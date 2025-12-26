// apps/web/app/AuthLayout.tsx
"use client";

import { ReactNode, useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { deleteUser } from "aws-amplify/auth";

// クライアント側で Amplify を初期化
Amplify.configure(outputs);

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  return (
    <Authenticator
      components={{
        Header() {
          // 🔽 未ログイン時にログインフォームの上に出るエリア
          return (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
                QUALog 
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
      {({ signOut, user }) => {
        const userId = user?.userId ?? user?.username ?? "";
        const handleDeleteAccount = async () => {
          if (!userId) {
            alert("ユーザー情報の取得に失敗しました。再度ログインしてください。");
            return;
          }
          if (!window.confirm("データが削除されますがよろしいですか？")) {
            return;
          }

          setIsDeletingAccount(true);
          try {
            const res = await fetch("/api/account", {
              method: "DELETE",
              headers: { "x-user-id": userId },
            });
            if (!res.ok) {
              const message = await res.text();
              throw new Error(message || "failed to delete account data");
            }
            await deleteUser();
            await signOut?.();
          } catch (error) {
            console.error("failed to delete account", error);
            alert("退会処理に失敗しました。時間をおいて再度お試しください。");
          } finally {
            setIsDeletingAccount(false);
          }
        };

        return (
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
            <span
              style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              }}
            >
              QUA<span style={{ color: "#666" }}>Log</span>
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                style={{
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border: "1px solid #fca5a5",
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  cursor: "pointer",
                }}
              >
                退会
              </button>
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
            </div>
          </header>

          <main style={{ padding: "24px" }}>{children}</main>
        </>
        );
      }}
    </Authenticator>
  );
}
