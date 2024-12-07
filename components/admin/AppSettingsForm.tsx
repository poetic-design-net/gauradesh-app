'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateAppSettings, AppSettings } from '@/lib/db/settings';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  headline: z.string().min(2, 'Headline must be at least 2 characters'),
});

interface AppSettingsFormProps {
  currentSettings?: AppSettings | null;
  onSuccess?: () => void;
}

export function AppSettingsForm({ currentSettings, onSuccess }: AppSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headline: currentSettings?.headline || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateAppSettings(user.uid, values);
      toast({
        title: 'Success',
        description: 'App settings have been updated successfully',
      });
      onSuccess?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter app headline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}