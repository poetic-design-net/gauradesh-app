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
  FieldValue
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection references
export const USERS_COLLECTION = 'users';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  bio?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  templeId?: string | null; // Using consistent casing
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  // If document doesn't exist, create it
  if (!userSnap.exists()) {
    const userData = {
      uid,
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL || null,
      bio: data.bio || null,
      isAdmin: false,
      isSuperAdmin: false,
      templeId: data.templeId || null, // Using consistent casing
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);
    return userData;
  }

  // If document exists, update it
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userRef, updateData);
  return updateData;
}

export async function getUserProfile(uid: string) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  // If profile doesn't exist, create it with basic data
  const basicProfile = {
    uid,
    email: '',
    displayName: '',
    photoURL: null,
    bio: null,
    isAdmin: false,
    isSuperAdmin: false,
    templeId: null, // Using consistent casing
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, basicProfile);
  return basicProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create profile if it doesn't exist
    return createUserProfile(uid, data);
  }

  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userRef, updateData);
  return updateData;
}

export async function searchUsers(searchTerm: string) {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(
    usersRef,
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function getUsersByTemple(templeId: string) {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('templeId', '==', templeId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}
