import Link from "next/link";
import { CONTACT_URL, PUBLIC_NAV } from "./constants";

export function PublicHeader() {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <Link href="/" style={{ textDecoration: "none", color: "#111", fontWeight: 800 }}>
        QUALog
      </Link>

      <nav style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
        {PUBLIC_NAV.map((item) => (
          <Link key={item.href} href={item.href} style={{ color: "#111", textDecoration: "underline" }}>
            {item.label}
          </Link>
        ))}
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "underline" }}>
          お問い合わせ
        </a>
      </nav>
    </header>
  );
}
