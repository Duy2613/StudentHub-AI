import React from "react";
import { ExpertIntelligenceStudioV2 } from "@/components/expert/ExpertIntelligenceStudioV2";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export const metadata = {
  title: "Expert Intelligence V2 — StudentHub AI",
  description: "Verified Expert Knowledge Graph, Scope Boundaries & Disagreement Mapping"
};

export default function ExpertIntelligencePage() {
  const initialExperts = ExpertStore.getAllExperts({ redactPrivate: true });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <ExpertIntelligenceStudioV2 initialExperts={initialExperts} />
    </main>
  );
}
