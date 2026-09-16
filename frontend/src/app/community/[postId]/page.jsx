import React from "react";
import CommunityDetailWorkspace from "@/components/community/CommunityDetailWorkspace";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Community detail — StudentHub AI",
  description: "Đọc post và bình luận công khai từ Community",
};

export default function CommunityDetailPage() {
  return <UnifiedAppShell><CommunityDetailWorkspace /></UnifiedAppShell>;
}
