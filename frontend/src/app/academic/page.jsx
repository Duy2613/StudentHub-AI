"use client";

/**
 * StudentHub AI — Academic Workspace 360 Route
 */

import React from "react";
import StudentHubOSShell from "@/components/layout/StudentHubOSShell";
import AcademicWorkspace360 from "@/components/academic/AcademicWorkspace360";

export default function AcademicPage() {
  return (
    <StudentHubOSShell>
      <AcademicWorkspace360 />
    </StudentHubOSShell>
  );
}
