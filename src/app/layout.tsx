import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@fontsource-variable/newsreader';

import { GrainOverlay } from '@/components/common/GrainOverlay';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Stock Market Simulator',
  description:
    'Practice investing safely with virtual CAD. Educational only — not financial advice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        <GrainOverlay />
        {children}
      </body>
    </html>
  );
}
