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
  runTransaction,
  onSnapshot,
  orderBy,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FirebaseError } from '../../firebase-error';
import { ServiceRegistration } from './types';
import { withRetry } from './utils';
import { addTempleMember } from '../temples';
import { isTempleAdmin, isSuperAdmin } from '../admin';
import { getService } from './services';
import { createNotification } from '../notifications';

// Helper function to convert Firestore timestamps
function convertTimestamps(data: any): any {
  if (!data) return data;
  
  const result = { ...data };
  
  // Convert known timestamp fields
  if (result.createdAt instanceof Timestamp) {
    result.createdAt = result.createdAt;
  }
  if (result.updatedAt instanceof Timestamp) {
    result.updatedAt = result.updatedAt;
  }
  if (result.serviceDate instanceof Timestamp) {
    result.serviceDate = result.serviceDate;
  }
  
  return result;
}

export async function deleteRegistration(registrationId: string, userId: string, templeId: string, message?: string): Promise<void> {
  return withRetry(async () => {
    const registrationRef = doc(db, `temples/${templeId}/service_registrations`, registrationId);
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

    // Create notification for the user if admin deleted it
    if ((userIsSuperAdmin || userIsTempleAdmin) && registration.userId !== userId) {
      try {
        await createNotification({
          userId: registration.userId,
          title: 'Service Registration Cancelled',
          message: `Your registration for "${registration.serviceName}" has been cancelled by an admin${message ? `: ${message}` : '.'}`,
          type: 'warning',
          read: false,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error creating deletion notification:', error);
      }
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
    const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
    const snapshot = await getDocs(registrationsRef);
    return snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as ServiceRegistration[];
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

export async function getUserServiceRegistrations(userId: string, templeId: string): Promise<ServiceRegistration[]> {
  if (!userId || !templeId) {
    return [];
  }

  return withRetry(async () => {
    const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
    const q = query(registrationsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as ServiceRegistration[];
  });
}

// Real-time registration updates
export function subscribeToUserRegistrations(
  userId: string,
  templeId: string,
  onUpdate: (registrations: ServiceRegistration[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId || !templeId) {
    onUpdate([]);
    return () => {};
  }

  try {
    const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
    const q = query(
      registrationsRef,
      where('userId', '==', userId),
      orderBy('serviceDate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      {
        next: (snapshot: QuerySnapshot<DocumentData>) => {
          const registrations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              serviceDate: data.serviceDate
            } as ServiceRegistration;
          });
          onUpdate(registrations);
        },
        error: (error: Error) => {
          console.error('Error in registration subscription:', error);
          if (onError) {
            onError(error);
          }
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up registration subscription:', error);
    if (onError) {
      onError(error as Error);
    }
    return () => {};
  }
}

export async function updateServiceRegistrationStatus(
  registrationId: string,
  status: ServiceRegistration['status'],
  templeId: string,
  serviceId: string
): Promise<void> {
  return withRetry(async () => {
    const registrationRef = doc(db, `temples/${templeId}/service_registrations`, registrationId);
    const registrationDoc = await getDoc(registrationRef);
    
    if (!registrationDoc.exists()) {
      throw new FirebaseError('not-found', 'Registration not found');
    }

    const registration = registrationDoc.data() as ServiceRegistration;
    const oldStatus = registration.status;

    // Update registration status directly first
    await updateDoc(registrationRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    // Then update service counts
    const serviceRef = doc(db, `temples/${templeId}/services`, serviceId);
    if (oldStatus === 'pending') {
      await updateDoc(serviceRef, {
        pendingParticipants: increment(-1),
        currentParticipants: status === 'approved' ? increment(1) : increment(0),
        updatedAt: serverTimestamp()
      });
    } else if (oldStatus === 'approved') {
      await updateDoc(serviceRef, {
        currentParticipants: increment(-1),
        pendingParticipants: status === 'pending' ? increment(1) : increment(0),
        updatedAt: serverTimestamp()
      });
    } else if (oldStatus === 'rejected') {
      await updateDoc(serviceRef, {
        pendingParticipants: status === 'pending' ? increment(1) : increment(0),
        currentParticipants: status === 'approved' ? increment(1) : increment(0),
        updatedAt: serverTimestamp()
      });
    }

    // Create notification for the user about status change
    try {
      let notificationTitle = '';
      let notificationType: 'success' | 'warning' | 'info' = 'info';
      
      switch (status) {
        case 'approved':
          notificationTitle = 'Service Registration Approved';
          notificationType = 'success';
          break;
        case 'rejected':
          notificationTitle = 'Service Registration Rejected';
          notificationType = 'warning';
          break;
        case 'pending':
          notificationTitle = 'Service Registration Status Updated';
          notificationType = 'info';
          break;
      }

      await createNotification({
        userId: registration.userId,
        title: notificationTitle,
        message: `Your registration for "${registration.serviceName}" has been ${status}.`,
        type: notificationType,
        link: `/temples/${templeId}/services/${serviceId}`,
        read: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error creating status change notification:', error);
    }
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
      const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
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

      const registrationRef = doc(collection(db, `temples/${templeId}/service_registrations`));
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

      // Create notification for service contact person
      if (service.contactPerson?.userId) {
        try {
          const formattedDate = service.date.toDate().toLocaleDateString();
          await createNotification({
            userId: service.contactPerson.userId,
            title: 'New Service Registration',
            message: `A new registration request for "${service.name}" (${formattedDate}) is pending approval.`,
            type: 'info',
            link: `/temples/${templeId}/services/${serviceId}`,
            read: false,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error creating registration notification:', error);
        }
      }
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
    const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
    
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
