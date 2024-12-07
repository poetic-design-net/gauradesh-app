'use client';

import { Suspense } from 'react';
import { Header } from './Header';
import { useNavigation } from '@/contexts/NavigationContext';

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useNavigation();
  
  return (
    <div 
      style={{ 
        willChange: 'transform, width',
        transform: `translateX(${isExpanded ? '16rem' : '4rem'})`,
        width: `calc(100% - ${isExpanded ? '16rem' : '4rem'})`,
      }}
      className="transition-all duration-300 ease-in-out"
    >
      <div className="sticky top-0 z-40 bg-background">
        <Header />
      </div>
      <main className="flex-1 px-6 py-4">
        <Suspense fallback={<PageLoading />}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
}
