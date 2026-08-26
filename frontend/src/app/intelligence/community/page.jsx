import React from "react";
import { CommunityExperienceStudio } from "@/components/community/CommunityExperienceStudio";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export const metadata = {
  title: "Community Experience Studio — StudentHub AI",
  description: "Real-World Student Experience Layer, Procedure Timelines & Astroturfing Defense"
};

export default function CommunityIntelligencePage() {
  const initialPosts = CommunityStore.getPostsByTopic("TOEIC_SUBMISSION_TIME", { redactPrivate: true });
  const initialConsensus = CommunityStore.getConsensus("TOEIC_SUBMISSION_TIME");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <CommunityExperienceStudio initialPosts={initialPosts} initialConsensus={initialConsensus} />
    </main>
  );
}
