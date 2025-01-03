'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImageUrl?: string;
  path: string;
  className?: string;
  aspectRatio?: "square" | "wide";
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not convert to WebP'));
        }
      }, 'image/webp', 0.8);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function ImageUpload({ 
  onUpload, 
  currentImageUrl, 
  path,
  className = "",
  aspectRatio = "square",
  onUploadStart,
  onUploadEnd
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      onUploadStart?.();

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      const webpBlob = await convertToWebP(file);
      const webpFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp'
      });

      const metadata = {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      };
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, webpFile, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      
      onUpload(downloadUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      onUploadEnd?.();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewUrl(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const aspectRatioClass = aspectRatio === "wide" ? "aspect-video" : "aspect-square";

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        ref={fileInputRef}
      />
      
      {previewUrl ? (
        <div className={`relative ${aspectRatioClass} rounded-lg overflow-hidden border`}>
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            onClick={handleClearImage}
            type="button"
            className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          onClick={handleUploadClick}
          type="button"
          variant="outline"
          className={`w-full ${aspectRatioClass} flex flex-col items-center justify-center border-dashed`}
          disabled={uploading}
        >
          <Upload className="h-6 w-6 mb-2" />
          <span className="text-sm">
            {uploading ? 'Converting & Uploading...' : 'Upload Image'}
          </span>
        </Button>
      )}
    </div>
  );
}
