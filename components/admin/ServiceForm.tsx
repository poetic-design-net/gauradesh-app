'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createService, ServiceType, Service, updateService, deleteService } from '@/lib/db/services';
import { CalendarIcon, Trash2, AlertTriangle } from 'lucide-react';
import { ServiceIcon } from '@/components/services/ServiceIcon';
import { useTempleContext } from '@/contexts/TempleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  maxParticipants: z.number().min(1, 'Must allow at least 1 participant'),
  type: z.string().min(1, 'Service type is required'),
  date: z.date({
    required_error: "Please select a date",
  }),
  timeSlot: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:mm)'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:mm)')
  }),
  contactPerson: z.object({
    name: z.string().min(2, 'Contact person name must be at least 2 characters'),
    phone: z.string().regex(/^\+?[0-9\s-()]{8,}$/, 'Please enter a valid phone number')
  })
});

type ServiceFormValues = z.infer<typeof formSchema>;

export interface ServiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  serviceTypes: ServiceType[];
  templeId?: string | null;
  service?: Service | null;
}

export function ServiceForm({ onClose, onSuccess, serviceTypes, templeId, service }: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteInProgressRef = useRef(false);
  const { toast } = useToast();
  const { currentTemple } = useTempleContext();
  const { user } = useAuth();

  const effectiveTempleId = templeId || currentTemple?.id;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      maxParticipants: service?.maxParticipants || 1,
      type: service?.type || '',
      date: service?.date ? service.date.toDate() : new Date(),
      timeSlot: service?.timeSlot || {
        start: '09:00',
        end: '10:00'
      },
      contactPerson: service?.contactPerson ? {
        name: service.contactPerson.name,
        phone: service.contactPerson.phone
      } : {
        name: '',
        phone: ''
      }
    },
  });

  // Debug logging
  useEffect(() => {
    console.log('Service Types:', serviceTypes);
    console.log('Current Service:', service);
    console.log('Current Form Values:', form.getValues());
  }, [serviceTypes, service, form]);

  // Find the matching service type for the current value
  const selectedType = serviceTypes.find(type => type.name === form.watch('type'));

  // Debug logging for form values
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('Form Values:', value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: ServiceFormValues) {
    if (!effectiveTempleId || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No temple selected or user not logged in',
      });
      return;
    }

    setIsLoading(true);
    try {
      const contactPerson = {
        ...values.contactPerson,
        userId: user.uid
      };

      if (service) {
        await updateService(service.id, user.uid, effectiveTempleId, {
          name: values.name,
          description: values.description,
          maxParticipants: values.maxParticipants,
          type: values.type,
          date: values.date,
          timeSlot: values.timeSlot,
          contactPerson
        });
        toast({
          description: 'Service has been updated successfully',
        });
      } else {
        await createService(effectiveTempleId, user.uid, {
          name: values.name,
          description: values.description,
          maxParticipants: values.maxParticipants,
          type: values.type,
          date: values.date,
          timeSlot: values.timeSlot,
          contactPerson
        });
        toast({
          description: 'Service has been created successfully',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save service',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = useCallback(async () => {
    if (!service || !user || !effectiveTempleId || deleteInProgressRef.current) return;

    deleteInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      await deleteService(service.id, user.uid, effectiveTempleId, true);
      toast({
        description: 'Service has been deleted successfully',
      });
      onSuccess();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      let errorMessage = 'Failed to delete service';
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = 'You do not have permission to delete this service. Only temple admins can delete services.';
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      deleteInProgressRef.current = false;
      setShowDeleteDialog(false);
    }
  }, [service, user, effectiveTempleId, toast, onSuccess]);

  const hasActiveRegistrations = service?.currentParticipants ? service.currentParticipants > 0 : false;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Service name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type">
                        {field.value && (
                          <div className="flex items-center gap-2">
                            <ServiceIcon name={selectedType?.icon || field.value} className="h-4 w-4" />
                            <span>{field.value}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" className="z-[9999]">
                    {serviceTypes.map((type) => (
                      <SelectItem 
                        key={type.id} 
                        value={type.name}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ServiceIcon name={type.icon} className="h-4 w-4" />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the service"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Schedule Section */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeSlot.start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeSlot.end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact and Capacity Section */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="contactPerson.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Participants</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1}
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            {service && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (!deleteInProgressRef.current) {
                    setShowDeleteDialog(true);
                  }
                }}
                disabled={isLoading || deleteInProgressRef.current}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex space-x-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (service ? 'Updating...' : 'Creating...') : (service ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          if (!deleteInProgressRef.current) {
            setShowDeleteDialog(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Service
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
              {hasActiveRegistrations && (
                <div className="mt-2">
                  Note: This service has active registrations. All registrations will be deleted along with the service.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgressRef.current}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!deleteInProgressRef.current) {
                  handleDelete();
                }
              }}
              disabled={deleteInProgressRef.current}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInProgressRef.current ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
