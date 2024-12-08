import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification, QuickLink } from './types';

// Notifications
export async function getUserNotifications(userId: string) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: (doc.data().timestamp as Timestamp).toDate(),
  })) as Notification[];
}

export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
}

export async function createNotification(notification: Omit<Notification, 'id'>) {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...notification,
    timestamp: Timestamp.now(),
  });
  return docRef.id;
}

// Quick Links
export async function getUserQuickLinks(userId: string) {
  const q = query(
    collection(db, 'quickLinks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as QuickLink[];
}

export async function createQuickLink(quickLink: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, 'quickLinks'), {
    ...quickLink,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateQuickLink(id: string, data: Partial<QuickLink>) {
  const quickLinkRef = doc(db, 'quickLinks', id);
  await updateDoc(quickLinkRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteQuickLink(id: string) {
  const quickLinkRef = doc(db, 'quickLinks', id);
  await deleteDoc(quickLinkRef);
}
