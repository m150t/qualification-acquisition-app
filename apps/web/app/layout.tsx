import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://qua-log.com"),
  title: "QUALog｜資格学習を続けるためのアプリ",
  description: "学習計画が崩れても、戻れる。資格学習の継続を支えるアプリ。",
  openGraph: {
    title: "QUALog｜資格学習が1日で止まらないための学習ログ",
    description: "学習計画が崩れても、戻れる。資格学習の継続を支えるアプリ。",
    url: "https://qua-log.com/",
    type: "website",
    images: [
      {
        url: "https://qua-log.com/ogp.png",
        width: 1200,
        height: 630,
        alt: "QUALog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QUALog｜資格学習が1日で止まらないための学習ログ",
    description: "学習計画が崩れても、戻れる。資格学習の継続を支えるアプリ。",
    images: ["https://qua-log.com/ogp.png"],
  },
  other: {
    "google-adsense-account": "ca-pub-3961829109868432",
  },
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
