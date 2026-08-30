"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /contract-check -> /trust
 * Contract scanning and document verification are integrated into the 4-layer Trust Engine.
 */
export default function ContractCheckRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/trust");
  }, [router]);

  return null;
}
