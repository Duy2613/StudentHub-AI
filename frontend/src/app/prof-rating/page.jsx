"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /prof-rating -> /expert
 * Professor evaluations and academic credentials are consolidated in the Expert Trust Network.
 */
export default function ProfRatingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/expert");
  }, [router]);

  return null;
}
