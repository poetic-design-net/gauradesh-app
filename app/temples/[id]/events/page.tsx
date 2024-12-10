import { EventList } from '@/components/events';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Event } from '@/lib/db/events/types';
import { Suspense } from 'react';
import { EventLoading } from '@/components/events/EventLoading';
import { headers } from 'next/headers';

interface EventsPageProps {
  params: {
    id: string;
  };
}

// Cache the events data for 1 minute
async function getEvents(templeId: string): Promise<Event[]> {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  try {
    const response = await fetch(
      `${protocol}://${host}/api/events?templeId=${templeId}`,
      { 
        next: { 
          revalidate: 60, // Cache for 1 minute
          tags: [`temple-${templeId}-events`] // Tag for on-demand revalidation
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch events:', await response.text());
      throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    return data.events;
  } catch (error) {
    console.error('Error in getEvents:', error);
    return [];
  }
}

// Cache the admin status check for 5 minutes
async function checkAdminStatus(templeId: string): Promise<boolean> {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  try {
    const response = await fetch(
      `${protocol}://${host}/api/temples/members?templeId=${templeId}`,
      {
        next: {
          revalidate: 300, // Cache for 5 minutes
          tags: [`temple-${templeId}-admin`] // Tag for on-demand revalidation
        }
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Add metadata for better SEO
export async function generateMetadata({ params }: EventsPageProps) {
  return {
    title: 'Temple Events',
    description: 'View and manage temple events',
    alternates: {
      canonical: `/temples/${params.id}/events`
    }
  };
}

export default async function EventsPage({ params }: EventsPageProps) {
  // Parallel data fetching with Promise.all
  const [events, isAdmin] = await Promise.all([
    getEvents(params.id),
    checkAdminStatus(params.id)
  ]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Temple Events</h1>
        {isAdmin && (
          <Link href={`/temples/${params.id}/events/create`} prefetch={true}>
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
