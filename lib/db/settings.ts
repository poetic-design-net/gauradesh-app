'use client';

import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { FirebaseError } from '../firebase-error';

const SETTINGS_COLLECTION = 'settings';
const APP_SETTINGS_DOC = 'app_settings';

export interface AppSettings {
  headline: string;
  updatedAt: Date;
  updatedBy: string;
}

export async function getAppSettings(): Promise<AppSettings | null> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC);
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      return null;
    }
    
    return settingsDoc.data() as AppSettings;
  } catch (error) {
    console.error('Error fetching app settings:', error);
    throw new FirebaseError('unknown', 'Failed to fetch app settings');
  }
}

export async function updateAppSettings(
  userId: string,
  settings: Partial<AppSettings>
): Promise<void> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC);
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }, { merge: true });
  } catch (error) {
    console.error('Error updating app settings:', error);
    throw new FirebaseError('unknown', 'Failed to update app settings');
  }
}