import React from "react";
import { CommunityIntelligenceStudioV2 } from "@/components/community/CommunityIntelligenceStudioV2";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export const metadata = {
  title: "Community Reality Graph — StudentHub AI",
  description: "Empirical Student Experience Layer, Operational Friction & Official vs Real-World Gap Engine"
};

export default function CommunityIntelligencePage() {
  const allTopics = CommunityStore.getAllTopics();
  const realityGaps = CommunityStore.getRealityGaps();
  const frictionSignals = CommunityStore.getFrictionSignals();
  const heatmap = CommunityStore.getFrictionHeatmap();
  const initialPosts = CommunityStore.getPostsByTopic("TOEIC_SUBMISSION_TIME", { redactPrivate: true });
  const initialConsensus = CommunityStore.getConsensus("TOEIC_SUBMISSION_TIME");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <CommunityIntelligenceStudioV2
        initialTopics={allTopics}
        initialGaps={realityGaps}
        initialFriction={frictionSignals}
        initialHeatmap={heatmap}
        initialPosts={initialPosts}
        initialConsensus={initialConsensus}
      />
    </main>
  );
}
