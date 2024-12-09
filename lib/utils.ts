import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serializeData(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (typeof data === 'object') {
    // Check if the object has a toDate method (like Firestore Timestamp)
    if (data.toDate && typeof data.toDate === 'function') {
      return data.toDate().toISOString();
    }
    
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeData(value);
    }
    return serialized;
  }
  
  return data;
}

export function formatFirebaseTimestamp(timestamp: Timestamp | null | undefined): string {
  if (!timestamp || !timestamp.toDate) {
    return '';
  }

  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
