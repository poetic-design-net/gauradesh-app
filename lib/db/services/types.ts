import { Timestamp } from 'firebase/firestore';

export const SERVICE_TYPES_COLLECTION = 'service_types';
export const SERVICE_REGISTRATIONS_COLLECTION = 'service_registrations';

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
    userId?: string; // Added to track service leader
  };
  notes?: string; // Added for service leader notes
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
