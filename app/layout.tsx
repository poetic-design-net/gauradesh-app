import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { TempleProvider } from '@/contexts/TempleContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Navigation } from '@/components/layout/Navigation';
import { MainContent } from '@/components/layout/MainContent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Temple Services',
  description: 'Manage and participate in temple services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TempleProvider>
              <NavigationProvider>
                <div className="min-h-screen flex flex-col">
                  <Navigation />
                  <MainContent>{children}</MainContent>
                </div>
                <Toaster />
              </NavigationProvider>
            </TempleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
