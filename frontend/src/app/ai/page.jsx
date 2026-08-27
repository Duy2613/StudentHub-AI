"use client";

/**
 * StudentHub AI — Grounded AI Studio Route
 */

import React from "react";
import StudentHubOSShell from "@/components/layout/StudentHubOSShell";
import GroundedAIStudio from "@/components/ai/GroundedAIStudio";

export default function AIPage() {
  return (
    <StudentHubOSShell>
      <GroundedAIStudio />
    </StudentHubOSShell>
  );
}
