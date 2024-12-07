'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EventForm from '@/components/events/EventForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_COLLECTION = 'admin';

interface CreateEventPageProps {
  params: {
    id: string;
  };
}

export default function CreateEventPage({ params }: CreateEventPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        router.push(`/temples/${params.id}/events`);
        return;
      }

      try {
        const adminRef = doc(db, ADMIN_COLLECTION, user.uid);
        const adminDoc = await getDoc(adminRef);
        const adminData = adminDoc.data();

        const isAdmin = adminDoc.exists() && (
          adminData?.isSuperAdmin === true || 
          (adminData?.isAdmin === true && adminData?.templeId === params.id)
        );

        if (!isAdmin) {
          router.push(`/temples/${params.id}/events`);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push(`/temples/${params.id}/events`);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, params.id, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Event</h1>
        <EventForm templeId={params.id} />
      </div>
    </div>
  );
}
