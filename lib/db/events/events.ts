import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event, CreateEventData, UpdateEventData } from './types';

export async function createEvent(templeId: string, data: CreateEventData): Promise<string> {
  const eventsRef = collection(db, `temples/${templeId}/events`);
  const now = Timestamp.now();

  const eventData: Omit<Event, 'id'> = {
    templeId,
    ...data,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: Timestamp.fromDate(data.endDate),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(eventsRef, eventData);
  return docRef.id;
}

export async function getEvent(templeId: string, eventId: string): Promise<Event | null> {
  const eventRef = doc(db, `temples/${templeId}/events`, eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) {
    return null;
  }

  return {
    id: eventSnap.id,
    ...eventSnap.data(),
  } as Event;
}

export async function getTempleEvents(templeId: string): Promise<Event[]> {
  const eventsRef = collection(db, `temples/${templeId}/events`);
  const q = query(
    eventsRef,
    orderBy('startDate', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Event[];
}

export async function updateEvent(
  templeId: string,
  eventId: string,
  data: UpdateEventData
): Promise<void> {
  const eventRef = doc(db, `temples/${templeId}/events`, eventId);
  const updateData: any = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (data.startDate) {
    updateData.startDate = Timestamp.fromDate(data.startDate);
  }
  if (data.endDate) {
    updateData.endDate = Timestamp.fromDate(data.endDate);
  }

  await updateDoc(eventRef, updateData);
}

export async function deleteEvent(templeId: string, eventId: string): Promise<void> {
  const eventRef = doc(db, `temples/${templeId}/events`, eventId);
  await deleteDoc(eventRef);
}
