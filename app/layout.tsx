import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../components/Providers';
import { Navigation } from '../components/layout/Navigation';
import { MainContent } from '../components/layout/MainContent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Temple Services',
  description: 'Manage and participate in temple services',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Temple Services',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen">
            <Navigation />
            <MainContent>{children}</MainContent>
          </div>
        </Providers>
      </body>
    </html>
  );
}
