import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templeId = searchParams.get('templeId');

  if (!templeId) {
    return NextResponse.json({ error: 'Temple ID is required' }, { status: 400 });
  }

  try {
    const eventsRef = adminDb.collection(`temples/${templeId}/events`);
    const snapshot = await eventsRef.orderBy('startDate', 'desc').get();
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
