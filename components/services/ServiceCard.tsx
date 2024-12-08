'use client';

import { Service } from '@/lib/db/services/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ServiceIcon } from './ServiceIcon';
import { ArrowRight, Calendar, Clock, Edit, Trash2, Phone, User, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ServiceRegistration, SERVICE_REGISTRATIONS_COLLECTION } from '@/lib/db/services/types';
import { deleteRegistration } from '@/lib/db/services/registrations';
import { getUsersByTemple, UserProfile } from '@/lib/db/users';
import { updateService } from '@/lib/db/services/services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ServiceCardProps {
  service: Service;
  onRegister: (serviceId: string, message?: string) => Promise<void>;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

interface ServiceCounts {
  currentParticipants: number;
  pendingParticipants: number;
  maxParticipants: number;
}

export function ServiceCard({ service, onRegister, onEdit, onDelete }: ServiceCardProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ServiceCounts>({
    currentParticipants: service.currentParticipants || 0,
    pendingParticipants: service.pendingParticipants || 0,
    maxParticipants: service.maxParticipants || 0
  });
  const [message, setMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userRegistration, setUserRegistration] = useState<ServiceRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [templeUsers, setTempleUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [manualContactName, setManualContactName] = useState(service.contactPerson?.name || '');
  const [manualContactPhone, setManualContactPhone] = useState(service.contactPerson?.phone || '');
  const [selectedUserId, setSelectedUserId] = useState<string>('none');
  const [notes, setNotes] = useState(service.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Check if current user is the service leader
  const isServiceLeader = user?.uid === service.contactPerson?.userId;

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates for service counts and data
    const serviceRef = doc(db, `temples/${service.templeId}/services/${service.id}`);
    const unsubscribeService = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCounts({
          currentParticipants: data.currentParticipants || 0,
          pendingParticipants: data.pendingParticipants || 0,
          maxParticipants: data.maxParticipants || 0
        });
        setNotes(data.notes || '');
      }
    });

    // Check if user is registered for this service
    const registrationsRef = collection(db, SERVICE_REGISTRATIONS_COLLECTION);
    const q = query(
      registrationsRef,
      where('userId', '==', user.uid),
      where('serviceId', '==', service.id)
    );

    const unsubscribeRegistration = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const registration = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as ServiceRegistration;
        setUserRegistration(registration);
      } else {
        setUserRegistration(null);
      }
    });

    // Fetch temple users
    const fetchTempleUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await getUsersByTemple(service.templeId);
        setTempleUsers(users);
        
        // Set initial selectedUserId if the current contact person matches a temple user
        if (service.contactPerson?.userId) {
          setSelectedUserId(service.contactPerson.userId);
        } else {
          setSelectedUserId('none');
        }
      } catch (error) {
        console.error('Error fetching temple users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchTempleUsers();

    return () => {
      unsubscribeService();
      unsubscribeRegistration();
    };
  }, [service.id, service.templeId, user, service.contactPerson?.userId]);

  const percentageFull = Math.round((counts.currentParticipants / counts.maxParticipants) * 100);
  const isFull = counts.currentParticipants >= counts.maxParticipants;
  const isAvailable = counts.currentParticipants < counts.maxParticipants;

  // Only show edit/delete if the handlers are provided
  const showManageButtons = Boolean(onEdit || onDelete);

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      await onRegister(service.id, message);
      setMessage('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to register:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!userRegistration || !user) return;
    
    try {
      setIsLoading(true);
      await deleteRegistration(userRegistration.id, user.uid);
    } catch (error) {
      console.error('Failed to unregister:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceLeaderChange = async (userId: string) => {
    try {
      setIsLoading(true);
      setSelectedUserId(userId);
      
      if (userId === 'none') {
        // Don't clear the manual inputs when "None" is selected
        await updateService(service.id, user!.uid, service.templeId, {
          contactPerson: {
            name: manualContactName,
            phone: manualContactPhone,
          }
        });
        return;
      }

      const selectedUser = templeUsers.find(u => u.uid === userId);
      if (selectedUser) {
        setManualContactName(selectedUser.displayName || '');
        await updateService(service.id, user!.uid, service.templeId, {
          contactPerson: {
            name: selectedUser.displayName || '',
            phone: manualContactPhone,
            userId: selectedUser.uid,
          }
        });
      }
    } catch (error) {
      console.error('Failed to update service leader:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactUpdate = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      await updateService(service.id, user.uid, service.templeId, {
        contactPerson: {
          name: manualContactName,
          phone: manualContactPhone,
          userId: selectedUserId !== 'none' ? selectedUserId : undefined,
        }
      });
    } catch (error) {
      console.error('Failed to update contact information:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      setIsLoading(true);
      if (!user || !isServiceLeader) return;

      await updateService(service.id, user.uid, service.templeId, {
        notes: notes
      });
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to update notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden backdrop-blur-lg bg-white/10 border-white/20 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
              <ServiceIcon name={service.type || 'default'} className="h-6 w-6 text-purple-400" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-white">{service.name || 'Unnamed Service'}</CardTitle>
              <CardDescription className="text-gray-400">
                Service Type: {service.type || 'Not specified'}
              </CardDescription>
            </div>
          </div>
          {showManageButtons && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(service)}
                  className="hover:bg-purple-500/20"
                >
                  <Edit className="h-4 w-4 text-purple-400" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          {service.description || 'No description available'}
        </p>

        {/* Date and Time Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="h-4 w-4" />
            <span>
              {service.date ? format(service.date.toDate(), 'EEEE, MMMM d, yyyy') : 'Date not set'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="h-4 w-4" />
            <span>
              {service.timeSlot ? `${service.timeSlot.start} - ${service.timeSlot.end}` : 'Time not set'}
            </span>
          </div>
        </div>

        {/* Service Leader Selection and Contact Information */}
        {showManageButtons ? (
          <div className="space-y-4 p-4 rounded-lg bg-purple-500/10">
            <h4 className="text-sm font-medium text-purple-300">Service Leader</h4>
            
            {/* Optional User Selection */}
            <div className="space-y-2">
              <Label className="text-gray-300">Select from Temple Users (Optional)</Label>
              <Select
                onValueChange={handleServiceLeaderChange}
                value={selectedUserId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Manual Entry)</SelectItem>
                  {templeUsers.map((user) => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {user.displayName || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manual Contact Information */}
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Leader Name</Label>
                <Input
                  value={manualContactName}
                  onChange={(e) => setManualContactName(e.target.value)}
                  placeholder="Enter leader name"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Leader Phone</Label>
                <Input
                  value={manualContactPhone}
                  onChange={(e) => setManualContactPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button 
                onClick={handleContactUpdate}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Updating...' : 'Update Contact Information'}
              </Button>
            </div>
          </div>
        ) : (
          /* Display Contact Information (when not editing) */
          service.contactPerson && (
            <div className="space-y-2 p-4 rounded-lg bg-purple-500/10">
              <h4 className="text-sm font-medium text-purple-300 mb-2">Service Leader Contact</h4>
              <div className="flex items-center gap-2 text-gray-300">
                <User className="h-4 w-4" />
                <span>{service.contactPerson.name}</span>
              </div>
              {service.contactPerson.phone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="h-4 w-4" />
                  <span>{service.contactPerson.phone}</span>
                </div>
              )}
            </div>
          )
        )}

        {/* Service Notes Section */}
        <div className="space-y-2 p-4 rounded-lg bg-purple-500/10">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-purple-300">Service Notes</h4>
            {isServiceLeader && !isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
                className="hover:bg-purple-500/20"
              >
                <Edit className="h-4 w-4 text-purple-400" />
              </Button>
            )}
          </div>
          
          {isServiceLeader && isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the service..."
                className="min-h-[100px] bg-white/5 border-white/10 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotes(service.notes || '');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNotesUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-300">
              {notes ? (
                <div className="flex items-start gap-2">
                  <StickyNote className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p className="whitespace-pre-wrap">{notes}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic">No notes available</p>
              )}
            </div>
          )}
        </div>

        {/* Registration Status */}
        {userRegistration && (
          <div className="p-4 rounded-lg bg-purple-500/10">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Your Registration</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  userRegistration.status === 'approved' ? 'text-green-400' :
                  userRegistration.status === 'pending' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  Status: {userRegistration.status.charAt(0).toUpperCase() + userRegistration.status.slice(1)}
                </span>
              </div>
              {userRegistration.message && (
                <div className="text-sm text-gray-300">
                  <span className="font-medium">Your message:</span>
                  <p className="mt-1 italic">{userRegistration.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {counts.currentParticipants} of {counts.maxParticipants} spots filled
              {counts.pendingParticipants > 0 && ` (${counts.pendingParticipants} pending)`}
            </span>
            <span className={`font-medium ${
              isFull ? 'text-red-400' : 
              counts.pendingParticipants > 0 ? 'text-yellow-400' :
              percentageFull > 75 ? 'text-orange-400' : 
              'text-green-400'
            }`}>
              {percentageFull}% full
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                isFull 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : percentageFull > 75
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
              }`}
              style={{ width: `${percentageFull}%` }}
            />
            {counts.pendingParticipants > 0 && (
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-50"
                style={{ 
                  left: `${percentageFull}%`,
                  width: `${Math.round((counts.pendingParticipants / counts.maxParticipants) * 100)}%`
                }}
              />
            )}
            <div 
              className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
              style={{ 
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {userRegistration ? (
          <Button 
            className="w-full bg-red-500/80 text-red-300 hover:bg-red-500/90 transition-all duration-300"
            onClick={handleUnregister}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Unregister from Service'}
          </Button>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className={`w-full group transition-all duration-300 ${
                  isFull 
                    ? 'bg-red-500/80 text-red-300 hover:bg-red-500/90'
                    : 'bg-purple-500/80 text-purple-300 hover:bg-purple-500/90'
                }`}
                disabled={isFull || !isAvailable || isLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  {isFull ? 'Service Full' : isLoading ? 'Processing...' : 'Register for Service'}
                  {!isFull && isAvailable && !isLoading && (
                    <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register for {service.name}</DialogTitle>
                <DialogDescription>
                  You can add an optional message with your registration.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRegister} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Register'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
