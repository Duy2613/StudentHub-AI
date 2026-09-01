import { redirect } from "next/navigation";

/** Compatibility entry: knowledge/evidence navigation is owned by Trust. */
export default function KnowledgeIntelligenceCompatibilityRoute() {
  redirect("/trust");
}
