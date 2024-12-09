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
      return NextResponse.json({ error: 'Only super admins can create temples' }, { status: 403 });
    }

    // Get temple data from request
    const data = await request.json();
    const { name, location } = data;

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
    }

    // Create temple with required fields only
    const templeRef = adminDb.collection(TEMPLES_COLLECTION).doc();
    await templeRef.set({
      name,
      location,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      templeId: templeRef.id,
      message: 'Temple created successfully'
    });

  } catch (error) {
    console.error('Error creating temple:', error);
    return NextResponse.json(
      { error: 'Failed to create temple' },
      { status: 500 }
    );
  }
}
