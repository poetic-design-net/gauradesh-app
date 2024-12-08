'use client';

import { useState, useEffect } from 'react';
import { Service } from '@/lib/db/services/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Edit } from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ServiceIcon } from './ServiceIcon';
import { Badge } from '@/components/ui/badge';

export interface ServiceListProps {
  services: Service[];
  templeId: string;
  onEdit?: (service: Service) => void;
  isAdmin?: boolean;
}

export function ServiceList({ services: initialServices, templeId, onEdit, isAdmin }: ServiceListProps) {
  const [services, setServices] = useState(initialServices);

  // Subscribe to real-time updates
  useEffect(() => {
    const servicesRef = collection(db, `temples/${templeId}/services`);
    const q = query(servicesRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedServices = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Service));
      setServices(updatedServices);
    }, (error) => {
      console.error('Error in real-time services subscription:', error);
    });

    return () => unsubscribe();
  }, [templeId]);

  if (!services?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No services found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const date = service.date.toDate();
        const availableSpots = service.maxParticipants - (service.currentParticipants || 0);
        
        return (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ServiceIcon name={service.type} className="h-4 w-4" />
                  <h3 className="font-medium text-sm">{service.name}</h3>
                </div>
                {isAdmin && onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2"
                    onClick={() => onEdit(service)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-2 h-3 w-3" />
                  {date.toLocaleDateString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-2 h-3 w-3" />
                  {service.timeSlot.start} - {service.timeSlot.end}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Users className="mr-2 h-3 w-3" />
                  <span>
                    {service.currentParticipants || 0} / {service.maxParticipants}
                  </span>
                  <Badge 
                    variant={availableSpots > 0 ? "outline" : "secondary"} 
                    className="ml-2 text-[10px] px-1 py-0"
                  >
                    {availableSpots > 0 ? `${availableSpots} spots` : 'Full'}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <Link href={`/temples/${templeId}/services/${service.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-7">Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
