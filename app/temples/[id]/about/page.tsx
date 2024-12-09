import { Suspense } from 'react';
import { TempleAboutPage } from '@/components/temples/TempleAboutPage';
import { adminDb } from '@/lib/firebase-admin';
import { Temple } from '@/lib/db/temples';
import { headers } from 'next/headers';
import { serializeData } from '@/lib/utils';

interface AboutPageProps {
  params: {
    id: string;
  };
}

async function getTempleData(templeId: string): Promise<Temple> {
  const templeDoc = await adminDb.collection('temples').doc(templeId).get();
  
  if (!templeDoc.exists) {
    throw new Error('Temple not found');
  }

  const data = templeDoc.data();
  return serializeData({
    id: templeDoc.id,
    ...data
  }) as Temple;
}

async function getInitialMembers(templeId: string) {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  const response = await fetch(
    `${protocol}://${host}/api/temples/members?templeId=${templeId}`,
    { next: { revalidate: 0 } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch temple members');
  }

  const data = await response.json();
  return { members: data.members }; // Data is already serialized by the API
}

export default async function AboutPage({ params }: AboutPageProps) {
  const [temple, { members }] = await Promise.all([
    getTempleData(params.id),
    getInitialMembers(params.id)
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TempleAboutPage 
        temple={temple} 
        initialMembers={members}
      />
    </Suspense>
  );
}
