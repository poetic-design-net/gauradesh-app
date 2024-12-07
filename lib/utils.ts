import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFirebaseTimestamp(timestamp: Timestamp | any): string {
  if (!timestamp) return 'N/A';
  
  // Check if it's a Firebase Timestamp
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  // Handle server timestamp that comes as an object
  if (timestamp?.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return 'N/A';
}
