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
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile, getUserProfile } from '../lib/db/users';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, templeId: string) => Promise<void>;
  signInWithGoogle: (templeId: string, isSignUp?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('AuthProvider mounted, setting up auth listener...');
    let unsubscribe: () => void;

    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
        setUser(user);
        setLoading(false);
        setInitialized(true);
      }, (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
        setInitialized(true);
      });

      // Fallback timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Auth initialization timeout reached');
        setLoading(false);
        setInitialized(true);
      }, 5000);

      return () => {
        console.log('Cleaning up auth listener...');
        unsubscribe?.();
        clearTimeout(timeout);
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
      setInitialized(true);
      return () => {};
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign in...');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (templeId: string, isSignUp: boolean = false) => {
    try {
      setLoading(true);
      console.log('Attempting Google sign in...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Only attempt to create profile if this is a sign-up and we have a templeId
      if (isSignUp && templeId) {
        try {
          // First check if user profile already exists
          const existingProfile = await getUserProfile(user.uid);
          if (!existingProfile.templeId) {
            // Only create profile if one doesn't exist or doesn't have a templeId
            await createUserProfile(user.uid, {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName!,
              templeId,
              photoURL: user.photoURL,
              bio: null
            });
            console.log('Profile created for Google user');
          }
        } catch (profileError: any) {
          console.error('Error handling user profile:', profileError);
          // Clean up auth user if profile creation fails
          await deleteUser(user);
          throw profileError;
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string, templeId: string) => {
    let createdUser: User | null = null;
    try {
      setLoading(true);
      console.log('Creating new user...');
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = user;
      
      console.log('Updating user profile...');
      await updateProfile(user, { displayName });
      
      console.log('Creating user profile...');
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
            bio: null
          });
          console.log('Profile created successfully');
          return;
        } catch (error) {
          console.error(`Failed to create profile, retries left: ${retries}`, error);
          lastError = error;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (lastError) {
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
      console.error('Sign up error:', error);
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
      console.log('Logging out...');
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Return null during initial load to prevent flash of loading UI
  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, initialized, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
