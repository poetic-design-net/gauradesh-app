'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/db/events/types';

interface EventPageProps {
  params: {
    id: string;
    eventId: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
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
        console.error('Error loading event:', error);
        router.push(`/temples/${params.id}/events`);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [params.id, params.eventId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {event.imageUrl && (
              <div className="w-full h-64 relative">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <Calendar className="mr-2 h-5 w-5" />
                  {event.startDate.toDate().toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-500">
                  <Clock className="mr-2 h-5 w-5" />
                  {event.startDate.toDate().toLocaleTimeString()} - 
                  {event.endDate.toDate().toLocaleTimeString()}
                </div>
                <div className="flex items-center text-gray-500">
                  <MapPin className="mr-2 h-5 w-5" />
                  {event.location}
                </div>
                {event.capacity && (
                  <div className="flex items-center text-gray-500">
                    <Users className="mr-2 h-5 w-5" />
                    Capacity: {event.capacity} people
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Description</h3>
                <p className="text-gray-600">{event.description}</p>
              </div>
            </div>

            {event.registrationRequired && (
              <div className="mt-6">
                <Button size="lg" className="w-full md:w-auto">
                  Register for Event
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
