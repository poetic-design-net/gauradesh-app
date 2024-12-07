'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile } from '../lib/db/users';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid ?? 'No user');
      setUser(user);
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
      // Wait a bit for auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, templeId: string) => {
    let createdUser: User | null = null;
    try {
      setLoading(true);
      
      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = user;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Wait for a short time to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create user profile with retry logic
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          await createUserProfile(user.uid, {
            uid: user.uid,
            email,
            displayName,
            templeId,
            photoURL: null,
            bio: null,
            isAdmin: false,
            isSuperAdmin: false,
          });
          console.log('Profile created successfully');
          
          // Wait a bit for Firestore to update
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/dashboard');
          
          return; // Success, exit the function
        } catch (error) {
          console.error(`Failed to create profile, retries left: ${retries}`, error);
          lastError = error;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
          }
        }
      }
      
      // If we get here, all retries failed
      if (lastError) {
        // Clean up the auth user since profile creation failed
        if (createdUser) {
          try {
            await deleteUser(createdUser);
          } catch (deleteError) {
            console.error('Error cleaning up auth user:', deleteError);
          }
        }
        throw lastError;
      }
      
    } catch (error) {
      // If any error occurred and we created a user, clean it up
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (deleteError) {
          console.error('Error cleaning up auth user:', deleteError);
        }
      }
      throw error;
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
