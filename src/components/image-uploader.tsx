'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  image: string | null;
  onImageUpload: (base64: string) => void;
  onReset: () => void;
  title: string;
  id: string;
}

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ImageUploader({
  image,
  onImageUpload,
  onReset,
  title,
  id,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload an image file (JPEG, PNG).',
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onImageUpload(reader.result as string);
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Error Reading File',
          description: 'Could not read the selected file.',
        });
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload, toast]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    handleDrag(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [handleDrag]);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    handleDrag(e);
    setIsDragging(false);
  }, [handleDrag]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      handleDragOut(e);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    },
    [handleDragOut, processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile]
  );

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-sm">
        {title}
      </label>
      <div
        className={cn(
          'relative w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/50 transition-colors duration-300',
          isDragging && 'border-primary bg-primary/10',
          image && 'border-solid border-muted-foreground/20'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {image ? (
          <>
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={title}
                fill
                className="object-contain rounded-md p-2"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
              onClick={onReset}
              aria-label={`Remove ${title}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-center p-4 cursor-pointer"
            onClick={() => inputRef.current?.click()}
            role="button"
            aria-labelledby={`${id}-label`}
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground/70" />
            <p id={`${id}-label`} className="mt-4 font-semibold text-foreground">
              Click or drag & drop to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG or JPG (max {MAX_FILE_SIZE_MB}MB)
            </p>
            <input
              ref={inputRef}
              id={id}
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
