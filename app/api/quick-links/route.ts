import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { 
  createQuickLink,
  getUserQuickLinks,
  updateQuickLink,
  deleteQuickLink
} from '@/lib/db/notifications';

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
  } catch (error) {
    console.error('Error fetching quick links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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

    const { title, url } = await request.json();
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    const linkId = await createQuickLink({ userId, title, url });
    return NextResponse.json({ id: linkId });
  } catch (error) {
    console.error('Error creating quick link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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

    const { id, title, url } = await request.json();
    if (!id || (!title && !url)) {
      return NextResponse.json(
        { error: 'Link ID and at least one field to update are required' },
        { status: 400 }
      );
    }

    await updateQuickLink(id, { title, url });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quick link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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

    await deleteQuickLink(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
