'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import type { Event } from '@/lib/db/events/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { Timestamp } from 'firebase/firestore';

export interface EventListProps {
  events: Event[];
  templeId: string;
}

const EVENTS_PER_PAGE = 9;

// Memoized formatters to prevent recreation on each render
const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit'
});

// Pure utility functions
const getDateFromTimestamp = (timestamp: any): Date => {
  try {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if ('toDate' in timestamp) return timestamp.toDate();
    if ('seconds' in timestamp) return new Date(timestamp.seconds * 1000);
    return new Date();
  } catch (error) {
    console.error('Error converting timestamp:', error, timestamp);
    return new Date();
  }
};

const formatDate = (date: Date): string => {
  try {
    return dateFormatter.format(date);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Ungültiges Datum';
  }
};

const formatTime = (date: Date): string => {
  try {
    return timeFormatter.format(date);
  } catch (error) {
    console.error('Error formatting time:', error, date);
    return '--:--';
  }
};

const isValidEvent = (event: unknown): event is Event => {
  try {
    const e = event as any;
    return e &&
      typeof e.id === 'string' &&
      typeof e.title === 'string' &&
      typeof e.description === 'string' &&
      typeof e.location === 'string' &&
      e.startDate &&
      e.endDate;
  } catch (error) {
    console.error('Error validating event:', error, event);
    return false;
  }
};

// Memoized Event Card Component with optimized rendering
const EventCard = memo(function EventCard({ 
  event, 
  templeId 
}: { 
  event: Event; 
  templeId: string;
}) {
  // Memoize computed values
  const participantCount = useMemo(() => event.participants?.length || 0, [event.participants]);
  const startDate = useMemo(() => getDateFromTimestamp(event.startDate), [event.startDate]);
  const endDate = useMemo(() => getDateFromTimestamp(event.endDate), [event.endDate]);
  
  const formattedStartDate = useMemo(() => formatDate(startDate), [startDate]);
  const formattedStartTime = useMemo(() => formatTime(startDate), [startDate]);
  const formattedEndTime = useMemo(() => formatTime(endDate), [endDate]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="mr-2 h-4 w-4" />
            {formattedStartDate}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-2 h-4 w-4" />
            {formattedStartTime} - {formattedEndTime}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="mr-2 h-4 w-4" />
            {event.location}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="mr-2 h-4 w-4" />
            <span>
              {participantCount} Teilnehmer{participantCount !== 1 ? '' : ''}
              {event.capacity ? ` / ${event.capacity}` : ''}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {event.description}
          </p>
          <Link href={`/temples/${templeId}/events/${event.id}`} prefetch={true}>
            <Button className="w-full mt-4">Details anzeigen</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.title === nextProps.event.title &&
    prevProps.event.description === nextProps.event.description &&
    prevProps.event.location === nextProps.event.location &&
    prevProps.event.startDate === nextProps.event.startDate &&
    prevProps.event.endDate === nextProps.event.endDate &&
    prevProps.event.capacity === nextProps.event.capacity &&
    (prevProps.event.participants?.length || 0) === (nextProps.event.participants?.length || 0)
  );
});

// Main EventList component with optimized rendering
export default function EventList({ events: initialEvents, templeId }: EventListProps) {
  // Memoize initial event filtering
  const [events, setEvents] = useState<Event[]>(() => 
    Array.isArray(initialEvents) ? initialEvents.filter(isValidEvent) : []
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState<Event | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Memoized loadMoreEvents function
  const loadMoreEvents = useCallback(async () => {
    if (!templeId || isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const lastEventDate = lastEvent?.startDate;
      const url = `/api/events?templeId=${templeId}${lastEventDate ? `&lastEventDate=${lastEventDate}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      const newEvents = (data.events || []).filter(isValidEvent);

      if (newEvents.length > 0) {
        setLastEvent(newEvents[newEvents.length - 1]);
        setEvents(prev => {
          // Use Map for efficient duplicate removal
          const uniqueEvents = new Map();
          [...prev, ...newEvents].forEach(event => {
            uniqueEvents.set(event.id, event);
          });
          return Array.from(uniqueEvents.values());
        });
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading more events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [templeId, isLoading, hasMore, lastEvent]);

  // Load more events when scrolling into view
  useEffect(() => {
    if (inView && hasMore && !isLoading && events.length >= EVENTS_PER_PAGE) {
      loadMoreEvents();
    }
  }, [inView, hasMore, isLoading, events.length, loadMoreEvents]);

  // Memoize the event grid to prevent unnecessary re-renders
  const eventGrid = useMemo(() => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          templeId={templeId}
        />
      ))}
    </div>
  ), [events, templeId]);

  if (!events?.length && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Keine Events gefunden</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button 
          onClick={() => loadMoreEvents()} 
          className="mt-4"
          variant="outline"
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {eventGrid}
      {(hasMore || isLoading) && (
        <div ref={ref} className="w-full h-10 flex items-center justify-center">
          {isLoading && <p className="text-gray-500">Lade weitere Events...</p>}
        </div>
      )}
    </div>
  );
}
