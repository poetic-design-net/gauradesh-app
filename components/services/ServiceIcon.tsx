'use client';

import { useEffect, useState } from 'react';
import { icons, LucideIcon, HelpCircle } from 'lucide-react';
import { getTempleServiceTypes } from '@/lib/db/services/service-types';
import { ServiceType } from '@/lib/db/services/types';

interface ServiceIconProps {
  name?: string;
  className?: string;
  templeId?: string;
}

export function ServiceIcon({ name, className = '', templeId }: ServiceIconProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [iconName, setIconName] = useState<string | undefined>(name);

  useEffect(() => {
    // If the name is already a valid Lucide icon, use it directly
    if (name && name in icons) {
      setIconName(name);
      return;
    }

    // If we have a templeId and name, try to find the corresponding service type
    if (templeId && name) {
      getTempleServiceTypes(templeId).then(types => {
        const serviceType = types.find(type => type.name === name);
        if (serviceType?.icon) {
          setIconName(serviceType.icon);
        }
      }).catch(error => {
        console.error('Error fetching service types:', error);
      });
    }
  }, [name, templeId]);

  if (!iconName) {
    return <HelpCircle className={className} />;
  }

  // Try to find the icon in Lucide icons
  const Icon = (icons as Record<string, LucideIcon>)[iconName] || HelpCircle;
  return <Icon className={className} />;
}
