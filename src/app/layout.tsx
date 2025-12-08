import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/common';

export const metadata: Metadata = {
  title: '모아드림 - 협업 반편성 프로그램',
  description: '동학년 교사들이 함께하는 스마트한 학급 편성 솔루션',
  keywords: ['반편성', '학급편성', '교사', '협업', '학교'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/logo.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/webfontworld/gmarket/GmarketSans.css"
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
