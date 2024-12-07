'use client';

import { Suspense } from 'react';
import { TempleLoading } from '@/components/temples/TempleLoading';

export default function TempleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense 
      fallback={
        <div className="no-fouc">
          <TempleLoading />
        </div>
      }
    >
      <div className="fouc-ready">
        {children}
      </div>
    </Suspense>
  );
}
