import React from "react";
import { GlobalAppShell } from "@/components/layout/GlobalAppShell";
import { CommunityLensView } from "@/components/intelligence/CommunityLensView";

export const metadata = {
  title: "T3 Community Intelligence Lens | StudentHub AI",
  description: "Mạng lưới tín hiệu học vụ thực tế từ cộng đồng sinh viên và bảo tồn góc nhìn thiểu số."
};

export default function CommunityLensPage() {
  return (
    <GlobalAppShell>
      <CommunityLensView />
    </GlobalAppShell>
  );
}
