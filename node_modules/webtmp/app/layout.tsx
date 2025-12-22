import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StudyCoach",
  description: "資格学習の計画と進捗をサポート",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
