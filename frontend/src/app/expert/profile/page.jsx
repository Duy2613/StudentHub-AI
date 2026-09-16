import React from "react";
import ExpertProfileWorkspace from "@/components/expert/ExpertProfileWorkspace";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Expert Profile — StudentHub AI",
  description: "Qualification và public expert profile theo trạng thái server",
};

export default function ExpertProfilePage() {
  return <UnifiedAppShell><ExpertProfileWorkspace /></UnifiedAppShell>;
}
