'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="hidden md:block w-64 border-r">
        <Navigation />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
