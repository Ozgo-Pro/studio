'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ImageIcon,
  Loader2,
  Sparkles,
  ZoomIn,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/image-uploader';
import { ZoomableImage } from '@/components/zoomable-image';
import { compareImages } from './actions';

type ComparisonResult = {
  comparisonImage: string;
  summary: string;
};

export default function Home() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCompare = async () => {
    if (!image1 || !image2) {
      toast({
        variant: 'destructive',
        title: 'Missing Images',
        description: 'Please upload both images before comparing.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await compareImages(image1, image2);
      setResult(res);
    } catch (e) {
      const errMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errMessage);
      toast({
        variant: 'destructive',
        title: 'Comparison Failed',
        description: errMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImage1(null);
    setImage2(null);
    setResult(null);
    setError(null);
  };

  const canCompare = image1 && image2 && !isLoading;

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <header className="container mx-auto px-4 py-8 md:py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">
          Spot the Difference
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload two images and let our AI instantly highlight what's changed.
        </p>
      </header>

      <main className="flex-1 w-full container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <ImageUploader
                image={image1}
                onImageUpload={setImage1}
                onReset={() => setImage1(null)}
                title="Original Image"
                id="image1"
              />
              <ImageUploader
                image={image2}
                onImageUpload={setImage2}
                onReset={() => setImage2(null)}
                title="Modified Image"
                id="image2"
              />
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                size="lg"
                onClick={handleCompare}
                disabled={!canCompare}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                <span className="ml-2">
                  {isLoading ? 'Analyzing...' : 'Find Differences'}
                </span>
              </Button>
              {(result || image1 || image2) && (
                <Button
                  size="lg"
                  onClick={handleReset}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Start Over
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="mt-12 max-w-6xl mx-auto">
          {isLoading && <LoadingSkeleton />}
          {error && !isLoading && <ErrorDisplay message={error} />}
          {result && !isLoading && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid md:grid-cols-3 gap-6">
                <ResultCard title="Original" image={image1} />
                <Card className="col-span-1 border-primary border-2 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-primary">Differences</CardTitle>
                    <CardDescription>
                      Click image to zoom and inspect.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.comparisonImage ? (
                      <ZoomableImage
                        src={result.comparisonImage}
                        alt="Comparison of the two images with differences highlighted"
                      />
                    ) : (
                      <div className="aspect-square w-full flex flex-col items-center justify-center bg-muted rounded-md">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No visual diff available.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <ResultCard title="Modified" image={image2} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{result.summary}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-6 text-center text-muted-foreground text-sm">
        <p>Powered by Firebase and Genkit AI</p>
      </footer>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full aspect-square" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full aspect-square" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full aspect-square" />
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <Alert variant="destructive" className="max-w-4xl mx-auto">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>An Error Occurred</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

const ResultCard = ({ title, image }: { title: string; image: string | null }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {image ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-md">
          <Image
            src={image}
            alt={`Uploaded image: ${title}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
          />
        </div>
      ) : (
        <div className="aspect-square w-full flex items-center justify-center bg-muted rounded-md">
          <ImageIcon className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
    </CardContent>
  </Card>
);
