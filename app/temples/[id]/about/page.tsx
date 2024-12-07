'use client';

import { Suspense } from 'react';
import { TempleLoading } from '@/components/temples/TempleLoading';
import { TempleAboutContent } from '@/components/temples/TempleAboutContent';

export default function TemplePage() {
  return (
    <Suspense fallback={<TempleLoading />}>
      <div className="fouc-ready">
        <TempleAboutContent />
      </div>
    </Suspense>
  );
}
