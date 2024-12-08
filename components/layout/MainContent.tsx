'use client';

import { Suspense } from 'react';
import { Header } from './Header';
import { useNavigation } from '../../contexts/NavigationContext';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
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
  const { user } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAuthPage = isHomePage && !user;
  
  return (
    <div 
      className={`
        relative
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'md:ml-[280px]' : 'md:ml-16'}
        ${!isAuthPage ? 'min-h-screen' : ''}
      `}
    >
      <Header />
      
      <main className={`
        flex-1 
        ${isAuthPage ? '' : isHomePage ? 'min-h-[calc(100vh-3.5rem)]' : 'px-0 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6'}
      `}>
        {children}
      </main>
    </div>
  );
}
