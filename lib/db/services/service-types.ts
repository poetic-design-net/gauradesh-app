import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FirebaseError } from '../../firebase-error';
import { ServiceType, SERVICE_TYPES_COLLECTION } from './types';
import { withRetry } from './utils';

export async function createServiceType(
  templeId: string,
  data: { name: string; icon: string }
): Promise<ServiceType> {
  if (!templeId) {
    throw new FirebaseError('invalid-argument', 'Temple ID is required');
  }

  return withRetry(async () => {
    const typeRef = doc(collection(db, SERVICE_TYPES_COLLECTION));
    const typeData: ServiceType = {
      id: typeRef.id,
      templeId,
      name: data.name,
      icon: data.icon,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(typeRef, typeData);
    return typeData;
  });
}

export async function getTempleServiceTypes(templeId: string): Promise<ServiceType[]> {
  if (!templeId) {
    return [];
  }

  return withRetry(async () => {
    const typesRef = collection(db, SERVICE_TYPES_COLLECTION);
    const q = query(typesRef, where('templeId', '==', templeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceType));
  });
}

export async function getAllServiceTypes(): Promise<ServiceType[]> {
  return withRetry(async () => {
    const typesRef = collection(db, SERVICE_TYPES_COLLECTION);
    const snapshot = await getDocs(typesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceType));
  });
}
