'use client';

import { Service, ServiceParticipant } from '@/lib/db/services/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ServiceIcon } from './ServiceIcon';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface ServiceDetailsProps {
  service: Service;
  templeId: string;
  onEdit?: (service: Service) => void;
  isAdmin?: boolean;
}

export function ServiceDetails({ service, templeId, onEdit, isAdmin }: ServiceDetailsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const date = service.date.toDate();
  const availableSpots = service.maxParticipants - (service.currentParticipants || 0);
  const isRegistered = service.participants?.some((p: ServiceParticipant) => p.userId === user?.uid);

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Button
        variant="ghost"
        className="mb-4 group hover:bg-transparent -ml-2"
        onClick={() => router.push(`/temples/${templeId}/services`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Services
      </Button>

      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ServiceIcon name={service.type} className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{service.name}</h2>
            </div>
            {isAdmin && onEdit && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(service)}
                size="sm"
              >
                Edit
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Service Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {date.toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {service.timeSlot.start} - {service.timeSlot.end}
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {service.currentParticipants || 0} / {service.maxParticipants}
                  </span>
                  <Badge 
                    variant={availableSpots > 0 ? "outline" : "secondary"} 
                    className="ml-2"
                  >
                    {availableSpots > 0 ? `${availableSpots} spots` : 'Full'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {service.description}
              </p>
            </div>

            {/* Notes if any */}
            {service.notes && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-1">Notes:</p>
                {service.notes}
              </div>
            )}

            {/* Registration Button */}
            {user && (
              <div className="pt-2">
                <Button 
                  className="w-full"
                  disabled={isRegistering || availableSpots === 0}
                  onClick={() => {
                    // Handle registration logic
                  }}
                >
                  {isRegistering ? 'Processing...' : 
                   isRegistered ? 'Cancel Registration' :
                   availableSpots === 0 ? 'Service Full' : 'Register for Service'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
