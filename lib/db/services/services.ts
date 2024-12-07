import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FirebaseError } from '../../firebase-error';
import { Service, SERVICE_REGISTRATIONS_COLLECTION } from './types';
import { withRetry } from './utils';
import { isTempleAdmin } from '../admin';

export async function createService(
  templeId: string,
  userId: string,
  data: {
    name: string;
    description: string;
    type: string;
    maxParticipants: number;
    date: Date;
    timeSlot: {
      start: string;
      end: string;
    };
  }
): Promise<Service> {
  if (!templeId) {
    throw new FirebaseError('invalid-argument', 'Temple ID is required');
  }

  return withRetry(async () => {
    // Check if user is admin for this temple
    const userIsTempleAdmin = await isTempleAdmin(userId, templeId);
    if (!userIsTempleAdmin) {
      throw new FirebaseError('permission-denied', 'Only temple admins can create services for their temple');
    }

    const servicesRef = collection(db, `temples/${templeId}/services`);
    const serviceRef = doc(servicesRef);
    
    const serviceData: Service = {
      id: serviceRef.id,
      templeId,
      name: data.name,
      description: data.description,
      type: data.type,
      maxParticipants: data.maxParticipants,
      currentParticipants: 0,
      pendingParticipants: 0,
      date: Timestamp.fromDate(data.date),
      timeSlot: data.timeSlot,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: userId,
    };

    await setDoc(serviceRef, serviceData);
    return serviceData;
  });
}

export async function updateService(
  serviceId: string,
  userId: string,
  templeId: string,
  data: Partial<{
    name: string;
    description: string;
    type: string;
    maxParticipants: number;
    date: Date;
    timeSlot: {
      start: string;
      end: string;
    };
  }>
): Promise<void> {
  return withRetry(async () => {
    const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      throw new FirebaseError('not-found', 'Service not found');
    }

    const userIsTempleAdmin = await isTempleAdmin(userId, templeId);
    if (!userIsTempleAdmin) {
      throw new FirebaseError('permission-denied', 'Only temple admins can update services for their temple');
    }

    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date);
    }

    await updateDoc(serviceRef, updateData);
  });
}

export async function deleteService(serviceId: string, userId: string, templeId: string, force: boolean = false): Promise<void> {
  console.log('[deleteService] Starting deletion process', { serviceId, userId, templeId, force });
  
  return withRetry(async () => {
    try {
      // Check if user is admin for this temple
      const userIsTempleAdmin = await isTempleAdmin(userId, templeId);
      if (!userIsTempleAdmin) {
        throw new FirebaseError('permission-denied', 'Only temple admins can delete services for their temple');
      }

      // Use temple-specific service reference
      const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);
      console.log('[deleteService] Service reference path:', serviceRef.path);
      
      const serviceDoc = await getDoc(serviceRef);
      console.log('[deleteService] Service document exists:', serviceDoc.exists());
      
      if (!serviceDoc.exists()) {
        console.log('[deleteService] Service not found');
        throw new FirebaseError('not-found', 'Service not found');
      }
      
      const serviceData = serviceDoc.data() as Service;
      console.log('[deleteService] Service data:', serviceData);
      
      // Check for registrations if not force deleting
      if (!force) {
        console.log('[deleteService] Checking for registrations...');
        const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
        const q = query(registrationsRef, where('serviceId', '==', serviceId));
        const registrationsSnapshot = await getDocs(q);
        
        if (!registrationsSnapshot.empty) {
          console.log('[deleteService] Found active registrations');
          throw new FirebaseError('failed-precondition', 'Service has active registrations. Please remove all registrations before deleting or use force delete.');
        }
        
        // Just delete the service if no registrations
        console.log('[deleteService] No registrations found, proceeding with deletion');
        try {
          await deleteDoc(serviceRef);
          console.log('[deleteService] Service deleted successfully');
        } catch (error) {
          console.error('[deleteService] Error deleting service:', error);
          throw error;
        }
      } else {
        // If force is true, delete all registrations first, then delete the service
        console.log('[deleteService] Force delete: removing registrations...');
        const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
        const q = query(registrationsRef, 
          where('serviceId', '==', serviceId),
          where('templeId', '==', templeId)  // Add templeId check to ensure we only get registrations for this temple
        );
        const registrationsSnapshot = await getDocs(q);
        
        console.log('[deleteService] Found registrations to force delete:', registrationsSnapshot.size);
        
        // Use a batch to delete registrations and service atomically
        const batch = writeBatch(db);
        
        // Add registration deletes to batch
        registrationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          console.log('[deleteService] Added registration to batch:', doc.id);
        });
        
        // Add service delete to batch
        batch.delete(serviceRef);
        console.log('[deleteService] Added service to batch');
        
        // Commit the batch
        try {
          await batch.commit();
          console.log('[deleteService] Batch committed successfully');
        } catch (error) {
          console.error('[deleteService] Error committing batch:', error);
          throw error;
        }
      }
      
      console.log('[deleteService] Delete completed successfully');
    } catch (error) {
      console.error('[deleteService] Error:', error);
      throw error;
    }
  });
}

export async function getTempleServices(templeId: string): Promise<Service[]> {
  if (!templeId) {
    return [];
  }

  return withRetry(async () => {
    const servicesRef = collection(db, `temples/${templeId}/services`);
    const snapshot = await getDocs(servicesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  });
}

export async function getAllServices(): Promise<Service[]> {
  return withRetry(async () => {
    const servicesRef = collectionGroup(db, 'services');
    const snapshot = await getDocs(servicesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  });
}

export async function getService(serviceId: string, templeId: string): Promise<Service> {
  if (!serviceId || !templeId) {
    throw new FirebaseError('invalid-argument', 'Service ID and Temple ID are required');
  }

  return withRetry(async () => {
    const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      throw new FirebaseError('not-found', 'Service not found');
    }
    
    return { id: serviceDoc.id, ...serviceDoc.data() } as Service;
  });
}
