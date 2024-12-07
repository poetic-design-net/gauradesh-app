'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  UserCircle, 
  Menu,
  X,
  Home,
  HeartHandshake,
  ShieldCheck,
  Flower2,
  FileText
} from 'lucide-react';
import { isAdmin, isSuperAdmin } from '@/lib/db/admin';
import { useEffect } from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTempleContext } from '@/contexts/TempleContext';

export function Header() {
  const { user, logout } = useAuth();
  const { currentTemple } = useTempleContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserSuperAdmin, setIsUserSuperAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        const [adminStatus, superAdminStatus] = await Promise.all([
          isAdmin(user.uid),
          isSuperAdmin(user.uid)
        ]);
        setIsUserAdmin(adminStatus);
        setIsUserSuperAdmin(superAdminStatus);
      }
    }

    checkAdminStatus();
  }, [user]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const menuItems = user ? [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/services', icon: HeartHandshake, label: 'Services' },
    ...(currentTemple ? [{
      href: `/temples/${currentTemple.id}/about`,
      icon: FileText,
      label: 'About Temple'
    }] : []),
    { href: '/dashboard/profile', icon: UserCircle, label: 'Profile' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ...(isUserAdmin ? [{ href: '/admin', icon: ShieldCheck, label: 'Admin', className: 'text-blue-600' }] : []),
    ...(isUserSuperAdmin ? [{ href: '/super-admin', icon: ShieldCheck, label: 'Super Admin', className: 'text-purple-600' }] : []),
  ] : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto px-4 h-14">
        <div className="flex h-full items-center justify-between">
          {/* Left side - Logo and Title */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 font-bold hover:opacity-90 transition-opacity"
            onClick={closeMenu}
          >
            <Flower2 className="h-6 w-6" />
            <span className="text-lg">Temple Services</span>
          </Link>

          {/* Right side - Theme Toggle and Menu */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10">
              <ThemeToggle />
            </div>
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
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={cn(
        "fixed inset-0 top-14 z-50 bg-background transition-transform duration-200 ease-in-out",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="container py-4 space-y-2">
          {user ? (
            <>
              {menuItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={closeMenu}
                >
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-start",
                      pathname === item.href && "bg-accent",
                      item.className
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth" onClick={closeMenu}>
              <Button className="w-full">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>

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
