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
import { Service, ServiceUpdate, SERVICE_REGISTRATIONS_COLLECTION } from './types';
import { withRetry } from './utils';
import { isTempleAdmin } from '../admin';
import { getUsersByTemple } from '../users';
import { createNotification } from '../notifications';

type ServiceInput = Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants' | 'pendingParticipants'> & {
  date: Date;
};

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
    contactPerson: {
      name: string;
      phone: string;
      userId?: string;
    };
    notes?: string | null;
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
    
    // Ensure contactPerson.userId is set to the creator's ID
    const contactPerson = {
      name: data.contactPerson.name,
      phone: data.contactPerson.phone,
      userId
    };
    
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
      contactPerson,
      notes: data.notes ?? null,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: userId,
    };

    await setDoc(serviceRef, serviceData);

    // Create notifications for all temple members
    try {
      const templeUsers = await getUsersByTemple(templeId);
      const formattedDate = data.date.toLocaleDateString();
      const formattedTime = `${data.timeSlot.start} - ${data.timeSlot.end}`;

      // Create notifications for all temple members except the creator
      const notificationPromises = templeUsers
        .filter(user => user.uid !== userId) // Exclude the creator
        .map(user => createNotification({
          userId: user.uid,
          title: 'New Service Available',
          message: `A new service "${data.name}" has been created for ${formattedDate} at ${formattedTime}`,
          type: 'info',
          link: `/temples/${templeId}/services/${serviceRef.id}`,
          read: false,
          timestamp: new Date()
        }));

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating notifications:', error);
      // Don't throw the error as the service was created successfully
    }

    return serviceData;
  });
}

export async function updateService(
  serviceId: string,
  userId: string,
  templeId: string,
  data: ServiceUpdate
): Promise<void> {
  return withRetry(async () => {
    const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      throw new FirebaseError('not-found', 'Service not found');
    }

    // Allow both temple admins and service leaders to update
    const service = serviceDoc.data() as Service;
    const userIsTempleAdmin = await isTempleAdmin(userId, templeId);
    const isServiceLeader = service.contactPerson?.userId === userId;

    if (!userIsTempleAdmin && !isServiceLeader) {
      throw new FirebaseError('permission-denied', 'Only temple admins or service leaders can update this service');
    }

    // If user is service leader but not admin, only allow updating notes
    if (!userIsTempleAdmin && isServiceLeader && Object.keys(data).some(key => key !== 'notes')) {
      throw new FirebaseError('permission-denied', 'Service leaders can only update notes');
    }

    // Create update data without date first
    const { date, ...restData } = data;
    
    const updateData: Partial<Service> = {
      ...restData,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Add converted date if present
    if (date) {
      updateData.date = Timestamp.fromDate(date);
    }

    // Ensure contactPerson.userId is preserved or set to the current user's ID
    if (data.contactPerson) {
      updateData.contactPerson = {
        ...data.contactPerson,
        userId: service.contactPerson?.userId || userId
      };
    }

    // Handle notes explicitly
    if ('notes' in data) {
      updateData.notes = data.notes ?? null;
    }

    await updateDoc(serviceRef, updateData);

    // Create notifications for service updates if significant changes were made
    if (userIsTempleAdmin && (data.date || data.timeSlot || data.name)) {
      try {
        const templeUsers = await getUsersByTemple(templeId);
        const formattedDate = date ? date.toLocaleDateString() : service.date.toDate().toLocaleDateString();
        const timeSlot = data.timeSlot || service.timeSlot;
        
        const changes: string[] = [];
        if (data.name) changes.push('name');
        if (data.date) changes.push('date');
        if (data.timeSlot) changes.push('time');

        const notificationPromises = templeUsers
          .filter(user => user.uid !== userId) // Exclude the updater
          .map(user => createNotification({
            userId: user.uid,
            title: 'Service Updated',
            message: `The service "${service.name}" has been updated (${changes.join(', ')}). New schedule: ${formattedDate} at ${timeSlot.start} - ${timeSlot.end}`,
            type: 'info',
            link: `/temples/${templeId}/services/${serviceId}`,
            read: false,
            timestamp: new Date()
          }));

        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error creating update notifications:', error);
        // Don't throw the error as the service was updated successfully
      }
    }
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

      const service = serviceDoc.data() as Service;
      
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
        await deleteDoc(serviceRef);
        console.log('[deleteService] Service deleted successfully');
      } else {
        // If force is true, delete all registrations first, then delete the service
        console.log('[deleteService] Force delete: removing registrations...');
        const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
        const q = query(registrationsRef, 
          where('serviceId', '==', serviceId),
          where('templeId', '==', templeId)
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
        await batch.commit();
        console.log('[deleteService] Batch committed successfully');
      }

      // Create notifications for service deletion
      try {
        const templeUsers = await getUsersByTemple(templeId);
        const formattedDate = service.date.toDate().toLocaleDateString();
        const timeSlot = service.timeSlot;

        const notificationPromises = templeUsers
          .filter(user => user.uid !== userId) // Exclude the deleter
          .map(user => createNotification({
            userId: user.uid,
            title: 'Service Cancelled',
            message: `The service "${service.name}" scheduled for ${formattedDate} at ${timeSlot.start} - ${timeSlot.end} has been cancelled.`,
            type: 'warning',
            read: false,
            timestamp: new Date()
          }));

        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error creating deletion notifications:', error);
        // Don't throw the error as the service was deleted successfully
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
