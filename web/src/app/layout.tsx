import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Eco-Presents',
  description: 'Cadeaux éco-responsables',
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png'
  }
};


import { ConsentProvider, CookieBanner } from '@/components/CookieConsent';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-neutral-50 text-neutral-900 flex flex-col`}>
        <ConsentProvider>
          <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm">
            <Nav />
          </header>
          <main className="flex-1 w-full">
            {children}
          </main>
          <Footer />
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
