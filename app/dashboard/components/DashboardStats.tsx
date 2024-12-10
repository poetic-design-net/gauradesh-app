import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, HeartHandshake, Newspaper } from 'lucide-react';
import { ServiceRegistration } from '@/lib/db/services';
import { UserProfile } from '@/lib/db/users';

interface EnrichedRegistration extends ServiceRegistration {
  service?: any;
}

interface DashboardStatsProps {
  profile: UserProfile;
  registrations: EnrichedRegistration[];
  temple: any;
}

export function DashboardStats({ profile, registrations, temple }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="group transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
          <User className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 transition-transform group-hover:scale-105">
              <AvatarImage src={profile?.photoURL ?? undefined} />
              <AvatarFallback>{profile?.displayName?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-2xl font-bold">{profile?.displayName ?? 'Anonymous'}</div>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since: {profile?.createdAt && 'toDate' in profile.createdAt ? 
                  profile.createdAt.toDate().toLocaleDateString() : 
                  'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="group transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Services</CardTitle>
          <HeartHandshake className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {registrations.filter(r => r.status === 'approved').length}
          </div>
          <p className="text-xs text-muted-foreground">Approved registrations</p>
        </CardContent>
      </Card>

      <Card className="group transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temple News</CardTitle>
          <Newspaper className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          {temple?.news ? (
            <div>
              <h3 className="text-lg font-semibold">{temple.news.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {temple.news.content}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Updated: {temple.news.updatedAt.toDate().toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No current news from your temple
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
