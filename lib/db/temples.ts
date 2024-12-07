'use client';

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  FieldValue,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FirebaseError } from '../firebase-error';

const TEMPLES_COLLECTION = 'temples';
const TEMPLE_ADMINS_COLLECTION = 'temple_admins';
const TEMPLE_MEMBERS_COLLECTION = 'temple_members';

export interface Temple {
  id: string;
  name: string;
  location: string;
  description?: string;
  aboutImageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface TempleUpdateData extends Partial<Omit<Temple, 'createdAt' | 'updatedAt'>> {
  updatedAt?: FieldValue;
}

export interface TempleAdmin {
  id: string;
  templeId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TempleMember {
  id: string;
  templeId: string;
  userId: string;
  role: 'admin' | 'member';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function createTemple(
  userId: string,
  data: Partial<Temple>
): Promise<Temple> {
  try {
    const templeRef = doc(collection(db, TEMPLES_COLLECTION));
    const templeData: Temple = {
      id: templeRef.id,
      name: data.name || '',
      location: data.location || '',
      description: data.description,
      aboutImageUrl: data.aboutImageUrl,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      createdBy: userId,
    };

    await setDoc(templeRef, templeData);
    
    // Add creator as admin
    await assignTempleAdmin(templeRef.id, userId);
    
    return templeData;
  } catch (error) {
    console.error('Error creating temple:', error);
    throw new FirebaseError('unknown', 'Failed to create temple');
  }
}

export async function getAllTemples(): Promise<Temple[]> {
  try {
    const templesRef = collection(db, TEMPLES_COLLECTION);
    const snapshot = await getDocs(templesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Temple));
  } catch (error) {
    console.error('Error fetching temples:', error);
    throw new FirebaseError('unknown', 'Failed to fetch temples');
  }
}

export async function getTemple(templeId: string): Promise<Temple> {
  try {
    const templeRef = doc(db, TEMPLES_COLLECTION, templeId);
    const templeDoc = await getDoc(templeRef);
    
    if (!templeDoc.exists()) {
      throw new FirebaseError('not-found', 'Temple not found');
    }
    
    return { id: templeDoc.id, ...templeDoc.data() } as Temple;
  } catch (error) {
    console.error('Error fetching temple:', error);
    if (error instanceof FirebaseError) throw error;
    throw new FirebaseError('unknown', 'Failed to fetch temple');
  }
}

export async function updateTemple(
  templeId: string,
  data: TempleUpdateData
): Promise<void> {
  try {
    const templeRef = doc(db, TEMPLES_COLLECTION, templeId);
    await setDoc(templeRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating temple:', error);
    throw new FirebaseError('unknown', 'Failed to update temple');
  }
}

export async function deleteTemple(templeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TEMPLES_COLLECTION, templeId));
  } catch (error) {
    console.error('Error deleting temple:', error);
    throw new FirebaseError('unknown', 'Failed to delete temple');
  }
}

// Temple Members
export async function getTempleMembers(templeId: string): Promise<TempleMember[]> {
  try {
    // Get all admins
    const adminsRef = collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_ADMINS_COLLECTION);
    const adminsSnapshot = await getDocs(adminsRef);
    const adminMembers = adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role: 'admin' as const
    }));

    // Get all regular members
    const membersRef = collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_MEMBERS_COLLECTION);
    const membersSnapshot = await getDocs(membersRef);
    const regularMembers = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role: 'member' as const
    }));

    return [...adminMembers, ...regularMembers] as TempleMember[];
  } catch (error) {
    console.error('Error fetching temple members:', error);
    throw new FirebaseError('unknown', 'Failed to fetch temple members');
  }
}

export async function addTempleMember(
  templeId: string,
  userId: string
): Promise<void> {
  try {
    // Check if user is already an admin
    const isAdmin = await isTempleAdmin(templeId, userId);
    if (isAdmin) {
      throw new FirebaseError('already-exists', 'User is already an admin of this temple');
    }

    // Check if user is already a member
    const membersRef = collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_MEMBERS_COLLECTION);
    const q = query(membersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new FirebaseError('already-exists', 'User is already a member of this temple');
    }

    // Add as member
    const memberRef = doc(collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_MEMBERS_COLLECTION));
    await setDoc(memberRef, {
      id: memberRef.id,
      templeId,
      userId,
      role: 'member',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding temple member:', error);
    if (error instanceof FirebaseError) throw error;
    throw new FirebaseError('unknown', 'Failed to add temple member');
  }
}

export async function removeTempleMember(
  templeId: string,
  memberId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, TEMPLES_COLLECTION, templeId, TEMPLE_MEMBERS_COLLECTION, memberId));
  } catch (error) {
    console.error('Error removing temple member:', error);
    throw new FirebaseError('unknown', 'Failed to remove temple member');
  }
}

// Temple Admins
export async function assignTempleAdmin(
  templeId: string,
  userId: string
): Promise<void> {
  try {
    const adminRef = doc(collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_ADMINS_COLLECTION));
    await setDoc(adminRef, {
      id: adminRef.id,
      templeId,
      userId,
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning temple admin:', error);
    throw new FirebaseError('unknown', 'Failed to assign temple admin');
  }
}

export async function removeTempleAdmin(
  templeId: string,
  adminId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, TEMPLES_COLLECTION, templeId, TEMPLE_ADMINS_COLLECTION, adminId));
  } catch (error) {
    console.error('Error removing temple admin:', error);
    throw new FirebaseError('unknown', 'Failed to remove temple admin');
  }
}

export async function getTempleAdmins(templeId: string): Promise<TempleAdmin[]> {
  try {
    const adminsRef = collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_ADMINS_COLLECTION);
    const snapshot = await getDocs(adminsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TempleAdmin));
  } catch (error) {
    console.error('Error fetching temple admins:', error);
    throw new FirebaseError('unknown', 'Failed to fetch temple admins');
  }
}

export async function isTempleAdmin(templeId: string, userId: string): Promise<boolean> {
  try {
    const adminsRef = collection(db, TEMPLES_COLLECTION, templeId, TEMPLE_ADMINS_COLLECTION);
    const q = query(adminsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking temple admin status:', error);
    return false;
  }
}
