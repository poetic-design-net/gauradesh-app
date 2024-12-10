import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ServiceType, SERVICE_TYPES_COLLECTION } from './types';

export async function getTempleServiceTypes(templeId: string): Promise<ServiceType[]> {
  if (!templeId) {
    console.error('getTempleServiceTypes: No templeId provided');
    return [];
  }

  try {
    const serviceTypesRef = collection(db, `temples/${templeId}/${SERVICE_TYPES_COLLECTION}`);
    const serviceTypesQuery = query(serviceTypesRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(serviceTypesQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ServiceType));
  } catch (error) {
    console.error('Error getting service types:', error);
    return [];
  }
}

export async function getServiceType(typeId: string, templeId: string): Promise<ServiceType | null> {
  if (!typeId || !templeId) {
    console.error('getServiceType: Missing required parameters');
    return null;
  }

  try {
    const serviceTypeRef = doc(db, `temples/${templeId}/${SERVICE_TYPES_COLLECTION}`, typeId);
    const serviceTypeDoc = await getDoc(serviceTypeRef);

    if (!serviceTypeDoc.exists()) {
      return null;
    }

    return {
      id: serviceTypeDoc.id,
      ...serviceTypeDoc.data()
    } as ServiceType;
  } catch (error) {
    console.error('Error getting service type:', error);
    return null;
  }
}

export async function createServiceType(
  templeId: string,
  data: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ServiceType> {
  if (!templeId) {
    throw new Error('createServiceType: No templeId provided');
  }

  if (!data.name || !data.icon) {
    throw new Error('createServiceType: Missing required fields (name, icon)');
  }

  try {
    const serviceTypesRef = collection(db, `temples/${templeId}/${SERVICE_TYPES_COLLECTION}`);
    
    // Check if a service type with the same name already exists
    const existingQuery = query(serviceTypesRef, where('name', '==', data.name));
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      console.log('Service type already exists:', data.name);
      const existingDoc = existingDocs.docs[0];
      return {
        id: existingDoc.id,
        ...existingDoc.data()
      } as ServiceType;
    }

    const timestamp = serverTimestamp();
    const docRef = await addDoc(serviceTypesRef, {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    // Get the created document to return the complete data
    const createdDoc = await getDoc(docRef);
    if (!createdDoc.exists()) {
      throw new Error('Failed to create service type');
    }

    return {
      id: docRef.id,
      ...createdDoc.data()
    } as ServiceType;
  } catch (error) {
    console.error('Error creating service type:', error);
    throw error;
  }
}

export async function updateServiceType(
  typeId: string,
  templeId: string,
  data: Partial<Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!typeId || !templeId) {
    throw new Error('updateServiceType: Missing required parameters');
  }

  try {
    const serviceTypeRef = doc(db, `temples/${templeId}/${SERVICE_TYPES_COLLECTION}`, typeId);
    
    await updateDoc(serviceTypeRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating service type:', error);
    throw error;
  }
}

export async function deleteServiceType(typeId: string, templeId: string): Promise<void> {
  if (!typeId || !templeId) {
    throw new Error('deleteServiceType: Missing required parameters');
  }

  try {
    const serviceTypeRef = doc(db, `temples/${templeId}/${SERVICE_TYPES_COLLECTION}`, typeId);
    await deleteDoc(serviceTypeRef);
  } catch (error) {
    console.error('Error deleting service type:', error);
    throw error;
  }
}
