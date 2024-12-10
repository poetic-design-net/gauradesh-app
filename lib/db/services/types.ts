import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '@/lib/db/users';

export const SERVICE_TYPES_COLLECTION = 'service_types';
export const SERVICES_COLLECTION = 'services';
export const SERVICE_REGISTRATIONS_COLLECTION = 'service_registrations';

export interface ServiceType {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceParticipant {
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  joinedAt: Timestamp;
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

export interface EnrichedRegistration extends Omit<ServiceRegistration, 'serviceName'> {
  service?: Service;
  user?: UserProfile;
  serviceName: string; // Keep it required but allow override
}
