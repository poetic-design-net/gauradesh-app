'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { TempleProvider } from '../contexts/TempleContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { TooltipProvider } from './ui/tooltip';
import { Toaster } from './ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TempleProvider>
            <NavigationProvider>
              {children}
              <Toaster />
            </NavigationProvider>
          </TempleProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}
