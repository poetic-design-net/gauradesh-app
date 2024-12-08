import * as React from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/db/notifications/types';
import { useToast } from '@/components/ui/use-toast';

export function NotificationsPopover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMarkingRead, setIsMarkingRead] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
          })) as Notification[];
          
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching notifications:', error);
          setError('Failed to load notifications');
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load notifications"
          });
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      setError('Failed to initialize notifications');
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize notifications"
      });
    }
  }, [user, toast]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark notification as read"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user || isMarkingRead) return;

    setIsMarkingRead(true);
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }

      toast({
        title: "Success",
        description: data.message || "All notifications marked as read"
      });
      
      // Close the popover after marking all as read
      setOpen(false);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark all notifications as read"
      });
    } finally {
      setIsMarkingRead(false);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the notification click
    if (!user) return;

    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete notification');
      }

      toast({
        title: "Success",
        description: "Notification deleted"
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete notification"
      });
    }
  };

  const deleteAllNotifications = async () => {
    if (!user || isDeleting) return;

    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/notifications?all=true', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete all notifications');
      }

      toast({
        title: "Success",
        description: "All notifications deleted"
      });
      
      // Close the popover after deleting all
      setOpen(false);
    } catch (error: any) {
      console.error('Error deleting all notifications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete all notifications"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingRead}
                className="text-sm"
              >
                {isMarkingRead ? 'Marking read...' : 'Mark all read'}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllNotifications}
                disabled={isDeleting}
                className="text-sm text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'p-4 hover:bg-muted/50 cursor-pointer relative group',
                    !notification.read && 'bg-muted/30'
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteNotification(notification.id, e)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <h5 className="font-medium mb-1">{notification.title}</h5>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {notification.timestamp.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
