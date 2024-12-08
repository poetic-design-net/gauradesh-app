'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { updateUserProfile } from '@/lib/db/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '@/lib/db/users';
import { FirebaseError } from '@/lib/firebase-error';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const profileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  photoURL: z.union([
    z.string().url('Must be a valid URL').optional(),
    z.string().length(0)
  ]).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  initialProfile: UserProfile;
}

export function UserProfileForm({ initialProfile }: UserProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialProfile?.displayName || '',
      bio: initialProfile?.bio || '',
      photoURL: initialProfile?.photoURL || '',
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!user) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Image must be less than 5MB',
      });
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'File must be an image (JPEG, PNG, or WebP)',
      });
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile-image`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      form.setValue('photoURL', downloadURL, { shouldDirty: true });
      
      toast({
        title: 'Success',
        description: 'Profile image uploaded successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, form, toast]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;

    const dirtyFields = Object.keys(form.formState.dirtyFields) as Array<keyof ProfileFormValues>;
    const updatedValues = dirtyFields.reduce((acc, field) => {
      acc[field] = values[field];
      return acc;
    }, {} as Partial<ProfileFormValues>);

    if (Object.keys(updatedValues).length === 0) {
      toast({
        title: 'No changes',
        description: 'No changes were made to your profile.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile(user.uid, updatedValues);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      form.reset(values);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof FirebaseError ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const photoURL = form.watch('photoURL');
  const displayName = form.watch('displayName');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="space-y-4">
              <FormLabel>Profile Picture</FormLabel>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoURL || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-2xl">
                    {displayName?.[0] || user?.email?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div
                    className={`
                      relative group border-2 border-dashed rounded-lg p-6 transition-all
                      ${isUploading ? 'bg-muted' : 'hover:bg-accent hover:border-accent-foreground/20'}
                    `}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={onFileSelect}
                      disabled={isUploading}
                    />
                    <div className="flex flex-col items-center gap-2 text-sm">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          <span>Drop an image here or click to upload</span>
                          <span className="text-xs text-muted-foreground">
                            Max file size: 5MB
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {photoURL && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => form.setValue('photoURL', '', { shouldDirty: true })}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum 160 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
