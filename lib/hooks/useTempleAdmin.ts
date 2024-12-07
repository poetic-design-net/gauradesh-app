'use client';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_COLLECTION = 'admin';

export async function useTempleAdmin(templeId: string): Promise<boolean> {
  try {
    const auth = useAuth();
    const user = auth?.user;
    
    if (!user) {
      return false;
    }

    const adminRef = doc(db, ADMIN_COLLECTION, user.uid);
    const adminDoc = await getDoc(adminRef);
    const adminData = adminDoc.data();
    
    return adminDoc.exists() && (
      adminData?.isSuperAdmin === true || 
      (adminData?.isAdmin === true && adminData?.templeId === templeId)
    );
  } catch (error) {
    console.error('Error checking temple admin status:', error);
    return false;
  }
}
