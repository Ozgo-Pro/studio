'use client';

import {
  useState,
  useRef,
  useCallback,
  MouseEvent,
  TouchEvent,
  useEffect,
} from 'react';
import Image from 'next/image';
import { ChevronsLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageComparatorProps {
  beforeImage: string;
  afterImage: string;
}

export function ImageComparator({
  beforeImage,
  afterImage,
}: ImageComparatorProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div
        ref={containerRef}
        className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Image
          src={beforeImage}
          alt="Before"
          fill
          className="object-contain"
          priority
        />

        <div
          className="absolute top-0 left-0 h-full w-full overflow-hidden"
          style={{
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          <Image
            src={afterImage}
            alt="After"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div
          className={cn(
            'absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm font-semibold pointer-events-none transition-opacity',
            sliderPosition < 2 && 'opacity-0'
          )}
        >
          AFTER
        </div>
        <div
          className={cn(
            'absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm font-semibold pointer-events-none transition-opacity',
            sliderPosition > 98 && 'opacity-0'
          )}
        >
          BEFORE
        </div>

        <div
          className="absolute top-0 h-full w-1 bg-white/50 cursor-ew-resize backdrop-invert"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-black shadow-md pointer-events-none">
            <ChevronsLeftRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
