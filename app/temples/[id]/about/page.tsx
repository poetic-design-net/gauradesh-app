import { Suspense } from 'react';
import { TempleAboutPage } from '@/components/temples/TempleAboutPage';
import { adminDb } from '@/lib/firebase-admin';
import { Temple } from '@/lib/db/temples';
import { UserProfile } from '@/lib/db/users';
import { serializeData } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';

interface AboutPageProps {
  params: {
    id: string;
  };
}

async function getTempleData(templeId: string): Promise<Temple> {
  const templeDoc = await adminDb.collection('temples').doc(templeId).get();
  
  if (!templeDoc.exists) {
    throw new Error('Temple not found');
  }

  const data = templeDoc.data();
  return serializeData({
    id: templeDoc.id,
    ...data
  }) as Temple;
}

async function getMembers(templeId: string) {
  try {
    // Get all members and admins in parallel
    const [adminsSnapshot, membersSnapshot, usersWithTempleSnapshot] = await Promise.all([
      adminDb.collection(`temples/${templeId}/temple_admins`).get(),
      adminDb.collection(`temples/${templeId}/temple_members`).get(),
      adminDb.collection('users').where('templeId', '==', templeId).get()
    ]);
    
    // Process members data
    const adminMembers = adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      templeId,
      userId: doc.data().userId,
      role: 'admin' as const,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt
    }));

    const regularMembers = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      templeId,
      userId: doc.data().userId,
      role: 'member' as const,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt
    }));

    // Create a Set of existing member userIds
    const existingMemberIds = new Set([
      ...adminMembers.map(m => m.userId),
      ...regularMembers.map(m => m.userId)
    ]);

    // Process additional members
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

    // Combine all members
    const allMembers = [...adminMembers, ...regularMembers, ...additionalMembers];

    // Get all unique userIds
    const uniqueUserIds = Array.from(new Set(allMembers.map(m => m.userId)));

    // Batch get all user profiles and admin statuses in parallel
    const [userDocs, adminDocs] = await Promise.all([
      adminDb.getAll(...uniqueUserIds.map(uid => adminDb.collection('users').doc(uid))),
      adminDb.getAll(...uniqueUserIds.map(uid => adminDb.collection('admin').doc(uid)))
    ]);

    // Create maps for quick lookup
    const userProfileMap = new Map(
      userDocs.map(doc => [
        doc.id,
        doc.exists ? doc.data() as UserProfile : {
          uid: doc.id,
          email: null,
          displayName: 'Unknown User',
          photoURL: null,
          bio: null,
          templeId: null
        }
      ])
    );

    const adminStatusMap = new Map(
      adminDocs.map(doc => [
        doc.id,
        doc.exists ? doc.data() : { isAdmin: false, isSuperAdmin: false }
      ])
    );

    // Enrich members with profile data
    const enrichedMembers = allMembers.map(member => ({
      ...member,
      profile: {
        ...userProfileMap.get(member.userId),
        ...adminStatusMap.get(member.userId)
      }
    }));

    // Handle additional members in batch if needed
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

    return serializeData(enrichedMembers);
  } catch (error: any) {
    console.error('Error fetching temple members:', error);
    return [];
  }
}

export default async function AboutPage({ params }: AboutPageProps) {
  const [temple, members] = await Promise.all([
    getTempleData(params.id),
    getMembers(params.id)
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TempleAboutPage 
        temple={temple} 
        initialMembers={members}
      />
    </Suspense>
  );
}
