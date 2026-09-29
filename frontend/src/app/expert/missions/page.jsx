import UnifiedAppShell from "@/components/layout/UnifiedAppShell";
import ExpertV5Missions from "@/components/expert/ExpertV5Missions";

export const metadata = {
  title: "Nhiệm vụ Expert — StudentHub AI",
  description: "Nhiệm vụ dựa trên nguồn thực đã được truy xuất và duyệt",
};

export default function ExpertMissionsPage() {
  return <UnifiedAppShell><ExpertV5Missions /></UnifiedAppShell>;
}
