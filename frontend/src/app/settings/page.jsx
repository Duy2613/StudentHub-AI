"use client";

/**
 * StudentHub AI — Privacy, Security & Source Settings Route
 */

import React from "react";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";
import { PrivacyAccessCenter } from "@/components/settings/PrivacyAccessCenter";

export default function SettingsPage() {
  return (
    <UnifiedAppShell>
      <PrivacyAccessCenter />
    </UnifiedAppShell>
  );
}
