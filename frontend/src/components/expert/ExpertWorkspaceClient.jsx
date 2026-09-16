"use client";

import dynamic from "next/dynamic";

// Normal Expert is a single state-aware network. Legacy intelligence tooling
// remains available only to internal callers and is not mounted here.
const ExpertWorkspace = dynamic(() => import("./ExpertNetworkWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="workspace-loading" role="status" aria-live="polite">
      Đang tải Expert Network…
    </div>
  ),
});

export default function ExpertWorkspaceClient() {
  return <ExpertWorkspace />;
}
