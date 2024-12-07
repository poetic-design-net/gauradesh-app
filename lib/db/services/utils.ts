import { FirebaseError } from '../../firebase-error';

export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Don't retry on permission errors or precondition failures
      if (error instanceof FirebaseError && 
         (error.code === 'permission-denied' || 
          error.code === 'failed-precondition')) {
        throw error;
      }
      if (attempt === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  throw lastError;
}
