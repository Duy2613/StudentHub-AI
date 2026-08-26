/**
 * StudentHub AI — API Route: GET /api/intelligence/community/experiences/[experienceId]
 * 
 * Retrieves detailed student experience report with privacy redaction.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function GET(req, { params }) {
  try {
    const { experienceId } = await params;
    if (!experienceId) {
      return NextResponse.json(
        { success: false, error: "experienceId is required." },
        { status: 400 }
      );
    }

    const post = CommunityStore.getPost(experienceId, { redactPrivate: true });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Experience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      experience: post
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving experience" },
      { status: 500 }
    );
  }
}
