import { 
  doc, 
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { FirebaseError } from '../firebase-error';

// Collection references
export const ADMIN_COLLECTION = 'admin';

export interface AdminData {
  uid: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  templeId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function isAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    const adminDoc = await getDoc(adminRef);
    const adminData = adminDoc.data();
    
    // User has access if they are either:
    // 1. A super admin
    // 2. A temple admin with a valid templeId
    return adminDoc.exists() && (
      adminData?.isSuperAdmin === true || 
      (adminData?.isAdmin === true && adminData?.templeId)
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function isSuperAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    const adminDoc = await getDoc(adminRef);
    return adminDoc.exists() && adminDoc.data()?.isSuperAdmin === true;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

export async function isTempleAdmin(uid: string, templeId: string): Promise<boolean> {
  console.log('[isTempleAdmin] Starting check:', { uid, templeId });
  
  if (!uid || !templeId) {
    console.log('[isTempleAdmin] Missing required parameters:', { uid, templeId });
    return false;
  }
  
  try {
    // Get admin document from root admin collection
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    console.log('[isTempleAdmin] Fetching admin document from:', adminRef.path);
    
    const adminDoc = await getDoc(adminRef);
    console.log('[isTempleAdmin] Admin doc exists:', adminDoc.exists());
    
    if (!adminDoc.exists()) {
      console.log('[isTempleAdmin] No admin document found');
      return false;
    }
    
    const data = adminDoc.data();
    console.log('[isTempleAdmin] Admin doc data:', {
      isAdmin: data?.isAdmin,
      isSuperAdmin: data?.isSuperAdmin,
      docTempleId: data?.templeId,
      requestedTempleId: templeId
    });
    
    // Match exactly how Firebase rules check
    const isUserAdmin = 
      data?.isSuperAdmin === true ||
      (data?.isAdmin === true && data?.templeId === templeId);
           
    console.log('[isTempleAdmin] Final result:', {
      isUserAdmin,
      reason: data?.isSuperAdmin ? 'Is super admin' : 
              (data?.isAdmin && data?.templeId === templeId) ? 'Is temple admin' : 
              'Not authorized'
    });
    
    return isUserAdmin;
  } catch (error) {
    console.error('[isTempleAdmin] Error checking temple admin status:', error);
    return false;
  }
}

export async function getTempleAdmins(templeId: string): Promise<AdminData[]> {
  try {
    const adminsQuery = query(
      collection(db, ADMIN_COLLECTION),
      where('templeId', '==', templeId),
      where('isAdmin', '==', true)
    );
    
    const snapshot = await getDocs(adminsQuery);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as AdminData));
  } catch (error) {
    console.error('Error getting temple admins:', error);
    throw new FirebaseError('unknown', 'Failed to get temple admins');
  }
}

export async function assignTempleAdmin(uid: string, templeId: string): Promise<void> {
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    await setDoc(adminRef, {
      uid,
      isAdmin: true,
      isSuperAdmin: false,
      templeId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning temple admin:', error);
    throw new FirebaseError('unknown', 'Failed to assign temple admin');
  }
}

export async function assignAdmin(uid: string): Promise<void> {
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    await setDoc(adminRef, {
      uid,
      isAdmin: true,
      isSuperAdmin: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning admin:', error);
    throw new FirebaseError('unknown', 'Failed to assign admin');
  }
}

export async function assignSuperAdmin(uid: string): Promise<void> {
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    await setDoc(adminRef, {
      uid,
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning super admin:', error);
    throw new FirebaseError('unknown', 'Failed to assign super admin');
  }
}

export async function removeAdmin(uid: string): Promise<void> {
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    await setDoc(adminRef, {
      uid,
      isAdmin: false,
      isSuperAdmin: false,
      templeId: null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error removing admin:', error);
    throw new FirebaseError('unknown', 'Failed to remove admin');
  }
}

export async function removeSuperAdmin(uid: string): Promise<void> {
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    await setDoc(adminRef, {
      uid,
      isSuperAdmin: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error removing super admin:', error);
    throw new FirebaseError('unknown', 'Failed to remove super admin');
  }
}

export async function cleanDemoData(uid: string): Promise<void> {
  try {
    // Check if user is super admin
    const superAdmin = await isSuperAdmin(uid);
    if (!superAdmin) {
      throw new FirebaseError('permission-denied', 'Only super admins can clean demo data');
    }

    const batch = writeBatch(db);
    const collections = [
      'services',
      'service_types',
      'service_registrations',
      'temples',
      'settings'
    ];

    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error cleaning demo data:', error);
    throw new FirebaseError('unknown', 'Failed to clean demo data');
  }
}
