'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRegistration, getUserServiceRegistrations, getService, Service } from '@/lib/db/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceIcon } from '@/components/services/ServiceIcon';

function StatusBadge({ status }: { status: ServiceRegistration['status'] }) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Array<ServiceRegistration & { service?: Service }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRegistrations() {
      if (!user) return;

      try {
        const userRegistrations = await getUserServiceRegistrations(user.uid);
        
        // Fetch service details for each registration
        const registrationsWithServices = await Promise.all(
          userRegistrations.map(async (registration) => {
            try {
              const service = await getService(registration.serviceId, registration.templeId);
              return { ...registration, service };
            } catch (error) {
              console.error(`Error loading service ${registration.serviceId}:`, error);
              return registration;
            }
          })
        );

        setRegistrations(registrationsWithServices);
      } catch (error) {
        console.error('Error loading registrations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRegistrations();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Services</h1>
      
      {registrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You haven&apos;t registered for any services yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((registration) => (
            <Card key={registration.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  {registration.service && (
                    <ServiceIcon name={registration.service.name} className="h-4 w-4" />
                  )}
                  <CardTitle className="text-lg">
                    {registration.service?.name || 'Unknown Service'}
                  </CardTitle>
                </div>
                <StatusBadge status={registration.status} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {registration.service?.description || 'No description available'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Registered on: {registration.createdAt.toDate().toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
