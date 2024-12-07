'use client';

import { Temple, getTempleMembers, TempleMember, DayOfWeek } from '@/lib/db/temples';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { getUserProfile, UserProfile } from '@/lib/db/users';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Crown, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TempleAboutPageProps {
  temple: Temple;
}

interface EnrichedMember extends TempleMember {
  profile: UserProfile;
}

export function TempleAboutPage({ temple }: TempleAboutPageProps) {
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentDayPrograms = () => {
    if (!temple.dailyPrograms) return [];
    
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[new Date().getDay()];
    return temple.dailyPrograms[currentDay];
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  useEffect(() => {
    async function loadMembers() {
      try {
        const templeMembers = await getTempleMembers(temple.id);
        const enrichedMembers = await Promise.all(
          templeMembers.map(async (member) => {
            const profile = await getUserProfile(member.userId);
            return { ...member, profile };
          })
        );

        const sortedMembers = enrichedMembers.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return (a.profile.displayName || '').localeCompare(b.profile.displayName || '');
        });

        setMembers(sortedMembers);
      } catch (error) {
        console.error('Error loading temple members:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [temple.id]);

  const currentDayPrograms = getCurrentDayPrograms();
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen relative">
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-secondary/5 dark:from-purple-500/10 dark:to-pink-500/10" />
      
      {/* Content */}
      <div className="relative container mx-auto p-6 space-y-8">
        {/* Hero Image */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
          {temple.aboutImageUrl ? (
            <Image
              src={temple.aboutImageUrl}
              alt={temple.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-purple-500/20 dark:to-pink-500/20 flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/0" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-4xl font-bold text-foreground">{temple.name}</h1>
          </div>
        </div>

        {/* Description */}
        <Card className="bg-card/50 dark:bg-white/10 backdrop-blur-lg border-border dark:border-white/20">
          <CardContent className="pt-6">
            <p className="text-lg text-foreground dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {temple.description || 'No description available.'}
            </p>
          </CardContent>
        </Card>

        {/* Daily Program Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-foreground dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r from-purple-400 to-pink-400">
              Today's Temple Program
            </h2>
          </div>

          <Card className="bg-card/50 dark:bg-white/10 backdrop-blur-lg border-border dark:border-white/20">
            <CardContent className="pt-6">
              <p className="text-lg font-medium mb-4 text-foreground dark:text-gray-200">
                {currentDay}
              </p>
              
              {currentDayPrograms.length > 0 ? (
                <div className="space-y-4">
                  {currentDayPrograms.map((program, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 dark:bg-white/5 backdrop-blur-sm"
                    >
                      <span className="font-medium text-foreground dark:text-gray-200">
                        {formatTime(program.time)}
                      </span>
                      <span className="text-muted-foreground">
                        {program.activity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No programs scheduled for today
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-foreground dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r from-purple-400 to-pink-400">
              Temple Members
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card/50 dark:bg-white/10 backdrop-blur-lg border-border dark:border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Card 
                  key={member.id} 
                  className="group bg-card/50 hover:bg-card/80 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-lg border-border dark:border-white/20 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 ring-2 ring-primary/30 dark:ring-purple-400/30 transition-transform duration-300 group-hover:scale-105">
                        <AvatarImage src={member.profile.photoURL || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-purple-500/20 dark:to-pink-500/20">
                          {member.profile.displayName?.[0] || member.profile.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground dark:text-white text-lg">
                          {member.profile.displayName || 'Anonymous'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {member.role === 'admin' ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-purple-500/20 dark:text-purple-200 border-primary/30 dark:border-purple-400/30">
                              <Crown className="h-3.5 w-3.5 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground dark:bg-blue-500/20 dark:text-blue-200 border-secondary/30 dark:border-blue-400/30">
                              <User className="h-3.5 w-3.5 mr-1" />
                              Member
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
