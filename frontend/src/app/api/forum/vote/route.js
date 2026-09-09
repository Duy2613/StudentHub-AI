import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

// Compatibility memory ledger is explicitly demo-only. Production reactions
// are durable, claim/revision-bound, and never mutate author trust.
const VOTES_LEDGER = new Map();
const MAX_VOTE_KEYS = 50_000;

function demoMode() {
  return process.env.NODE_ENV !== "production" && (process.env.STUDENTHUB_PERSISTENCE_ADAPTER === "memory" || process.env.STUDENTHUB_COMMUNITY_DEMO === "true");
}

async function castForumVote(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  const postId = body?.postId;
  const type = body?.type;
  if (typeof postId !== "string" || postId.length > 160 || !postId || !["trust", "distrust", "helpful", "challenge"].includes(type)) {
    return NextResponse.json({ success: false, error: { code: "REACTION_INPUT_INVALID", userMessage: "Dữ liệu reaction không hợp lệ." } }, { status: 400 });
  }
  const kind = type === "trust" || type === "helpful" ? "HELPFUL" : "CHALLENGE";
  const idempotencyKey = request.headers.get("idempotency-key") || body?.idempotencyKey;
  if (demoMode()) {
    const key = `${postId}_${principal.subjectId}_${kind}`;
    const previous = VOTES_LEDGER.get(key);
    if (previous === type) VOTES_LEDGER.delete(key);
    else {
      if (!VOTES_LEDGER.has(key) && VOTES_LEDGER.size >= MAX_VOTE_KEYS) VOTES_LEDGER.delete(VOTES_LEDGER.keys().next().value);
      VOTES_LEDGER.set(key, type);
    }
    return NextResponse.json({ success: true, action: previous === type ? "RETRACTED" : previous ? "UPDATED" : "CAST", vote: previous === type ? null : { postId, kind, type }, provenance: "DEMO_FIXTURE", trustMutation: false });
  }
  if (!idempotencyKey) return NextResponse.json({ success: false, error: { code: "IDEMPOTENCY_KEY_REQUIRED", userMessage: "A stable Idempotency-Key is required." } }, { status: 400 });
  try {
    const reaction = await CommunityRepository.setReaction({
      userId: principal.subjectId,
      contributionId: postId,
      claimId: body.claimId || null,
      caseRevision: body.caseRevision,
      expectedRevision: body.expectedRevision ?? null,
      kind,
      value: body.value === -1 ? -1 : 1,
      idempotencyKey,
    });
    return NextResponse.json({ success: true, action: reaction.idempotent ? "IDEMPOTENT" : "SET", reaction, trustMutation: false, provenance: "DURABLE_POSTGRES", correlationId: securityContext.correlationId });
  } catch (error) {
    if (error instanceof CommunityRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode || 409 });
    return NextResponse.json({ success: false, error: { code: "REACTION_STORAGE_UNAVAILABLE", userMessage: "Reaction storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "VOTE_ON_COMMUNITY_POST", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 16 * 1024 }, castForumVote);
