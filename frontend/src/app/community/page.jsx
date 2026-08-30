import React from "react";
import { CommunityIntelligenceView } from "@/components/community/CommunityIntelligenceView";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Community Intelligence — StudentHub AI",
  description: "Student Real-World Experience Layer, Consensus & Astroturfing Defense"
};

export default function CommunityPage() {
  const initialPosts = CommunityStore.getAllPosts();

  return <UnifiedAppShell><CommunityIntelligenceView initialPosts={initialPosts} /></UnifiedAppShell>;
}
