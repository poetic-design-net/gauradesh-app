import { EventList } from '@/components/events';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Event } from '@/lib/db/events/types';
import { Suspense } from 'react';
import { EventLoading } from '@/components/events/EventLoading';

interface EventsPageProps {
  params: {
    id: string;
  };
}

async function getEvents(templeId: string): Promise<Event[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(
    `${baseUrl}/api/events?templeId=${templeId}`,
    { 
      next: { revalidate: 0 },
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.events;
}

async function checkAdminStatus(templeId: string): Promise<boolean> {
  try {
    // This should be implemented based on your auth setup
    // For now, we'll return true to avoid blocking the UI
    return true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export default async function EventsPage({ params }: EventsPageProps) {
  const [events, isAdmin] = await Promise.all([
    getEvents(params.id),
    checkAdminStatus(params.id)
  ]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Temple Events</h1>
        {isAdmin && (
          <Link href={`/temples/${params.id}/events/create`}>
            <Button>Create New Event</Button>
          </Link>
        )}
      </div>
      <Suspense fallback={<EventLoading />}>
        <EventList events={events} templeId={params.id} />
      </Suspense>
    </div>
  );
}
