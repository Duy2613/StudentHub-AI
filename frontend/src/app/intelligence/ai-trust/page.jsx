import { redirect } from "next/navigation";

/** Compatibility entry: Trust processing depth belongs to the Trust case. */
export default function AiTrustCompatibilityRoute() {
  redirect("/trust");
}
