'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Video, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/image-uploader';
import { ImageComparator } from '@/components/image-comparator';
import {
  VideoRecorder,
  type VideoRecorderHandle,
} from '@/components/video-recorder';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function Home() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoFileExtension, setVideoFileExtension] = useState('webm');
  const recorderRef = useRef<VideoRecorderHandle>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (image1 && image2) {
      setShowComparison(true);
    }
  }, [image1, image2]);

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

  const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : null;

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground relative">
      <Image
        src="https://picsum.photos/seed/10/1920/1080"
        alt="Abstract background"
        fill
        className="object-cover -z-10 opacity-10 blur-sm"
        data-ai-hint="abstract background"
      />
      <header className="container mx-auto px-4 py-8 md:py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">
          Spot the Difference
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload two images and use the slider to compare them side-by-side.
        </p>
      </header>

      <main className="flex-1 w-full container mx-auto px-4">
        {!showComparison ? (
          <Card className="max-w-4xl mx-auto bg-background/80 backdrop-blur-sm">
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
          <section className="mt-8 max-w-4xl mx-auto">
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
      </main>

      <footer className="w-full py-6 text-center text-muted-foreground text-sm">
        <p>Powered by Firebase and Next.js</p>
      </footer>
    </div>
  );
}