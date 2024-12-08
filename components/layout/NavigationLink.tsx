'use client';

import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavigationLinkProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'destructive';
  className?: string;
  showLabel?: boolean;
}

export function NavigationLink({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'ghost',
  className = '',
  showLabel = false
}: NavigationLinkProps) {
  const button = (
    <Button
      variant={variant}
      className={`relative h-10 ${showLabel ? 'w-full justify-start' : 'w-10'} ${className}`}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 absolute left-2.5" />
      {showLabel && (
        <span className="pl-8">{label}</span>
      )}
    </Button>
  );

  if (showLabel) {
    return button;
  }

  return (
    <div style={{ position: 'static' }}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          align="center" 
          alignOffset={-5}
          avoidCollisions={false}
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
