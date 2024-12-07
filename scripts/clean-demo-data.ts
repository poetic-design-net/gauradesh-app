import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc,
  query,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot 
} from 'firebase/firestore';

import { 
  SERVICES_COLLECTION,
  SERVICE_TYPES_COLLECTION,
  SERVICE_REGISTRATIONS_COLLECTION,
  TEMPLES_COLLECTION,
  SETTINGS_COLLECTION
} from '../lib/firebase-admin';

async function cleanCollection(collectionName: string) {
  console.log(`Cleaning ${collectionName}...`);
  const batch = writeBatch(db);
  const snapshot = await getDocs(collection(db, collectionName));
  
  let count = 0;
  snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    batch.delete(doc.ref);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Deleted ${count} documents from ${collectionName}`);
  } else {
    console.log(`No documents found in ${collectionName}`);
  }
}

async function cleanDemoData() {
  try {
    // Clean all collections that might contain demo data
    await cleanCollection(SERVICES_COLLECTION);
    await cleanCollection(SERVICE_TYPES_COLLECTION);
    await cleanCollection(SERVICE_REGISTRATIONS_COLLECTION);
    await cleanCollection(TEMPLES_COLLECTION);
    await cleanCollection(SETTINGS_COLLECTION);
    
    console.log('Successfully cleaned all demo data');
  } catch (error) {
    console.error('Error cleaning demo data:', error);
  }
}

// Execute the cleanup
cleanDemoData();
