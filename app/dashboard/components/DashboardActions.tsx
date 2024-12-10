'use client';

import { Button } from '@/components/ui/button';
import { FileText, Settings, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardActionsProps {
  temple: any;
  isAdmin: boolean;
}

export function DashboardActions({ temple, isAdmin }: DashboardActionsProps) {
  const router = useRouter();

  return (
    <div className="block sm:flex justify-end space-y-2 sm:space-y-0 sm:space-x-4">
      {temple && (
        <Button
          variant="outline"
          onClick={() => router.push(`/temples/${temple.id}/about`)}
          className="group w-full sm:w-auto transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          <FileText className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          About Temple
          <ChevronRight className="ml-2 h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="outline"
          onClick={() => router.push('/admin/settings')}
          className="group w-full sm:w-auto transition-all duration-300 hover:bg-blue-600 hover:text-white"
        >
          <Settings className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          Admin Settings
          <ChevronRight className="ml-2 h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </Button>
      )}
    </div>
  );
}
