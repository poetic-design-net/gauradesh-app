'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Temple, getTemple } from '../lib/db/temples';
import { useAuth } from './AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Collection references
const USERS_COLLECTION = 'users';
const ADMIN_COLLECTION = 'admin';

interface TempleContextType {
  currentTemple: Temple | null;
  setCurrentTemple: (temple: Temple | null) => void;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const TempleContext = createContext<TempleContextType>({} as TempleContextType);

export function TempleProvider({ children }: { children: ReactNode }) {
  const [currentTemple, setCurrentTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, initialized } = useAuth();

  const loadTempleData = async () => {
    if (!user?.uid || !initialized) {
      setCurrentTemple(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      let templeId = null;
      
      // First check admin collection
      const adminRef = doc(db, ADMIN_COLLECTION, user.uid);
      const adminDoc = await getDoc(adminRef);
      const adminData = adminDoc.data();
      
      console.log('[TempleContext] Admin data:', adminData);
      
      if (adminDoc.exists()) {
        // Check if user is either:
        // 1. A super admin
        // 2. A temple admin with a valid templeId
        if (adminData?.isSuperAdmin === true || (adminData?.isAdmin === true && adminData?.templeId)) {
          templeId = adminData.templeId;
          console.log('[TempleContext] Found temple ID in admin collection:', templeId);
        }
      }
      
      // If no temple ID found in admin collection, check users collection
      if (!templeId) {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        console.log('[TempleContext] User data:', userData);
        templeId = userData?.templeId;
        console.log('[TempleContext] Found temple ID in users collection:', templeId);
      }

      if (templeId) {
        // Load the temple data
        const temple = await getTemple(templeId);
        console.log('[TempleContext] Loaded temple:', temple);
        setCurrentTemple(temple);
      } else {
        console.log('[TempleContext] No temple ID found for user');
        setCurrentTemple(null);
      }
    } catch (error) {
      console.error('[TempleContext] Error loading temple data:', error);
      setError('Failed to load temple data. Please try again.');
      setCurrentTemple(null);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener for user document
  useEffect(() => {
    if (!user?.uid || !initialized) return;

    // Subscribe to user document changes
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const unsubscribe = onSnapshot(userRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData?.templeId) {
          try {
            const temple = await getTemple(userData.templeId);
            setCurrentTemple(temple);
          } catch (error) {
            console.error('[TempleContext] Error loading temple:', error);
          }
        }
      }
    }, (error) => {
      console.error('[TempleContext] Error in user document listener:', error);
    });

    // Initial load
    loadTempleData();

    return () => unsubscribe();
  }, [user?.uid, initialized]);

  // Don't render children while Firebase is initializing
  if (!initialized) {
    return null;
  }

  return (
    <TempleContext.Provider 
      value={{ 
        currentTemple, 
        setCurrentTemple, 
        loading, 
        error,
        reload: loadTempleData 
      }}
    >
      {children}
    </TempleContext.Provider>
  );
}

export const useTempleContext = () => useContext(TempleContext);
