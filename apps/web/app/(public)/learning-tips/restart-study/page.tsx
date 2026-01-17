import Link from "next/link";

const CONTACT_URL = "https://forms.gle/GwcLWTGeKGwLwdkC9";

export default function RestartStudyPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Header />

        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: 999,
              background: "#f5f5f5",
              color: "#555",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            学習コラム / Tips
          </div>
          <h1
            style={{
              marginTop: 16,
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            1日サボっても、学習をやめないために
          </h1>
          <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.8, color: "#333" }}>
            資格学習で一番つらい瞬間は、「分からないとき」よりも「1日サボってしまったあと」だと思っている。
            <br />
            理由はいくらでもあるのに、翌日になると「もうダメかも」という気持ちだけが残る。
          </p>
        </div>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>計画が崩れること自体は、珍しくない</h2>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            資格学習をしていると、最初はやる気に満ちて計画を立てる。けれど実際には、仕事が立て込む、
            体調を崩す、想定より内容が重い――そんな理由で、計画通りに進まない日の方が多い。
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            これは意志が弱いからではなく、現実の生活が計画より複雑だからだ。
          </p>
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>問題は「サボったあと」にある</h2>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            学習が止まってしまう原因は、サボったことそのものではない。多くの場合、
            「前日のタスクが消えている」「何から再開すればいいか分からない」「やれていない感だけが積み上がる」
            といった体験が、再開のハードルを一気に上げてしまう。
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            結果として「今日はやらなくていいや」が何日も続いてしまう。
          </p>
        </section>
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>「戻れる前提」で学習を設計する</h2>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            この問題を解決するために意識しているのは、「学習は必ず崩れるものとして設計する」という考え方だ。
            完璧に続く計画を作るのではなく、休んだ日があっても、予定通り進まなくても、その翌日に戻ってこられる。
            そんな前提で学習体験を作る。
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            QUALogでは「今日は休む」を選んだ場合でも計画が壊れず、後ろにずれるだけ、という設計にしている。
            これは「やらなかった日を失敗にしない」ための仕組みだ。
          </p>
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>続けるために必要なのは、根性ではない</h2>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            学習が続かないとき、「自分は意志が弱い」と感じてしまいがちだ。しかし実際には、再開しづらい設計、
            やれていないことが目立つ表示、修正しづらい計画――こうした要因が人を学習から遠ざけていることが多い。
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            続けるために必要なのは、強い意志よりも、戻りやすい仕組みだと思っている。
          </p>
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>おわりに</h2>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            QUALogは「計画通り進める人」のためのツールではない。たまにサボる、予定が崩れる、
            それでもやめたくはない――そんな人がまた戻ってこれる場所を目指して作っている。
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.9, color: "#333" }}>
            もし今「1日空いてしまって気まずい」と感じているなら、それはやめる理由ではなく、再開するタイミングかもしれない。
          </p>
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
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "underline" }}>
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
        <span>※ 学習コラムは予告なく更新されることがあります。</span>
        <Link href="/howto" style={{ color: "#666", textDecoration: "underline" }}>
          使い方
        </Link>
        <Link href="/terms" style={{ color: "#666", textDecoration: "underline" }}>
          利用規約
        </Link>
        <Link href="/privacy" style={{ color: "#666", textDecoration: "underline" }}>
          プライバシーポリシー
        </Link>
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#666", textDecoration: "underline" }}>
          お問い合わせ
        </a>
      </div>
    </footer>
  );
}

function AdPlaceholder({ label, note }: { label: string; note: string }) {
  return (
    <aside
      style={{
        marginTop: 32,
        padding: 18,
        borderRadius: 14,
        border: "1px dashed #ddd",
        background: "#fafafa",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#888" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#555" }}>{note}</div>
    </aside>
  );
}
