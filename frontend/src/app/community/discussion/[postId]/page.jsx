import React from "react";
import CommunityDiscussionDetailWorkspace from "@/components/community/CommunityDiscussionDetailWorkspace";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Community discussion — StudentHub AI",
  description: "Đọc bài viết và bình luận công khai trong Community",
};

export default function CommunityDiscussionPage() {
  return <UnifiedAppShell><CommunityDiscussionDetailWorkspace /></UnifiedAppShell>;
}
