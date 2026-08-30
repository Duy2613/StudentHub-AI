"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /marketplace -> /community
 * Peer listings and verified student resources are centralized in Community Intelligence.
 */
export default function MarketplaceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/community");
  }, [router]);

  return null;
}
