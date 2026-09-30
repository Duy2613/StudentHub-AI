"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

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
  return <>
    <div className="expert-workspace-shortcuts mx-auto flex max-w-[1320px] justify-end px-4 pt-4">
      <div className="flex flex-wrap items-center gap-4">
        <Link className="text-link" href="/expert/missions">Nhiệm vụ hôm nay →</Link>
        <Link className="text-link" href="/expert/rooms">Phòng xác minh trực tiếp →</Link>
      </div>
    </div>
    <ExpertWorkspace />
  </>;
}
