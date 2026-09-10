import React, { Suspense } from "react";
import CommunityWorkspaceClient from "@/components/community/CommunityWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Community Intelligence — StudentHub AI",
  description: "Student Real-World Experience Layer, Consensus & Astroturfing Defense"
};

export default function CommunityPage() {
  return (
    <UnifiedAppShell>
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-xs text-[var(--text-muted)] font-mono">LOADING COMMUNITY INTELLIGENCE...</div>}>
        <CommunityWorkspaceClient />
      </Suspense>
    </UnifiedAppShell>
  );
}
