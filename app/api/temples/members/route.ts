import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { TempleMember } from '@/lib/db/temples';
import { UserProfile } from '@/lib/db/users';
import { Timestamp } from 'firebase-admin/firestore';
import { serializeData } from '@/lib/server-utils';

interface MemberData extends Omit<TempleMember, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profile?: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
    isAdmin: boolean;
    isSuperAdmin: boolean;
  };
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

    // Get all regular members from temple_members collection
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

    // Get users who have this templeId in their profile but are not in temple_members
    const usersWithTempleSnapshot = await adminDb
      .collection('users')
      .where('templeId', '==', templeId)
      .get();

    // Create a Set of existing member userIds for quick lookup
    const existingMemberIds = new Set([
      ...adminMembers.map(m => m.userId),
      ...regularMembers.map(m => m.userId)
    ]);

    // Filter out users who are already in temple_members
    const additionalMembers = usersWithTempleSnapshot.docs
      .filter(doc => !existingMemberIds.has(doc.id))
      .map(doc => ({
        id: doc.id,
        templeId,
        userId: doc.id,
        role: 'member' as const,
        createdAt: doc.data().createdAt || Timestamp.now(),
        updatedAt: doc.data().updatedAt || Timestamp.now()
      }));

    // Combine all unique members
    const allMembers = [...adminMembers, ...regularMembers, ...additionalMembers];
    
    // Get user profiles for all members
    try {
      const userProfiles = await Promise.all(
        allMembers.map(async (member) => {
          try {
            // Get user profile
            const userDoc = await adminDb.collection('users').doc(member.userId).get();
            // Get admin status from admin collection
            const adminDoc = await adminDb.collection('admin').doc(member.userId).get();
            const adminData = adminDoc.exists ? adminDoc.data() : null;

            if (!userDoc.exists) {
              console.warn(`User profile not found for userId: ${member.userId}`);
              return {
                uid: member.userId,
                email: null,
                displayName: 'Unknown User',
                photoURL: null,
                bio: null,
                templeId: null,
                isAdmin: false,
                isSuperAdmin: false
              };
            }

            const userData = userDoc.data() as UserProfile;
            return {
              uid: userData.uid,
              email: userData.email,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              bio: userData.bio,
              templeId: userData.templeId,
              isAdmin: adminData?.isAdmin || false,
              isSuperAdmin: adminData?.isSuperAdmin || false
            };
          } catch (error) {
            console.error(`Error fetching user profile for userId: ${member.userId}`, error);
            return {
              uid: member.userId,
              email: null,
              displayName: 'Error Loading User',
              photoURL: null,
              bio: null,
              templeId: null,
              isAdmin: false,
              isSuperAdmin: false
            };
          }
        })
      );

      // Map user profiles to members and serialize the data
      const enrichedMembers = allMembers.map(member => ({
        ...member,
        profile: userProfiles.find(profile => profile.uid === member.userId)
      }));

      // For users found through templeId in their profile, also add them to temple_members collection
      if (additionalMembers.length > 0) {
        const batch = adminDb.batch();
        for (const member of additionalMembers) {
          const memberRef = adminDb
            .collection(`temples/${templeId}/temple_members`)
            .doc();
          batch.set(memberRef, {
            id: memberRef.id,
            templeId,
            userId: member.userId,
            role: 'member',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
        await batch.commit();
      }

      // Serialize the data before sending it to the client
      return NextResponse.json({ 
        members: serializeData(enrichedMembers)
      });
    } catch (error: any) {
      console.error('Error enriching members with profiles:', {
        error: error.message,
        code: error.code,
        templeId,
        memberCount: allMembers.length
      });
      
      return NextResponse.json({ 
        members: serializeData(allMembers),
        warning: 'Failed to load some user profiles'
      });
    }
  } catch (error: any) {
    console.error('Error fetching temple members:', {
      error: error.message,
      code: error.code,
      templeId,
      path: `temples/${templeId}`
    });

    if (error.code === 'permission-denied') {
      return NextResponse.json(
        { error: 'Permission denied accessing temple members' },
        { status: 403 }
      );
    }
    
    if (error.code === 'not-found') {
      return NextResponse.json(
        { error: 'Temple not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch temple members',
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}
