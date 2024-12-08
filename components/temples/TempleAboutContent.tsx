'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTemple, Temple, TempleMember } from '@/lib/db/temples';
import { TempleAboutPage } from '@/components/temples/TempleAboutPage' ;
import { TempleLoading } from './TempleLoading';
import { ErrorMessage } from '@/components/ui/error-message';
import { Timestamp } from 'firebase/firestore';

type Member = {
  id: string;
  templeId: string;
  userId: string;
  role: 'admin' | 'member';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profile: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    bio?: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    templeId?: string;
  };
};

export function TempleAboutContent() {
  const params = useParams();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTempleAndMembers() {
      if (!params.id) {
        setError('Temple ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load temple data
        const templeData = await getTemple(params.id as string);
        if (!templeData) {
          setError('Temple not found');
          return;
        }
        setTemple(templeData);

        // Load temple members
        const response = await fetch(`/api/temples/members?templeId=${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch temple members');
        }
        const data = await response.json();
        setMembers(data.members);
      } catch (error) {
        console.error('Error loading temple data:', error);
        setError('Failed to load temple information');
      } finally {
        setIsLoading(false);
      }
    }

    loadTempleAndMembers();
  }, [params.id]);

  if (isLoading) {
    return <TempleLoading />;
  }

  if (error || !temple) {
    return <ErrorMessage message={error || 'Temple not found'} />;
  }

  return (
    <div className="content-fade-in">
      <TempleAboutPage temple={temple} initialMembers={members} />
    </div>
  );
}
