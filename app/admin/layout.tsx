'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        console.log('Checking admin status for user:', user.uid);
        
        try {
          // Check admin document directly
          const adminRef = doc(db, 'admin', user.uid);
          const adminDoc = await getDoc(adminRef);
          const adminData = adminDoc.data();
          
          console.log('Admin document exists:', adminDoc.exists());
          console.log('Admin data:', adminData);
          
          // User has access if they are either:
          // 1. A super admin
          // 2. A temple admin with a valid templeId
          const hasAdminAccess = adminDoc.exists() && (
            adminData?.isSuperAdmin === true || 
            (adminData?.isAdmin === true && adminData?.templeId)
          );
          
          console.log('Has admin access:', hasAdminAccess, {
            isSuperAdmin: adminData?.isSuperAdmin,
            isAdmin: adminData?.isAdmin,
            templeId: adminData?.templeId
          });
          
          setHasAccess(hasAdminAccess);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setHasAccess(false);
        }
      } else {
        console.log('No user found');
        setHasAccess(false);
      }
      setChecking(false);
    }

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !checking && (!user || !hasAccess)) {
      console.log('Redirecting to home:', { 
        loading, 
        checking, 
        user: !!user, 
        hasAccess 
      });
      router.push('/');
    }
  }, [user, loading, checking, hasAccess, router]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  return (
    <div className="container mx-auto">
      {children}
    </div>
  );
}
