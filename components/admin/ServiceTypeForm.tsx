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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceType } from '@/lib/db/services';
import { X, icons } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTempleContext } from '@/contexts/TempleContext';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().min(1, 'Icon is required'),
});

type ServiceTypeFormValues = z.infer<typeof formSchema>;

export interface ServiceTypeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  templeId?: string | null;
}

// Get all available Lucide icons
const availableIcons = Object.entries(icons).map(([name, Icon]) => ({
  name,
  Icon,
}));

export function ServiceTypeForm({ onClose, onSuccess, templeId }: ServiceTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { currentTemple } = useTempleContext();

  // Use provided templeId if available, otherwise fall back to context
  const effectiveTempleId = templeId || currentTemple?.id;

  const form = useForm<ServiceTypeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: '',
    },
  });

  const filteredIcons = availableIcons.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function onSubmit(values: ServiceTypeFormValues) {
    if (!effectiveTempleId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No temple selected',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createServiceType(effectiveTempleId, {
        name: values.name,
        icon: values.icon,
      });
      toast({
        title: 'Success',
        description: 'Service type has been created successfully',
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create service type',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add New Service Type</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Service type name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormDescription>
                    Search and select an icon for this service type
                  </FormDescription>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search icons..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-72 border rounded-md p-4">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                        {filteredIcons.map(({ name: iconName, Icon }) => (
                          <Button
                            key={iconName}
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-12 w-12 p-0",
                              field.value === iconName && "border-primary bg-primary/10"
                            )}
                            onClick={() => field.onChange(iconName)}
                          >
                            <Icon className="h-6 w-6" />
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Type'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
