import * as React from 'react';
import { Link2, Plus, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { QuickLink } from '@/lib/db/notifications/types';

export function QuickLinksPopover() {
  const { user } = useAuth();
  const [quickLinks, setQuickLinks] = React.useState<QuickLink[]>([]);
  const [newLink, setNewLink] = React.useState({ title: '', url: '' });
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<QuickLink | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'quickLinks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const links = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as QuickLink[];
          
          setQuickLinks(links);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching quick links:', error);
          setError('Failed to load quick links');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up quick links listener:', error);
      setError('Failed to initialize quick links');
      setIsLoading(false);
    }
  }, [user]);

  const handleAddLink = async () => {
    if (!user || !newLink.title || !newLink.url) return;

    try {
      const response = await fetch('/api/quick-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(newLink),
      });

      if (!response.ok) {
        throw new Error('Failed to add quick link');
      }

      setNewLink({ title: '', url: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding quick link:', error);
      setError('Failed to add quick link');
    }
  };

  const handleUpdateLink = async () => {
    if (!user || !editingLink) return;

    try {
      const response = await fetch('/api/quick-links', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          id: editingLink.id,
          title: newLink.title,
          url: newLink.url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quick link');
      }

      setNewLink({ title: '', url: '' });
      setEditingLink(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating quick link:', error);
      setError('Failed to update quick link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/quick-links', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete quick link');
      }
    } catch (error) {
      console.error('Error deleting quick link:', error);
      setError('Failed to delete quick link');
    }
  };

  const handleEditClick = (link: QuickLink) => {
    setEditingLink(link);
    setNewLink({ title: link.title, url: link.url });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setNewLink({ title: '', url: '' });
    setEditingLink(null);
    setIsDialogOpen(false);
    setError(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Link2 className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-semibold">Quick Links</h4>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditingLink(null);
                  setError(null);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? 'Edit Quick Link' : 'Add Quick Link'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="text-sm text-red-500 text-center">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDialogClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-full"
                    onClick={editingLink ? handleUpdateLink : handleAddLink}
                  >
                    {editingLink ? 'Update' : 'Add'} Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading quick links...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">
              {error}
            </div>
          ) : quickLinks.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No quick links added
            </div>
          ) : (
            <div className="divide-y">
              {quickLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 hover:bg-muted/50 flex items-center justify-between group"
                >
                  <a
                    href={link.url}
                    className="flex items-center space-x-2 flex-grow"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Link2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{link.title}</span>
                  </a>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditClick(link);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteLink(link.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
