'use client';

import { Suspense } from 'react';
import { DashboardHero } from './components/DashboardHero';
import { DashboardStats } from './components/DashboardStats';
import { DashboardActions } from './components/DashboardActions';
import { DashboardServices } from './components/DashboardServices';
import { useAuth } from '@/contexts/AuthContext';
import { useTempleContext } from '@/contexts/TempleContext';
import { useEffect, useState } from 'react';
import { getUserProfile, UserProfile } from '@/lib/db/users';
import { isAdmin } from '@/lib/db/admin';
import { ServiceRegistration, Service } from '@/lib/db/services/types';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

interface EnrichedRegistration extends ServiceRegistration {
  service?: Service;
}

interface DashboardData {
  profile: UserProfile;
  isAdmin: boolean;
  registrations: EnrichedRegistration[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentTemple } = useTempleContext();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        const [profile, adminStatus] = await Promise.all([
          getUserProfile(user.uid),
          isAdmin(user.uid)
        ]);

        setData({
          profile,
          isAdmin: adminStatus,
          registrations: [], // Initial empty array, will be populated by subscription
        });
      } catch (error) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !user?.uid) {
    return null;
  }

  return (
    <div className="space-y-8">
      <DashboardHero profile={data.profile} />
      <DashboardStats 
        profile={data.profile}
        registrations={data.registrations}
        temple={currentTemple}
      />

      <Suspense>
        <DashboardActions 
          temple={currentTemple}
          isAdmin={data.isAdmin}
        />
      </Suspense>

      <Suspense>
        <DashboardServices 
          initialRegistrations={data.registrations}
          templeId={currentTemple?.id}
          userId={user.uid}
        />
      </Suspense>
    </div>
  );
}
