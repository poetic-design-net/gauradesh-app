'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Service, ServiceType, getTempleServices, registerForService, deleteService, getTempleServiceTypes } from '@/lib/db/services';
import { useToast } from '@/components/ui/use-toast';
import { ServiceCard } from '@/components/services/ServiceCard';
import { useTempleContext } from '@/contexts/TempleContext';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartHandshake } from 'lucide-react';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { isTempleAdmin } from '@/lib/db/admin';

export default function ServicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentTemple } = useTempleContext();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user || !currentTemple) {
        setIsAdmin(false);
        return;
      }

      try {
        const admin = await isTempleAdmin(user.uid, currentTemple.id);
        setIsAdmin(admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [user, currentTemple]);

  useEffect(() => {
    async function loadData() {
      if (!currentTemple) {
        setServices([]);
        setServiceTypes([]);
        setLoading(false);
        return;
      }

      try {
        const [templeServices, types] = await Promise.all([
          getTempleServices(currentTemple.id),
          getTempleServiceTypes(currentTemple.id)
        ]);
        console.log('Loaded services:', templeServices);
        setServices(templeServices);
        setServiceTypes(types);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load services',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTemple, toast]);

  const handleRegister = async (serviceId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to register for a service',
      });
      return;
    }

    if (!currentTemple) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No temple selected',
      });
      return;
    }

    try {
      await registerForService(user.uid, serviceId, currentTemple.id);
      toast({
        title: 'Success',
        description: 'You have successfully registered for this service',
      });
      
      // Refresh services to update participant count
      const updatedServices = await getTempleServices(currentTemple.id);
      setServices(updatedServices);
    } catch (error: any) {
      console.error('Error registering for service:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to register for service',
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleDelete = async (service: Service) => {
    setDeletingService(service);
  };

  const confirmDelete = async (force: boolean = false) => {
    if (!user || !deletingService || !currentTemple) return;

    try {
      await deleteService(deletingService.id, user.uid, currentTemple.id, force);
      toast({
        title: 'Success',
        description: 'Service has been deleted successfully',
      });
      
      // Refresh services
      const updatedServices = await getTempleServices(currentTemple.id);
      setServices(updatedServices);
    } catch (error: any) {
      if (error.code === 'failed-precondition' && !force) {
        setShowForceDeleteDialog(true);
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete service',
      });
    } finally {
      if (force) {
        setShowForceDeleteDialog(false);
      }
      setDeletingService(null);
    }
  };

  const handleServiceSaved = async () => {
    setEditingService(null);
    if (currentTemple) {
      const updatedServices = await getTempleServices(currentTemple.id);
      setServices(updatedServices);
    }
  };

  const filteredServices = selectedType === 'all'
    ? services
    : services.filter(service => service.type === selectedType);

  if (!currentTemple) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ 
            backgroundImage: 'url("https://s3-ap-southeast-1.amazonaws.com/images.brajrasik.org/66407fbea13f2d00091c9a30.jpeg")',
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        </div>
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 p-8 bg-white/10 rounded-lg border border-white/20">
            <HeartHandshake className="h-16 w-16 text-purple-400 mx-auto opacity-50" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              No Temple Selected
            </h1>
            <p className="text-gray-300">Please select a temple to view available services.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ 
            backgroundImage: 'url("https://s3-ap-southeast-1.amazonaws.com/images.brajrasik.org/66407fbea13f2d00091c9a30.jpeg")',
          }}
        >
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
        </div>
        <div className="relative container mx-auto p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="backdrop-blur-lg bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                <Skeleton className="h-48" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ 
            backgroundImage: 'url("https://s3-ap-southeast-1.amazonaws.com/images.brajrasik.org/66407fbea13f2d00091c9a30.jpeg")',
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto p-6 space-y-8 min-h-screen">
          {/* Hero Section */}
          <div className="space-y-4 pt-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r text-white">
                  Temple Services
                </h1>
                <p className="text-xl text-gray-300">
                  Discover and participate in various spiritual services
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="flex items-center justify-center flex-1 min-h-[calc(100vh-200px)]">
              <div className="text-center space-y-4 p-8 backdrop-blur-lg bg-white/10 rounded-lg border border-white/20">
                <HeartHandshake className="h-16 w-16 text-purple-400 mx-auto opacity-50" />
                <p className="text-xl text-gray-300">No services available at this time.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 animate-fadeIn pb-8">
              {filteredServices.map((service) => (
                <div key={service.id} className="group transition-all duration-300 hover:scale-[1.02]">
                  <ServiceCard
                    service={service}
                    onRegister={handleRegister}
                    onEdit={isAdmin ? handleEdit : undefined}
                    onDelete={isAdmin ? handleDelete : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editingService !== null} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogTitle>
            {editingService ? 'Edit Service' : 'Add Service'}
          </DialogTitle>
          {editingService && (
            <ServiceForm
              service={editingService}
              serviceTypes={serviceTypes}
              onClose={() => setEditingService(null)}
              onSuccess={handleServiceSaved}
              templeId={currentTemple.id}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingService !== null} onOpenChange={() => setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete(false)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Active Registrations</AlertDialogTitle>
            <AlertDialogDescription>
              This service has active registrations. Deleting it will also remove all associated registrations. 
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete(true)} className="bg-red-600 hover:bg-red-700">
              Force Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
