import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Event, EventParticipant } from './types';
import { getAuth } from 'firebase/auth';

export async function registerForEvent(
  templeId: string,
  eventId: string,
  userId: string,
  userProfile: { photoURL?: string; displayName?: string }
): Promise<void> {
  const eventRef = doc(db, `temples/${templeId}/events`, eventId);
  const eventDoc = await getDoc(eventRef);

  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }

  const event = eventDoc.data() as Event;
  
  // Check capacity if it exists
  if (event.capacity && event.participants && event.participants.length >= event.capacity) {
    throw new Error('Event is at full capacity');
  }

  // Get current user from Firebase Auth
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  // Try to get additional user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.exists() ? userDoc.data() : null;

  // Create participant object with combined user data
  const participant: EventParticipant = {
    userId,
    registeredAt: Timestamp.now(),
    // Prioritize Firestore data over Auth data
    photoURL: userData?.photoURL || currentUser.photoURL || undefined,
    displayName: userData?.displayName || currentUser.displayName || undefined
  };

  // Only include defined values
  const participantData = Object.fromEntries(
    Object.entries(participant).filter(([_, v]) => v !== undefined)
  ) as EventParticipant;

  await updateDoc(eventRef, {
    participants: arrayUnion(participantData)
  });
}

export async function unregisterFromEvent(
  templeId: string,
  eventId: string,
  userId: string
): Promise<void> {
  const eventRef = doc(db, `temples/${templeId}/events`, eventId);
  const eventDoc = await getDoc(eventRef);

  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }

  const event = eventDoc.data() as Event;
  const participant = event.participants?.find(p => p.userId === userId);

  if (!participant) {
    throw new Error('User is not registered for this event');
  }

  await updateDoc(eventRef, {
    participants: arrayRemove(participant)
  });
}
