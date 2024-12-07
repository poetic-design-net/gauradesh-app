'use client';

import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface NavigationLinkProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'destructive';
  className?: string;
}

export function NavigationLink({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'ghost',
  className = ''
}: NavigationLinkProps) {
  return (
    <Button
      variant={variant}
      className={`w-full justify-start ${className}`}
      onClick={onClick}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}