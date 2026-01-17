import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 18,
          }}
        >
          <img
            src="/qualog-logo.svg"
            alt="QUALog ロゴ"
            style={{ width: 140, height: "auto" }}
          />
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em" }}>
            QUALog -試験対策の設計支援と伴走
          </h1>
        </div>

        <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.7, textAlign: "center" }}>
          資格学習の計画を立てて、毎日の進捗を記録。
          <br />
          「続く仕組み」を最短で作る学習ダッシュボード。
        </p>

        <p style={{ marginTop: 24, fontSize: 14, color: "#555", textAlign: "center" }}>
           🔧 最近のアップデート：
            計画変更機能を追加しました（2026/1）
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 28,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
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

        <div
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
          <Link href="/changelog" style={{ color: "#666", textDecoration: "underline" }}>
            更新履歴
          </Link>
        
          <Link href="/howto" style={{ color: "#666", textDecoration: "underline" }}>
            使い方
          </Link>
        
          <Link href="/terms" style={{ color: "#666", textDecoration: "underline" }}>
            利用規約
          </Link>
        
          <Link href="/privacy" style={{ color: "#666", textDecoration: "underline" }}>
            プライバシーポリシー
          </Link>
        
          <a
            href="https://forms.gle/GwcLWTGeKGwLwdkC9"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#666", textDecoration: "underline" }}
          >
            お問い合わせ
          </a>
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
