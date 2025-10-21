'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronsLeftRight } from 'lucide-react';

import { Slider } from '@/components/ui/slider';

interface ImageComparatorProps {
  beforeImage: string;
  afterImage: string;
}

export function ImageComparator({
  beforeImage,
  afterImage,
}: ImageComparatorProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (value: number[]) => {
    setSliderPosition(value[0]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div
        ref={containerRef}
        className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg"
      >
        <Image
          src={beforeImage}
          alt="Before"
          fill
          className="object-contain"
        />
        <div
          className="absolute top-0 left-0 h-full w-full overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <Image
            src={afterImage}
            alt="After"
            fill
            className="object-contain"
          />
        </div>
        <div
          className="absolute top-0 h-full w-1 bg-white/50 cursor-ew-resize backdrop-invert"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-black shadow-md pointer-events-none">
            <ChevronsLeftRight className="w-6 h-6" />
          </div>
        </div>
      </div>
      <div className="px-1">
         <Slider
          id="comparator-slider"
          min={0}
          max={100}
          step={0.1}
          value={[sliderPosition]}
          onValueChange={handleSliderChange}
        />
      </div>
      <div className="flex justify-between text-sm text-muted-foreground px-1">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
}
