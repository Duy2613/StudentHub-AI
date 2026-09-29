import { redirect } from "next/navigation";

// Compatibility destination for the one shell-owned Omni surface.
export default function AIEntryPage() {
  redirect("/trust?omni=1");
}
