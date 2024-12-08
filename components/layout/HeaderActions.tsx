import * as React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { QuickLinksPopover } from '@/components/quick-links/QuickLinksPopover';
import { PinnedQuickLink } from '@/components/quick-links/PinnedQuickLink';

export function HeaderActions() {
  return (
    <div className="flex items-center space-x-2">
      <PinnedQuickLink />
      <QuickLinksPopover />
      <NotificationsPopover />
      <ThemeToggle />
    </div>
  );
}
