"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /credit-scheduler -> /academic?view=planner
 * Timetable scheduling and prerequisite resolution are unified within Academic 360.
 */
export default function CreditSchedulerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/academic?view=planner");
  }, [router]);

  return null;
}
