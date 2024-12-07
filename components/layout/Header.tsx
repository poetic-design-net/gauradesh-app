'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTempleContext } from "@/contexts/TempleContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flower2, Menu, X } from 'lucide-react';
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Header() {
  const { user, logout } = useAuth();
  const { currentTemple } = useTempleContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 font-bold hover:opacity-90 transition-opacity"
            onClick={closeMenu}
          >
            {currentTemple?.logoUrl ? (
              <div className="relative h-12 w-12">
                <Image
                  src={currentTemple.logoUrl}
                  alt={currentTemple.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <Flower2 className="h-6 w-6" />
            )}
            <span className="text-lg">{currentTemple && (
          <div className="py-1">
            {currentTemple.name}
          </div>
        )}</span>
          </Link>

          {/* Right side - Theme Toggle and Menu */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10">
              <ThemeToggle />
            </div>
            {!user && (
              <button
                className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-accent transition-colors"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Only for non-authenticated users */}
      {!user && (
        <nav className={cn(
          "fixed inset-0 top-14 z-50 bg-background transition-transform duration-200 ease-in-out",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="container py-4">
            <Link href="/auth" onClick={closeMenu}>
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </nav>
      )}

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 top-14 z-40 bg-black/50"
          onClick={closeMenu}
        />
      )}
    </header>
  );
}
