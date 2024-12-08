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
  try {
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
  } catch (error) {
    console.error('Error getting quick links:', error);
    throw error;
  }
}

export async function createQuickLink(data: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = Timestamp.now();
    const quickLinkData = {
      userId: data.userId,
      title: data.title,
      url: data.url,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'quickLinks'), quickLinkData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating quick link:', error);
    throw error;
  }
}

export async function updateQuickLink(id: string, data: Partial<QuickLink>) {
  try {
    const quickLinkRef = doc(db, 'quickLinks', id);
    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };
    if (data.title) updateData.title = data.title;
    if (data.url) updateData.url = data.url;

    await updateDoc(quickLinkRef, updateData);
  } catch (error) {
    console.error('Error updating quick link:', error);
    throw error;
  }
}

export async function deleteQuickLink(id: string) {
  try {
    const quickLinkRef = doc(db, 'quickLinks', id);
    await deleteDoc(quickLinkRef);
  } catch (error) {
    console.error('Error deleting quick link:', error);
    throw error;
  }
}
