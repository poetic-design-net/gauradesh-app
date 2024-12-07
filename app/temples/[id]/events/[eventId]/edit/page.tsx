'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EventForm from '@/components/events/EventForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/lib/db/events/types';

const ADMIN_COLLECTION = 'admin';
const EVENTS_COLLECTION = 'events';

interface EditEventPageProps {
  params: {
    id: string;
    eventId: string;
  };
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function checkAdminAndLoadEvent() {
      if (!user) {
        router.push(`/temples/${params.id}/events`);
        return;
      }

      try {
        // Check admin status
        const adminRef = doc(db, ADMIN_COLLECTION, user.uid);
        const adminDoc = await getDoc(adminRef);
        const adminData = adminDoc.data();

        const isAdmin = adminDoc.exists() && (
          adminData?.isSuperAdmin === true || 
          (adminData?.isAdmin === true && adminData?.templeId === params.id)
        );

        if (!isAdmin) {
          router.push(`/temples/${params.id}/events`);
          return;
        }

        // Load event data
        const eventRef = doc(db, `temples/${params.id}/events`, params.eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (!eventDoc.exists()) {
          router.push(`/temples/${params.id}/events`);
          return;
        }

        const eventData = {
          id: eventDoc.id,
          ...eventDoc.data()
        } as Event;

        // Verify the event belongs to this temple
        if (eventData.templeId !== params.id) {
          router.push(`/temples/${params.id}/events`);
          return;
        }

        setEvent(eventData);
      } catch (error) {
        console.error('Error checking admin status or loading event:', error);
        router.push(`/temples/${params.id}/events`);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndLoadEvent();
  }, [user, params.id, params.eventId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Event</h1>
        <EventForm templeId={params.id} event={event} />
      </div>
    </div>
  );
}
