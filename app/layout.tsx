import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Click - No-Code App Builder',
  description:
    'Clickはノーコードでアプリを作れるプラットフォームです。ドラッグ&ドロップで誰でも簡単にアプリを構築できます。',
  keywords: 'ノーコード, アプリ開発, ドラッグアンドドロップ, no-code, app builder',
  openGraph: {
    title: 'Click - No-Code App Builder',
    description: '誰でもノーコードでアプリを作れる',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
