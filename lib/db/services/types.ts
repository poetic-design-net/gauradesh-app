import { Timestamp } from 'firebase/firestore';

export const SERVICE_TYPES_COLLECTION = 'service_types';
export const SERVICE_REGISTRATIONS_COLLECTION = 'service_registrations';

export interface ServiceParticipant {
  userId: string;
  displayName?: string;
  photoURL?: string;
}

export interface Service {
  id: string;
  templeId: string;
  name: string;
  description: string;
  type: string;
  maxParticipants: number;
  currentParticipants: number;
  pendingParticipants: number;
  participants?: ServiceParticipant[];
  date: Timestamp;
  timeSlot: {
    start: string;
    end: string;
  };
  contactPerson: {
    name: string;
    phone: string;
    userId?: string;
  };
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface ServiceType {
  id: string;
  templeId: string;
  name: string;
  icon: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceRegistration {
  id: string;
  userId: string;
  serviceId: string;
  templeId: string;
  serviceName: string;
  serviceType: string;
  serviceDate: Timestamp;
  serviceTimeSlot: {
    start: string;
    end: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for service updates
export type ServiceUpdate = Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants' | 'pendingParticipants' | 'date'>> & {
  date?: Date;
};
