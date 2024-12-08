import { NextResponse } from 'next/server';
import { auth, adminDb, NOTIFICATIONS_COLLECTION } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const notificationsRef = adminDb.collection(NOTIFICATIONS_COLLECTION);
    const snapshot = await notificationsRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));

    return NextResponse.json({ data: notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
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

    const body = await request.json();
    
    if (body.markAllRead) {
      try {
        const notificationsRef = adminDb.collection(NOTIFICATIONS_COLLECTION);
        const snapshot = await notificationsRef
          .where('userId', '==', userId)
          .where('read', '==', false)
          .get();
        
        if (snapshot.empty) {
          return NextResponse.json({ 
            success: true, 
            message: 'No unread notifications found' 
          });
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });

        await batch.commit();
        
        return NextResponse.json({ 
          success: true, 
          message: 'All notifications marked as read' 
        });
      } catch (err: any) {
        console.error('Error marking all notifications as read:', err);
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read', details: err?.message },
          { status: 500 }
        );
      }
    } else if (body.notificationId) {
      try {
        const notificationRef = adminDb.collection(NOTIFICATIONS_COLLECTION).doc(body.notificationId);
        await notificationRef.update({ read: true });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Notification marked as read' 
        });
      } catch (err: any) {
        console.error('Error marking notification as read:', err);
        return NextResponse.json(
          { error: 'Failed to mark notification as read', details: err?.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('Error processing notification update:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err?.message },
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

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      try {
        const notificationsRef = adminDb.collection(NOTIFICATIONS_COLLECTION);
        const snapshot = await notificationsRef
          .where('userId', '==', userId)
          .get();

        if (snapshot.empty) {
          return NextResponse.json({ 
            success: true, 
            message: 'No notifications found' 
          });
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        
        return NextResponse.json({ 
          success: true, 
          message: 'All notifications deleted' 
        });
      } catch (err: any) {
        console.error('Error deleting all notifications:', err);
        return NextResponse.json(
          { error: 'Failed to delete all notifications', details: err?.message },
          { status: 500 }
        );
      }
    } else if (notificationId) {
      try {
        const notificationRef = adminDb.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
        const doc = await notificationRef.get();
        
        if (!doc.exists) {
          return NextResponse.json(
            { error: 'Notification not found' },
            { status: 404 }
          );
        }

        if (doc.data()?.userId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized to delete this notification' },
            { status: 403 }
          );
        }

        await notificationRef.delete();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Notification deleted' 
        });
      } catch (err: any) {
        console.error('Error deleting notification:', err);
        return NextResponse.json(
          { error: 'Failed to delete notification', details: err?.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Notification ID or delete all parameter required' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('Error processing notification deletion:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err?.message },
      { status: 500 }
    );
  }
}
