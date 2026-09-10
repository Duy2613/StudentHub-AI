import React, { Suspense } from "react";
import TrustWorkspaceClient from "@/components/trust/TrustWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Trust Engine | StudentHub AI",
  description: "Phân tích rủi ro, truy vết bằng chứng và kết nối xác minh cộng đồng, chuyên gia."
};

export default function TrustPage() {
  return (
    <UnifiedAppShell>
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-xs text-[var(--text-muted)] font-mono">LOADING TRUST ENGINE...</div>}>
        <TrustWorkspaceClient />
      </Suspense>
    </UnifiedAppShell>
  );
}
