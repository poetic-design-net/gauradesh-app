'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { createServiceType, updateServiceType, ServiceType } from '@/lib/db/services';
import { X, icons, ChevronLeft, ChevronRight } from 'lucide-react';
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
  serviceType?: ServiceType;
}

const ICONS_PER_PAGE = 48; // 6x8 grid

export function ServiceTypeForm({ onClose, onSuccess, templeId, serviceType }: ServiceTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableIcons, setAvailableIcons] = useState<{ name: string; Icon: any }[]>([]);
  const { toast } = useToast();
  const { currentTemple } = useTempleContext();

  const effectiveTempleId = templeId || currentTemple?.id;

  const form = useForm<ServiceTypeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: serviceType?.name || '',
      icon: serviceType?.icon || '',
    },
  });

  // Lazy load icons
  useEffect(() => {
    if (!iconsLoaded) {
      const iconsList = Object.entries(icons).map(([name, Icon]) => ({
        name,
        Icon,
      }));
      setAvailableIcons(iconsList);
      setIconsLoaded(true);
    }
  }, [iconsLoaded]);

  const filteredIcons = availableIcons.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const paginatedIcons = filteredIcons.slice(
    (currentPage - 1) * ICONS_PER_PAGE,
    currentPage * ICONS_PER_PAGE
  );

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  async function onSubmit(values: ServiceTypeFormValues) {
    if (!effectiveTempleId) {
      toast({
        variant: 'destructive',
        description: 'No temple selected',
      });
      return;
    }

    if (!values.name || !values.icon) {
      toast({
        variant: 'destructive',
        description: 'Name and icon are required',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating/updating service type:', {
        templeId: effectiveTempleId,
        values
      });

      if (serviceType) {
        await updateServiceType(serviceType.id, effectiveTempleId, {
          name: values.name,
          icon: values.icon,
        });
        toast({
          description: 'Service type has been updated successfully',
        });
      } else {
        await createServiceType(effectiveTempleId, {
          name: values.name,
          icon: values.icon,
          description: null // Optional field
        });
        toast({
          description: 'Service type has been created successfully',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving service type:', error);
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to save service type',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{serviceType ? 'Edit Service Type' : 'Add New Service Type'}</CardTitle>
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
                    <div className="border rounded-md">
                      <ScrollArea className="h-72 p-4">
                        <div className="grid grid-cols-6 md:grid-cols-8 gap-4">
                          {paginatedIcons.map(({ name: iconName, Icon }) => (
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
                      {/* Pagination controls */}
                      <div className="flex items-center justify-between border-t p-2">
                        <div className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={prevPage}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
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
                {isLoading ? (serviceType ? 'Updating...' : 'Creating...') : (serviceType ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
