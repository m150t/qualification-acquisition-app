import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QUALog - 資格学習ログ",
    short_name: "QUALog",
    description: "資格学習の目標・進捗・振り返りを支援する学習ログアプリ",
    start_url: "/home",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    lang: "ja",
    icons: [
      { src: "/qualog-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/qualog-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
