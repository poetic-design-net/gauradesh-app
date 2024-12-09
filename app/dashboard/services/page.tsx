'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRegistration } from '@/lib/db/services/types';
import { subscribeToUserRegistrations } from '@/lib/db/services/registrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceIcon } from '@/components/services/ServiceIcon';
import { formatFirebaseTimestamp } from '@/lib/utils';

function StatusBadge({ status }: { status: ServiceRegistration['status'] }) {
  const variants: Record<ServiceRegistration['status'], string> = {
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
  const [registrations, setRegistrations] = useState<ServiceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserRegistrations(
      user.uid,
      (updatedRegistrations: ServiceRegistration[]) => {
        // Sort registrations by date, most recent first
        const sortedRegistrations = [...updatedRegistrations].sort((a, b) => 
          b.serviceDate.toMillis() - a.serviceDate.toMillis()
        );
        setRegistrations(sortedRegistrations);
        setLoading(false);
      },
      (error: Error) => {
        console.error('Error loading registrations:', error);
        setError('Failed to load registrations');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user]);

  if (loading) {
    return null; // Return nothing while loading instead of skeleton
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to view your services.
          </p>
        </CardContent>
      </Card>
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
                  <ServiceIcon name={registration.serviceType} className="h-4 w-4" />
                  <CardTitle className="text-lg">
                    {registration.serviceName}
                  </CardTitle>
                </div>
                <StatusBadge status={registration.status} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Type: {registration.serviceType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {formatFirebaseTimestamp(registration.serviceDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Time: {registration.serviceTimeSlot.start} - {registration.serviceTimeSlot.end}
                  </p>
                  {registration.message && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-600">Your Message:</p>
                      <p className="text-sm text-gray-500 mt-1">{registration.message}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>
                      Registered on: {registration.createdAt.toDate().toLocaleDateString()}
                    </span>
                    {registration.updatedAt && registration.updatedAt.toMillis() > registration.createdAt.toMillis() && (
                      <span>
                        Last updated: {registration.updatedAt.toDate().toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
