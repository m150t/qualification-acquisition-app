import Link from "next/link";

const CONTACT_URL = "https://forms.gle/GwcLWTGeKGwLwdkC9";

export default function Privacy() {
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
            <Link href="/terms" style={{ color: "#111", textDecoration: "underline" }}>
              利用規約
            </Link>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "underline" }}>
              お問い合わせ
            </a>
          </nav>
        </header>

        <h1 style={{ marginTop: 28, fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em" }}>
          プライバシーポリシー
        </h1>

        <div style={{ marginTop: 18, color: "#333", lineHeight: 1.9, fontSize: 15 }}>
          <p>
            QUALog（以下「本サービス」）は、利用者の個人情報を以下の方針に基づき取り扱います。
          </p>

          <Section title="1. 取得する情報">
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>アカウント登録時の情報（メールアドレス等）</li>
              <li>学習目標、学習計画、日報など、利用者が入力した情報</li>
              <li>アクセスログ、利用状況、エラーログ等の技術情報</li>
              <li>問い合わせフォームに入力された情報</li>
            </ul>
          </Section>

          <Section title="2. 利用目的">
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              <li>本サービスの提供・運営のため</li>
              <li>学習計画作成、AIフィードバック等の機能提供のため</li>
              <li>不具合調査、品質改善のため</li>
              <li>問い合わせ対応のため</li>
              <li>不正利用の防止・対応のため</li>
            </ul>
          </Section>

          <Section title="3. AI機能の利用について">
            <p>
              本サービスでは、学習支援の目的で外部AIサービスを利用する場合があります。
            </p>
            <p style={{ marginTop: 8 }}>
              その際、AI処理に必要な範囲で利用者が入力した情報を送信することがありますが、個人を特定する目的では使用しません。
            </p>
          </Section>

          <Section title="4. 第三者提供">
            <li>法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。</li>
          </Section>

          <Section title="5. 情報の管理">
            <li>取得した情報は、不正アクセス・漏えい・改ざん等を防止するため、適切な安全管理措置を講じて管理します。</li>
          </Section>

          <Section title="6. 退会およびデータ削除">
            <p>
              利用者は、本サービス内の退会機能を利用することで、アカウントおよび関連する利用者データを削除できます。
            </p>
            <p style={{ marginTop: 8 }}>退会後、当該データは合理的な期間内に削除されます。</p>
          </Section>

          <Section title="7. アクセス解析・ログ">
            <p>
              本サービスでは、安定運用および改善のため、アクセスログやエラーログを取得する場合があります。
            </p>
            <p style={{ marginTop: 8 }}>これらの情報は個人を特定する目的では利用しません。</p>
          </Section>

          <Section title="8. プライバシーポリシーの変更">
            <li>本ポリシーの内容は、必要に応じて変更することがあります。変更後の内容は、本サービス上に掲載した時点で効力を生じます。</li>
          </Section>

          <Section title="9. お問い合わせ">
            <li>本ポリシーに関するお問い合わせは、以下の問い合わせフォームよりご連絡ください。</li>
            <div style={{ marginTop: 8 }}>
              <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                {CONTACT_URL}
              </a>
            </div>
          </Section>

          <Section title="10. 広告配信について">
            <p>本サービスでは、第三者配信の広告サービス（Google AdSense等）を利用する場合があります。</p>
            <p style={{ marginTop: 8 }}>
              広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。
            </p>
            <p style={{ marginTop: 8 }}>
              Google を含む第三者配信事業者は、Cookie を使用して、ユーザーが本サービスや他のウェブサイトに過去にアクセスした情報に基づいて広告を配信します。
            </p>
            <p style={{ marginTop: 8 }}>
              ユーザーは、広告設定によりパーソナライズ広告を無効にすることができます。
            </p>
            <p style={{ marginTop: 8 }}>
              本サービスでは、Google Analytics 等のアクセス解析ツールを利用する場合があります。
            </p>
            <p style={{ marginTop: 8 }}>
              これらのツールはトラフィックデータ収集のために Cookie を使用しますが、このデータは匿名で収集され、個人を特定するものではありません。
            </p>
          </Section>

          <Section title="11. 運営者情報">
            <div>運営者名：QUALog 運営</div>
            <div style={{ marginTop: 6 }}>
              連絡先：
              <a href="mailto:miho84611@gmail.com" style={{ textDecoration: "underline", marginLeft: 4 }}>
                miho84611@gmail.com
              </a>
            </div>
          </Section>

          <div style={{ marginTop: 28, fontSize: 12, color: "#666" }}>
            最終更新日：2026-01-17
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



