import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  FieldValue,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection references
export const USERS_COLLECTION = 'users';
export const ADMIN_COLLECTION = 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  bio?: string | null;
  templeId?: string | null;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const batch = writeBatch(db);

    // Create or update user document
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    // If document doesn't exist, create it with all required fields
    if (!userSnap.exists()) {
      const userData = {
        uid,
        email: data.email || '',
        displayName: data.displayName || '',
        templeId: data.templeId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(userRef, userData);

      // Create admin document for permissions
      const adminRef = doc(db, ADMIN_COLLECTION, uid);
      batch.set(adminRef, {
        isAdmin: false,
        isSuperAdmin: false,
        templeId: data.templeId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      return userData;
    }

    // If document exists, update it with only allowed fields
    const updateData = {
      displayName: data.displayName,
      photoURL: data.photoURL,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);
    return { ...updateData, uid };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
}

export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    // Return a default profile without creating it
    return {
      uid,
      email: '',
      displayName: '',
      photoURL: null,
      bio: null,
      templeId: null,
    } as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create profile if it doesn't exist
      return createUserProfile(uid, data);
    }

    // Only include fields that are actually provided in the update
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }
    if (data.photoURL !== undefined) {
      updateData.photoURL = data.photoURL;
    }
    if (data.bio !== undefined) {
      updateData.bio = data.bio;
    }

    await updateDoc(userRef, updateData);
    return { ...updateData, uid };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
}

export async function searchUsers(searchTerm: string) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error in searchUsers:', error);
    throw error;
  }
}

export async function getUsersByTemple(templeId: string) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('templeId', '==', templeId));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error in getUsersByTemple:', error);
    throw error;
  }
}

export async function checkUserPermissions(uid: string) {
  try {
    const adminRef = doc(db, ADMIN_COLLECTION, uid);
    const adminSnap = await getDoc(adminRef);
    
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        isAdmin: false,
        isSuperAdmin: false,
        templeId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return false;
    }

    const adminData = adminSnap.data();
    return adminData.isAdmin || adminData.isSuperAdmin;
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
}
