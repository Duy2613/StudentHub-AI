"use client";

/**
 * StudentHub AI — Unified Intelligence Workspace Route
 */

import React from "react";
import StudentHubOSShell from "@/components/layout/StudentHubOSShell";
import UnifiedIntelligenceWorkspace from "@/components/intelligence/UnifiedIntelligenceWorkspace";

export default function IntelligencePage() {
  return (
    <StudentHubOSShell>
      <UnifiedIntelligenceWorkspace />
    </StudentHubOSShell>
  );
}
