import { NextRequest, NextResponse } from 'next/server';
import { adminDb, auth, TEMPLES_COLLECTION, ADMIN_COLLECTION } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if user is super admin
    const adminDoc = await adminDb.collection(ADMIN_COLLECTION).doc(uid).get();
    if (!adminDoc.exists || !adminDoc.data()?.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can update temple details' }, { status: 403 });
    }

    // Get temple data from request
    const data = await request.json();
    const { templeId, name, location, description } = data;

    if (!templeId || !name || !location) {
      return NextResponse.json({ error: 'Temple ID, name, and location are required' }, { status: 400 });
    }

    // Update temple with all fields
    const templeRef = adminDb.collection(TEMPLES_COLLECTION).doc(templeId);
    await templeRef.set({
      name,
      location,
      description: description || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Temple updated successfully'
    });

  } catch (error) {
    console.error('Error updating temple:', error);
    return NextResponse.json(
      { error: 'Failed to update temple' },
      { status: 500 }
    );
  }
}
