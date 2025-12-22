import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em" }}>
          QUALog -試験対策の設計支援と伴走
        </h1>

        <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.7 }}>
          資格学習の計画を立てて、毎日の進捗を記録。
          <br />
          「続く仕組み」を最短で作る学習ダッシュボード。
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <Link
            href="/app"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            無料で始める
          </Link>

          <Link
            href="/app"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #aaa",
              background: "#fff",
              color: "#111",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ログイン
          </Link>
        </div>

        <div style={{ marginTop: 48, display: "grid", gap: 16 }}>
          <Feature title="計画" desc="資格・期限から、学習の全体像を作る。" />
          <Feature title="実行" desc="今日やることを迷わない。" />
          <Feature title="記録" desc="進捗が見えるから、続く。" />
        </div>

        <div style={{ marginTop: 56, fontSize: 12, color: "#666" }}>
          ※ 現在、試験的に公開しています（ベータ版）。至らない点もありますが、順次改善していきます。
        </div>
      </div>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ padding: 18, border: "1px solid #eee", borderRadius: 14 }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, color: "#444", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}
