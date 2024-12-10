import { 
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Service } from './types';

/**
 * Subscribe to temple services with real-time updates
 * @param templeId - The temple ID
 * @param callback - Callback function to handle updates
 * @param options - Query options
 * @returns Unsubscribe function
 */
export function subscribeToTempleServices(
  templeId: string,
  callback: (services: Service[]) => void,
  options: {
    limit?: number;
    orderByField?: keyof Service;
    orderDirection?: 'asc' | 'desc';
  } = {}
) {
  if (!templeId) {
    callback([]);
    return () => {};
  }

  // Build query with optimizations
  const servicesRef = collection(db, `temples/${templeId}/services`);
  let servicesQuery = query(servicesRef);

  // Add ordering if specified
  if (options.orderByField) {
    servicesQuery = query(
      servicesQuery, 
      orderBy(options.orderByField, options.orderDirection || 'desc')
    );
  }

  // Add limit if specified
  if (options.limit) {
    servicesQuery = query(servicesQuery, limit(options.limit));
  }

  // Subscribe to query with field selection
  return onSnapshot(
    servicesQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
      callback(services);
    },
    (error) => {
      console.error('Error subscribing to services:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to a single service with real-time updates
 * @param serviceId - The service ID
 * @param templeId - The temple ID
 * @param callback - Callback function to handle updates
 * @returns Unsubscribe function
 */
export function subscribeToService(
  serviceId: string,
  templeId: string,
  callback: (service: Service | null) => void
) {
  if (!serviceId || !templeId) {
    callback(null);
    return () => {};
  }

  const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);

  return onSnapshot(
    serviceRef,
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as Service);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to service:', error);
      callback(null);
    }
  );
}

/**
 * Subscribe to services by type with real-time updates
 * @param templeId - The temple ID
 * @param type - The service type
 * @param callback - Callback function to handle updates
 * @returns Unsubscribe function
 */
export function subscribeToServicesByType(
  templeId: string,
  type: string,
  callback: (services: Service[]) => void
) {
  if (!templeId || !type) {
    callback([]);
    return () => {};
  }

  const servicesRef = collection(db, `temples/${templeId}/services`);
  const servicesQuery = query(
    servicesRef,
    where('type', '==', type),
    orderBy('date', 'desc')
  );

  return onSnapshot(
    servicesQuery,
    (snapshot) => {
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));
      callback(services);
    },
    (error) => {
      console.error('Error subscribing to services by type:', error);
      callback([]);
    }
  );
}

/**
 * Helper function to transform service data for optimized network transfer
 * @param service - The service data
 * @returns Transformed service data
 */
export function transformServiceData(service: Service) {
  return {
    id: service.id,
    name: service.name,
    type: service.type,
    date: service.date,
    timeSlot: service.timeSlot,
    currentParticipants: service.currentParticipants,
    maxParticipants: service.maxParticipants,
    // Only include essential fields for list view
    // Additional fields can be loaded when viewing service details
  };
}
