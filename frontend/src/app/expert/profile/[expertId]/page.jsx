import React from "react";
import ExpertPublicProfileWorkspace from "@/components/expert/ExpertPublicProfileWorkspace";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Public Expert Profile | StudentHub AI",
  description: "Hồ sơ chuyên gia công khai với domain, qualification và reputation projection.",
};

export default function PublicExpertProfilePage() {
  return <UnifiedAppShell><ExpertPublicProfileWorkspace /></UnifiedAppShell>;
}
