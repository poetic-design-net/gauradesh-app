'use client';

import { icons, LucideIcon, HelpCircle } from 'lucide-react';

interface ServiceIconProps {
  name?: string;
  className?: string;
}

export function ServiceIcon({ name, className = '' }: ServiceIconProps) {
  if (!name) {
    return <HelpCircle className={className} />;
  }

  // Try to find the icon in Lucide icons
  const Icon = (icons as Record<string, LucideIcon>)[name] || HelpCircle;
  return <Icon className={className} />;
}