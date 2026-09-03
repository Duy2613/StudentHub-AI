"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /tuition-radar -> /academic
 * Tuition verification and bank accounts are verified through the Trust Engine and Academic 360.
 */
export default function TuitionRadarRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/academic");
  }, [router]);

  return null;
}
