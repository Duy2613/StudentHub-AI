"use client";

/**
 * StudentHub AI — Privacy, Security & Source Settings Route
 */

import React from "react";
import StudentHubOSShell from "@/components/layout/StudentHubOSShell";
import PrivacyAndSecurityCenter from "@/components/settings/PrivacyAndSecurityCenter";

export default function SettingsPage() {
  return (
    <StudentHubOSShell>
      <PrivacyAndSecurityCenter />
    </StudentHubOSShell>
  );
}
