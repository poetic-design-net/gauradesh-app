'use client';

import { Suspense } from 'react';
import { EventLoading } from '@/components/events/EventLoading';

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense 
      fallback={
        <div className="no-fouc">
          <EventLoading />
        </div>
      }
    >
      <div className="fouc-ready transition-all duration-300 ease-in-out">
        {children}
      </div>
    </Suspense>
  );
}
