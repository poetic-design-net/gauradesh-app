'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getTemple, Temple } from "@/lib/db/temples";
import { TempleAboutForm } from "@/components/admin/TempleAboutForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { AdminData, ADMIN_COLLECTION } from "@/lib/db/admin";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) {
        router.push('/auth');
        return;
      }

      try {
        // Get admin data to get templeId
        const adminRef = doc(db, ADMIN_COLLECTION, user.uid);
        const adminDoc = await getDoc(adminRef);
        
        if (!adminDoc.exists()) {
          router.push('/');
          return;
        }

        const adminData = adminDoc.data() as AdminData;
        
        if (!adminData.isAdmin || !adminData.templeId) {
          router.push('/');
          return;
        }

        // Load temple data
        const templeData = await getTemple(adminData.templeId);
        setTemple(templeData);
      } catch (error) {
        console.error('Error loading admin settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded dark:bg-gray-700" />
          <div className="h-[400px] bg-gray-200 rounded dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!temple) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          Failed to load temple settings
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Temple Settings</h1>
        <Link href={`/temples/${temple.id}/about`} target="_blank">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View About Page
          </Button>
        </Link>
      </div>

      <TempleAboutForm 
        temple={temple} 
        onSuccess={() => {
          // Reload temple data after successful update
          getTemple(temple.id).then(setTemple);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Temple Name</label>
              <p className="text-lg">{temple.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <p className="text-lg">{temple.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
