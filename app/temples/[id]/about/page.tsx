import { Suspense } from 'react';
import { TempleAboutPage } from '@/components/temples/TempleAboutPage';
import { adminDb } from '@/lib/firebase-admin';
import { Temple } from '@/lib/db/temples';

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

  return {
    id: templeDoc.id,
    ...templeDoc.data()
  } as Temple;
}

async function getInitialMembers(templeId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(
    `${baseUrl}/api/temples/members?templeId=${templeId}`,
    { next: { revalidate: 0 } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch temple members');
  }

  return response.json();
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
