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

    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = userDoc.data();
    const profile: UserProfile = {
      uid: userDoc.id,
      email: data?.email || '',
      displayName: data?.displayName || '',
      photoURL: data?.photoURL || null,
      bio: data?.bio || null,
      isAdmin: data?.isAdmin || false,
      isSuperAdmin: data?.isSuperAdmin || false,
      templeId: data?.templeId || null,
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
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

    await userRef.update({
      ...data,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
