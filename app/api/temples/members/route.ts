import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { TempleMember } from '@/lib/db/temples';
import { UserProfile } from '@/lib/db/users';
import { Timestamp } from 'firebase-admin/firestore';

interface MemberData extends Omit<TempleMember, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profile?: Omit<UserProfile, 'createdAt' | 'updatedAt'>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templeId = searchParams.get('templeId');

  if (!templeId) {
    return NextResponse.json({ error: 'Temple ID is required' }, { status: 400 });
  }

  try {
    // Get all admins
    const adminsSnapshot = await adminDb
      .collection(`temples/${templeId}/temple_admins`)
      .get();
    
    const adminMembers = adminsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        templeId,
        userId: data.userId,
        role: 'admin' as const,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    // Get all regular members
    const membersSnapshot = await adminDb
      .collection(`temples/${templeId}/temple_members`)
      .get();
    
    const regularMembers = membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        templeId,
        userId: data.userId,
        role: 'member' as const,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    // Get user profiles for all members
    const allMembers = [...adminMembers, ...regularMembers];
    const userIds = Array.from(new Set(allMembers.map(member => member.userId)));
    
    const userProfiles = await Promise.all(
      userIds.map(async (userId) => {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data() as UserProfile;
        return {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          bio: userData.bio,
          isAdmin: userData.isAdmin,
          isSuperAdmin: userData.isSuperAdmin,
          templeId: userData.templeId
        };
      })
    );

    // Map user profiles to members
    const enrichedMembers = allMembers.map(member => ({
      ...member,
      profile: userProfiles.find(profile => profile.uid === member.userId)
    }));

    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    console.error('Error fetching temple members:', error);
    return NextResponse.json({ error: 'Failed to fetch temple members' }, { status: 500 });
  }
}
