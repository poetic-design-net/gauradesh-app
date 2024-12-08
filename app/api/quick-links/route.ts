import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { getUserQuickLinks } from '@/lib/db/notifications';
import { 
  createQuickLinkAdmin,
  updateQuickLinkAdmin,
  deleteQuickLinkAdmin
} from '@/lib/server/quick-links';
import { handleFirestoreError } from '@/lib/firebase-admin';
import type { FirebaseError } from '@/lib/types/firebase';

const isFirebaseError = (err: unknown): err is FirebaseError => 
  typeof err === 'object' && err !== null && 'code' in err;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const quickLinks = await getUserQuickLinks(userId);
    return NextResponse.json(quickLinks);
  } catch (error: unknown) {
    console.error('Error fetching quick links:', error);
    const handledError = handleFirestoreError(error);
    return NextResponse.json(
      { error: handledError.message },
      { status: isFirebaseError(error) && error.code === 'permission-denied' ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { title, url, pinned, internal } = await request.json();
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const linkId = await createQuickLinkAdmin({
      userId,
      title,
      url,
      pinned,
      internal
    });

    if (!linkId) {
      throw new Error('Failed to create quick link');
    }

    return NextResponse.json({ id: linkId, success: true });
  } catch (error: unknown) {
    console.error('Error in POST /api/quick-links:', error);
    const handledError = handleFirestoreError(error);
    return NextResponse.json(
      { error: handledError.message },
      { status: isFirebaseError(error) && error.code === 'permission-denied' ? 403 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id, title, url, pinned, internal } = await request.json();
    if (!id || (!title && !url && pinned === undefined && internal === undefined)) {
      return NextResponse.json(
        { error: 'Link ID and at least one field to update are required' },
        { status: 400 }
      );
    }

    // Validate URL format if provided
    if (url) {
      try {
        new URL(url);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    await updateQuickLinkAdmin(id, userId, { title, url, pinned, internal });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in PATCH /api/quick-links:', error);
    const handledError = handleFirestoreError(error);
    return NextResponse.json(
      { error: handledError.message },
      { status: isFirebaseError(error) && error.code === 'permission-denied' ? 403 : 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    await deleteQuickLinkAdmin(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/quick-links:', error);
    const handledError = handleFirestoreError(error);
    return NextResponse.json(
      { error: handledError.message },
      { status: isFirebaseError(error) && error.code === 'permission-denied' ? 403 : 500 }
    );
  }
}
