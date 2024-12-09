import { Timestamp } from 'firebase-admin/firestore';

export function serializeTimestamp(timestamp: Timestamp | null | undefined): string | null {
  if (!timestamp) return null;
  return timestamp.toDate().toISOString();
}

export function serializeData(data: any): any {
  if (!data) return data;
  
  if (data instanceof Timestamp) {
    return serializeTimestamp(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeData(value);
    }
    return serialized;
  }
  
  return data;
}
