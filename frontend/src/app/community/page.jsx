import React, { Suspense } from "react";
import CommunityWorkspaceClient from "@/components/community/CommunityWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Community — StudentHub AI",
  description: "Bảng tin xã hội và tín hiệu trải nghiệm của cộng đồng StudentHub"
};

export default function CommunityPage() {
  return (
    <UnifiedAppShell>
      <Suspense fallback={<div className="workspace-loading">Đang tải Community…</div>}>
        <CommunityWorkspaceClient />
      </Suspense>
    </UnifiedAppShell>
  );
}
