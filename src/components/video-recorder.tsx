'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react';
import { ImageComparator, type ImageComparatorHandle } from './image-comparator';

interface VideoRecorderProps {
  children: ReactNode;
  beforeImage: string;
  afterImage: string;
}

export interface VideoRecorderHandle {
  startRecording: () => 'mp4' | 'webm';
  stopRecording: () => Promise<Blob>;
}

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const FPS = 30;

export const VideoRecorder = forwardRef<
  VideoRecorderHandle,
  VideoRecorderProps
>(({ children, beforeImage, afterImage }, ref) => {
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
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    const { sliderPosition } = imageComparatorRef.current.getState();
    const beforeImg = beforeImgRef.current;
    const afterImg = afterImgRef.current;

    if (!ctx) return;

    ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    drawImageMaintainAspectRatio(ctx, afterImg);

    ctx.save();
    const clipX = (sliderPosition / 100) * VIDEO_WIDTH;
    ctx.beginPath();
    ctx.rect(clipX, 0, VIDEO_WIDTH - clipX, VIDEO_HEIGHT);
    ctx.clip();
    drawImageMaintainAspectRatio(ctx, beforeImg);
    ctx.restore();

    animationFrameId.current = requestAnimationFrame(drawFrame);
  };

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      const preferredMimeType = 'video/mp4';
      const fallbackMimeType = 'video/webm';
      const supportedMimeType = MediaRecorder.isTypeSupported(preferredMimeType)
        ? preferredMimeType
        : fallbackMimeType;
      
      const fileExtension = supportedMimeType === preferredMimeType ? 'mp4' : 'webm';

      (async () => {
        beforeImgRef.current = await loadImage(beforeImage);
        afterImgRef.current = await loadImage(afterImage);
  
        const canvas = document.createElement('canvas');
        canvas.width = VIDEO_WIDTH;
        canvas.height = VIDEO_HEIGHT;
        canvasRef.current = canvas;
  
        const stream = canvas.captureStream(FPS);
        const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
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
        };

        mediaRecorderRef.current.onerror = (event) => {
          reject((event as any).error || new Error('MediaRecorder error'));
        };
        
        mediaRecorderRef.current.stop();

        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      });
    },
  }));
  
  return (
    <ImageComparator
      ref={imageComparatorRef}
      beforeImage={beforeImage}
      afterImage={afterImage}
    />
  );
});

VideoRecorder.displayName = 'VideoRecorder';
