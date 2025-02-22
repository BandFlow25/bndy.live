import { Geist } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect } from 'react';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#242a38',
  viewportFit: 'cover'
}

export const metadata = {
  title: 'Bndy - Live Music Events',
  description: 'Discover live music events near you',
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const fixViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    fixViewportHeight();
    window.addEventListener('resize', fixViewportHeight);
    window.addEventListener('orientationchange', fixViewportHeight);
    
    return () => {
      window.removeEventListener('resize', fixViewportHeight);
      window.removeEventListener('orientationchange', fixViewportHeight);
    };
  }, []);

  return (
    <html lang="en" className={geist.className}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <ErrorBoundary>
          <Header />
          <main className="pt-[72px] flex flex-col min-h-screen safari-height">
            {children}
          </main>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}