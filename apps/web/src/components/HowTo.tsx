import Link from "next/link";

const CONTACT_URL = "https://forms.gle/GwcLWTGeKGwLwdkC9";

export default function HowTo() {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Header />

        <h1 style={{ marginTop: 28, fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em" }}>
          使い方（3分でわかる）
        </h1>

        <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.8, color: "#333" }}>
          QUALogは「計画 → 実行 → 記録」を回すための学習ダッシュボードです。
          <br />
          迷う時間を減らして、やることを固定化します。
        </p>

        <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
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
              fontWeight: 800,
            }}
          >
            アプリを開く
          </Link>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #aaa",
              background: "#fff",
              color: "#111",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            トップに戻る
          </Link>
        </div>

        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>操作説明動画</h2>
          <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.8, color: "#444" }}>
            3分でざっと流れを掴める動画です。先に見ておくと設定がスムーズです。
          </p>
          <div
            style={{
              marginTop: 16,
              position: "relative",
              width: "100%",
              paddingTop: "56.25%",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #eee",
              background: "#000",
            }}
          >
            <iframe
              title="QUALog 操作説明動画"
              src="https://www.youtube.com/embed/3u2v8XkViHw"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        <section style={{ marginTop: 40, display: "grid", gap: 16 }}>
          <Card
            step="STEP 1"
            title="試験を選んで、学習の枠を決める"
            bullets={[
              "対象資格と試験日を決めます。",
              "ここが曖昧だと計画が全部ブレるので、最初に固定してください。",
            ]}
          />
          <Card
            step="STEP 2"
            title="学習計画を作る（= 迷いを消す）"
            bullets={[
              "AIが日ごとの計画作成をサポートしてくれます。",
              "毎日「今日やること」が出る状態を作ります。",
              "計画は完璧じゃなくてOK。回しながら直す前提です。",
            ]}
          />
          <Card
            step="STEP 3"
            title="日報を書く（= 継続の仕組み）"
            bullets={[
              "やったこと・学習時間・詰まった点を短く記録します。",
              "AIフィードバックで「次に何を直すか」を言語化します。",
              "書けなかった日はゼロでOK。翌日から再開すれば勝ちです。",
            ]}
          />
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>よくある質問</h2>

          <Faq
            q="AIフィードバックが出ません / エラーになります"
            a={
              <>
                まずは再読み込みを試してください。それでも解決しない場合は、エラー内容（スクショ or 表示メッセージ）を添えて{" "}
                <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                  お問い合わせフォーム
                </a>{" "}
                から連絡してください。
              </>
            }
          />

          <Faq
            q="退会（アカウント削除）したい"
            a={
              <>
                アプリ内の退会機能から手続きできます（削除後は復元できません）。操作に不安がある場合は{" "}
                <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                  お問い合わせ
                </a>{" "}
                へ。
              </>
            }
          />
        </section>

        <Footer />
      </div>
    </main>
  );
}

function Header() {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <Link href="/" style={{ textDecoration: "none", color: "#111", fontWeight: 800 }}>
        QUALog
      </Link>

      <nav style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
        <Link href="/howto" style={{ color: "#111", textDecoration: "underline" }}>
          使い方
        </Link>
        <Link href="/terms" style={{ color: "#111", textDecoration: "underline" }}>
          利用規約
        </Link>
        <Link href="/privacy" style={{ color: "#111", textDecoration: "underline" }}>
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
  );
}

function Footer() {
  return (
    <footer style={{ marginTop: 56, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 12, color: "#666" }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span>※ 現在ベータ版として公開中です。</span>
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
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#666", textDecoration: "underline" }}
        >
          お問い合わせ
        </a>
      </div>
    </footer>
  );
}

function Card({ step, title, bullets }: { step: string; title: string; bullets: string[] }) {
  return (
    <div style={{ padding: 18, border: "1px solid #eee", borderRadius: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#666" }}>{step}</div>
      <div style={{ marginTop: 8, fontWeight: 900, fontSize: 18 }}>{title}</div>
      <ul style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.8, color: "#333" }}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
      <div style={{ fontWeight: 900 }}>{q}</div>
      <div style={{ marginTop: 8, color: "#444", lineHeight: 1.8 }}>{a}</div>
    </div>
  );
}

