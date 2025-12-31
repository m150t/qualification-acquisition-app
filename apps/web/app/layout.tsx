import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "QUALog",
  description: "資格学習の計画と進捗をサポート",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* AdSense: 審査通すまで一旦グローバルに入れる */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3961829109868432"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
