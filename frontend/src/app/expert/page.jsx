import React from "react";
import ExpertWorkspaceClient from "@/components/expert/ExpertWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Expert Intelligence — StudentHub AI",
  description: "Expert Knowledge Graph, Scope Graph & Credential Verification"
};

export default function ExpertPage() {
  return <UnifiedAppShell><ExpertWorkspaceClient /></UnifiedAppShell>;
}
