import Link from "next/link";

const CONTACT_URL = "https://forms.gle/GwcLWTGeKGwLwdkC9";

export default function ChangeLog() {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header（規約ページと同じ） */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{ textDecoration: "none", color: "#111", fontWeight: 800 }}
          >
            QUALog
          </Link>

          <nav
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              fontSize: 14,
            }}
          >
            <Link
              href="/howto"
              style={{ color: "#111", textDecoration: "underline" }}
            >
              使い方
            </Link>
            <Link
              href="/terms"
              style={{ color: "#111", textDecoration: "underline" }}
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              style={{ color: "#111", textDecoration: "underline" }}
            >
              プライバシーポリシー
            </Link>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#111", textDecoration: "underline" }}
            >
              お問い合わせ
            </a>
          </nav>
        </header>

        {/* Title */}
        <h1
          style={{
            marginTop: 28,
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          更新履歴（ベータ版）
        </h1>

        <p style={{ marginTop: 12, fontSize: 15, color: "#555" }}>
          QUALog はベータ版として公開中です。小さく改善を重ねながら、学習を継続しやすい体験を目指しています。
        </p>

        {/* Logs */}
        <div style={{ marginTop: 28, color: "#333", lineHeight: 1.9, fontSize: 15 }}>
          <Section title="2026-01">
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>学習カレンダーに「日別タスク表示」を追加</li>
              <li>週表示・月表示の両方からタスク詳細を確認可能に</li>
              <li>日報ページに「今日のタスク」を表示</li>
              <li>UIの視認性を改善</li>
            </ul>
          </Section>

          <Section title="2025-12">
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>QUALog ベータ版を公開</li>
              <li>学習計画の作成・保存機能を追加</li>
              <li>日報記録・AIフィードバック機能を追加</li>
            </ul>
          </Section>

          <div style={{ marginTop: 28, fontSize: 12, color: "#666" }}>
            最終更新日：2026-01-01
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 22 }}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </section>
  );
}
