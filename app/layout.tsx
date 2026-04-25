import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WDEP — 欲求を原動力に',
  description: 'WDEPフレームワークで自分の本当の欲求を掘り起こし、人生を変える。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${notoSansJP.className} min-h-full antialiased`}>{children}</body>
    </html>
  );
}
