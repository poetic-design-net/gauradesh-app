'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isAdmin } from '../../lib/db/admin';
import { NavigationLink } from './NavigationLink';
import { useTempleContext } from '../../contexts/TempleContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { isTempleAdmin } from '../../lib/db/admin';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    <TooltipProvider>
      <nav 
        style={{ willChange: 'width' }}
        className={`fixed left-0 top-0 h-full bg-background border-r flex flex-col py-3 overflow-hidden transition-[width] duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-16'
        } z-50`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center h-10 mb-4 px-5 hover:bg-accent/50 rounded-lg transition-colors group"
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <Menu className="h-6 w-6 text-black group-hover:text-foreground transition-colors" />
          )}
        </button>
        
        <div className="flex flex-col gap-1 px-3 flex-1">
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
          <div className="px-3 py-3 border-t border-border">
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
          
        <div className="px-3 mt-2 space-y-1">
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
    </TooltipProvider>
  );
}
