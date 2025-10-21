'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Sparkles, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/image-uploader';
import { ImageComparator } from '@/components/image-comparator';
import { VideoRecorder, type VideoRecorderHandle } from '@/components/video-recorder';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
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
    setIsGenerating(false);
  };

  const handleRecordVideo = async () => {
    if (!recorderRef.current) return;
    setIsGenerating(true);
    setVideoBlob(null);
    try {
      const blob = await recorderRef.current.record();
      setVideoBlob(blob);
    } catch (error) {
      console.error('Error recording video:', error);
      toast({
        variant: 'destructive',
        title: 'Video Recording Failed',
        description:
          'Something went wrong while creating the video. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : null;

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
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
          <Card className="max-w-4xl mx-auto">
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
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <VideoRecorder ref={recorderRef} beforeImage={image1} afterImage={image2}>
                      <ImageComparator beforeImage={image1} afterImage={image2} />
                    </VideoRecorder>
                  </CardContent>
                </Card>
                <div className="text-center flex flex-wrap justify-center gap-4">
                  <Button size="lg" onClick={handleReset} variant="outline">
                    Start Over
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleRecordVideo}
                    disabled={isGenerating}
                  >
                    <Video className="mr-2" />
                    {isGenerating ? 'Recording Video...' : 'Record Video'}
                  </Button>
                  {videoUrl && (
                    <Button size="lg" asChild>
                      <a href={videoUrl} download="comparison.webm">
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
                <Button onClick={handleReset} variant="outline" className="mt-4">
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
