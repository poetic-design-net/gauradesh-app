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

function formatPrivateKey(key: string | undefined): string {
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
  }
  // Handle both formats: with literal \n and with actual line breaks
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin SDK configuration');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formatPrivateKey(privateKey),
      } as admin.ServiceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Re-throw the error to prevent the app from starting with invalid Firebase config
    throw error;
  }
}

// Export the admin instance and services
export const adminDb = getFirestore();
export const auth = getAuth();
export const db = clientDb;

// Error handling
export function handleFirestoreError(error: any): Error {
  console.error('Firestore error:', error);
  
  if (!error) {
    return new Error('An unknown error occurred');
  }

  if (error instanceof Error) {
    // If it's already an Error instance, add context if needed
    if (error.message.includes('permission')) {
      return new Error('You do not have permission to perform this action');
    }
    return error;
  }
  
  if (error.code === 'permission-denied') {
    return new Error('You do not have permission to perform this action');
  }
  
  if (error.code === 'not-found') {
    return new Error('The requested resource was not found');
  }

  if (error.code === 'failed-precondition') {
    return new Error('The operation failed due to a precondition check');
  }

  if (error.code === 'unauthenticated') {
    return new Error('You must be authenticated to perform this action');
  }
  
  // Include the original error code in the message if available
  const errorCode = error.code ? ` (${error.code})` : '';
  return new Error(`An error occurred while accessing the database${errorCode}`);
}
