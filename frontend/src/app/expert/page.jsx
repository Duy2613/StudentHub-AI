import React from "react";
import { ExpertIntelligenceView } from "@/components/expert/ExpertIntelligenceView";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export const metadata = {
  title: "Expert Intelligence — StudentHub AI",
  description: "Expert Knowledge Graph, Scope Graph & Credential Verification"
};

export default function ExpertPage() {
  const initialExperts = ExpertStore.getAllExperts();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <ExpertIntelligenceView initialExperts={initialExperts} />
    </main>
  );
}
