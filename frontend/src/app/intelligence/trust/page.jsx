import React from "react";
import { GlobalAppShell } from "@/components/layout/GlobalAppShell";
import { TrustLensView } from "@/components/intelligence/TrustLensView";

export const metadata = {
  title: "T1 Trust Intelligence Lens | StudentHub AI",
  description: "Giải mã ma trận tin cậy đa chiều và giải trình minh bạch hồ sơ học vụ."
};

export default function TrustLensPage() {
  return (
    <GlobalAppShell>
      <TrustLensView />
    </GlobalAppShell>
  );
}
