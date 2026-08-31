import React from "react";
import { GlobalAppShell } from "@/components/layout/GlobalAppShell";
import { ExpertLensView } from "@/components/intelligence/ExpertLensView";

export const metadata = {
  title: "T2 Expert Intelligence Lens | StudentHub AI",
  description: "Khám phá chuyên gia theo thẩm quyền kiểm định chính quy và lịch sử độ chính xác."
};

export default function ExpertLensPage() {
  return (
    <GlobalAppShell>
      <ExpertLensView />
    </GlobalAppShell>
  );
}
