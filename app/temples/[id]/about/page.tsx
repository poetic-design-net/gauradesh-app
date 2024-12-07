'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTemple, Temple } from '@/lib/db/temples';
import { TempleAboutPage } from '@/components/temples/TempleAboutPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function TemplePage() {
  const params = useParams();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemple() {
      if (!params.id) return;

      try {
        const templeData = await getTemple(params.id as string);
        setTemple(templeData);
      } catch (error) {
        console.error('Error loading temple:', error);
        setError('Failed to load temple information');
      } finally {
        setLoading(false);
      }
    }

    loadTemple();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (error || !temple) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          {error || 'Temple not found'}
        </div>
      </div>
    );
  }

  return <TempleAboutPage temple={temple} />;
}
