import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { db as clientDb } from './firebase';
import serviceAccount from '@/isckon-a55f5-firebase-adminsdk-qcejk-a5d466170e.json';

// Collection references
export const USERS_COLLECTION = 'users';
export const SERVICES_COLLECTION = 'services';
export const SERVICE_TYPES_COLLECTION = 'service_types';
export const SERVICE_REGISTRATIONS_COLLECTION = 'service_registrations';
export const TEMPLES_COLLECTION = 'temples';
export const ADMIN_COLLECTION = 'admin';
export const SETTINGS_COLLECTION = 'settings';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

// Export the admin instance
export const adminDb = getFirestore();

// Export the client db for client-side use
export const db = clientDb;

// Error handling
export function handleFirestoreError(error: any): Error {
  console.error('Firestore error:', error);
  
  if (error?.code === 'permission-denied') {
    return new Error('You do not have permission to perform this action');
  }
  
  if (error?.code === 'not-found') {
    return new Error('The requested resource was not found');
  }
  
  return new Error('An error occurred while accessing the database');
}
