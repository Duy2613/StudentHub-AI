"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /quests -> /dashboard
 * Actionable tasks and verified student missions are tracked directly in the Personal Command Center.
 */
export default function QuestsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
