'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTemple, Temple } from '@/lib/db/temples';
import { TempleAboutPage } from '@/components/temples/TempleAboutPage';
import { TempleLoading } from './TempleLoading';
import { ErrorMessage } from '@/components/ui/error-message';

export function TempleAboutContent() {
  const params = useParams();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTemple() {
      if (!params.id) {
        setError('Temple ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const templeData = await getTemple(params.id as string);
        if (!templeData) {
          setError('Temple not found');
        } else {
          setTemple(templeData);
        }
      } catch (error) {
        console.error('Error loading temple:', error);
        setError('Failed to load temple information');
      } finally {
        setIsLoading(false);
      }
    }

    loadTemple();
  }, [params.id]);

  if (isLoading) {
    return <TempleLoading />;
  }

  if (error || !temple) {
    return <ErrorMessage message={error || 'Temple not found'} />;
  }

  return (
    <div className="content-fade-in">
      <TempleAboutPage temple={temple} />
    </div>
  );
}
