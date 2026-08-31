import React from "react";
import { GlobalAppShell } from "@/components/layout/GlobalAppShell";
import { PrivacyAccessCenter } from "@/components/settings/PrivacyAccessCenter";

export const metadata = {
  title: "Privacy & Device Trust Center | StudentHub AI",
  description: "Quản lý thiết bị, kiểm soát quyền truy cập và xuất dữ liệu cá nhân."
};

export default function PrivacySettingsPage() {
  return (
    <GlobalAppShell>
      <PrivacyAccessCenter />
    </GlobalAppShell>
  );
}
