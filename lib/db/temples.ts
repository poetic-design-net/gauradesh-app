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
import { auth } from '../firebase';
import { FirebaseError } from '../firebase-error';
import { isSuperAdmin } from './admin';

const TEMPLES_COLLECTION = 'temples';
const TEMPLE_ADMINS_COLLECTION = 'temple_admins';
const TEMPLE_MEMBERS_COLLECTION = 'temple_members';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DailyProgram {
  time: string;
  activity: string;
}

export interface TempleNews {
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
}

export type TempleProgram = Record<DayOfWeek, DailyProgram[]>;

// Interface for data stored in Firestore
interface TempleData {
  name: string;
  description?: string;
  location: string; // Changed from address to location
  phone?: string;
  email?: string;
  website?: string;
  aboutImageUrl?: string;
  logoUrl?: string;
  dailyPrograms?: TempleProgram;
  news?: TempleNews;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    telefon?: string;
    gmaps?: string;
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Interface for temple with ID (used in the application)
export interface Temple extends TempleData {
  id: string;
}

export interface TempleUpdateData extends Partial<Omit<TempleData, 'createdAt' | 'updatedAt'>> {
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

// Only superadmin can create temples
export async function createTemple(
  userId: string,
  data: { name: string; location: string; description?: string }
): Promise<string> {
  try {
    console.log('Creating temple with data:', data);

    // Get the current user's token
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new FirebaseError('unauthenticated', 'User must be authenticated');
    }

    // Call the API endpoint to create temple
    const response = await fetch('/api/temples/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: data.name,
        location: data.location
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new FirebaseError(
        response.status === 403 ? 'permission-denied' : 'unknown',
        errorData.error || 'Failed to create temple'
      );
    }

    const result = await response.json();
    const templeId = result.templeId;

    // If description is provided, update it separately
    if (data.description) {
      await updateTempleDetails(templeId, {
        description: data.description
      });
    }

    return templeId;
  } catch (error) {
    console.error('Error creating temple:', error);
    if (error instanceof FirebaseError) throw error;
    throw new FirebaseError('unknown', 'Failed to create temple');
  }
}

// Temple admins can update temple details
export async function updateTempleDetails(
  templeId: string,
  data: {
    description?: string;
    aboutImageUrl?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    website?: string;
    dailyPrograms?: TempleProgram;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      website?: string;
      telefon?: string;
      gmaps?: string;
    };
  }
): Promise<void> {
  try {
    const templeRef = doc(db, TEMPLES_COLLECTION, templeId);
    await setDoc(templeRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating temple details:', error);
    throw new FirebaseError('unknown', 'Failed to update temple details');
  }
}

export async function updateTempleNews(
  templeId: string,
  news: Omit<TempleNews, 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    const templeRef = doc(db, TEMPLES_COLLECTION, templeId);
    await setDoc(templeRef, {
      news: {
        ...news,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating temple news:', error);
    throw new FirebaseError('unknown', 'Failed to update temple news');
  }
}

export async function getAllTemples(): Promise<Temple[]> {
  try {
    console.log('Fetching all temples...');
    const templesRef = collection(db, TEMPLES_COLLECTION);
    const snapshot = await getDocs(templesRef);
    const temples = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as Temple));
    console.log('Temples fetched:', temples);
    return temples;
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
    
    return {
      ...templeDoc.data(),
      id: templeDoc.id,
    } as Temple;
  } catch (error) {
    console.error('Error fetching temple:', error);
    if (error instanceof FirebaseError) throw error;
    throw new FirebaseError('unknown', 'Failed to fetch temple');
  }
}

// Only superadmin can delete temples
export async function deleteTemple(templeId: string, userId: string): Promise<void> {
  try {
    const superAdmin = await isSuperAdmin(userId);
    if (!superAdmin) {
      throw new FirebaseError('permission-denied', 'Only superadmins can delete temples');
    }

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
