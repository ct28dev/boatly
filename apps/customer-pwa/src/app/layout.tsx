import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import BottomNav from '@/components/navigation/BottomNav';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BOATLY - เช่าเรือท่องเที่ยวทั่วไทย',
  description:
    'แพลตฟอร์มจองเรือท่องเที่ยวอันดับ 1 ของไทย ครอบคลุมทุกเส้นทาง ทุกจังหวัด สะดวก ปลอดภัย ราคาดี',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BOATLY',
  },
  openGraph: {
    title: 'BOATLY - เช่าเรือท่องเที่ยวทั่วไทย',
    description: 'จองเรือท่องเที่ยวง่ายๆ ครอบคลุมทุกเส้นทางทั่วไทย',
    type: 'website',
    locale: 'th_TH',
  },
};

export const viewport: Viewport = {
  themeColor: '#0077b6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <Providers>
          <main className="relative z-0 mx-auto max-w-lg min-h-screen bg-white shadow-sm pb-28">
            {children}
          </main>
          {/* อยู่นอก main เพื่อไม่ถูก overflow/stacking context ตัด — เมนูล่างต้องลอยเหนือทุกหน้า */}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
