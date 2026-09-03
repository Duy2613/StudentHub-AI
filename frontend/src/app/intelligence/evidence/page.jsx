import { redirect } from "next/navigation";

/** Compatibility entry: evidence drill-down is a Trust report level. */
export default function EvidenceIntelligenceCompatibilityRoute() {
  redirect("/trust");
}
