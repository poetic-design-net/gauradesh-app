import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  memoryLocalCache
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getPerformance } from 'firebase/performance';
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

    // Initialize Performance Monitoring in browser environment
    if (typeof window !== 'undefined') {
      getPerformance(app);
    }

    // Initialize services with optimized settings
    const auth = getAuth(app);
    
    // Disable Firestore logs in production
    if (process.env.NODE_ENV === 'production') {
      setLogLevel('error');
    }

    // Initialize Firestore with optimized settings
    const db = initializeFirestore(app, {
      // Use memory cache for server-side rendering and persistent cache for client-side
      localCache: typeof window !== 'undefined'
        ? persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        : memoryLocalCache(),
      // Optimize for web apps
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    });

    const storage = getStorage(app);

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
      try {
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          connectFirestoreEmulator(db, 'localhost', 8080);
          connectStorageEmulator(storage, 'localhost', 9199);
        }
      } catch (emulatorError) {
        console.error('Failed to connect to Firebase emulators:', emulatorError);
      }
    }

    return { app, auth, db, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Re-throw to prevent the app from running with invalid Firebase config
    throw error;
  }
}

// Initialize Firebase and export services
const { app, auth, db, storage } = initializeFirebase();

// Add auth state change listener with token refresh optimization
auth.onAuthStateChanged((user) => {
  if (user) {
    // Only refresh if token is close to expiration
    const tokenExpirationThreshold = 5 * 60 * 1000; // 5 minutes
    user.getIdTokenResult().then(idTokenResult => {
      const expirationTime = new Date(idTokenResult.expirationTime).getTime();
      const timeUntilExpiration = expirationTime - Date.now();
      
      if (timeUntilExpiration < tokenExpirationThreshold) {
        user.getIdToken(true).catch(error => {
          console.error('Error refreshing ID token:', error);
        });
      }
    });
  }
});

export { app, auth, db, storage };
