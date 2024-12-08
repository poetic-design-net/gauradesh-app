import * as React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { QuickLinksPopover } from '@/components/quick-links/QuickLinksPopover';

export function HeaderActions() {
  return (
    <div className="flex items-center space-x-2">
      <QuickLinksPopover />
      <NotificationsPopover />
      <ThemeToggle />
    </div>
  );
}
