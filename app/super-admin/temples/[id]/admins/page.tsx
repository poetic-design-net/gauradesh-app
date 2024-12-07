'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { UserProfile, searchUsers } from '@/lib/db/users';
import { AdminData, getTempleAdmins, assignTempleAdmin, removeAdmin } from '@/lib/db/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Trash2 } from 'lucide-react';

interface Params {
  [key: string]: string;
  id: string;
}

export default function TempleAdminsPage() {
  const { id: templeId } = useParams<Params>();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (templeId) {
      loadAdmins();
    }
  }, [templeId]);

  async function loadAdmins() {
    try {
      const templeAdmins = await getTempleAdmins(templeId);
      setAdmins(templeAdmins);
    } catch (error) {
      console.error('Error loading temple admins:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load temple admins',
      });
    }
  }

  async function handleSearch() {
    if (!searchTerm) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchTerm);
      // Filter out users who are already admins
      const filteredResults = results.filter(
        user => !admins.some(admin => admin.uid === user.uid)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to search users',
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAssignAdmin(user: UserProfile) {
    try {
      await assignTempleAdmin(user.uid, templeId);
      await loadAdmins();
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Admin assigned successfully',
      });
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign admin',
      });
    }
  }

  async function handleRemoveAdmin(adminUid: string) {
    try {
      await removeAdmin(adminUid);
      await loadAdmins();
      toast({
        title: 'Success',
        description: 'Admin removed successfully',
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove admin',
      });
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Temple Admins</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Temple Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {searchResults.map((user) => (
                          <TableRow key={user.uid}>
                            <TableCell>
                              <div className="flex items-center">
                                {user.photoURL && (
                                  <img
                                    src={user.photoURL}
                                    alt={user.displayName || ''}
                                    className="h-8 w-8 rounded-full mr-2"
                                  />
                                )}
                                <div>
                                  <div>{user.displayName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleAssignAdmin(user)}
                              >
                                Add
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.uid}>
                  <TableCell>{admin.uid}</TableCell>
                  <TableCell>
                    {admin.createdAt?.toDate?.()?.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAdmin(admin.uid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
