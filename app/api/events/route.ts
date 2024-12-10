import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { revalidateTag } from 'next/cache';

const EVENTS_PER_PAGE = 9;

async function getEvents(templeId: string, lastEventDate: string | null) {
  const eventsRef = adminDb.collection('temples').doc(templeId).collection('events');
  
  // Only select the fields we need
  let query = eventsRef
    .select(
      'title',
      'description',
      'location',
      'startDate',
      'endDate',
      'participants',
      'capacity'
    )
    .orderBy('startDate', 'desc')
    .limit(EVENTS_PER_PAGE);

  if (lastEventDate) {
    const date = new Date(lastEventDate);
    query = query.startAfter(date);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Convert timestamps to ISO strings for serialization
    startDate: doc.data().startDate?.toDate?.().toISOString() || null,
    endDate: doc.data().endDate?.toDate?.().toISOString() || null,
    // Only include participant count instead of full array
    participantCount: doc.data().participants?.length || 0,
    // Remove unnecessary fields from response
    participants: undefined
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templeId = searchParams.get('templeId');
    const lastEventDate = searchParams.get('lastEventDate');
    const revalidate = searchParams.get('revalidate') === 'true';
    
    if (!templeId) {
      return NextResponse.json(
        { error: 'Temple ID is required' },
        { status: 400 }
      );
    }

    // Handle revalidation requests
    if (revalidate) {
      revalidateTag(`temple-${templeId}-events`);
      return NextResponse.json({ revalidated: true, now: Date.now() });
    }

    const events = await getEvents(templeId, lastEventDate);

    // Return optimized response with cache headers
    return new NextResponse(
      JSON.stringify({
        events,
        hasMore: events.length === EVENTS_PER_PAGE,
        lastEventDate: events.length > 0 ? events[events.length - 1].startDate : null
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache for 1 minute, allow stale-while-revalidate for 30 seconds
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { 
        status: 500,
        headers: {
          // Don't cache error responses
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

// Handle POST requests to trigger revalidation
export async function POST(request: Request) {
  try {
    const { templeId } = await request.json();
    
    if (!templeId) {
      return NextResponse.json(
        { error: 'Temple ID is required' },
        { status: 400 }
      );
    }

    // Revalidate the cache for this temple's events
    revalidateTag(`temple-${templeId}-events`);

    return NextResponse.json({
      revalidated: true,
      now: Date.now()
    });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}
