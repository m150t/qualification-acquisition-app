// apps/web/app/AuthLayout.tsx
"use client";

import { ReactNode } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";

// クライアント側で Amplify を初期化
Amplify.configure(outputs);

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Authenticator
      components={{
        Header() {
          // 🔽 未ログイン時にログインフォームの上に出るエリア
          return (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
                StudyCoach
              </h1>
              <p style={{ marginTop: "8px", fontSize: "14px" }}>
                資格学習の計画を立てて、毎日の進捗を記録できます。
                <br />
                ログインして学習をスタートしましょう。
              </p>
            </div>
          );
        },
      }}
    >
      {({ user, signOut }) => (
        <>
          {/* 🔽 ログイン済みのときだけここが表示される */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px",
              borderBottom: "1px solid #eee",
            }}
          >
            <span style={{ fontSize: "14px" }}>
              ログイン中: {user?.username}
            </span>
            <button
              onClick={signOut}
              style={{
                fontSize: "12px",
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              ログアウト
            </button>
          </header>

          <main style={{ padding: "24px" }}>{children}</main>
        </>
      )}
    </Authenticator>
  );
}
