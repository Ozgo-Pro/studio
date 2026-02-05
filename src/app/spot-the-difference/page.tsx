'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser, useFirestore, useStorage, useCollection } from '@/firebase';
import { Download, Video, Square, LogOut, Save } from 'lucide-react';
import { saveComparison } from '@/lib/comparisons';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/image-uploader';
import { ImageComparator } from '@/components/image-comparator';
import {
  VideoRecorder,
  type VideoRecorderHandle,
} from '@/components/video-recorder';
import { useToast } from '@/hooks/use-toast';

export default function SpotTheDifferencePage() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoFileExtension, setVideoFileExtension] = useState('webm');
  const recorderRef = useRef<VideoRecorderHandle>(null);
  const { toast } = useToast();

  const { user, loading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: comparisons, loading: comparisonsLoading } = useCollection(
    user ? `users/${user.uid}/comparisons` : null
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !user.emailVerified) {
      router.push(`/auth/verify?email=${user.email}`);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (image1 && image2) {
      setShowComparison(true);
    }
  }, [image1, image2]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleReset = () => {
    setImage1(null);
    setImage2(null);
    setShowComparison(false);
    setVideoBlob(null);
    setIsRecording(false);
  };

  const handleStartRecording = () => {
    if (!recorderRef.current) return;
    setVideoBlob(null);
    setIsRecording(true);
    const extension = recorderRef.current.startRecording();
    setVideoFileExtension(extension);
    toast({
      title: 'Recording Started',
      description: 'Move the slider to create your video.',
    });
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      const blob = await recorderRef.current.stopRecording();
      setVideoBlob(blob);
      toast({
        title: 'Recording Finished',
        description: 'Your video is ready for download.',
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        variant: 'destructive',
        title: 'Recording Failed',
        description: 'Something went wrong. Please try recording again.',
      });
    } finally {
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    if (!user || !image1 || !image2 || !comparisonName) return;
    setIsSaving(true);
    try {
      await saveComparison(
        firestore,
        storage,
        user.uid,
        comparisonName,
        image1,
        image2
      );
      toast({ title: 'Success!', description: 'Comparison saved.' });
      setShowSaveDialog(false);
      setComparisonName('');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save comparison.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadComparison = (comparison: any) => {
    setImage1(comparison.image1Url);
    setImage2(comparison.image2Url);
    setShowComparison(true);
  };

  const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : null;

  if (loading || !user || !user.emailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh text-foreground">
      <header className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-between items-center">
          <div className="text-center flex-grow">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">
              Spot the Difference
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload two images and use the slider to compare them side-by-side.
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full container mx-auto px-4">
        {!showComparison ? (
          <Card className="max-w-3xl mx-auto bg-background/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <ImageUploader
                  image={image1}
                  onImageUpload={setImage1}
                  onReset={() => setImage1(null)}
                  title="Before Image"
                  id="image1"
                />
                <ImageUploader
                  image={image2}
                  onImageUpload={setImage2}
                  onReset={() => setImage2(null)}
                  title="After Image"
                  id="image2"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <section className="mt-8 max-w-3xl mx-auto">
            {image1 && image2 ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <VideoRecorder
                  ref={recorderRef}
                  beforeImage={image1}
                  afterImage={image2}
                  isRecording={isRecording}
                >
                  <ImageComparator beforeImage={image1} afterImage={image2} />
                </VideoRecorder>
                <div className="text-center flex flex-wrap justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleReset}
                    variant="outline"
                    disabled={isRecording}
                  >
                    Start Over
                  </Button>
                  <Button size="lg" onClick={() => setShowSaveDialog(true)}>
                    <Save className="mr-2" />
                    Save Comparison
                  </Button>
                  {!isRecording ? (
                    <Button
                      size="lg"
                      onClick={handleStartRecording}
                      disabled={isRecording}
                    >
                      <Video className="mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleStopRecording}
                    >
                      <Square className="mr-2" />
                      Stop Recording
                      <span className="relative flex h-3 w-3 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                      </span>
                    </Button>
                  )}
                  {videoUrl && (
                    <Button size="lg" asChild>
                      <a
                        href={videoUrl}
                        download={`comparison.${videoFileExtension}`}
                      >
                        <Download className="mr-2" />
                        Download Video
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p>Something went wrong. Please start over.</p>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="mt-4"
                >
                  Start Over
                </Button>
              </div>
            )}
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            Your Saved Comparisons
          </h2>
          {comparisonsLoading && (
            <p className="text-center">Loading comparisons...</p>
          )}
          {!comparisonsLoading &&
            comparisons &&
            comparisons.length === 0 && (
              <p className="text-center text-muted-foreground">
                You have no saved comparisons yet.
              </p>
            )}
          {!comparisonsLoading && comparisons && comparisons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(comparisons as any[]).map((comp) => (
                <Card
                  key={comp.id}
                  onClick={() => handleLoadComparison(comp)}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle>{comp.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2 justify-center">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                      <Image
                        src={comp.image1Url}
                        alt="Before"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                      <Image
                        src={comp.image2Url}
                        alt="After"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-6 mt-12 text-center text-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <a
            href="https://ozgo.co.uk/apps/"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            More Apps
          </a>
          <a
            href="https://www.paypal.com/ncp/payment/QWAJXHVJKRHJ6"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate
          </a>
          <a
            href="mailto:augustin.galatanu@gmail.com?subject=Issue%20with%20Spot%20the%20Difference%20App"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Report an issue
          </a>
          <span>
            Powered by{' '}
            <a
              href="https://ozgo.co.uk/"
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ozgo Productions
            </a>
          </span>
        </div>
      </footer>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Comparison</DialogTitle>
            <DialogDescription>
              Give your comparison a name to save it for later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
