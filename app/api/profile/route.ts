import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { UserProfile } from '@/lib/db/users';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';

async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user profile
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Get admin status from admin collection
    const adminDoc = await adminDb.collection('admin').doc(decodedToken.uid).get();
    const adminData = adminDoc.exists ? adminDoc.data() : null;

    const profile: UserProfile & { isAdmin?: boolean; isSuperAdmin?: boolean } = {
      uid: userDoc.id,
      email: userData?.email || '',
      displayName: userData?.displayName || '',
      photoURL: userData?.photoURL || null,
      bio: userData?.bio || null,
      templeId: userData?.templeId || null,
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
      // Add admin status from admin collection
      isAdmin: adminData?.isAdmin || false,
      isSuperAdmin: adminData?.isSuperAdmin || false,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const userRef = adminDb.collection('users').doc(decodedToken.uid);

    // Only update allowed user profile fields
    const updateData = {
      displayName: data.displayName,
      photoURL: data.photoURL,
      bio: data.bio,
      updatedAt: new Date(),
    };

    await userRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
