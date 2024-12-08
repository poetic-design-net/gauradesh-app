import { Timestamp } from 'firebase/firestore';

export interface EventParticipant {
  userId: string;
  photoURL?: string;
  displayName?: string;
  registeredAt: Timestamp;
}

export interface Event {
  id: string;
  templeId: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location: string;
  imageUrl?: string;
  capacity?: number;
  registrationRequired: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  participants?: EventParticipant[];
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  imageUrl?: string;
  capacity?: number;
  registrationRequired: boolean;
}

export interface UpdateEventData extends Partial<CreateEventData> {}
