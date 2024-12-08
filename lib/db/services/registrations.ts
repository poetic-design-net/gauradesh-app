import { 
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FirebaseError } from '../../firebase-error';
import { ServiceRegistration, SERVICE_REGISTRATIONS_COLLECTION } from './types';
import { withRetry } from './utils';
import { addTempleMember } from '../temples';
import { isTempleAdmin, isSuperAdmin } from '../admin';
import { getService } from './services';

export async function deleteRegistration(registrationId: string, userId: string, message?: string): Promise<void> {
  return withRetry(async () => {
    const registrationRef = doc(db, SERVICE_REGISTRATIONS_COLLECTION, registrationId);
    const registrationDoc = await getDoc(registrationRef);
    
    if (!registrationDoc.exists()) {
      throw new FirebaseError('not-found', 'Registration not found');
    }

    const registration = registrationDoc.data() as ServiceRegistration;
    
    // Check permissions
    const [userIsSuperAdmin, userIsTempleAdmin] = await Promise.all([
      isSuperAdmin(userId),
      isTempleAdmin(userId, registration.templeId)
    ]);

    if (!userIsSuperAdmin && !userIsTempleAdmin && registration.userId !== userId) {
      throw new FirebaseError('permission-denied', 'Only temple admins, super admins, or the registration owner can delete registrations');
    }

    // Update service counts in Firestore
    const serviceRef = doc(db, `temples/${registration.templeId}/services`, registration.serviceId);
    if (registration.status === 'approved') {
      await updateDoc(serviceRef, {
        currentParticipants: increment(-1),
        updatedAt: serverTimestamp()
      });
    } else if (registration.status === 'pending') {
      await updateDoc(serviceRef, {
        pendingParticipants: increment(-1),
        updatedAt: serverTimestamp()
      });
    }

    // Delete the registration
    await deleteDoc(registrationRef);
  });
}

export async function getTempleServiceRegistrations(templeId: string): Promise<ServiceRegistration[]> {
  if (!templeId) {
    return [];
  }

  return withRetry(async () => {
    const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
    const q = query(registrationsRef, where('templeId', '==', templeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRegistration));
  });
}

export async function getAllServiceRegistrations(userId: string, templeId: string): Promise<ServiceRegistration[]> {
  if (!userId || !templeId) {
    throw new FirebaseError('invalid-argument', 'User ID and Temple ID are required');
  }

  return withRetry(async () => {
    const isUserTempleAdmin = await isTempleAdmin(userId, templeId);
    if (!isUserTempleAdmin) {
      throw new FirebaseError('permission-denied', 'Only temple admins can fetch their temple registrations');
    }

    return getTempleServiceRegistrations(templeId);
  });
}

export async function getUserServiceRegistrations(userId: string): Promise<ServiceRegistration[]> {
  if (!userId) {
    return [];
  }

  return withRetry(async () => {
    const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
    const q = query(registrationsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRegistration));
  });
}

export async function updateServiceRegistrationStatus(
  registrationId: string,
  status: ServiceRegistration['status'],
  templeId: string,
  serviceId: string
): Promise<void> {
  return withRetry(async () => {
    await runTransaction(db, async (transaction) => {
      const registrationRef = doc(db, SERVICE_REGISTRATIONS_COLLECTION, registrationId);
      const registrationDoc = await transaction.get(registrationRef);
      
      if (!registrationDoc.exists()) {
        throw new FirebaseError('not-found', 'Registration not found');
      }

      const registration = registrationDoc.data() as ServiceRegistration;
      const oldStatus = registration.status;
      
      // Update registration status
      transaction.update(registrationRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      // Update service counts based on status change
      const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);
      if (oldStatus === 'pending') {
        transaction.update(serviceRef, {
          pendingParticipants: increment(-1),
          currentParticipants: status === 'approved' ? increment(1) : increment(0),
          updatedAt: serverTimestamp()
        });
      } else if (oldStatus === 'approved') {
        transaction.update(serviceRef, {
          currentParticipants: increment(-1),
          pendingParticipants: status === 'pending' ? increment(1) : increment(0),
          updatedAt: serverTimestamp()
        });
      } else if (oldStatus === 'rejected') {
        transaction.update(serviceRef, {
          pendingParticipants: status === 'pending' ? increment(1) : increment(0),
          currentParticipants: status === 'approved' ? increment(1) : increment(0),
          updatedAt: serverTimestamp()
        });
      }
    });
  });
}

export async function registerForService(
  userId: string,
  serviceId: string,
  templeId: string,
  message?: string
): Promise<void> {
  if (!userId || !serviceId || !templeId) {
    throw new FirebaseError('invalid-argument', 'User ID, Service ID, and Temple ID are required');
  }

  return withRetry(async () => {
    await runTransaction(db, async (transaction) => {
      const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
      const q = query(
        registrationsRef,
        where('userId', '==', userId),
        where('serviceId', '==', serviceId)
      );
      const existingReg = await getDocs(q);

      if (!existingReg.empty) {
        throw new FirebaseError('already-exists', 'You are already registered for this service');
      }

      // Get service details
      const service = await getService(serviceId, templeId);
      if (!service) {
        throw new FirebaseError('not-found', 'Service not found');
      }

      const registrationRef = doc(collection(db, SERVICE_REGISTRATIONS_COLLECTION));
      const registration: ServiceRegistration = {
        id: registrationRef.id,
        userId,
        serviceId,
        templeId,
        serviceName: service.name,
        serviceType: service.type,
        serviceDate: service.date,
        serviceTimeSlot: service.timeSlot,
        status: 'pending',
        message: message,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      transaction.set(registrationRef, registration);
      transaction.update(doc(db, `temples/${templeId}/services`, serviceId), {
        pendingParticipants: increment(1),
        updatedAt: serverTimestamp()
      });
    });

    // Try to add user as temple member, ignore if they're already a member
    try {
      await addTempleMember(templeId, userId);
    } catch (error) {
      // Only ignore the specific "already exists" error
      if (error instanceof FirebaseError && error.code !== 'already-exists') {
        throw error;
      }
      // If it's not a FirebaseError or has a different code, throw it
      if (!(error instanceof FirebaseError)) {
        throw error;
      }
    }
  });
}

export async function recalculateServiceParticipants(serviceId: string, templeId: string): Promise<void> {
  return withRetry(async () => {
    const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
    
    // Get approved registrations
    const approvedQuery = query(
      registrationsRef,
      where('serviceId', '==', serviceId),
      where('status', '==', 'approved')
    );
    const approvedSnapshot = await getDocs(approvedQuery);
    const approvedCount = approvedSnapshot.size;

    // Get pending registrations
    const pendingQuery = query(
      registrationsRef,
      where('serviceId', '==', serviceId),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingCount = pendingSnapshot.size;

    // Update Firestore
    await updateDoc(doc(db, `temples/${templeId}/services`, serviceId), {
      currentParticipants: approvedCount,
      pendingParticipants: pendingCount,
      updatedAt: serverTimestamp(),
    });
  });
}
