'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Maximize,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ZoomableImageProps {
  src: string;
  alt: string;
}

export function ZoomableImage({ src, alt }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const minScale = 0.5;
  const maxScale = 4;
  const step = 0.1;

  useEffect(() => {
    if (!isOpen) {
      // Reset scale when dialog is closed
      const timer = setTimeout(() => setScale(1), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + step, maxScale));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - step, minScale));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-md group">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Maximize className="w-8 h-8 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90dvh] flex flex-col p-0 gap-0">
        <div className="flex-1 relative overflow-hidden bg-muted/20">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          </div>
        </div>
        <DialogFooter className="bg-background border-t p-3 flex-row justify-center items-center gap-4 sm:justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= minScale}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Slider
            value={[scale]}
            onValueChange={(value) => setScale(value[0])}
            min={minScale}
            max={maxScale}
            step={step}
            className="w-48"
            aria-label="Zoom slider"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= maxScale}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale(1)}
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
