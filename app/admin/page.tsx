'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardSkeleton } from '@/components/admin/AdminDashboardSkeleton';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { EventsTable } from '@/components/admin/EventsTable';
import { ServicesTable } from '@/components/admin/ServicesTable';
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
import { Loader2 } from 'lucide-react';

import { 
  getAllServices, 
  getTempleServiceRegistrations,
  getAllServiceTypes,
  getTempleServices,
  getTempleServiceTypes,
  updateServiceRegistrationStatus,
  deleteRegistration,
  deleteService,
  Service,
  ServiceRegistration,
  ServiceType
} from '@/lib/db/services';
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
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const { toast } = useToast();
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadServices = async (adminData: AdminData) => {
    try {
      setLoadingServices(true);
      const servicesData = adminData.templeId 
        ? await getTempleServices(adminData.templeId)
        : await getAllServices();
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
      setLoadingServiceTypes(true);
      const typesData = adminData.templeId
        ? await getTempleServiceTypes(adminData.templeId)
        : await getAllServiceTypes();
      setServiceTypes(typesData);
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

      await Promise.all([
        loadServices(adminResult),
        loadEvents(adminResult),
        loadServiceTypes(adminResult)
      ]);

      if (adminResult.templeId) {
        await loadRegistrations(adminResult);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load data');
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
        variant: 'success',
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
        variant: 'success',
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

  const confirmDeleteService = async () => {
    if (!user?.uid || !deletingService || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      await deleteService(deletingService.id, user.uid, adminData.templeId, true);
      toast({ 
        variant: 'success',
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

  const confirmDeleteEvent = async () => {
    if (!deletingEvent || !adminData?.templeId) return;

    try {
      setActionLoading(true);
      await deleteEvent(adminData.templeId, deletingEvent.id);
      toast({ 
        variant: 'success',
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
  
  if (authLoading || !adminData) {
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

  return (
    <div className="p-4 space-y-6">
      <AdminHeader
        onRefresh={loadData}
        onAddServiceType={() => setShowTypeForm(true)}
        onAddService={() => setShowServiceForm(true)}
        templeId={adminData?.templeId}
        isLoading={actionLoading}
      />

      {showServiceForm && (
        <ServiceForm 
          onClose={() => setShowServiceForm(false)}
          onSuccess={async () => {
            setShowServiceForm(false);
            if (adminData) await loadServices(adminData);
          }}
          serviceTypes={serviceTypes}
          templeId={adminData?.templeId}
        />
      )}

      {showTypeForm && (
        <ServiceTypeForm
          onClose={() => setShowTypeForm(false)}
          onSuccess={async () => {
            setShowTypeForm(false);
            if (adminData) await loadServiceTypes(adminData);
          }}
          templeId={adminData?.templeId}
        />
      )}

      <EventsTable
        events={events}
        onDeleteEvent={handleDeleteEvent}
        isLoading={actionLoading}
      />

      <ServicesTable
        services={services}
        onDeleteService={handleDeleteService}
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
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
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
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
