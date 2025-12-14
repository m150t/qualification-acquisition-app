// apps/web/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import AuthLayout from "./AuthLayout"; // さっき作るやつを読み込む

export const metadata: Metadata = {
  title: "StudyCoach",
  description: "資格学習をサポートするアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}
