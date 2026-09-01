"use client";

import dynamic from "next/dynamic";

const ExpertWorkspace = dynamic(() => import("./ExpertIntelligenceView").then((module) => ({ default: module.ExpertIntelligenceView })), {
  ssr: false,
  loading: () => (
    <div className="workspace-loading" role="status" aria-live="polite">
      Đang tải Expert Intelligence…
    </div>
  ),
});

export default function ExpertWorkspaceClient() {
  return <ExpertWorkspace />;
}
