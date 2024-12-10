'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardSkeleton } from '@/components/admin/AdminDashboardSkeleton';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { EventsTable } from '@/components/admin/EventsTable';
import { ServicesTable } from '@/components/admin/ServicesTable';
import { ServiceTypesTable } from '@/components/admin/ServiceTypesTable';
import { RegistrationsTable } from '@/components/admin/RegistrationsTable';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { ServiceTypeForm } from '@/components/admin/ServiceTypeForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

import { 
  getAllServices, 
  getTempleServiceRegistrations,
  getTempleServices,
  updateServiceRegistrationStatus,
  deleteRegistration,
  deleteService,
  Service,
  ServiceRegistration,
  ServiceType
} from '@/lib/db/services';
import { getTempleServiceTypes, createServiceType, deleteServiceType } from '@/lib/db/services/service-types';
import { getTempleEvents, deleteEvent } from '@/lib/db/events/events';
import { Event } from '@/lib/db/events/types';
import { getUserProfile, type UserProfile } from '@/lib/db/users';
import { type AdminData } from '@/lib/db/admin';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ADMIN_COLLECTION = 'admin';

async function getAdminData(uid: string): Promise<AdminData | null> {
  if (!uid) return null;
  
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    const adminDoc = await getDoc(adminRef);
    const adminData = adminDoc.data();
    
    if (adminDoc.exists() && adminData) {
      const hasAccess = 
        adminData.isSuperAdmin === true || 
        (adminData.isAdmin === true && adminData.templeId);

      if (hasAccess) {
        return {
          uid,
          ...adminData
        } as AdminData;
      }
    }
    return null;
  } catch (error) {
    console.error('[getAdminData] Error:', error);
    return null;
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [registrations, setRegistrations] = useState<
    Array<ServiceRegistration & { user?: UserProfile }>
  >([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | undefined>();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const { toast } = useToast();
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadServices = async (adminData: AdminData) => {
    try {
      setLoadingServices(true);
      const servicesData = adminData.templeId 
        ? await getTempleServices(adminData.templeId)
        : await getAllServices();
      console.log('Loaded services:', servicesData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load services'
      });
    } finally {
      setLoadingServices(false);
    }
  };

  const loadEvents = async (adminData: AdminData) => {
    try {
      setLoadingEvents(true);
      if (adminData.templeId) {
        const eventsData = await getTempleEvents(adminData.templeId);
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load events'
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadServiceTypes = async (adminData: AdminData) => {
    try {
      console.log('Loading service types for temple:', adminData.templeId);
      if (!adminData.templeId) {
        console.error('No temple ID available');
        return;
      }
      
      setLoadingServiceTypes(true);
      const typesData = await getTempleServiceTypes(adminData.templeId);
      console.log('Loaded service types:', typesData);
      
      // If we have a service with type "Kirtan" but no service types, create it
      if (typesData.length === 0 && services.some(s => s.type === "Kirtan")) {
        console.log('Creating missing Kirtan service type');
        try {
          const kirtanType = await createServiceType(adminData.templeId, {
            name: "Kirtan",
            icon: "music", // Using a default icon
            description: "Devotional chanting and singing"
          });
          console.log('Successfully created Kirtan service type:', kirtanType);
          setServiceTypes([kirtanType]);
        } catch (error) {
          console.error('Error creating Kirtan service type:', error);
          toast({
            variant: 'destructive',
            description: 'Failed to create Kirtan service type'
          });
        }
      } else {
        setServiceTypes(typesData);
      }
    } catch (error) {
      console.error('Error loading service types:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load service types'
      });
    } finally {
      setLoadingServiceTypes(false);
    }
  };

  const loadRegistrations = async (adminData: AdminData) => {
    try {
      setLoadingRegistrations(true);
      if (adminData.templeId) {
        const registrationsData = await getTempleServiceRegistrations(adminData.templeId);
        const enrichedRegistrations = await Promise.all(
          registrationsData.map(async (reg) => {
            const user = await getUserProfile(reg.userId);
            return { ...reg, user };
          })
        );
        setRegistrations(enrichedRegistrations);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load registrations'
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      setError(null);
      const adminResult = await getAdminData(user.uid);
      
      if (!adminResult) {
        setError('Unauthorized access');
        return;
      }

      setAdminData(adminResult);

      // Load services first, then service types
      await loadServices(adminResult);
      await loadServiceTypes(adminResult);
      
      // Load other data
      await Promise.all([
        loadEvents(adminResult),
        adminResult.templeId ? loadRegistrations(adminResult) : Promise.resolve()
      ]);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleStatusUpdate = async (registrationId: string, newStatus: ServiceRegistration['status']) => {
    if (!user?.uid || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      const registration = registrations.find(r => r.id === registrationId);
      if (!registration?.serviceId) {
        throw new Error('Service not found for registration');
      }

      await updateServiceRegistrationStatus(
        registrationId,
        newStatus,
        adminData.templeId,
        registration.serviceId
      );
      toast({ 
        description: 'Status updated successfully' 
      });
      await loadRegistrations(adminData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to update status'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!user?.uid || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      await deleteRegistration(registrationId, user.uid);
      toast({ 
        description: 'Registration deleted successfully' 
      });
      await loadRegistrations(adminData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete registration'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!adminData?.templeId) {
      toast({
        variant: 'destructive',
        description: 'Missing temple ID'
      });
      return;
    }
    setDeletingService(service);
  };

  const handleDeleteServiceType = async (serviceType: ServiceType) => {
    if (!adminData?.templeId) {
      toast({
        variant: 'destructive',
        description: 'Missing temple ID'
      });
      return;
    }
    setDeletingServiceType(serviceType);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleEditServiceType = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType);
    setShowTypeForm(true);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!adminData?.templeId) {
      toast({
        variant: 'destructive',
        description: 'Missing temple ID'
      });
      return;
    }
    setDeletingEvent(event);
  };

  const handleEditEvent = (event: Event) => {
    if (adminData?.templeId) {
      router.push(`/temples/${adminData.templeId}/events/edit/${event.id}`);
    }
  };

  const confirmDeleteService = async () => {
    if (!user?.uid || !deletingService || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      await deleteService(deletingService.id, user.uid, adminData.templeId, true);
      toast({ 
        description: 'Service deleted successfully' 
      });
      await loadServices(adminData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete service'
      });
    } finally {
      setActionLoading(false);
      setDeletingService(null);
    }
  };

  const confirmDeleteServiceType = async () => {
    if (!deletingServiceType || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      await deleteServiceType(deletingServiceType.id, adminData.templeId);
      toast({ 
        description: 'Service type deleted successfully' 
      });
      await loadServiceTypes(adminData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete service type'
      });
    } finally {
      setActionLoading(false);
      setDeletingServiceType(null);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEvent || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      await deleteEvent(adminData.templeId, deletingEvent.id);
      toast({ 
        description: 'Event deleted successfully' 
      });
      await loadEvents(adminData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete event'
      });
    } finally {
      setActionLoading(false);
      setDeletingEvent(null);
    }
  };
  
  if (authLoading || isInitialLoad || !adminData) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadData} className="mt-4">Retry</Button>
      </div>
    );
  }

  const isLoading = loadingServices || loadingEvents || loadingRegistrations || loadingServiceTypes;

  return (
    <div className="p-4 space-y-6 animate-in fade-in-50 duration-500">
      <AdminHeader
        onRefresh={loadData}
        onAddServiceType={() => {
          setEditingServiceType(undefined);
          setShowTypeForm(true);
        }}
        onAddService={() => {
          setEditingService(null);
          setShowServiceForm(true);
        }}
        templeId={adminData?.templeId}
        isLoading={actionLoading}
      />

      <Dialog 
        open={showServiceForm} 
        onOpenChange={(open) => {
          if (!open) {
            setShowServiceForm(false);
            setEditingService(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create Service'}</DialogTitle>
          </DialogHeader>
          <ServiceForm 
            onClose={() => {
              setShowServiceForm(false);
              setEditingService(null);
            }}
            onSuccess={async () => {
              setShowServiceForm(false);
              setEditingService(null);
              if (adminData) await loadServices(adminData);
            }}
            serviceTypes={serviceTypes}
            templeId={adminData?.templeId}
            service={editingService}
          />
        </DialogContent>
      </Dialog>

      <Dialog 
        open={showTypeForm} 
        onOpenChange={(open) => {
          if (!open) {
            setShowTypeForm(false);
            setEditingServiceType(undefined);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingServiceType ? 'Edit Service Type' : 'Create Service Type'}</DialogTitle>
          </DialogHeader>
          <ServiceTypeForm
            onClose={() => {
              setShowTypeForm(false);
              setEditingServiceType(undefined);
            }}
            onSuccess={async () => {
              setShowTypeForm(false);
              setEditingServiceType(undefined);
              if (adminData) await loadServiceTypes(adminData);
            }}
            templeId={adminData?.templeId}
            serviceType={editingServiceType}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
        <>
          <ServiceTypesTable
            serviceTypes={serviceTypes}
            onDeleteServiceType={handleDeleteServiceType}
            onEditServiceType={handleEditServiceType}
            isLoading={actionLoading}
          />

          <EventsTable
            events={events}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
            isLoading={actionLoading}
          />

          <ServicesTable
            services={services}
            onDeleteService={handleDeleteService}
            onEditService={handleEditService}
            isLoading={actionLoading}
          />

          {adminData?.templeId && (
            <RegistrationsTable
              registrations={registrations}
              onStatusUpdate={handleStatusUpdate}
              onDeleteRegistration={handleDeleteRegistration}
              isLoading={actionLoading}
            />
          )}
        </>
      )}

      <AlertDialog open={deletingService !== null} onOpenChange={() => setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This will also delete all associated registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteService} 
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingServiceType !== null} onOpenChange={() => setDeletingServiceType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service type? This may affect existing services using this type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteServiceType} 
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingEvent !== null} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEvent} 
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
