import Link from "next/link";

const CONTACT_URL = "https://forms.gle/GwcLWTGeKGwLwdkC9";

export default function Terms() {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#111", fontWeight: 800 }}>
            QUALog
          </Link>
          <nav style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
            <Link href="/howto" style={{ color: "#111", textDecoration: "underline" }}>
              使い方
            </Link>
            <Link href="/privacy" style={{ color: "#111", textDecoration: "underline" }}>
              プライバシーポリシー
            </Link>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "underline" }}>
              お問い合わせ
            </a>
          </nav>
        </header>

        <h1 style={{ marginTop: 28, fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em" }}>
          利用規約
        </h1>

        <div style={{ marginTop: 18, color: "#333", lineHeight: 1.9, fontSize: 15 }}>
          <Section title="1. 適用">
            本規約は、QUALog（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意のうえ本サービスを利用します。
          </Section>

          <Section title="2. 提供内容">
            本サービスは、資格学習の目標設定、学習計画、学習記録（日報等）の保存、およびAIによるフィードバック表示等の機能を提供します。
            <br />
            AI出力は一般的な助言であり、学習成果・合格等を保証しません。
          </Section>

          <Section title="3. アカウント">
            利用者は、登録情報を正確に提供し、自己の責任で管理します。第三者による不正利用が疑われる場合、速やかに問い合わせ窓口へ連絡してください。
          </Section>

          <Section title="4. 禁止事項">
            利用者は以下を行ってはいけません。
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>法令・公序良俗に反する行為</li>
              <li>他人のアカウント利用、なりすまし</li>
              <li>本サービスの運営を妨害する行為（過度なリクエスト送信等）</li>
              <li>不正アクセス、脆弱性の悪用</li>
              <li>第三者の権利侵害（著作権・プライバシー等）</li>
            </ul>
          </Section>

          <Section title="5. 知的財産">
            本サービスに関するプログラム、画面、文章等の権利は運営者または正当な権利者に帰属します。利用者は、私的利用の範囲を超えて無断で転載・複製等できません。
          </Section>

          <Section title="6. 利用者データ">
            利用者が入力した学習計画・日報等（以下「利用者データ」）は、利用者に帰属します。運営者は、本サービス提供・改善、障害対応のために必要な範囲で利用者データを取り扱います（詳細はプライバシーポリシー参照）。
          </Section>

          <Section title="7. サービスの変更・停止">
            運営者は、必要に応じて本サービスの内容を変更、提供を中断または終了できます。重要な変更がある場合は、適切な方法で告知します。
          </Section>

          <Section title="8. 免責">
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>本サービスは現状有姿で提供されます。運営者は、正確性・完全性・有用性・特定目的適合性等を保証しません。</li>
              <li>AI出力を含む情報に基づく判断・行動は利用者の責任で行ってください。</li>
              <li>システム障害、通信回線、外部サービスの不具合等により生じた損害について、運営者は合理的な範囲を超えて責任を負いません（故意または重過失を除く）。</li>
            </ul>
          </Section>

          <Section title="9. お問い合わせ">
            本サービスに関する問い合わせは、運営者が指定する問い合わせフォームから行います。
          </Section>

          <Section title="10. 規約の変更">
            運営者は、本規約を変更できるものとします。変更後の規約は、本サービス上の表示等により告知し、告知後に利用者が本サービスを利用した場合、変更に同意したものとみなします。
          </Section>

          <Section title="11. 準拠法・管轄">
            本規約は日本法に準拠し、本サービスに関する紛争は運営者所在地を管轄する裁判所を専属的合意管轄とします。
          </Section>

          <div style={{ marginTop: 28, fontSize: 12, color: "#666" }}>
            最終更新日：2025-12-26
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 18 }}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </section>
  );
}

