'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from '@/components/services/ServiceIcon';
import { Activity, Bell, ChevronRight, X } from 'lucide-react';
import { Service, ServiceRegistration } from '@/lib/db/services/types';
import { subscribeToTempleServices } from '@/lib/db/services/services-optimized';
import { deleteRegistration } from '@/lib/db/services/registrations';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EnrichedRegistration extends ServiceRegistration {
  service?: Service;
}

interface DashboardServicesProps {
  initialRegistrations: EnrichedRegistration[];
  templeId: string | undefined;
  userId: string;
}

function StatusBadge({ status }: { status: ServiceRegistration['status'] }) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} transition-colors duration-200`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function DashboardServices({ initialRegistrations, templeId, userId }: DashboardServicesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>(initialRegistrations);
  const [services, setServices] = useState<Record<string, Service>>({});

  // Subscribe to user's registrations
  useEffect(() => {
    if (!userId || !templeId) {
      return;
    }

    const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
    const q = query(registrationsRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newRegistrations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EnrichedRegistration[];
        
        setRegistrations(newRegistrations);
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your service registrations'
        });
      }
    );

    return () => unsubscribe();
  }, [userId, templeId, toast]);

  // Subscribe to services updates
  useEffect(() => {
    if (!templeId) {
      const servicesMap = registrations.reduce((acc, reg) => {
        if (reg.service) {
          acc[reg.serviceId] = reg.service;
        }
        return acc;
      }, {} as Record<string, Service>);
      setServices(servicesMap);
      return;
    }

    const unsubscribe = subscribeToTempleServices(
      templeId,
      (updatedServices) => {
        const servicesMap = updatedServices.reduce((acc, service) => {
          acc[service.id] = service;
          return acc;
        }, {} as Record<string, Service>);

        setServices(servicesMap);
      },
      {
        orderByField: 'date',
        orderDirection: 'desc'
      }
    );

    return () => unsubscribe();
  }, [templeId, registrations]);

  const handleUnregister = async (registration: EnrichedRegistration) => {
    if (!templeId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Temple ID is required',
      });
      return;
    }

    try {
      await deleteRegistration(registration.id, userId, templeId);
      setRegistrations(prev => prev.filter(reg => reg.id !== registration.id));
      toast({
        title: 'Success',
        description: 'Successfully unregistered from the service',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unregister from service',
      });
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">My Services</CardTitle>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              You haven&apos;t registered for any services yet.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/services')}
              className="mt-4 group transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              Browse Services
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => (
              <Card key={reg.id} className="group overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-2 transition-transform group-hover:scale-110">
                        <ServiceIcon name={reg.serviceType} className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium transition-colors group-hover:text-primary">
                          {reg.serviceName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {reg.serviceDate.toDate().toLocaleDateString()} at {reg.serviceTimeSlot.start}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={reg.status} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnregister(reg)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                        <span className="ml-2">Unregister</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
