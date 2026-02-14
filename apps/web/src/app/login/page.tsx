"use client";

import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          router.replace("/home");
          return;
        }
      } catch (e) {
        // 未ログイン想定なので無視
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(99,102,241,0.20), transparent 55%)," +
          "radial-gradient(900px 600px at 80% 15%, rgba(34,197,94,0.14), transparent 55%)," +
          "radial-gradient(900px 700px at 60% 90%, rgba(59,130,246,0.12), transparent 55%)," +
          "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "min(1120px, 100%)",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 20,
        }}
      >
        {/* Left */}
        <section
          style={{
            borderRadius: 28,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
            border: "1px solid rgba(15,23,42,0.06)",
            padding: 36,
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, rgba(99,102,241,1), rgba(59,130,246,1))",
                boxShadow: "0 10px 24px rgba(59,130,246,0.25)",
              }}
            />
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>
                QUA<span style={{ color: "#6b7280" }}>Log</span>
              </div>
              <div style={{ marginTop: 4, color: "#64748b" }}>
                今日の積み上げが、合格を作る。
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22, color: "#0f172a", lineHeight: 1.9, fontSize: 16 }}>
            試験日から逆算して計画を作り、日報で進捗を積み上げる。<br />
            QUALog は「継続を設計する」学習ログです。
          </div>

          <div style={{ marginTop: 26, display: "grid", gap: 14 }}>
            {[
              { title: "学習計画を自動生成", desc: "試験日から逆算して、毎日のタスクを現実的に割り当て。" },
              { title: "日報で進捗が積み上がる", desc: "学習時間・達成タスク・メモを残して、継続が可視化される。" },
              { title: "AIフィードバックで軌道修正", desc: "サボりが続いても戻れる。やることが曖昧にならない。" },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: "rgba(15,23,42,0.05)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    marginTop: 2,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{f.title}</div>
                  <div style={{ color: "#475569", marginTop: 4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right */}
<section
  style={{
    borderRadius: 28,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
    border: "1px solid rgba(15,23,42,0.06)",
    padding: 22,
    backdropFilter: "blur(10px)",
    minHeight: 520,
  }}
>
  <Authenticator>
    {({ signOut }: { signOut?: () => void }) => (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>ログイン済みです</div>
        <div style={{ marginTop: 8, color: "#475569", fontSize: 14 }}>
          ダッシュボードへ移動します…
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            onClick={() => router.replace("/home")}
            style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ダッシュボードへ
          </button>
          <button
            onClick={() => signOut?.()}
            style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    )}
  </Authenticator>
</section>

      </div>
    </div>
  );
}
