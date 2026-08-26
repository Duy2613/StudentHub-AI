import React from "react";
import { ExpertKnowledgeGraphView } from "@/components/expert/ExpertKnowledgeGraphView";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export const metadata = {
  title: "Expert Knowledge Graph — StudentHub AI",
  description: "Multi-Signal Expert Verification, Scope Graphs & Academic Jurisdiction"
};

export default function ExpertIntelligencePage() {
  const initialExperts = ExpertStore.getAllExperts({ redactPrivate: true });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <ExpertKnowledgeGraphView initialExperts={initialExperts} />
    </main>
  );
}
