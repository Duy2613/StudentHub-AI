import React from "react";
import { CommunityIntelligenceView } from "@/components/community/CommunityIntelligenceView";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export const metadata = {
  title: "Community Intelligence — StudentHub AI",
  description: "Student Real-World Experience Layer, Consensus & Astroturfing Defense"
};

export default function CommunityPage() {
  const initialPosts = CommunityStore.getAllPosts();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <CommunityIntelligenceView initialPosts={initialPosts} />
    </main>
  );
}
