'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { createUserProfile } from '../lib/db/users';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, templeId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // First, wait for Firebase Auth to initialize
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        try {
          // Test database connection by trying to read user's document
          await getDoc(doc(db, 'users', user.uid));
          setInitialized(true);
        } catch (error) {
          console.error('Error initializing Firebase:', error);
          // If there's an error, we'll try again on the next auth state change
          setInitialized(false);
        }
      } else {
        // If no user, we can still mark as initialized since auth is ready
        setInitialized(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, templeId: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      // Create initial user profile in Firestore with all details
      await createUserProfile(userCredential.user.uid, {
        email: email,
        displayName: displayName,
        photoURL: userCredential.user.photoURL || null,
        templeId: templeId,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  // Only render children when both auth is loaded and Firebase is initialized
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, initialized, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
