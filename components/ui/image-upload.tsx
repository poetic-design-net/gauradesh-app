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
}

export function ImageUpload({ 
  onUpload, 
  currentImageUrl, 
  path,
  className = "",
  aspectRatio = "square"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      onUpload(downloadUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClearImage = () => {
    setPreviewUrl(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className={`w-full ${aspectRatioClass} flex flex-col items-center justify-center border-dashed`}
          disabled={uploading}
        >
          <Upload className="h-6 w-6 mb-2" />
          <span className="text-sm">
            {uploading ? 'Uploading...' : 'Upload Image'}
          </span>
        </Button>
      )}
    </div>
  );
}
