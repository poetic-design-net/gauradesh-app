import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';

type FirebaseConfigType = {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
  measurementId?: string | undefined;
};

function initializeFirebase() {
  try {
    // Validate required config
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ] as const;

    const missingFields = requiredFields.filter(field => {
      return !firebaseConfig[field as keyof FirebaseConfigType];
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required Firebase config fields: ${missingFields.join(', ')}`);
    }

    // Initialize Firebase
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    // Initialize services
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
      try {
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          connectFirestoreEmulator(db, 'localhost', 8080);
          connectStorageEmulator(storage, 'localhost', 9199);
          console.log('Connected to Firebase emulators');
        }
      } catch (emulatorError) {
        console.error('Failed to connect to Firebase emulators:', emulatorError);
      }
    }

    // Log successful initialization
    console.log('Firebase client initialized successfully');

    return { app, auth, db, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Re-throw to prevent the app from running with invalid Firebase config
    throw error;
  }
}

// Initialize Firebase and export services
const { app, auth, db, storage } = initializeFirebase();

// Add auth state change listener for debugging
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Auth state changed: User is signed in', user.uid);
    // Get the current ID token for debugging
    user.getIdToken(true).then(token => {
      console.log('Current ID token refreshed');
    }).catch(error => {
      console.error('Error refreshing ID token:', error);
    });
  } else {
    console.log('Auth state changed: User is signed out');
  }
});

export { app, auth, db, storage };
