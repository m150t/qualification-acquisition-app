import type { ReactNode } from "react";
import { PublicHeader } from "@/features/publicPages/PublicHeader";
import { PublicFooter } from "@/features/publicPages/PublicFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <PublicHeader />
        {children}
        <PublicFooter />
      </div>
    </main>
  );
}
