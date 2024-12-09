'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSuperAdmin } from '@/lib/db/admin';
import { useToast } from '@/components/ui/use-toast';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkSuperAdminStatus() {
      if (!user) {
        console.log('No user found, redirecting...');
        setChecking(false);
        return;
      }

      try {
        // Force token refresh before checking super admin status
        await user.getIdToken(true);
        console.log('Token refreshed, checking super admin status...');
        
        const adminStatus = await isSuperAdmin(user.uid);
        console.log('Super admin status:', adminStatus);
        
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have super admin permissions',
          });
          console.log('Access denied, user is not super admin');
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to verify admin status',
        });
      }
      setChecking(false);
    }

    if (!loading) {
      checkSuperAdminStatus();
    }
  }, [user, loading, toast]);

  useEffect(() => {
    if (!loading && !checking && (!user || !isAdmin)) {
      console.log('Redirecting to home, conditions:', {
        loading,
        checking,
        hasUser: !!user,
        isAdmin
      });
      router.push('/');
    }
  }, [user, loading, checking, isAdmin, router]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  );
}
