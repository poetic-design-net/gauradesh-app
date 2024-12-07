'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { handleFirebaseError } from '@/lib/firebase-error';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(handleFirebaseError(error));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}