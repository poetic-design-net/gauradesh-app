'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isAdmin } from '@/lib/db/admin';
import { NavigationLink } from './NavigationLink';
import { useTempleContext } from '@/contexts/TempleContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { isTempleAdmin } from '@/lib/db/admin';
import { cn } from '@/lib/utils';

import {
  LayoutDashboard,
  Settings,
  LogOut,
  UserCircle,
  HeartHandshake,
  ShieldCheck,
  Building,
  Home,
  Calendar,
  Loader2,
  Menu,
  X,
  Instagram,
  Facebook,
  Globe,
  Phone,
  MapPin
} from 'lucide-react';

interface NavigationProps {
  onNavigate?: () => void;
}

export function Navigation({ onNavigate }: NavigationProps) {
  const { user, logout } = useAuth();
  const { currentTemple, loading: templeLoading } = useTempleContext();
  const { isExpanded, setIsExpanded } = useNavigation();
  const router = useRouter();
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserTempleAdmin, setIsUserTempleAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        setAdminLoading(true);
        try {
          const adminStatus = await isAdmin(user.uid);
          setIsUserAdmin(adminStatus);

          if (currentTemple) {
            const templeAdminStatus = await isTempleAdmin(user.uid, currentTemple.id);
            setIsUserTempleAdmin(templeAdminStatus);
          }
        } finally {
          setAdminLoading(false);
        }
      }
    }

    checkAdminStatus();
  }, [user, currentTemple]);

  const handleNavigation = (path: string) => {
    router.push(path);
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
    onNavigate?.();
  };

  const handleSocialClick = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!user) return null;

  const socialMedia = currentTemple?.socialMedia || {};
  const hasSocialLinks = Object.values(socialMedia).some(value => value);

  return (
    <>
      {/* Overlay for mobile */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-[998] md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <nav 
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r flex flex-col py-3 overflow-hidden transition-all duration-300 ease-in-out z-[999]",
          // Mobile styles
          "w-[280px]",
          isExpanded ? "translate-x-0" : "-translate-x-full",
          // Desktop styles
          "md:translate-x-0",
          isExpanded ? "md:w-[280px]" : "md:w-16"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center h-10 mb-4 px-4 hover:bg-accent/50 rounded-lg transition-colors group md:hidden"
        >
          <X className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Desktop expand button */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden md:flex w-full items-center h-10 px-2 hover:bg-accent rounded-lg transition-all duration-200 group"
            title={isExpanded ? "Collapse Menu" : "Expand Menu"}
          >
            <div className="relative w-6 h-6">
              <Menu 
                className={`absolute inset-0 h-6 w-6 text-muted-foreground group-hover:text-foreground transition-all duration-300 ${
                  isExpanded ? 'opacity-0 scale-90 rotate-90' : 'opacity-100 scale-100 rotate-0'
                }`} 
              />
              <X 
                className={`absolute inset-0 h-6 w-6 text-muted-foreground group-hover:text-foreground transition-all duration-300 ${
                  isExpanded ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-90'
                }`} 
              />
            </div>
            <span className="sr-only">{isExpanded ? "Collapse Menu" : "Expand Menu"}</span>
          </button>
        </div>
        
        <div className="flex flex-col gap-1 px-2 flex-1">
          <NavigationLink
            icon={LayoutDashboard}
            label="Overview"
            onClick={() => handleNavigation('/dashboard')}
            showLabel={isExpanded}
          />
          
          <NavigationLink
            icon={HeartHandshake}
            label="Services"
            onClick={() => handleNavigation('/services')}
            showLabel={isExpanded}
          />

          {templeLoading ? (
            <div className="flex items-center justify-center h-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : currentTemple && (
            <>
              <NavigationLink
                icon={Home}
                label="About Temple"
                onClick={() => handleNavigation(`/temples/${currentTemple.id}/about`)}
                className="text-primary hover:text-primary/90"
                showLabel={isExpanded}
              />
              <NavigationLink
                icon={Calendar}
                label="Events"
                onClick={() => handleNavigation(`/temples/${currentTemple.id}/events`)}
                className="text-primary hover:text-primary/90"
                showLabel={isExpanded}
              />
            </>
          )}
          
          <NavigationLink
            icon={UserCircle}
            label="Profile"
            onClick={() => handleNavigation('/dashboard/profile')}
            showLabel={isExpanded}
          />
        
          {adminLoading ? (
            <div className="flex items-center justify-center h-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (isUserAdmin || isUserTempleAdmin) && (
            <>
              <NavigationLink
                icon={ShieldCheck}
                label="Admin Panel"
                onClick={() => handleNavigation('/admin')}
                className="text-blue-600"
                showLabel={isExpanded}
              />
              {currentTemple && (
                <NavigationLink
                  icon={Building}
                  label="Temple Settings"
                  onClick={() => handleNavigation('/admin/settings')}
                  className="text-blue-600"
                  showLabel={isExpanded}
                />
              )}
            </>
          )}
        </div>

        {currentTemple && hasSocialLinks && (
          <div className="px-2 py-3 border-t border-border">
            <div className={`flex items-center ${isExpanded ? 'justify-around' : 'justify-center'} flex-wrap gap-2`}>
              {socialMedia.instagram && (
                <button 
                  onClick={() => handleSocialClick(socialMedia.instagram)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <Instagram className="h-5 w-5 text-pink-600" />
                </button>
              )}
              {socialMedia.facebook && (
                <button 
                  onClick={() => handleSocialClick(socialMedia.facebook)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <Facebook className="h-5 w-5 text-blue-600" />
                </button>
              )}
              {socialMedia.website && (
                <button 
                  onClick={() => handleSocialClick(socialMedia.website)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <Globe className="h-5 w-5 text-green-600" />
                </button>
              )}
              {socialMedia.telefon && (
                <button 
                  onClick={() => handleSocialClick(`tel:${socialMedia.telefon}`)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <Phone className="h-5 w-5 text-yellow-600" />
                </button>
              )}
              {socialMedia.gmaps && (
                <button 
                  onClick={() => handleSocialClick(socialMedia.gmaps)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <MapPin className="h-5 w-5 text-red-600" />
                </button>
              )}
            </div>
          </div>
        )}
          
        <div className="px-2 mt-2 space-y-1">
          <NavigationLink
            icon={Settings}
            label="Settings"
            onClick={() => handleNavigation('/dashboard/settings')}
            showLabel={isExpanded}
          />
          <NavigationLink
            icon={LogOut}
            label="Sign Out"
            onClick={logout}
            variant="destructive"
            showLabel={isExpanded}
          />
        </div>
      </nav>
    </>
  );
}
