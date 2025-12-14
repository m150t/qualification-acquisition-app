// apps/web/app/layout.tsx
"use client";

import "./globals.css";
import type { Metadata } from "next";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";

export const metadata: Metadata = {
  title: "StudyCoach",
  description: "資格学習をサポートするアプリ",
};

// クライアント側で Amplify を初期化
Amplify.configure(outputs);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Authenticator
          components={{
            Header() {
              // 🔽 未ログイン時にログインフォームの上に表示されるエリア
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
              {/* 🔽 ここから下は「ログイン済み」のときだけ表示される */}
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
      </body>
    </html>
  );
}
