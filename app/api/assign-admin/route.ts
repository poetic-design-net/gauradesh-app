import { NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTION } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST() {
  const USER_ID = 'LrWrfpn8VOhjhsKDiQpGFnyJuFa2';

  try {
    const adminRef = adminDb.collection(ADMIN_COLLECTION).doc(USER_ID);
    
    await adminRef.set({
      uid: USER_ID,
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true, message: 'Successfully assigned super admin permissions' });
  } catch (error) {
    console.error('Error assigning admin:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign admin permissions' }, { status: 500 });
  }
}
