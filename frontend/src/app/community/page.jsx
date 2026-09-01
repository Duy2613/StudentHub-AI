import React from "react";
import CommunityWorkspaceClient from "@/components/community/CommunityWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Community Intelligence — StudentHub AI",
  description: "Student Real-World Experience Layer, Consensus & Astroturfing Defense"
};

export default function CommunityPage() {
  return <UnifiedAppShell><CommunityWorkspaceClient /></UnifiedAppShell>;
}
