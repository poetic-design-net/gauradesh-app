'use client';

import { Suspense } from 'react';
import { DashboardHero } from './components/DashboardHero';
import { DashboardStats } from './components/DashboardStats';
import { DashboardActions } from './components/DashboardActions';
import { DashboardServices } from './components/DashboardServices';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/db/users';
import { getTemple } from '@/lib/db/temples';
import { isAdmin } from '@/lib/db/admin';
import { getUserServiceRegistrations, getService } from '@/lib/db/services';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

interface DashboardData {
  profile: any;
  isAdmin: boolean;
  registrations: any[];
  temple: any;
}

export default function DashboardPage() {
  const { user } = useAuth();
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
        // Load initial data in parallel
        const [profile, adminStatus, userRegistrations] = await Promise.all([
          getUserProfile(user.uid),
          isAdmin(user.uid),
          getUserServiceRegistrations(user.uid)
        ]);

        // Get temple data if user has a temple
        let temple = null;
        if (profile?.templeId) {
          temple = await getTemple(profile.templeId);
        }

        // Get initial service data for each registration
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

        setData({
          profile,
          isAdmin: adminStatus,
          registrations: enrichedRegistrations,
          temple
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
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
        temple={data.temple}
      />

      <Suspense>
        <DashboardActions 
          temple={data.temple}
          isAdmin={data.isAdmin}
        />
      </Suspense>

      <Suspense>
        <DashboardServices 
          initialRegistrations={data.registrations}
          templeId={data.temple?.id}
          userId={user.uid}
        />
      </Suspense>
    </div>
  );
}
