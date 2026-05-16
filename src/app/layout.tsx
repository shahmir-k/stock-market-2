import type { Metadata } from 'next';

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-app-bg text-text-primary">{children}</body>
    </html>
  );
}
