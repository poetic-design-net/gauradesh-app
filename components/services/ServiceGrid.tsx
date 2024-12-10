'use client';

import { Service } from '@/lib/db/services/types';
import { ServiceCard } from '@/components/services/ServiceCard';
import { HeartHandshake } from 'lucide-react';

interface ServiceGridProps {
  services: Service[];
  isAdmin: boolean;
  onRegister: (serviceId: string, message?: string) => Promise<void>;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

export function ServiceGrid({ 
  services, 
  isAdmin, 
  onRegister, 
  onEdit, 
  onDelete 
}: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 px-6">
        <div className="text-center space-y-4 p-8 backdrop-blur-lg bg-white/10 rounded-lg border border-white/20">
          <HeartHandshake className="h-16 w-16 text-purple-400 mx-auto opacity-50" />
          <p className="text-xl text-gray-300">No services available at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 p-6">
      {services.map((service) => (
        <div key={service.id} className="group transition-all duration-300">
          <ServiceCard
            service={service}
            onRegister={onRegister}
            onEdit={isAdmin ? onEdit : undefined}
            onDelete={isAdmin ? onDelete : undefined}
          />
        </div>
      ))}
    </div>
  );
}
