'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { ServiceTypeForm } from "@/components/admin/ServiceTypeForm";
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
} from "@/lib/db/services";
import { getTempleEvents, deleteEvent } from "@/lib/db/events/events";
import { Event } from "@/lib/db/events/types";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { type AdminData } from "@/lib/db/admin";
import { formatFirebaseTimestamp } from "@/lib/utils";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_COLLECTION = 'admin';

async function getAdminData(uid: string): Promise<AdminData | null> {
  if (!uid) return null;
  
  try {
    console.log('[getAdminData] Fetching admin data for uid:', uid);
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    const adminDoc = await getDoc(adminRef);
    const adminData = adminDoc.data();
    console.log('[getAdminData] Admin doc exists:', adminDoc.exists(), 'Data:', adminData);
    
    if (adminDoc.exists() && adminData) {
      // User has access if they are either:
      // 1. A super admin
      // 2. A temple admin with a valid templeId
      const hasAccess = 
        adminData.isSuperAdmin === true || 
        (adminData.isAdmin === true && adminData.templeId);

      console.log('[getAdminData] Has access:', hasAccess, {
        isSuperAdmin: adminData.isSuperAdmin,
        isAdmin: adminData.isAdmin,
        templeId: adminData.templeId
      });

      if (hasAccess) {
        return {
          uid,
          ...adminData
        } as AdminData;
      }
    }
    return null;
  } catch (error) {
    console.error('[getAdminData] Error getting admin data:', error);
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
    Array<ServiceRegistration & { user?: UserProfile; service?: Service }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const { toast } = useToast();
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log('[loadData] Loading data for user:', user.uid);
      const adminResult = await getAdminData(user.uid);
      console.log('[loadData] Admin result:', adminResult);
      
      if (!adminResult) {
        setError('Unauthorized access');
        return;
      }

      setAdminData(adminResult);

      const [servicesData, typesData, eventsData] = await Promise.all([
        adminResult.templeId ? getTempleServices(adminResult.templeId) : getAllServices(),
        adminResult.templeId ? getTempleServiceTypes(adminResult.templeId) : getAllServiceTypes(),
        adminResult.templeId ? getTempleEvents(adminResult.templeId) : []
      ]);

      console.log('[loadData] Loaded services:', servicesData);
      console.log('[loadData] Loaded service types:', typesData);
      console.log('[loadData] Loaded events:', eventsData);

      let registrationsData: ServiceRegistration[] = [];
      if (adminResult.templeId) {
        registrationsData = await getTempleServiceRegistrations(adminResult.templeId);
        console.log('[loadData] Loaded registrations:', registrationsData);
      }

      setServices(servicesData);
      setServiceTypes(typesData);
      setEvents(eventsData);

      const enrichedRegistrations = await Promise.all(
        registrationsData.map(async (reg) => {
          const [user, service] = await Promise.all([
            getUserProfile(reg.userId),
            servicesData.find(s => s.id === reg.serviceId)
          ]);
          return { ...reg, user, service };
        })
      );

      setRegistrations(enrichedRegistrations);
    } catch (err: any) {
      console.error('[loadData] Error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
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
      const registration = registrations.find(r => r.id === registrationId);
      if (!registration?.service?.id) {
        throw new Error('Service not found for registration');
      }

      await updateServiceRegistrationStatus(
        registrationId,
        newStatus,
        adminData.templeId,
        registration.service.id
      );
      toast({ description: 'Status updated successfully' });
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to update status'
      });
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!user?.uid || !adminData?.templeId) return;

    try {
      await deleteRegistration(registrationId, user.uid);
      toast({ description: 'Registration deleted successfully' });
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete registration'
      });
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!adminData?.templeId) {
      console.error('[handleDeleteService] No temple ID found in admin data');
      toast({
        variant: 'destructive',
        description: 'Missing temple ID'
      });
      return;
    }
    console.log('[handleDeleteService] Starting delete for service:', service);
    console.log('[handleDeleteService] Current admin data:', adminData);
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
    if (!user?.uid || !deletingService || !adminData?.templeId) {
      console.error('[confirmDeleteService] Missing required data:', {
        userId: user?.uid,
        deletingService: !!deletingService,
        templeId: adminData?.templeId
      });
      return;
    }

    try {
      await deleteService(deletingService.id, user.uid, adminData.templeId, true);
      toast({ description: 'Service deleted successfully' });
      loadData();
    } catch (error: any) {
      console.error('[confirmDeleteService] Error:', error);
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete service'
      });
    } finally {
      setDeletingService(null);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEvent || !adminData?.templeId) return;

    try {
      await deleteEvent(adminData.templeId, deletingEvent.id);
      toast({ description: 'Event deleted successfully' });
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to delete event'
      });
    } finally {
      setDeletingEvent(null);
    }
  };

  if (authLoading || loading) {
    return <div>Loading...</div>;
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
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowTypeForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
          </Button>
          <Button onClick={() => setShowServiceForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          {adminData?.templeId && (
            <Link href={`/temples/${adminData.templeId}/events/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </Link>
          )}
        </div>
      </div>

      {showServiceForm && (
        <ServiceForm 
          onClose={() => setShowServiceForm(false)}
          onSuccess={() => {
            setShowServiceForm(false);
            loadData();
          }}
          serviceTypes={serviceTypes}
          templeId={adminData?.templeId}
        />
      )}

      {showTypeForm && (
        <ServiceTypeForm
          onClose={() => setShowTypeForm(false)}
          onSuccess={() => {
            setShowTypeForm(false);
            loadData();
          }}
          templeId={adminData?.templeId}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Start Date</th>
                  <th className="text-left p-2">End Date</th>
                  <th className="text-left p-2">Capacity</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="p-2">{event.title}</td>
                    <td className="p-2">{event.location}</td>
                    <td className="p-2">{event.startDate.toDate().toLocaleString()}</td>
                    <td className="p-2">{event.endDate.toDate().toLocaleString()}</td>
                    <td className="p-2">{event.capacity || 'Unlimited'}</td>
                    <td className="p-2 space-x-2">
                      <Link href={`/temples/${adminData?.templeId}/events/${event.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Participants</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="p-2">{service.name}</td>
                    <td className="p-2">{service.type}</td>
                    <td className="p-2">{formatFirebaseTimestamp(service.date)}</td>
                    <td className="p-2">{service.timeSlot.start} - {service.timeSlot.end}</td>
                    <td className="p-2">
                      {service.currentParticipants}/{service.maxParticipants}
                      {service.pendingParticipants > 0 && ` (${service.pendingParticipants} pending)`}
                    </td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteService(service)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {adminData?.templeId && (
        <Card>
          <CardHeader>
            <CardTitle>Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Service</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td className="p-2">{reg.service?.name}</td>
                      <td className="p-2">{reg.user?.email}</td>
                      <td className="p-2">
                        <select
                          value={reg.status}
                          onChange={(e) => handleStatusUpdate(reg.id, e.target.value as ServiceRegistration['status'])}
                          className="border rounded p-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="p-2">{formatFirebaseTimestamp(reg.createdAt)}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRegistration(reg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteService} className="bg-red-600">
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
