"use client";

/**
 * StudentHub AI — StudentHub OS Main Entry
 * Personal Command Center with grounded intelligence briefing and next best actions.
 */

import React from "react";
import StudentHubOSShell from "@/components/layout/StudentHubOSShell";
import CommandCenterDashboard from "@/components/home/CommandCenterDashboard";

export default function HomePage() {
  return (
    <StudentHubOSShell>
      <CommandCenterDashboard />
    </StudentHubOSShell>
  );
}
