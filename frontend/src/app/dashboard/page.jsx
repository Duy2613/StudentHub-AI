"use client";

import React from "react";
import { GlobalAppShell } from "@/components/layout/GlobalAppShell";
import { PersonalCommandCenter } from "@/components/command/PersonalCommandCenter";

export default function DashboardPage() {
  return (
    <GlobalAppShell>
      <PersonalCommandCenter />
    </GlobalAppShell>
  );
}
