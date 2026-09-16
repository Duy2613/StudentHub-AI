import React from "react";
import ExpertWorkspaceClient from "@/components/expert/ExpertWorkspaceClient";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Expert Network — StudentHub AI",
  description: "Danh bạ chuyên gia công khai và qualification theo trạng thái server"
};

export default function ExpertPage() {
  return <UnifiedAppShell><ExpertWorkspaceClient /></UnifiedAppShell>;
}
