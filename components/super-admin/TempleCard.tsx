'use client';

import { Temple } from '@/lib/db/temples';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  MoreVertical, 
  Users, 
  Trash,
  Settings,
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface TempleCardProps {
  temple: Temple;
  onUpdate: () => void;
}

export function TempleCard({ temple, onUpdate }: TempleCardProps) {
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{temple.name}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            {temple.location}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/super-admin/temples/${temple.id}/admins`}>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Manage Admins
              </DropdownMenuItem>
            </Link>
            <Link href={`/super-admin/temples/${temple.id}/settings`}>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete Temple
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {temple.description && (
          <p className="text-sm text-muted-foreground">{temple.description}</p>
        )}
      </CardContent>
    </Card>
  );
}