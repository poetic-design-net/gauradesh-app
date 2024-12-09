'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Temple, updateTempleDetails, TempleUpdateData, TempleProgram } from '@/lib/db/temples';
import { TempleProgramForm } from './TempleProgramForm';
import { ImageUpload } from '@/components/ui/image-upload';
import { serverTimestamp } from 'firebase/firestore';

interface TempleAboutFormProps {
  temple: Temple;
  onSuccess?: () => void;
}

export function TempleAboutForm({ temple, onSuccess }: TempleAboutFormProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState(temple.description || '');
  const [socialMedia, setSocialMedia] = useState(temple.socialMedia || {});
  const [dailyPrograms, setDailyPrograms] = useState<TempleProgram>(temple.dailyPrograms || {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const { toast } = useToast();

  const handleSocialMediaChange = (field: string, value: string) => {
    setSocialMedia(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (url: string) => {
    try {
      // Update temple data with new image URL
      await updateTempleDetails(temple.id, {
        aboutImageUrl: url
      });

      toast({
        title: 'Success',
        variant: 'success',
        description: 'Temple image has been updated',
      });
    } catch (error) {
      console.error('Error updating temple image:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update temple image',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update temple data
      await updateTempleDetails(temple.id, {
        description,
        dailyPrograms,
        socialMedia
      });

      toast({
        title: 'Success',
        variant: 'success',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About Page Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Temple Image</label>
            <ImageUpload
              onUpload={handleImageUpload}
              currentImageUrl={temple.aboutImageUrl}
              path={`temples/${temple.id}/about-image`}
              aspectRatio="wide"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Image will be automatically converted to WebP format for optimal performance
            </p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media & Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <Input
              value={socialMedia.instagram || ''}
              onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
              placeholder="Instagram profile URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <Input
              value={socialMedia.facebook || ''}
              onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
              placeholder="Facebook page URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <Input
              value={socialMedia.website || ''}
              onChange={(e) => handleSocialMediaChange('website', e.target.value)}
              placeholder="Website URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              value={socialMedia.telefon || ''}
              onChange={(e) => handleSocialMediaChange('telefon', e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Google Maps</label>
            <Input
              value={socialMedia.gmaps || ''}
              onChange={(e) => handleSocialMediaChange('gmaps', e.target.value)}
              placeholder="Google Maps URL"
            />
          </div>
        </CardContent>
      </Card>

      <TempleProgramForm
        programs={dailyPrograms}
        onChange={setDailyPrograms}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
