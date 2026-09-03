import { redirect } from "next/navigation";

/** Compatibility entry: Community has one canonical owner. */
export default function CommunityIntelligenceCompatibilityRoute() {
  redirect("/community");
}
