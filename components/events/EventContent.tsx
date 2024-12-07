'use client';

import { Event } from '@/lib/db/events/types';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EventContentProps {
  event: Event;
  templeId: string;
}

export function EventContent({ event, templeId }: EventContentProps) {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 content-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 group hover:bg-transparent"
        onClick={() => router.push(`/temples/${templeId}/events`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Events
      </Button>

      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Hero Section with Image */}
        {event.imageUrl && (
          <div className="relative h-[300px] w-full">
            <div className="absolute inset-0 bg-gradient-to-b to-black/70 from-transparent z-10" />
            <img
              src={event.imageUrl}
              alt={event.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
              <div className="flex items-center text-white/90">
                <Calendar className="mr-2 h-5 w-5" />
                {event.startDate.toDate().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="p-8">
          {!event.imageUrl && (
            <h1 className="text-4xl font-bold mb-6">{event.title}</h1>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            {/* Left Column - Details */}
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-3 h-5 w-5" />
                    <div>
                      <div>{event.startDate.toDate().toLocaleTimeString()}</div>
                      <div>to {event.endDate.toDate().toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-3 h-5 w-5" />
                    <span>{event.location}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-3 h-5 w-5" />
                      <span>Capacity: {event.capacity} people</span>
                    </div>
                  )}
                </div>
              </div>

              {event.registrationRequired && (
                <Button 
                  size="lg" 
                  className="w-full transition-all duration-300 hover:scale-[1.02]"
                >
                  Register for Event
                </Button>
              )}
            </div>

            {/* Right Column - Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">About this Event</h3>
              <div className="prose prose-gray dark:prose-invert">
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
