import Link from "next/link";
import { CONTACT_URL, PUBLIC_NAV } from "./constants";

export function PublicFooter() {
  return (
    <footer
      style={{
        marginTop: 56,
        fontSize: 12,
        color: "#666",
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <span>※ 現在ベータ版として公開中です。</span>

      {PUBLIC_NAV.map((item) => (
        <Link key={item.href} href={item.href} style={{ color: "#666", textDecoration: "underline" }}>
          {item.label}
        </Link>
      ))}

      <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#666", textDecoration: "underline" }}>
        お問い合わせ
      </a>
    </footer>
  );
}
