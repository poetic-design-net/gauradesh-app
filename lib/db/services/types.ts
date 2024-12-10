import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '@/lib/db/users';

export const SERVICE_TYPES_COLLECTION = 'service_types';
export const SERVICES_COLLECTION = 'services';
export const SERVICE_REGISTRATIONS_COLLECTION = 'service_registrations';

export interface ServiceType {
  id: string;
  name: string;
  description?: string | null; // Made optional
  icon: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EnrichedRegistration extends ServiceRegistration {
  service?: Service;
  user?: UserProfile;
  serviceName?: string; // For backwards compatibility
}
