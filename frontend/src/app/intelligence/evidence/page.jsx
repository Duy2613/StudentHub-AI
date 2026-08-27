import React from "react";
import { GlobalAppShell } from "@/components/layout/GlobalAppShell";
import { EvidenceLensView } from "@/components/intelligence/EvidenceLensView";

export const metadata = {
  title: "T4 Evidence Fusion Lens | StudentHub AI",
  description: "Trung tâm hợp nhất minh chứng đa nguồn và bộ phân loại xung đột quy chế."
};

export default function EvidenceLensPage() {
  return (
    <GlobalAppShell>
      <EvidenceLensView />
    </GlobalAppShell>
  );
}
