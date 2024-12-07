'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Temple, getAllTemples, createTemple } from '@/lib/db/temples';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TempleForm } from '@/components/super-admin/TempleForm';
import { TempleCard } from '@/components/super-admin/TempleCard';
import { Plus } from 'lucide-react';
import { isSuperAdmin } from '@/lib/db/admin';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTempleForm, setShowTempleForm] = useState(false);
  const { toast } = useToast();

  async function loadTemples() {
    try {
      const allTemples = await getAllTemples();
      setTemples(allTemples);
    } catch (error) {
      console.error('Error loading temples:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load temples',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemples();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Temple Management</h1>
        <Button onClick={() => setShowTempleForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Temple
        </Button>
      </div>

      {showTempleForm && (
        <TempleForm
          onClose={() => setShowTempleForm(false)}
          onSuccess={() => {
            setShowTempleForm(false);
            loadTemples();
          }}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {temples.map((temple) => (
          <TempleCard
            key={temple.id}
            temple={temple}
            onUpdate={loadTemples}
          />
        ))}
      </div>
    </div>
  );
}
