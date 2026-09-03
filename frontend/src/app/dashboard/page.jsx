"use client";

/**
 * StudentHub AI — StudentHub OS Master Dashboard Route
 * Personal Command Center with grounded academic intelligence briefing, early warnings, and next best actions.
 */

import React from "react";
import StudentHubOSShell from "@/components/layout/StudentHubOSShell";
import CommandCenterDashboard from "@/components/home/CommandCenterDashboard";

export default function DashboardPage() {
  return (
    <StudentHubOSShell>
      <CommandCenterDashboard />
    </StudentHubOSShell>
  );
}
