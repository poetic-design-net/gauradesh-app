'use client';

import { Suspense } from 'react';
import { Header } from './Header';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <div 
      className={`
        relative
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'md:ml-[280px]' : 'md:ml-16'}
        ${isHomePage ? 'h-screen overflow-hidden' : ''}
      `}
    >
      <Header />
      
      <main className={`
        flex-1 
        ${isHomePage ? 'h-[calc(100vh-3.5rem)]' : 'px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6'}
      `}>
        <Suspense fallback={<PageLoading />}>
          <div className={`w-full ${isHomePage ? '' : 'max-w-[95%] md:max-w-7xl mx-auto'}`}>
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
}
