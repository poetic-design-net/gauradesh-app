'use client';

import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-6">
      <Suspense 
        fallback={
          <div className="no-fouc">
            <PageLoading items={3} />
          </div>
        }
      >
        <div className="fouc-ready">
          {children}
        </div>
      </Suspense>
    </div>
  );
}
