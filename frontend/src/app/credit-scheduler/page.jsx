"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * StudentHub AI — retired compatibility route.
 * The former academic planning surface is outside the product scope.
 */
export default function CreditSchedulerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
