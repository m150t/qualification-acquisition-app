export default function ChangeLog() {
  return (
    <>
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
        QUALog はベータ版として公開中です。小さく改善を重ねながら、
        学習を継続しやすい体験を目指しています。
      </p>

      <div
        style={{
          marginTop: 28,
          color: "#333",
          lineHeight: 1.9,
          fontSize: 15,
        }}
      >
        <Section title="2026-01">
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>計画修正機能を追加</li>
            <li>ホーム画面の軽微なUI改善</li>
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
    </>
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
