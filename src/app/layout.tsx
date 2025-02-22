import { Geist } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
}

export const metadata = {
  title: 'Bndy - Live Music Events',
  description: 'Discover live music events near you',
  manifest: '/site.webmanifest', // Using the standard filename
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, minimum-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

      </head>
      <body>
        <ErrorBoundary>
          <Header />
          <main className="pt-[72px] flex flex-col min-h-screen">


            {children}
          </main>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}