'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, type UserProfile } from '@/lib/db/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from '@/components/services/ServiceIcon';
import { useTempleContext } from '@/contexts/TempleContext';
import { useRouter } from 'next/navigation';
import { 
  Activity,
  Calendar,
  User,
  HeartHandshake,
  Settings,
  FileText,
  Bell,
  ChevronRight
} from 'lucide-react';
import { 
  ServiceRegistration, 
  getUserServiceRegistrations, 
  getService, 
  Service 
} from '@/lib/db/services';
import { isAdmin } from '@/lib/db/admin';

interface EnrichedRegistration extends ServiceRegistration {
  service?: Service;
}

function StatusBadge({ status }: { status: ServiceRegistration['status'] }) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} transition-colors duration-200`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentTemple } = useTempleContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const [userProfile, userRegistrations, adminStatus] = await Promise.all([
            getUserProfile(user.uid),
            getUserServiceRegistrations(user.uid),
            isAdmin(user.uid)
          ]);

          setIsUserAdmin(adminStatus);

          const enrichedRegistrations = await Promise.all(
            userRegistrations.map(async (reg) => {
              try {
                const service = await getService(reg.serviceId, reg.templeId);
                return { ...reg, service };
              } catch (error) {
                console.error(`Error loading service ${reg.serviceId}:`, error);
                return reg;
              }
            })
          );

          setProfile(userProfile);
          setRegistrations(enrichedRegistrations);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Welcome back, {profile?.displayName ?? 'Devotee'}</h1>
            <p className="text-lg opacity-90">Your spiritual journey continues here</p>
          </div>
          <Avatar className="h-20 w-20 ring-4 ring-white/50">
            <AvatarImage src={profile?.photoURL ?? undefined} />
            <AvatarFallback className="text-2xl">{profile?.displayName?.[0] ?? user?.email?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {currentTemple && (
          <Button
            variant="outline"
            onClick={() => router.push(`/temples/${currentTemple.id}/about`)}
            className="group transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            <FileText className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            About Temple
            <ChevronRight className="ml-2 h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </Button>
        )}
        {isUserAdmin && (
          <Button
            variant="outline"
            onClick={() => router.push('/admin/settings')}
            className="group transition-all duration-300 hover:bg-blue-600 hover:text-white"
          >
            <Settings className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Admin Settings
            <ChevronRight className="ml-2 h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 transition-transform group-hover:scale-105">
                <AvatarImage src={profile?.photoURL ?? undefined} />
                <AvatarFallback>{profile?.displayName?.[0] ?? user?.email?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-2xl font-bold">{profile?.displayName ?? 'Anonymous'}</div>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Approved registrations</p>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.createdAt && 'toDate' in profile.createdAt ? 
                profile.createdAt.toDate().toLocaleDateString() : 
                'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Account creation date</p>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card className="transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">My Services</CardTitle>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                You haven&apos;t registered for any services yet.
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/services')}
                className="mt-4 group transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                Browse Services
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <Card key={reg.id} className="group overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-2 transition-transform group-hover:scale-110">
                          <ServiceIcon name={reg.service?.type} className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-medium transition-colors group-hover:text-primary">
                            {reg.service?.name ?? 'Unknown Service'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Registered on {reg.createdAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={reg.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
