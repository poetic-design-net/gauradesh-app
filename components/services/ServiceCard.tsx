'use client';

import { Service } from '@/lib/db/services';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from './ServiceIcon';
import { ArrowRight, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ServiceCardProps {
  service: Service;
  onRegister: (serviceId: string) => Promise<void>;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

interface ServiceCounts {
  currentParticipants: number;
  pendingParticipants: number;
  maxParticipants: number;
}

export function ServiceCard({ service, onRegister, onEdit, onDelete }: ServiceCardProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ServiceCounts>({
    currentParticipants: service.currentParticipants || 0,
    pendingParticipants: service.pendingParticipants || 0,
    maxParticipants: service.maxParticipants || 0
  });

  useEffect(() => {
    // Subscribe to real-time updates using Firestore
    const serviceRef = doc(db, `temples/${service.templeId}/services/${service.id}`);
    const unsubscribe = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCounts({
          currentParticipants: data.currentParticipants || 0,
          pendingParticipants: data.pendingParticipants || 0,
          maxParticipants: data.maxParticipants || 0
        });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [service.id, service.templeId]);

  const percentageFull = Math.round((counts.currentParticipants / counts.maxParticipants) * 100);
  const isFull = counts.currentParticipants >= counts.maxParticipants;
  const isAvailable = counts.currentParticipants < counts.maxParticipants;

  // Only show edit/delete if the handlers are provided
  const showManageButtons = Boolean(onEdit || onDelete);

  return (
    <Card className="overflow-hidden backdrop-blur-lg bg-white/10 border-white/20 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
              <ServiceIcon name={service.type || 'default'} className="h-6 w-6 text-purple-400" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-white">{service.name || 'Unnamed Service'}</CardTitle>
              <CardDescription className="text-gray-400">
                Service Type: {service.type || 'Not specified'}
              </CardDescription>
            </div>
          </div>
          {showManageButtons && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(service)}
                  className="hover:bg-purple-500/20"
                >
                  <Edit className="h-4 w-4 text-purple-400" />
                </Button>
              )}
             
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          {service.description || 'No description available'}
        </p>

        {/* Date and Time Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="h-4 w-4" />
            <span>
              {service.date ? format(service.date.toDate(), 'EEEE, MMMM d, yyyy') : 'Date not set'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="h-4 w-4" />
            <span>
              {service.timeSlot ? `${service.timeSlot.start} - ${service.timeSlot.end}` : 'Time not set'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {counts.currentParticipants} of {counts.maxParticipants} spots filled
              {counts.pendingParticipants > 0 && ` (${counts.pendingParticipants} pending)`}
            </span>
            <span className={`font-medium ${
              isFull ? 'text-red-400' : 
              counts.pendingParticipants > 0 ? 'text-yellow-400' :
              percentageFull > 75 ? 'text-orange-400' : 
              'text-green-400'
            }`}>
              {percentageFull}% full
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Approved Participants Bar */}
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                isFull 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : percentageFull > 75
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
              }`}
              style={{ width: `${percentageFull}%` }}
            />
            {/* Pending Participants Bar */}
            {counts.pendingParticipants > 0 && (
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-50"
                style={{ 
                  left: `${percentageFull}%`,
                  width: `${Math.round((counts.pendingParticipants / counts.maxParticipants) * 100)}%`
                }}
              />
            )}
            <div 
              className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ 
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className={`w-full group transition-all duration-300 ${
            isFull 
              ? 'bg-red-500/80 text-red-300 hover:bg-red-500/90'
              : 'bg-purple-500/80 text-purple-300 hover:bg-purple-500/90'
          }`}
          onClick={() => onRegister(service.id)}
          disabled={isFull || !isAvailable}
        >
          <span className="flex items-center justify-center gap-2">
            {isFull ? 'Service Full' : 'Register for Service'}
            {!isFull && isAvailable && (
              <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            )}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
