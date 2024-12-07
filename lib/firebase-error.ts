export class FirebaseError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FirebaseError';
  }
}

export function handleFirebaseError(error: any): FirebaseError {
  if (error instanceof FirebaseError) {
    return error;
  }

  const errorCode = error.code || 'unknown';
  let errorMessage = 'An unknown error occurred';

  switch (errorCode) {
    case 'auth/email-already-in-use':
      errorMessage = 'This email is already registered';
      break;
    case 'auth/invalid-email':
      errorMessage = 'Invalid email address';
      break;
    case 'auth/operation-not-allowed':
      errorMessage = 'Operation not allowed';
      break;
    case 'auth/weak-password':
      errorMessage = 'Password is too weak';
      break;
    case 'auth/user-disabled':
      errorMessage = 'This account has been disabled';
      break;
    case 'auth/user-not-found':
      errorMessage = 'User not found';
      break;
    case 'auth/wrong-password':
      errorMessage = 'Invalid password';
      break;
    case 'auth/too-many-requests':
      errorMessage = 'Too many attempts. Please try again later';
      break;
    case 'storage/unauthorized':
      errorMessage = 'Not authorized to access storage';
      break;
    case 'storage/canceled':
      errorMessage = 'Upload was canceled';
      break;
    case 'storage/unknown':
      errorMessage = 'An unknown error occurred during upload';
      break;
    default:
      errorMessage = error.message || errorMessage;
  }

  return new FirebaseError(errorCode, errorMessage);
}