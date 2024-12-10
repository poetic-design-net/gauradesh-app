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
  const [iconName, setIconName] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadIcon() {
      if (!templeId || !name) {
        // If no templeId or name, check if name is a valid icon
        if (name && name in icons) {
          setIconName(name);
        }
        return;
      }

      try {
        // Get service types for the temple
        const types = await getTempleServiceTypes(templeId);
        
        // Find the service type that matches the service type name
        const serviceType = types.find(type => type.name === name);
        
        if (serviceType?.icon) {
          // Use the icon field from the service type
          setIconName(serviceType.icon);
        } else if (name in icons) {
          // Fallback: if name is a valid icon name, use it directly
          setIconName(name);
        } else {
          console.log('No icon found for service type:', name);
          setIconName(undefined);
        }
      } catch (error) {
        console.error('Error loading service type icon:', error);
        // Fallback to using name as icon if it's valid
        if (name in icons) {
          setIconName(name);
        }
      }
    }

    loadIcon();
  }, [name, templeId]);

  // If no icon name is set, show default icon
  if (!iconName) {
    return <HelpCircle className={className} />;
  }

  // Get the icon component from Lucide icons
  const Icon = (icons as Record<string, LucideIcon>)[iconName] || HelpCircle;
  return <Icon className={className} />;
}
