import React, { Suspense } from "react";
import TrustWorkspaceClient from "@/components/trust/TrustWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Kiểm chứng | StudentHub AI",
  description: "Phân tích rủi ro, truy vết bằng chứng và kết nối xác minh cộng đồng, chuyên gia."
};

export default function TrustPage() {
  return (
    <UnifiedAppShell>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm" role="status">Đang mở không gian kiểm chứng…</div>}>
        <TrustWorkspaceClient />
      </Suspense>
    </UnifiedAppShell>
  );
}
