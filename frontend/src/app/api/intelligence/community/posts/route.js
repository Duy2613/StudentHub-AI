/**
 * GET/POST /api/intelligence/community/posts
 *
 * Production reads and writes use CommunityRepository. The legacy JSON store
 * is available only behind an explicit non-production demo adapter and is
 * labelled as fixture data by the response.
 */

import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { createSecureId } from "@/lib/security/secureId.js";
import { redactText } from "@/lib/communityExpert/promaxDomain.js";
import { publishRealtimeEvent } from "@/lib/server/realtime/RealtimePublisher.js";

function demoMode() {
  return isCommunityDemoMode();
}

function errorResponse(error, correlationId) {
  if (error instanceof CommunityRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) {
    return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId } }, { status: error.statusCode });
  }
  if (["42P01", "42703", "3F000"].includes(error?.code)) {
    return NextResponse.json({ success: false, error: { code: "PROMAX_MIGRATION_REQUIRED", userMessage: "Community Promax storage is not available in this environment.", correlationId } }, { status: 503 });
  }
  return NextResponse.json({ success: false, error: { code: "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Community storage is temporarily unavailable.", correlationId } }, { status: 503 });
}

function inputFromBody(body) {
  return {
    caseId: body.caseId || body.caseScope?.caseId,
    caseRevision: body.caseRevision ?? body.caseScope?.caseRevision,
    claimId: body.claimId,
    contributionType: body.contributionType || "DIRECT_EXPERIENCE",
    statement: body.statement || body.content,
    evidenceRefs: body.evidenceRefs,
    evidenceRevisionIds: body.evidenceRevisionIds,
    metadata: body.metadata,
    ocrText: body.ocrText,
    qrContent: body.qrContent,
    source: body.source,
  };
}

async function listCommunityPosts(request) {
  const { searchParams } = new URL(request.url);
  const topic = (searchParams.get("topic") || "").slice(0, 80);
  if (demoMode()) {
    const posts = topic ? CommunityStore.getPostsByTopic(topic, { redactPrivate: true }) : CommunityStore.getAllPosts({ redactPrivate: true });
    return Response.json({ success: true, total: posts.length, posts, sourceState: "DEMO_FIXTURE", isAuthoritative: false, dataNotice: "Demo fixture only; community signals are not official evidence." });
  }
  try {
    const posts = await CommunityRepository.listContributions({
      caseId: searchParams.get("caseId") || null,
      claimId: searchParams.get("claimId") || null,
      sort: searchParams.get("sort") || "relevant",
      limit: Number(searchParams.get("limit") || 50),
    });
    return Response.json({ success: true, total: posts.length, posts, sourceState: "COMMUNITY_SIGNAL", isAuthoritative: false, rankingPolicyVersion: "community-ranking-v1", dataNotice: "Community contributions are signals attached to a case revision; Trust remains authoritative." });
  } catch (error) {
    return errorResponse(error);
  }
}

async function createCommunityIntelligencePost(request, routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = inputFromBody(body);
    const preview = CommunityRepository.previewContribution(input);
    const phase = String(body.phase || body.action || "PREVIEW").toUpperCase();
    const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;

    // A first request always returns a redacted preview. No original text or
    // file metadata is published until the client confirms this exact digest.
    if (phase !== "PUBLISH" || body.privacyConfirmed !== true) {
      return NextResponse.json({ success: true, state: preview.state, publicationState: preview.publicationState, preview, requiresConfirmation: preview.state === "PREVIEW_READY" }, { status: preview.state === "BLOCKED" ? 422 : 200 });
    }
    if (preview.state !== "PREVIEW_READY") {
      return NextResponse.json({ success: false, error: { code: "PRIVACY_SCAN_BLOCKED", userMessage: "The contribution cannot be published until identifying content is removed.", findings: preview.scan.findings } }, { status: 422 });
    }
    if (!body.previewDigest || body.previewDigest !== preview.previewDigest) {
      return NextResponse.json({ success: false, error: { code: "PREVIEW_DIGEST_MISMATCH", userMessage: "The privacy preview changed; generate a new preview before publishing." } }, { status: 409 });
    }
    if (demoMode()) {
      const saved = CommunityStore.savePost({
        ...body,
        postId: createSecureId("POST"),
        content: redactText(input.statement),
        authorId: principal.subjectId,
        authorCohort: principal.attributes?.cohort || "UNKNOWN",
        verifiedIdentity: principal.attributes?.emailVerified ? "VERIFIED_STUDENT" : "UNVERIFIED_GUEST",
        verificationState: principal.attributes?.emailVerified ? "VERIFIED_IDENTITY" : "KNOWN_ACCOUNT",
        moderationState: "CLEAN",
        upvotes: 0,
        promaxMode: "DEMO_ONLY",
      });
      return NextResponse.json({ success: true, state: "PUBLISHED", post: CommunityStore.getPost(saved.postId, { redactPrivate: true }), provenance: "DEMO_FIXTURE" }, { status: 201 });
    }
    if (!idempotencyKey) return NextResponse.json({ success: false, error: { code: "IDEMPOTENCY_KEY_REQUIRED", userMessage: "A stable Idempotency-Key is required." } }, { status: 400 });
    const saved = await CommunityRepository.createContribution({
      ...input,
      authorId: principal.subjectId,
      privacyFindings: preview.scan.findings,
      idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    void publishRealtimeEvent({
      channel: "community",
      eventType: "community:contribution",
      subjectId: principal.subjectId,
      classification: "PUBLIC",
      producer: "StudentHub-AI",
      environment: process.env.NODE_ENV || "development",
      correlationId: securityContext.correlationId,
      causationId: saved.contributionId,
      idempotencyKey: `community:contribution:${saved.contributionId}`,
      data: { contributionId: saved.contributionId, caseScope: saved.caseScope, claimId: saved.claimId, evidenceState: saved.evidenceState, reviewState: saved.reviewState },
    }).catch(() => {});
    return NextResponse.json({ success: true, state: saved.publicationState, post: saved, provenance: "DURABLE_POSTGRES", rankingPolicyVersion: saved.ranking?.policyVersion }, { status: saved.idempotent ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, securityContext?.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_INTELLIGENCE_POSTS", allowAnonymous: true, maxRequests: 90 }, listCommunityPosts);
export const POST = SecurityFabric.wrapHandler({ action: "CREATE_COMMUNITY_INTELLIGENCE_POST", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 512 * 1024 }, createCommunityIntelligencePost);
