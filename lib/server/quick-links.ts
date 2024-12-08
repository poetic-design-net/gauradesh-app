import { adminDb } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function verifyQuickLinkOwnership(linkId: string, userId: string): Promise<boolean> {
  try {
    const linkRef = adminDb.collection('quickLinks').doc(linkId);
    const doc = await linkRef.get();
    
    if (!doc.exists) {
      return false;
    }
    
    return doc.data()?.userId === userId;
  } catch (error) {
    console.error('Error verifying quick link ownership:', error);
    return false;
  }
}

export async function createQuickLinkAdmin(data: { 
  userId: string; 
  title: string; 
  url: string; 
  pinned?: boolean;
  internal?: boolean;
}) {
  try {
    const now = Timestamp.now();
    const quickLinkData = {
      userId: data.userId,
      title: data.title,
      url: data.url,
      pinned: data.pinned || false,
      internal: data.internal || false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('quickLinks').add(quickLinkData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating quick link:', error);
    throw error;
  }
}

export async function updateQuickLinkAdmin(
  id: string, 
  userId: string, 
  data: { title?: string; url?: string; pinned?: boolean; internal?: boolean }
) {
  try {
    // First verify ownership
    const isOwner = await verifyQuickLinkOwnership(id, userId);
    if (!isOwner) {
      throw new Error('Permission denied');
    }

    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.pinned !== undefined) updateData.pinned = data.pinned;
    if (data.internal !== undefined) updateData.internal = data.internal;

    // If we're pinning this link, unpin any other pinned links for this user
    if (data.pinned) {
      const pinnedLinks = await adminDb
        .collection('quickLinks')
        .where('userId', '==', userId)
        .where('pinned', '==', true)
        .get();

      const batch = adminDb.batch();
      pinnedLinks.docs.forEach(doc => {
        if (doc.id !== id) {
          batch.update(doc.ref, { pinned: false });
        }
      });
      await batch.commit();
    }

    await adminDb.collection('quickLinks').doc(id).update(updateData);
  } catch (error) {
    console.error('Error updating quick link:', error);
    throw error;
  }
}

export async function deleteQuickLinkAdmin(id: string, userId: string) {
  try {
    // First verify ownership
    const isOwner = await verifyQuickLinkOwnership(id, userId);
    if (!isOwner) {
      throw new Error('Permission denied');
    }

    await adminDb.collection('quickLinks').doc(id).delete();
  } catch (error) {
    console.error('Error deleting quick link:', error);
    throw error;
  }
}

export async function getPinnedQuickLink(userId: string) {
  try {
    const pinnedLink = await adminDb
      .collection('quickLinks')
      .where('userId', '==', userId)
      .where('pinned', '==', true)
      .limit(1)
      .get();

    if (pinnedLink.empty) {
      return null;
    }

    const doc = pinnedLink.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    };
  } catch (error) {
    console.error('Error getting pinned quick link:', error);
    throw error;
  }
}
