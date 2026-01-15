import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "QUALog",
  description: "資格学習の計画と進捗をサポート",
};

const GA_ID = "G-REKGLY7BW6";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
