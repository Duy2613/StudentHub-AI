import React from "react";
import { KnowledgeObjectStudio } from "@/components/fusion/KnowledgeObjectStudio";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore";

export const metadata = {
  title: "Evidence Fusion & Knowledge Objects — StudentHub AI",
  description: "Authority-Aware Knowledge Fusion: Official Academic Truth + AI Reasoning + Expert Interpretation + Community Reality"
};

export default function KnowledgeIntelligencePage() {
  const allObjects = EvidenceFusionStore.getAll({ redactPrivate: true });

  return (
    <main className="w-full min-w-0 min-h-screen bg-slate-950 text-slate-100">
      <KnowledgeObjectStudio initialKnowledgeObjects={allObjects} />
    </main>
  );
}
