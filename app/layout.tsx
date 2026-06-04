import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Click — ノーコードアプリビルダー',
  description: 'ノーコードでWebアプリ・モバイルアプリを作成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
