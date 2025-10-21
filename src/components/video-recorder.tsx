'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react';
import { ImageComparator, type ImageComparatorHandle } from './image-comparator';

interface VideoRecorderProps {
  beforeImage: string;
  afterImage: string;
  children: ReactNode;
}

export interface VideoRecorderHandle {
  record: () => Promise<Blob>;
}

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const DURATION_S = 5;
const FPS = 30;

export const VideoRecorder = forwardRef<
  VideoRecorderHandle,
  VideoRecorderProps
>(({ beforeImage, afterImage, children }, ref) => {
  const imageComparatorRef = useRef<ImageComparatorHandle>(null);

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
      // Image is wider than canvas
      drawHeight = canvasWidth / imgRatio;
      y = (canvasHeight - drawHeight) / 2;
    } else {
      // Image is taller than or same aspect as canvas
      drawWidth = canvasHeight * imgRatio;
      x = (canvasWidth - drawWidth) / 2;
    }
    
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };


  useImperativeHandle(ref, () => ({
    record: async () => {
      const beforeImg = await loadImage(beforeImage);
      const afterImg = await loadImage(afterImage);

      const canvas = document.createElement('canvas');
      canvas.width = VIDEO_WIDTH;
      canvas.height = VIDEO_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const stream = canvas.captureStream(FPS);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      return new Promise((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        recorder.onerror = reject;

        recorder.start();

        let frame = 0;
        const totalFrames = DURATION_S * FPS;
        const wipeDurationFrames = totalFrames * 0.6; // 60% of time for wiping
        const holdDurationFrames = totalFrames * 0.2; // 20% hold at start/end

        const drawFrame = () => {
          if (frame >= totalFrames) {
            recorder.stop();
            return;
          }

          let sliderPosition = 50;
          if (frame < holdDurationFrames) {
            sliderPosition = 100; // Hold "before"
          } else if (frame >= holdDurationFrames && frame < holdDurationFrames + wipeDurationFrames) {
            // Wipe from right to left
            const wipeFrame = frame - holdDurationFrames;
            sliderPosition = 100 - (wipeFrame / wipeDurationFrames) * 100;
          } else {
            sliderPosition = 0; // Hold "after"
          }
          
          ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
          
          // Draw "before" image
          drawImageMaintainAspectRatio(ctx, beforeImg);

          // Draw "after" image with clipping
          ctx.save();
          const clipWidth = (sliderPosition / 100) * VIDEO_WIDTH;
          ctx.beginPath();
          ctx.rect(0, 0, clipWidth, VIDEO_HEIGHT);
          ctx.clip();
          drawImageMaintainAspectRatio(ctx, afterImg);
          ctx.restore();

          frame++;
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      });
    },
  }));

  // We only need the children for the live view, the recorder uses its own canvas
  return <div style={{ position: 'relative' }}>
    {/* This is the visible component */}
    <ImageComparator ref={imageComparatorRef} beforeImage={beforeImage} afterImage={afterImage} />
  </div>;
});

VideoRecorder.displayName = 'VideoRecorder';
