'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react';
import { ImageComparator, type ImageComparatorHandle } from './image-comparator';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

interface VideoRecorderProps {
  children: ReactNode;
  beforeImage: string;
  afterImage: string;
  isRecording: boolean;
}

export interface VideoRecorderHandle {
  startRecording: () => 'mp4' | 'webm';
  stopRecording: () => Promise<Blob>;
}

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const FPS = 30;

export const VideoRecorder = forwardRef<
  VideoRecorderHandle,
  VideoRecorderProps
>(({ children, beforeImage, afterImage, isRecording }, ref) => {
  const imageComparatorRef = useRef<ImageComparatorHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const afterImgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const drawImageMaintainAspectRatio = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement
  ) => {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let x = 0;
    let y = 0;

    if (imgRatio > canvasRatio) {
      drawHeight = canvasWidth / imgRatio;
      y = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      x = (canvasWidth - drawWidth) / 2;
    }

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };

  const drawFrame = () => {
    if (
      !canvasRef.current ||
      !imageComparatorRef.current ||
      !beforeImgRef.current ||
      !afterImgRef.current
    ) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(drawFrame);
      return;
    }
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const { sliderPosition } = imageComparatorRef.current.getState();
    const beforeImg = beforeImgRef.current;
    const afterImg = afterImgRef.current;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw after image (visible by default)
    drawImageMaintainAspectRatio(ctx, afterImg);
  
    // Draw before image clipped
    ctx.save();
    const clipWidth = (sliderPosition / 100) * canvas.width;
    ctx.beginPath();
    ctx.rect(0, 0, clipWidth, canvas.height);
    ctx.clip();
    drawImageMaintainAspectRatio(ctx, beforeImg);
    ctx.restore();
  
    animationFrameId.current = requestAnimationFrame(drawFrame);
  };

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      const preferredMimeType = 'video/mp4; codecs=avc1';
      const fallbackMimeType = 'video/webm';
      const supportedMimeType = MediaRecorder.isTypeSupported(preferredMimeType)
        ? preferredMimeType
        : fallbackMimeType;

      const fileExtension = supportedMimeType.startsWith('video/mp4')
        ? 'mp4'
        : 'webm';

      (async () => {
        beforeImgRef.current = await loadImage(beforeImage);
        afterImgRef.current = await loadImage(afterImage);

        const canvas = document.createElement('canvas');
        canvas.width = VIDEO_WIDTH;
        canvas.height = VIDEO_HEIGHT;
        canvasRef.current = canvas;

        const stream = canvas.captureStream(FPS);
        const recorder = new MediaRecorder(stream, {
          mimeType: supportedMimeType,
        });
        mediaRecorderRef.current = recorder;
        recordedChunks.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.current.push(event.data);
          }
        };

        recorder.start();
        animationFrameId.current = requestAnimationFrame(drawFrame);
      })();
      return fileExtension;
    },
    stopRecording: () => {
      return new Promise((resolve, reject) => {
        if (!mediaRecorderRef.current) {
          return reject(new Error('Recorder not initialized.'));
        }

        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
          const blob = new Blob(recordedChunks.current, { type: mimeType });
          resolve(blob);
          recordedChunks.current = [];
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }
        };

        mediaRecorderRef.current.onerror = (event) => {
          reject((event as any).error || new Error('MediaRecorder error'));
        };

        mediaRecorderRef.current.stop();
      });
    },
  }));

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        isRecording &&
          'ring-2 ring-red-500 ring-offset-4 ring-offset-background'
      )}
    >
      <CardContent className="p-4 md:p-6 relative">
        <ImageComparator
          ref={imageComparatorRef}
          beforeImage={beforeImage}
          afterImage={afterImage}
        />
      </CardContent>
    </Card>
  );
});

VideoRecorder.displayName = 'VideoRecorder';