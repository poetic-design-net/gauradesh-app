'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/lib/db/events/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface EventListProps {
  events: Event[];
  templeId: string;
}

function getDateFromTimestamp(timestamp: Timestamp | { seconds: number; nanoseconds: number } | Date): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if ('toDate' in timestamp) return timestamp.toDate();
  if ('seconds' in timestamp) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
}

function isValidEvent(event: any): event is Event {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.description === 'string' &&
    typeof event.location === 'string' &&
    (event.startDate instanceof Timestamp || 'seconds' in event.startDate) &&
    (event.endDate instanceof Timestamp || 'seconds' in event.endDate)
  );
}

export default function EventList({ events: initialEvents, templeId }: EventListProps) {
  const [events, setEvents] = useState<Event[]>(() => 
    Array.isArray(initialEvents) ? initialEvents.filter(isValidEvent) : []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!templeId) return;

    const eventsRef = collection(db, `temples/${templeId}/events`);
    const q = query(eventsRef, orderBy('startDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedEvents = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Event))
        .filter(isValidEvent);
      setEvents(updatedEvents);
      setIsLoading(false);
    }, (error) => {
      console.error('Error in real-time events subscription:', error);
      setIsLoading(false);
    });

    // Set a timeout to ensure loading state shows for at least a brief moment
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [templeId]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const participantCount = event.participants?.length || 0;
        const startDate = getDateFromTimestamp(event.startDate);
        const endDate = getDateFromTimestamp(event.endDate);
        
        return (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate.toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-2 h-4 w-4" />
                  {startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="mr-2 h-4 w-4" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {participantCount} participant{participantCount !== 1 ? 's' : ''}
                    {event.capacity ? ` / ${event.capacity}` : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {event.description}
                </p>
                <Link href={`/temples/${templeId}/events/${event.id}`} prefetch={true}>
                  <Button className="w-full mt-4">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
