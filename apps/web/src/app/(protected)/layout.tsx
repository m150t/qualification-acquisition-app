"use client";

import type { ReactNode} from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession, signOut, deleteUser } from "aws-amplify/auth";
import { getAuthHeaders } from "@/lib/authClient";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) {
          router.replace("/login");
          return;
        }
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("データが削除されますがよろしいですか？")) return;
    setDeleting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/account", { method: "DELETE", headers });
      if (!res.ok) throw new Error(await res.text());
      await deleteUser();
      await signOut();
      router.replace("/login");
    } finally {
      setDeleting(false);
    }
  };

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom: "1px solid #eee",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800 }}>
          QUA<span style={{ color: "#666" }}>Log</span>
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #fca5a5",
              background: "#fee2e2",
              color: "#b91c1c",
              cursor: "pointer",
            }}
          >
            退会
          </button>

          <button
            onClick={handleSignOut}
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main style={{ padding: 24 }}>{children}</main>
    </>
  );
}
