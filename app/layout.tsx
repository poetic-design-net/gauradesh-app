import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { TempleProvider } from '@/contexts/TempleContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Temple Services',
  description: 'Manage and participate in temple services',
};

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

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
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<PageLoading />}>
                    <div className="page-transition-enter page-transition-enter-active">
                      {children}
                    </div>
                  </Suspense>
                </main>
              </div>
              <Toaster />
            </TempleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
