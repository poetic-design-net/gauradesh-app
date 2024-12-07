'use client';

import { Event } from '@/lib/db/events/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export interface EventListProps {
  events: Event[];
  templeId: string;
}

export default function EventList({ events, templeId }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">{event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="mr-2 h-4 w-4" />
                {event.startDate.toDate().toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="mr-2 h-4 w-4" />
                {event.startDate.toDate().toLocaleTimeString()} - 
                {event.endDate.toDate().toLocaleTimeString()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="mr-2 h-4 w-4" />
                {event.location}
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {event.description}
              </p>
              <Link href={`/temples/${templeId}/events/${event.id}`}>
                <Button className="w-full mt-4">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
