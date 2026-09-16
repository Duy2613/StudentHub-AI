"use client";

import dynamic from "next/dynamic";

// The normal route owns one social workspace. The older intelligence view is
// retained as an internal QA surface and is never mounted here.
const CommunityWorkspace = dynamic(() => import("./CommunitySocialWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="workspace-loading" role="status" aria-live="polite">
      Đang tải Community…
    </div>
  ),
});

export default function CommunityWorkspaceClient() {
  return <CommunityWorkspace />;
}
