import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "영어 대화 학습 | 초등 영어",
  description: "초등학생을 위한 영어 대화 연습 코너",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
