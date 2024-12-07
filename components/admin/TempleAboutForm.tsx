'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Temple, updateTemple, TempleUpdateData } from '@/lib/db/temples';
import Image from 'next/image';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { serverTimestamp } from 'firebase/firestore';

const storage = getStorage();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface TempleAboutFormProps {
  temple: Temple;
  onSuccess?: () => void;
}

export function TempleAboutForm({ temple, onSuccess }: TempleAboutFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(temple.aboutImageUrl || '');
  const [description, setDescription] = useState(temple.description || '');
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: error,
        });
        return;
      }

      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let aboutImageUrl = temple.aboutImageUrl;

      // Upload new image if selected
      if (imageFile) {
        try {
          const imageRef = ref(storage, `temples/${temple.id}/about-image`);
          await uploadBytes(imageRef, imageFile);
          aboutImageUrl = await getDownloadURL(imageRef);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            variant: 'destructive',
            title: 'Upload Error',
            description: 'Failed to upload image. Please make sure Firebase Storage is properly configured.',
          });
          setLoading(false);
          return;
        }
      }

      // Update temple data
      const updateData: TempleUpdateData = {
        description,
        aboutImageUrl,
        updatedAt: serverTimestamp()
      };

      await updateTemple(temple.id, updateData);

      toast({
        title: 'Success',
        description: 'Temple about page has been updated',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error updating temple about:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update temple about page',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Page Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Temple Image</label>
            <div className="flex flex-col items-center gap-4">
              {imagePreview && (
                <div className="relative w-full aspect-video">
                  <Image
                    src={imagePreview}
                    alt="Temple preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="w-full">
                <Input
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleImageChange}
                  className="w-full"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Accepted formats: JPEG, PNG, WebP. Max size: 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Enter temple description..."
              className="w-full"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}