import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  onRefresh: () => void;
  onAddServiceType: () => void;
  onAddService: () => void;
  templeId?: string;
  isLoading: boolean;
}

export function AdminHeader({
  onRefresh,
  onAddServiceType,
  onAddService,
  templeId,
  isLoading
}: AdminHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
        <Button 
          onClick={onAddServiceType} 
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service Type
        </Button>
        <Button 
          onClick={onAddService} 
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
        {templeId && (
          <Link href={`/temples/${templeId}/events/create`} className="w-full sm:w-auto">
            <Button className="w-full" disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
