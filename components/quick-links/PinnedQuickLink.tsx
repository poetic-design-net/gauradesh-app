import * as React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { QuickLink } from '@/lib/db/notifications/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';

export function PinnedQuickLink() {
  const { user } = useAuth();
  const [pinnedLink, setPinnedLink] = React.useState<QuickLink | null>(null);

  React.useEffect(() => {
    if (!user?.uid) {
      setPinnedLink(null);
      return;
    }

    const q = query(
      collection(db, 'quickLinks'),
      where('userId', '==', user.uid),
      where('pinned', '==', true)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setPinnedLink({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          } as QuickLink);
        } else {
          setPinnedLink(null);
        }
      },
      (error) => {
        console.error('Error fetching pinned quick link:', error);
        setPinnedLink(null);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (!pinnedLink) {
    return null;
  }

  const LinkWrapper = ({ children }: { children: React.ReactNode }) => {
    if (pinnedLink.internal) {
      return (
        <Link href={pinnedLink.url} className="flex items-center">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={pinnedLink.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center"
      >
        {children}
      </a>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <LinkWrapper>
            <Button variant="ghost" size="icon">
              <Star className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </LinkWrapper>
        </TooltipTrigger>
        <TooltipContent>
          <p>{pinnedLink.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
