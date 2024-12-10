import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getCacheControlHeaders, generateCacheTag } from '@/lib/cache-utils';
import { revalidateTag } from 'next/cache';

const SERVICES_PER_PAGE = 12;

async function getServices(templeId: string, lastServiceDate: string | null) {
  const servicesRef = adminDb.collection('temples').doc(templeId).collection('services');
  
  // Optimize query with field selection
  let query = servicesRef
    .select(
      'title',
      'description',
      'type',
      'schedule',
      'capacity',
      'registrations',
      'status',
      'updatedAt'
    )
    .orderBy('updatedAt', 'desc')
    .limit(SERVICES_PER_PAGE);

  if (lastServiceDate) {
    const date = new Date(lastServiceDate);
    query = query.startAfter(date);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Convert timestamps to ISO strings
    updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || null,
    // Only include registration count instead of full array
    registrationCount: doc.data().registrations?.length || 0,
    // Remove unnecessary fields from response
    registrations: undefined
  }));
}

async function getServiceTypes(templeId: string) {
  const typesRef = adminDb.collection('temples').doc(templeId).collection('serviceTypes');
  const snapshot = await typesRef.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templeId = searchParams.get('templeId');
    const lastServiceDate = searchParams.get('lastServiceDate');
    const revalidate = searchParams.get('revalidate') === 'true';
    const includeTypes = searchParams.get('includeTypes') === 'true';
    
    if (!templeId) {
      return NextResponse.json(
        { error: 'Temple ID is required' },
        { status: 400 }
      );
    }

    // Handle revalidation requests
    if (revalidate) {
      revalidateTag(generateCacheTag('temple-services', templeId));
      if (includeTypes) {
        revalidateTag(generateCacheTag('temple-service-types', templeId));
      }
      return NextResponse.json({ revalidated: true, now: Date.now() });
    }

    // Fetch services and optionally service types in parallel
    const [services, types] = await Promise.all([
      getServices(templeId, lastServiceDate),
      includeTypes ? getServiceTypes(templeId) : Promise.resolve(undefined)
    ]);

    // Return optimized response with appropriate cache headers
    return new NextResponse(
      JSON.stringify({
        services,
        hasMore: services.length === SERVICES_PER_PAGE,
        lastServiceDate: services.length > 0 ? services[services.length - 1].updatedAt : null,
        ...(includeTypes && { types })
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': getCacheControlHeaders(includeTypes ? 'service-types' : 'services')
        }
      }
    );
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

// Handle POST requests to trigger revalidation
export async function POST(request: Request) {
  try {
    const { templeId, includeTypes = true } = await request.json();
    
    if (!templeId) {
      return NextResponse.json(
        { error: 'Temple ID is required' },
        { status: 400 }
      );
    }

    // Revalidate both services and types caches
    revalidateTag(generateCacheTag('temple-services', templeId));
    if (includeTypes) {
      revalidateTag(generateCacheTag('temple-service-types', templeId));
    }

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
