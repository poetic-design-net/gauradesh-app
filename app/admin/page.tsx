'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { ServiceTypeForm } from '@/components/admin/ServiceTypeForm';
import { AdminDashboardSkeleton } from '@/components/admin/AdminDashboardSkeleton';
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
import { getUserProfile, UserProfile } from '@/lib/db/users';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, RefreshCw, Loader2, Check, X, Clock } from 'lucide-react';
import { type AdminData } from '@/lib/db/admin';
import { formatFirebaseTimestamp } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
} from '@/components/ui/alert-dialog';

const ADMIN_COLLECTION = 'admin';

const getStatusBadge = (status: ServiceRegistration['status']) => {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center gap-1 w-24 justify-center">
          <Check className="w-3 h-3" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 flex items-center gap-1 w-24 justify-center">
          <X className="w-3 h-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 flex items-center gap-1 w-24 justify-center">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
};

const getStatusColor = (status: ServiceRegistration['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-green-50 text-green-800 dark:bg-green-900/10 dark:text-green-100';
    case 'rejected':
      return 'bg-red-50 text-red-800 dark:bg-red-900/10 dark:text-red-100';
    default:
      return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-100';
  }
};

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
      toast({ description: 'Status updated successfully' });
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
      toast({ description: 'Registration deleted successfully' });
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
      toast({ description: 'Service deleted successfully' });
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
      toast({ description: 'Event deleted successfully' });
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
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={loadData} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button 
            onClick={() => setShowTypeForm(true)} 
            className="w-full sm:w-auto"
            disabled={actionLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
          </Button>
          <Button 
            onClick={() => setShowServiceForm(true)} 
            className="w-full sm:w-auto"
            disabled={actionLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          {adminData?.templeId && (
            <Link href={`/temples/${adminData.templeId}/events/create`} className="w-full sm:w-auto">
              <Button className="w-full" disabled={actionLoading}>
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

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingEvents ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-[250px] bg-muted animate-pulse rounded" />
                    <div className="h-3 w-[200px] bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-8 w-[100px] bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden rounded-lg border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Location</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Start Date</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">End Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Capacity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {events.map((event) => (
                        <tr key={event.id} className="hover:bg-muted/50">
<td className="px-4 py-3 text-sm">
                            <div className="font-medium">{event.title}</div>
                            <div className="sm:hidden text-xs text-muted-foreground mt-1">
                              {event.location}<br />
                              {event.startDate.toDate().toLocaleString()}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-sm">{event.location}</td>
                          <td className="hidden sm:table-cell px-4 py-3 text-sm">
                            {event.startDate.toDate().toLocaleString()}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-sm">
                            {event.endDate.toDate().toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="secondary">
                              {event.capacity || 'Unlimited'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/temples/${adminData?.templeId}/events/${event.id}/edit`}>
                                <Button size="sm" variant="outline" disabled={actionLoading}>
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteEvent(event)}
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingServices ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-[250px] bg-muted animate-pulse rounded" />
                    <div className="h-3 w-[200px] bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-8 w-[100px] bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden rounded-lg border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Type</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Time</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Participants</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">{service.name}</div>
                            <div className="sm:hidden text-xs text-muted-foreground mt-1">
                              {service.type}<br />
                              {formatFirebaseTimestamp(service.date)}<br />
                              {service.timeSlot.start} - {service.timeSlot.end}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-sm">
                            <Badge variant="outline">{service.type}</Badge>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-sm">
                            {formatFirebaseTimestamp(service.date)}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-sm">
                            {service.timeSlot.start} - {service.timeSlot.end}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="secondary">
                              {service.currentParticipants}/{service.maxParticipants}
                            </Badge>
                            {service.pendingParticipants > 0 && (
                              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                {service.pendingParticipants} pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteService(service)}
                              disabled={actionLoading}
                              className="ml-auto"
                            >
                              {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {adminData?.templeId && (
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Registrations</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingRegistrations ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-[250px] bg-muted animate-pulse rounded" />
                      <div className="h-3 w-[200px] bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-[100px] bg-muted animate-pulse rounded" />
                      <div className="h-8 w-[40px] bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden rounded-lg border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Service</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">User</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Date</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Message</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {registrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium">{reg.serviceName}</div>
                              <div className="sm:hidden text-xs text-muted-foreground mt-1">
                                {reg.user?.email}<br />
                                {formatFirebaseTimestamp(reg.createdAt)}
                                {reg.message && (
                                  <>
                                    <br />
                                    <span className="italic">"{reg.message}"</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3 text-sm">{reg.user?.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <select
                                value={reg.status}
                                onChange={(e) => handleStatusUpdate(reg.id, e.target.value as ServiceRegistration['status'])}
                                className={`w-full sm:w-auto rounded-md border p-2 ${getStatusColor(reg.status)} transition-colors duration-200 cursor-pointer hover:opacity-90 focus:ring-2 focus:ring-offset-2 ${
                                  reg.status === 'approved' 
                                    ? 'focus:ring-green-500 hover:bg-green-200 dark:hover:bg-green-900/20' 
                                    : reg.status === 'rejected'
                                    ? 'focus:ring-red-500 hover:bg-red-200 dark:hover:bg-red-900/20'
                                    : 'focus:ring-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-900/20'
                                }`}
                                disabled={actionLoading}
                              >
                                <option value="pending" className="bg-white dark:bg-gray-800">Change to Pending</option>
                                <option value="approved" className="bg-white dark:bg-gray-800">Change to Approved</option>
                                <option value="rejected" className="bg-white dark:bg-gray-800">Change to Rejected</option>
                              </select>
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3 text-sm">
                              {formatFirebaseTimestamp(reg.createdAt)}
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3 text-sm">
                              {reg.message ? (
                                <span className="italic text-gray-600">"{reg.message}"</span>
                              ) : (
                                <span className="text-gray-400">No message</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRegistration(reg.id)}
                                disabled={actionLoading}
                                className="ml-auto"
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
