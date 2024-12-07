'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/db/events/types';
import { EventLoading } from '@/components/events/EventLoading';
import { EventContent } from '@/components/events/EventContent';
import { ErrorMessage } from '@/components/ui/error-message';

interface EventPageProps {
  params: {
    id: string;
    eventId: string;
  };
}

function EventDetail({ params }: { params: { id: string; eventId: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const eventRef = doc(db, `temples/${params.id}/events`, params.eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
          setError('Event not found');
          return;
        }

        const eventData = {
          id: eventDoc.id,
          ...eventDoc.data()
        } as Event;

        // Verify the event belongs to this temple
        if (eventData.templeId !== params.id) {
          setError('Event not found');
          return;
        }

        setEvent(eventData);
      } catch (error) {
        console.error('Error loading event:', error);
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [params.id, params.eventId, router]);

  if (isLoading) {
    return <EventLoading />;
  }

  if (error || !event) {
    return <ErrorMessage message={error || 'Event not found'} />;
  }

  return <EventContent event={event} templeId={params.id} />;
}

export default function EventPage({ params }: EventPageProps) {
  return (
    <Suspense fallback={<EventLoading />}>
      <div className="fouc-ready">
        <EventDetail params={params} />
      </div>
    </Suspense>
  );
}
