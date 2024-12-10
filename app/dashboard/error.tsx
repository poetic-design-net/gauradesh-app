'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-6">
        <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Something went wrong!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {error.message || 'An error occurred while loading the dashboard. Please try again.'}
          </p>
        </div>
        <Button 
          onClick={reset}
          className="group transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
