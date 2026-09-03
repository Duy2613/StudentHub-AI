import UnifiedAppShell from "@/components/layout/UnifiedAppShell";
import { CompetitionCaseStudio } from "@/components/competition/CompetitionCaseStudio";
import { listCompetitionSuperflows } from "@/lib/competition/competitionSuperflows.js";

export const metadata = {
  title: "Evidence Case Lab | StudentHub AI",
  description: "Ba superflow trình diễn kết nối Trust, Community, Expert, Academic, Evidence Passport và Decision Twin.",
};

export default function CompetitionCasesPage() {
  return <UnifiedAppShell><CompetitionCaseStudio flows={listCompetitionSuperflows()} /></UnifiedAppShell>;
}
