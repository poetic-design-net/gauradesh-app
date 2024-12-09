'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTempleContext } from '@/contexts/TempleContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Flower2, X, Menu } from 'lucide-react';
import { HeaderActions } from '@/components/layout/HeaderActions';

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      <div className="container mx-auto">
        <div className="h-14 flex items-center">
          <div className="flex items-center space-x-2">
            <div className="relative h-12 w-12 bg-accent/10 rounded-full animate-pulse" />
            <div className="h-6 w-48 bg-accent/10 rounded animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function Header() {
  const { user } = useAuth();
  const { currentTemple, loading } = useTempleContext();
  const { isExpanded, setIsExpanded } = useNavigation();

  if (loading) {
    return <HeaderSkeleton />;
  }

  // Don't render header if user is not logged in
  if (!user) {
    return null;
  }

  // Pre-render the temple name for faster LCP
  const templeName = currentTemple?.name || '🕉️ ISKCON Connect';

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      <div className="container mx-auto">
        <div className="h-14 flex items-center">
          {/* Menu Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="md:hidden px-4 h-14 hover:bg-accent/50 flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Left side - Logo and Title */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 font-bold hover:opacity-90 transition-opacity"
          >
            <div className="relative h-12 w-12 flex items-center justify-center">
              {currentTemple?.logoUrl ? (
                <Image
                  src={currentTemple.logoUrl}
                  alt={templeName}
                  fill
                  priority
                  sizes="48px"
                  className="object-contain"
                />
              ) : (
                <Flower2 className="h-6 w-6" />
              )}
            </div>
            <h1 className="text-lg hidden sm:inline-block font-bold">
              {templeName}
            </h1>
          </Link>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 ml-auto">
            <HeaderActions />
          </div>
        </div>
      </div>
    </header>
  );
}
