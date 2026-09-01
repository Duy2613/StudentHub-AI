"use client";

import dynamic from "next/dynamic";

const TrustWorkspace = dynamic(() => import("./AiTrustStudioView").then((module) => ({ default: module.AiTrustStudioView })), {
  ssr: false,
  loading: () => (
    <div className="workspace-loading" role="status" aria-live="polite">
      Đang tải Trust Engine…
    </div>
  ),
});

export default function TrustWorkspaceClient() {
  return <TrustWorkspace />;
}
