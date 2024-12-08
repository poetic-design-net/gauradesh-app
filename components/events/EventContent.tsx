'use client';

import { useState, useCallback } from 'react';
import { Event } from '@/lib/db/events/types';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { registerForEvent, unregisterFromEvent } from '@/lib/db/events/registrations';
import { useFirebaseAuth } from '@/lib/hooks/useFirebaseAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';
import { getAuth } from 'firebase/auth';

interface EventContentProps {
  event: Event;
  templeId: string;
}

export function EventContent({ event: initialEvent, templeId }: EventContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useFirebaseAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [event, setEvent] = useState(initialEvent);

  // Subscribe to real-time updates
  useEffect(() => {
    const eventRef = doc(db, `temples/${templeId}/events`, event.id);
    const unsubscribe = onSnapshot(eventRef, (doc) => {
      if (doc.exists()) {
        setEvent({ ...doc.data(), id: doc.id } as Event);
      }
    });

    return () => unsubscribe();
  }, [templeId, event.id]);

  const isRegistered = event.participants?.some(p => p.userId === user?.uid);
  const participantCount = event.participants?.length || 0;

  const handleRegistration = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for events",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    try {
      if (isRegistered) {
        await unregisterFromEvent(templeId, event.id, user.uid);
        toast({
          title: "Unregistered",
          description: "You have been unregistered from the event"
        });
      } else {
        // Get current user from Firebase Auth
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        await registerForEvent(templeId, event.id, user.uid, {
          photoURL: currentUser.photoURL || undefined,
          displayName: currentUser.displayName || undefined
        });
        toast({
          title: "Registered",
          description: "You have been registered for the event"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  }, [event.id, isRegistered, templeId, toast, user]);

  return (
    <div className="container mx-auto p-4 content-fade-in">
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
              <h1 className="text-4xl text-white font-bold mb-2">{event.title}</h1>
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
                  <div className="flex items-center text-muted-foreground">
                    <Users className="mr-3 h-5 w-5" />
                    <span>
                      {participantCount} participant{participantCount !== 1 ? 's' : ''}
                      {event.capacity ? ` / ${event.capacity}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {event.registrationRequired && (
                <Button 
                  size="lg" 
                  className="w-full transition-all duration-300 hover:scale-[1.02]"
                  onClick={handleRegistration}
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Processing...' : isRegistered ? 'Cancel Registration' : 'Register for Event'}
                </Button>
              )}

              {/* Participants Section */}
              {event.participants && event.participants.length > 0 && (
                <div className="p-6 rounded-lg bg-muted/50">
                  <h3 className="text-lg font-semibold mb-4">Participants</h3>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      {event.participants.map((participant) => (
                        <Tooltip key={participant.userId}>
                          <TooltipTrigger>
                            <Avatar className="h-10 w-10">
                              {participant.photoURL ? (
                                <AvatarImage src={participant.photoURL} alt={participant.displayName || 'Participant'} />
                              ) : (
                                <AvatarFallback>
                                  {participant.displayName?.[0] || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{participant.displayName || 'Anonymous User'}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>
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
