import { redirect } from "next/navigation";

/** Compatibility entry: TrustGraph is part of a Trust case, not a peer route. */
export default function TrustIntelligenceCompatibilityRoute() {
  redirect("/trust");
}
