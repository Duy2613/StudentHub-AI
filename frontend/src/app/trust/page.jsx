import React from "react";
import { AiTrustStudioView } from "@/components/trust/AiTrustStudioView";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const metadata = {
  title: "Trust Engine | StudentHub AI",
  description: "Phân tích rủi ro, truy vết bằng chứng và kết nối xác minh cộng đồng, chuyên gia."
};

export default function TrustPage() {
  return <UnifiedAppShell><AiTrustStudioView /></UnifiedAppShell>;
}
