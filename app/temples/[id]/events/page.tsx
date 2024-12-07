'use client';

import { useEffect, useState } from 'react';
import { EventList } from '@/components/events';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/lib/db/events/types';

const ADMIN_COLLECTION = 'admin';

interface EventsPageProps {
  params: {
    id: string;
  };
}

export default function EventsPage({ params }: EventsPageProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Check admin status
        if (user) {
          const adminRef = doc(db, ADMIN_COLLECTION, user.uid);
          const adminDoc = await getDoc(adminRef);
          const adminData = adminDoc.data();

          const hasAdminAccess = adminDoc.exists() && (
            adminData?.isSuperAdmin === true || 
            (adminData?.isAdmin === true && adminData?.templeId === params.id)
          );
          setIsAdmin(hasAdminAccess);
        }

        // Load events
        const eventsRef = collection(db, `temples/${params.id}/events`);
        const q = query(eventsRef, orderBy('startDate', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Temple Events</h1>
        {isAdmin && (
          <Link href={`/temples/${params.id}/events/create`}>
            <Button>Create New Event</Button>
          </Link>
        )}
      </div>
      <EventList events={events} templeId={params.id} />
    </div>
  );
}
