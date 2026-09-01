"use client";

import dynamic from "next/dynamic";

const CommunityWorkspace = dynamic(() => import("./CommunityIntelligenceView").then((module) => ({ default: module.CommunityIntelligenceView })), {
  ssr: false,
  loading: () => (
    <div className="workspace-loading" role="status" aria-live="polite">
      Đang tải Community Intelligence…
    </div>
  ),
});

export default function CommunityWorkspaceClient() {
  return <CommunityWorkspace />;
}
