import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { db as clientDb } from './firebase';

// Collection references
export const USERS_COLLECTION = 'users';
export const SERVICES_COLLECTION = 'services';
export const SERVICE_TYPES_COLLECTION = 'service_types';
export const SERVICE_REGISTRATIONS_COLLECTION = 'service_registrations';
export const TEMPLES_COLLECTION = 'temples';
export const ADMIN_COLLECTION = 'admin';
export const SETTINGS_COLLECTION = 'settings';
export const NOTIFICATIONS_COLLECTION = 'notifications';
export const QUICK_LINKS_COLLECTION = 'quickLinks';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount)
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export the admin instance and services
export const adminDb = getFirestore();
export const auth = getAuth();
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
