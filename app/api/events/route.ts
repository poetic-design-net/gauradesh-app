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
  } catch (error: any) {
    console.error('Error fetching events:', {
      error: error.message,
      code: error.code,
      templeId,
      path: `temples/${templeId}/events`
    });
    
    // Return more specific error messages to help diagnose deployment issues
    if (error.code === 'permission-denied') {
      return NextResponse.json(
        { error: 'Permission denied accessing events' },
        { status: 403 }
      );
    }
    
    if (error.code === 'not-found') {
      return NextResponse.json(
        { error: 'Temple or events collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch events',
        details: error.message,
        code: error.code 
      }, 
      { status: 500 }
    );
  }
}
