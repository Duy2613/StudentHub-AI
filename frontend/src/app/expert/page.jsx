import React from "react";
import { ExpertIntelligenceView } from "@/components/expert/ExpertIntelligenceView";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Expert Intelligence — StudentHub AI",
  description: "Expert Knowledge Graph, Scope Graph & Credential Verification"
};

export default function ExpertPage() {
  const initialExperts = ExpertStore.getAllExperts();

  return <UnifiedAppShell><ExpertIntelligenceView initialExperts={initialExperts} /></UnifiedAppShell>;
}
