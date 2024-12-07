'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isAdmin } from '@/lib/db/admin';
import { NavigationLink } from './NavigationLink';
import { useTempleContext } from '@/contexts/TempleContext';
import { isTempleAdmin } from '@/lib/db/admin';

import {
  LayoutDashboard,
  Settings,
  LogOut,
  UserCircle,
  HeartHandshake,
  ShieldCheck,
  Flower2,
  Building,
  FileText,
  Calendar
} from 'lucide-react';

interface NavigationProps {
  onNavigate?: () => void;
}

export function Navigation({ onNavigate }: NavigationProps) {
  const { user, logout } = useAuth();
  const { currentTemple } = useTempleContext();
  const router = useRouter();
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserTempleAdmin, setIsUserTempleAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        const adminStatus = await isAdmin(user.uid);
        setIsUserAdmin(adminStatus);

        if (currentTemple) {
          const templeAdminStatus = await isTempleAdmin(user.uid, currentTemple.id);
          setIsUserTempleAdmin(templeAdminStatus);
        }
      }
    }

    checkAdminStatus();
  }, [user, currentTemple]);

  useEffect(() => {
    if (currentTemple) {
      console.log('Current Temple:', currentTemple);
    }
  }, [currentTemple]);

  const handleNavigation = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  if (!user) return null;

  return (
    <nav className="h-full bg-background px-4 py-6">
      <div className="flex items-center gap-2 mb-8">
        <Flower2 className="h-6 w-6" />
        <span className="font-bold">Temple Services</span>
      </div>
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            <NavigationLink
              icon={LayoutDashboard}
              label="Overview"
              onClick={() => handleNavigation('/dashboard')}
            />
            
            <NavigationLink
              icon={HeartHandshake}
              label="Services"
              onClick={() => handleNavigation('/services')}
            />

            {currentTemple && (
              <>
                <NavigationLink
                  icon={FileText}
                  label="About Temple"
                  onClick={() => handleNavigation(`/temples/${currentTemple.id}/about`)}
                  className="text-primary hover:text-primary/90"
                />
                <NavigationLink
                  icon={Calendar}
                  label="Events"
                  onClick={() => handleNavigation(`/temples/${currentTemple.id}/events`)}
                  className="text-primary hover:text-primary/90"
                />
              </>
            )}
            
            <NavigationLink
              icon={UserCircle}
              label="Profile"
              onClick={() => handleNavigation('/dashboard/profile')}
            />
            
            <NavigationLink
              icon={Settings}
              label="Settings"
              onClick={() => handleNavigation('/dashboard/settings')}
            />
            
            {(isUserAdmin || isUserTempleAdmin) && (
              <>
                <NavigationLink
                  icon={ShieldCheck}
                  label="Admin Panel"
                  onClick={() => handleNavigation('/admin')}
                  className="text-blue-600"
                />
                {currentTemple && (
                  <NavigationLink
                    icon={Building}
                    label="Temple Settings"
                    onClick={() => handleNavigation('/admin/settings')}
                    className="text-blue-600"
                  />
                )}
              </>
            )}
          </div>
        </div>
        <div className="px-3 py-2">
          <NavigationLink
            icon={LogOut}
            label="Sign Out"
            onClick={logout}
            variant="destructive"
          />
        </div>
      </div>
    </nav>
  );
}
