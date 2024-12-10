'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from '@/components/services/ServiceIcon';
import { Activity, Bell, ChevronRight } from 'lucide-react';
import { ServiceRegistration } from '@/lib/db/services';
import { subscribeToTempleServices } from '@/lib/db/services/services-optimized';
import { useRouter } from 'next/navigation';

interface ServiceData {
  id: string;
  name: string;
  type: string;
  maxParticipants: number;
  currentParticipants: number;
  pendingParticipants: number;
  date: any;
  timeSlot: { start: string; end: string };
  contactPerson: { name: string; phone: string };
  notes: string | null;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

interface EnrichedRegistration extends ServiceRegistration {
  service?: ServiceData;
}

interface DashboardServicesProps {
  initialRegistrations: EnrichedRegistration[];
  templeId: string | undefined;
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

export function DashboardServices({ initialRegistrations, templeId }: DashboardServicesProps) {
  const router = useRouter();
  const [registrations] = useState(initialRegistrations);
  const [services, setServices] = useState<Record<string, ServiceData>>({});

  // Subscribe to services updates
  useEffect(() => {
    if (!templeId) {
      // If no templeId, use the initial service data from registrations
      const servicesMap = registrations.reduce((acc, reg) => {
        if (reg.service) {
          acc[reg.serviceId] = reg.service;
        }
        return acc;
      }, {} as Record<string, ServiceData>);
      setServices(servicesMap);
      return;
    }

    const unsubscribe = subscribeToTempleServices(
      templeId,
      (updatedServices) => {
        // Create a map of services for quick lookup
        const servicesMap = updatedServices.reduce((acc, service) => {
          acc[service.id] = service;
          return acc;
        }, {} as Record<string, ServiceData>);

        setServices(servicesMap);
      },
      {
        orderByField: 'date',
        orderDirection: 'desc'
      }
    );

    return () => unsubscribe();
  }, [templeId, registrations]);

  // Enrich registrations with service data
  const enrichedRegistrations = registrations.map(reg => ({
    ...reg,
    service: services[reg.serviceId] || reg.service || {
      id: reg.serviceId,
      name: 'Loading...',
      type: 'unknown',
      maxParticipants: 0,
      currentParticipants: 0,
      pendingParticipants: 0,
      date: reg.createdAt,
      timeSlot: { start: '00:00', end: '00:00' },
      contactPerson: { name: 'Unknown', phone: 'N/A' },
      notes: null,
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt,
      createdBy: ''
    }
  }));

  return (
    <Card className="transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">My Services</CardTitle>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {enrichedRegistrations.length === 0 ? (
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
            {enrichedRegistrations.map((reg) => (
              <Card key={reg.id} className="group overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-2 transition-transform group-hover:scale-110">
                        <ServiceIcon name={reg.service?.type} className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium transition-colors group-hover:text-primary">
                          {reg.service?.name ?? 'Unknown Service'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Registered on {reg.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={reg.status} />
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