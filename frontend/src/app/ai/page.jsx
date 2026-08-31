"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — Canonical Redirect: /ai -> /trust
 * Contextual AI verification and intelligence workflows live in the Trust Engine.
 */
export default function AIRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/trust");
  }, [router]);

  return null;
}
