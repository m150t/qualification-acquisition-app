"use client";

import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

function AuthenticatedRedirect({ onRedirect }: { onRedirect: () => void }) {
  useEffect(() => {
    onRedirect();
  }, [onRedirect]);

  return null;
}

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
      } catch {
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
        padding: 16,
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section
        style={{
          width: "min(420px, 100%)",
          borderRadius: 20,
          background: "rgba(255,255,255,0.96)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
          border: "1px solid rgba(15,23,42,0.06)",
          padding: 18,
          backdropFilter: "blur(8px)",
        }}
      >
        <Authenticator>
          {() => <AuthenticatedRedirect onRedirect={() => router.replace("/home")} />}
        </Authenticator>
      </section>
    </div>
  );
}
