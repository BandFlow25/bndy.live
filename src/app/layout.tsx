//src\app\layout.tsx
import { Geist } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header'; // Import Header
import { Toaster } from "@/components/ui/toaster"; 

const geist = Geist({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div className="pt-16">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}