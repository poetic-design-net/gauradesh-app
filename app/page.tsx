'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useRouter } from 'next/navigation';
import { HeartHandshake, FileText, ArrowRight, Bell, Calendar, User, MessageSquare } from 'lucide-react';
import { getUserProfile, type UserProfile } from '../lib/db/users';
import { useTempleContext } from '../contexts/TempleContext';

export default function Home() {
  const { user, loading: authLoading, initialized } = useAuth();
  const { currentTemple } = useTempleContext();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          setProfileLoading(true);
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    }

    if (user && !profile) {
      loadProfile();
    }
  }, [user, profile]);

  // Don't render anything until auth is initialized
  if (!initialized) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-auto">
      {/* Animated Background with Parallax Effect */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-fixed bg-no-repeat transition-transform duration-1000 hover:scale-105"
        style={{ 
          backgroundImage: 'url("https://s3-ap-southeast-1.amazonaws.com/images.brajrasik.org/66407fbea13f2d00091c9a30.jpeg")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen py-8 md:py-12 px-4 flex items-center justify-center">
        {user ? (
          // Authenticated State
          <div className="text-center space-y-8 w-full max-w-4xl mx-auto">
            {/* Welcome Message */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="h-8 w-8 text-purple-400 animate-pulse">🕉️</div>
                <h1 className="text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Hare Krishna{profile?.displayName ? `, ${profile.displayName}` : ''}
                </h1>
              </div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Welcome to our spiritual sanctuary. Your presence enriches our temple community.
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <Card className="group bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg">
                <button
                  onClick={() => router.push('/services')}
                  className="p-6 text-left w-full h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <HeartHandshake className="h-8 w-8 text-purple-400" />
                    <ArrowRight className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Temple Services</h3>
                  <p className="text-gray-300 text-sm">Explore and register for various temple services</p>
                </button>
              </Card>

              <Card className="group bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-6 text-left w-full h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Bell className="h-8 w-8 text-pink-400" />
                    <ArrowRight className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Dashboard</h3>
                  <p className="text-gray-300 text-sm">View your activities and manage your profile</p>
                </button>
              </Card>

              {currentTemple && (
                <Card className="group bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg">
                  <button
                    onClick={() => router.push(`/temples/${currentTemple.id}/about`)}
                    className="p-6 text-left w-full h-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <FileText className="h-8 w-8 text-blue-400" />
                      <ArrowRight className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">About Temple</h3>
                    <p className="text-gray-300 text-sm">Learn more about our temple and its activities</p>
                  </button>
                </Card>
              )}

              {currentTemple && (
                <Card className="group bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg">
                  <button
                    onClick={() => router.push(`/temples/${currentTemple.id}/events`)}
                    className="p-6 text-left w-full h-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-8 w-8 text-green-400" />
                      <ArrowRight className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Events</h3>
                    <p className="text-gray-300 text-sm">View upcoming temple events and festivals</p>
                  </button>
                </Card>
              )}

              <Card className="group bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="p-6 text-left w-full h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <User className="h-8 w-8 text-yellow-400" />
                    <ArrowRight className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">My Account</h3>
                  <p className="text-gray-300 text-sm">Manage your personal information and preferences</p>
                </button>
              </Card>

              <Card className="group bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg">
                <div className="p-6 text-left w-full h-full">
                  <div className="flex items-center justify-between mb-4">
                    <MessageSquare className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Admin Message</h3>
                  <p className="text-gray-300 text-sm">Welcome to our temple portal! We're blessed to have you as part of our community. Join us for daily arati at 7 AM and 7 PM.</p>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          // Non-authenticated State
          <div className="w-full max-w-md">
            <div className="text-center space-y-6 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="h-10 w-10 text-purple-400 animate-pulse">🕉️</div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Sri Sri Radha Krishna Temple
                </h1>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join our spiritual community and participate in divine services
              </p>
            </div>
            
            {/* Enhanced Auth Form Container */}
            <div className="backdrop-blur-lg bg-white/10 rounded-lg border border-white/20 shadow-2xl">
              <AuthForm />
            </div>

            {/* Decorative Bottom Element */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                "Service to the Lord brings eternal happiness"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
