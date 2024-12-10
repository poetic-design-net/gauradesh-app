import { revalidateTag } from 'next/cache';

/**
 * Utility functions for managing Next.js cache revalidation
 */

/**
 * Cache durations in seconds
 */
const CACHE_DURATIONS = {
  services: {
    data: 5 * 60, // 5 minutes for service data
    types: 30 * 60, // 30 minutes for service types
    staleWhileRevalidate: 60 // 1 minute stale-while-revalidate
  },
  events: {
    data: 60, // 1 minute for event data
    staleWhileRevalidate: 30 // 30 seconds stale-while-revalidate
  },
  admin: {
    data: 5 * 60, // 5 minutes for admin status
    staleWhileRevalidate: 60 // 1 minute stale-while-revalidate
  }
};

/**
 * Revalidate temple services cache
 * @param templeId - The ID of the temple whose services need revalidation
 */
export async function revalidateTempleServices(templeId: string) {
  try {
    // Revalidate both services and service types
    revalidateTag(`temple-${templeId}-services`);
    revalidateTag(`temple-${templeId}-service-types`);

    // If running in development, also trigger the API endpoint
    if (process.env.NODE_ENV === 'development') {
      const response = await fetch(`/api/services?templeId=${templeId}&revalidate=true`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.warn('Failed to revalidate services cache via API');
      }
    }
  } catch (error) {
    console.error('Error revalidating temple services:', error);
  }
}

/**
 * Revalidate temple events cache
 * @param templeId - The ID of the temple whose events need revalidation
 */
export async function revalidateTempleEvents(templeId: string) {
  try {
    revalidateTag(`temple-${templeId}-events`);

    if (process.env.NODE_ENV === 'development') {
      const response = await fetch(`/api/events?templeId=${templeId}&revalidate=true`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.warn('Failed to revalidate events cache via API');
      }
    }
  } catch (error) {
    console.error('Error revalidating temple events:', error);
  }
}

/**
 * Revalidate temple admin status cache
 * @param templeId - The ID of the temple whose admin status needs revalidation
 */
export async function revalidateTempleAdmin(templeId: string) {
  try {
    revalidateTag(`temple-${templeId}-admin`);
  } catch (error) {
    console.error('Error revalidating temple admin status:', error);
  }
}

/**
 * Revalidate multiple caches at once
 * @param templeId - The ID of the temple
 * @param cacheTypes - Array of cache types to revalidate
 */
export async function revalidateTempleCaches(
  templeId: string,
  cacheTypes: ('services' | 'events' | 'admin')[] = ['services', 'events', 'admin']
) {
  try {
    const revalidationPromises = cacheTypes.map(type => {
      switch (type) {
        case 'services':
          return revalidateTempleServices(templeId);
        case 'events':
          return revalidateTempleEvents(templeId);
        case 'admin':
          return revalidateTempleAdmin(templeId);
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(revalidationPromises);
  } catch (error) {
    console.error('Error revalidating temple caches:', error);
  }
}

/**
 * Helper function to generate cache tags
 * @param type - The type of cache tag to generate
 * @param id - The ID to include in the tag
 */
export function generateCacheTag(
  type: 'temple-services' | 'temple-service-types' | 'temple-events' | 'temple-admin',
  id: string
): string {
  switch (type) {
    case 'temple-services':
      return `temple-${id}-services`;
    case 'temple-service-types':
      return `temple-${id}-service-types`;
    case 'temple-events':
      return `temple-${id}-events`;
    case 'temple-admin':
      return `temple-${id}-admin`;
    default:
      throw new Error(`Unknown cache tag type: ${type}`);
  }
}

/**
 * Get cache control headers based on cache type
 * @param type - The type of cache
 * @returns Cache-Control header value
 */
export function getCacheControlHeaders(
  type: 'services' | 'service-types' | 'events' | 'admin'
): string {
  switch (type) {
    case 'services':
      return `public, s-maxage=${CACHE_DURATIONS.services.data}, stale-while-revalidate=${CACHE_DURATIONS.services.staleWhileRevalidate}`;
    case 'service-types':
      return `public, s-maxage=${CACHE_DURATIONS.services.types}, stale-while-revalidate=${CACHE_DURATIONS.services.staleWhileRevalidate}`;
    case 'events':
      return `public, s-maxage=${CACHE_DURATIONS.events.data}, stale-while-revalidate=${CACHE_DURATIONS.events.staleWhileRevalidate}`;
    case 'admin':
      return `public, s-maxage=${CACHE_DURATIONS.admin.data}, stale-while-revalidate=${CACHE_DURATIONS.admin.staleWhileRevalidate}`;
    default:
      return 'no-store';
  }
}
