import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/lib/db/users';

interface DashboardHeroProps {
  profile: UserProfile;
}

export function DashboardHero({ profile }: DashboardHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-8 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Welcome back, {profile?.displayName ?? 'Devotee'}</h1>
          <p className="text-lg opacity-90">Your spiritual journey continues here</p>
        </div>
        <Avatar className="h-20 w-20 ring-4 ring-white/50">
          <AvatarImage src={profile?.photoURL ?? undefined} />
          <AvatarFallback>{profile?.displayName?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
