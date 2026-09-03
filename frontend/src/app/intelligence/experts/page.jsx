import { redirect } from "next/navigation";

/** Compatibility entry: Expert has one canonical owner. */
export default function ExpertIntelligenceCompatibilityRoute() {
  redirect("/expert");
}
