import type { Metadata, Viewport } from "next";
import "./globals.css";
import AudioUnlock from "@/components/AudioUnlock";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "영어 대화 학습 | 초등 영어",
  description: "초등학생을 위한 영어 대화 연습 코너",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        <AudioUnlock />
        {children}
      </body>
    </html>
  );
}
