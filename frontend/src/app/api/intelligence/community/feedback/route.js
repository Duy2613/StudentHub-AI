import { NextResponse } from "next/server";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function createCommunityFeedback(request, routeParams, principal) {
  try {
    if (!isCommunityDemoMode()) {
      return NextResponse.json({ success: false, error: { code: "DISCUSSION_WORKFLOW_NOT_MIGRATED", userMessage: "Unlinked discussion feedback requires the durable discussion workflow." } }, { status: 503 });
    }
    const body = await request.json();
    if (!body || !body.topic) {
      return NextResponse.json(
        { success: false, error: "Topic is required for community feedback" },
        { status: 400 }
      );
    }

    const record = CommunityStore.registerFeedback({
      ...body,
      reporterId: principal.subjectId,
      cohort: principal.attributes?.cohort || "UNKNOWN"
    });
    return NextResponse.json({
      success: true,
      feedback: record,
      message: "Ghi nhận phản hồi thực tế thành công."
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "CREATE_COMMUNITY_FEEDBACK",
    requiredPermission: "COMMUNITY.POST",
    allowAnonymous: false
  },
  createCommunityFeedback
);
