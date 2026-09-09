import { redirect } from "next/navigation";

/** CUT-2: the legacy roadmap entrypoint resolves to the personal command center. */
export default function RetiredRoadmapRoute() {
  redirect("/dashboard");
}
