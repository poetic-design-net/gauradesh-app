'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ServiceLoading() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-4 pt-8 px-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-96 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-[200px] bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 p-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-white/10 rounded mr-2" />
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-white/10 rounded mr-2" />
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-white/10 rounded mr-2" />
                  <div className="h-4 w-2/3 bg-white/10 rounded" />
                </div>
                <div className="h-20 w-full bg-white/10 rounded" />
                <div className="h-10 w-full bg-white/10 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
