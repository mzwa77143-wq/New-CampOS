import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/ui/PwaRegister';

export const metadata: Metadata = {
  title: 'CampOS • Combat Sports Fight Camp Operating System',
  description: 'Pro Fight Camp Management, Real-Time Weight Cut Trajectory, Camp Readiness, and Mobile Check-Ins for MMA, Boxing, and Muay Thai.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CampOS',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-red-500/30 selection:text-red-200"
        suppressHydrationWarning
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
