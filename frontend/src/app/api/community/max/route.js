import { NextResponse } from "next/server";
import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { CommunityMaxRepository, CommunityMaxRepositoryError } from "@/lib/server/database/CommunityMaxRepository.js";
import {
  buildTransparentCommunityRanking,
  communityAuthorityBoundary,
  validateComposerInput,
} from "@/lib/communityMax/communityMaxDomain.js";

export const runtime = "nodejs";

const AUTHORITY_BOUNDARY = communityAuthorityBoundary();

function repository() {
  return new CommunityMaxRepository();
}

function idempotencyKey(request, body) {
  return request.headers.get("idempotency-key") || body?.idempotencyKey || "";
}

function inputFromBody(body) {
  return {
    intent: body.intent || body.contributionType,
    title: body.title,
    statement: body.statement || body.content,
    caseId: body.caseId || body.caseScope?.caseId,
    caseRevision: body.caseRevision ?? body.caseScope?.caseRevision,
    claimId: body.claimId,
    evidenceRevisionIds: body.evidenceRevisionIds || body.evidenceIds,
    sourceRefs: body.sourceRefs || body.evidenceRefs,
    metadata: body.metadata,
    ocrText: body.ocrText,
    qrContent: body.qrContent,
  };
}

function responseError(error, correlationId) {
  const statusCode = Number(error?.statusCode);
  const code = String(error?.code || "").toUpperCase();
  if (statusCode >= 400 && statusCode < 500 && code) {
    return NextResponse.json({
      success: false,
      error: {
        code,
        userMessage: String(error?.userMessage || error?.message || "The Community request was rejected.").slice(0, 500),
        correlationId,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
    }, { status: statusCode });
  }
  if (["42P01", "42703", "3F000"].includes(error?.code)) {
    return NextResponse.json({
      success: false,
      error: { code: "COMMUNITY_MAX_MIGRATION_REQUIRED", userMessage: "Community Max storage is not available in this environment.", correlationId },
      authorityBoundary: AUTHORITY_BOUNDARY,
    }, { status: 503 });
  }
  return NextResponse.json({
    success: false,
    error: { code: "COMMUNITY_MAX_STORAGE_UNAVAILABLE", userMessage: "Community Max storage is temporarily unavailable.", correlationId },
    authorityBoundary: AUTHORITY_BOUNDARY,
  }, { status: 503 });
}

async function readCommunityMax(request, _routeParams, principal, securityContext) {
  const url = new URL(request.url);
  const view = String(url.searchParams.get("view") || "contract").trim().toLowerCase();
  const contributionId = url.searchParams.get("contributionId");
  const contributionRevision = url.searchParams.get("contributionRevision") || url.searchParams.get("revision");
  const actorId = principal?.isAuthenticated ? principal.subjectId : null;
  const repo = repository();

  try {
    if (view === "contract") {
      return NextResponse.json({
        success: true,
        contractVersion: "community-max.v1",
        waves: {
          wave1: ["EVIDENCE_FIRST_COMPOSER", "CLAIM_LEVEL_DISCUSSION", "SOURCE_INDEPENDENCE", "REVISION_AWARENESS", "VERIFICATION_FRESHNESS"],
          wave2: ["HIGH_VALUE_DISAGREEMENT", "EVIDENCE_PASSPORT", "EXPERT_REQUEST", "AI_DISCUSSION_SUMMARY", "TRANSPARENT_RANKING"],
          wave3: ["SOURCE_RETRACTION", "CAMPUS_INTELLIGENCE", "RISK_PATTERN_CLUSTERING", "CORRECTION_CULTURE", "DATA_FLYWHEEL"],
        },
        authorityBoundary: AUTHORITY_BOUNDARY,
        externalGate: "STAGING_EMAIL_FINAL_ASSURANCE_PENDING",
        correlationId: securityContext.correlationId,
      });
    }
    if (!contributionId || !contributionRevision) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_SCOPE_REQUIRED", "A contribution ID and immutable revision are required.", 400);
    if (view === "discussions") {
      const discussions = await repo.listClaimDiscussions({ actorId, contributionId, contributionRevision, claimId: url.searchParams.get("claimId") || null });
      return NextResponse.json({ success: true, discussions, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    if (view === "sources") {
      const sources = await repo.listSourceReferences({ actorId, contributionId, contributionRevision });
      return NextResponse.json({ success: true, ...sources, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    if (view === "verification") {
      const verification = await repo.getVerificationProjection({ actorId, contributionId, contributionRevision });
      return NextResponse.json({ success: true, verification, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    if (view === "summary") {
      const summary = await repo.getDiscussionSummary({ actorId, contributionId, contributionRevision });
      return NextResponse.json({ success: true, summary, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    if (view === "campus") {
      const campus = await repo.getCampusContext({ actorId, contributionId, contributionRevision });
      return NextResponse.json({ success: true, campus, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    if (view === "passport") {
      if (!actorId) throw new CommunityMaxRepositoryError("AUTHENTICATION_REQUIRED", "An authenticated identity is required to read an Evidence Passport.", 401);
      const passport = await repo.getEvidencePassport({ actorId, caseId: url.searchParams.get("caseId") });
      return NextResponse.json({ success: true, passport, authorityOwner: "TRUST_V5", readOnly: true, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    if (view === "overview") {
      const [discussions, sources, verification, summary, campus] = await Promise.all([
        repo.listClaimDiscussions({ actorId, contributionId, contributionRevision }),
        repo.listSourceReferences({ actorId, contributionId, contributionRevision }),
        repo.getVerificationProjection({ actorId, contributionId, contributionRevision }),
        repo.getDiscussionSummary({ actorId, contributionId, contributionRevision }),
        repo.getCampusContext({ actorId, contributionId, contributionRevision }),
      ]);
      return NextResponse.json({ success: true, overview: { discussions, ...sources, verification, summary, campus }, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }
    throw new CommunityMaxRepositoryError("COMMUNITY_MAX_VIEW_INVALID", "The requested Community Max view is not supported.", 400);
  } catch (error) {
    return responseError(error, securityContext.correlationId);
  }
}

async function writeCommunityMax(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || body?.phase || "PREVIEW_COMPOSER").trim().toUpperCase();
  const actorId = principal.subjectId;
  const repo = repository();

  try {
    if (action === "PREVIEW_COMPOSER") {
      const validation = validateComposerInput(inputFromBody(body));
      let corePreview = null;
      if (validation.ok && validation.normalized.caseId && validation.normalized.caseRevision) {
        const evidenceRefs = validation.normalized.sourceRefs.map((source) => source.canonicalUrl);
        corePreview = CommunityRepository.previewContribution({
          caseId: validation.normalized.caseId,
          caseRevision: validation.normalized.caseRevision,
          claimId: validation.normalized.claimId,
          contributionType: validation.normalized.contributionType,
          statement: validation.normalized.statement,
          evidenceRefs,
          evidenceRevisionIds: validation.normalized.evidenceRevisionIds,
          metadata: body.metadata,
          ocrText: body.ocrText,
          qrContent: body.qrContent,
          source: validation.normalized.sourceRefs[0] || null,
        });
      }
      return NextResponse.json({
        success: validation.ok,
        state: validation.ok ? "PREVIEW_READY" : validation.privacy.blocked ? "BLOCKED" : "PREVIEW_INVALID",
        preview: { ...validation, core: corePreview ? { state: corePreview.state, publicationState: corePreview.publicationState, redactedStatement: corePreview.redactedStatement, scan: corePreview.scan, policyVersion: corePreview.policyVersion } : null },
        previewDigest: corePreview?.previewDigest || null,
        requiresCaseScopeToPublish: !validation.normalized.caseId || !validation.normalized.caseRevision,
        isAuthoritative: false,
        authorityBoundary: AUTHORITY_BOUNDARY,
        correlationId: securityContext.correlationId,
      }, { status: validation.ok ? 200 : 422 });
    }

    if (action === "PUBLISH_CONTRIBUTION") {
      const validation = validateComposerInput(inputFromBody(body));
      if (!validation.ok) throw new CommunityMaxRepositoryError(validation.errors[0]?.code || "COMMUNITY_MAX_COMPOSER_INVALID", "The contribution cannot pass the Community safety checks.", 422);
      if (body.privacyConfirmed !== true || !body.previewDigest) throw new CommunityMaxRepositoryError("PREVIEW_CONFIRMATION_REQUIRED", "Confirm the current privacy preview before publishing.", 409);
      const evidenceRefs = validation.normalized.sourceRefs.map((source) => source.canonicalUrl);
      const coreInput = {
        caseId: validation.normalized.caseId,
        caseRevision: validation.normalized.caseRevision,
        claimId: validation.normalized.claimId,
        contributionType: validation.normalized.contributionType,
        statement: validation.normalized.statement,
        evidenceRefs,
        evidenceRevisionIds: validation.normalized.evidenceRevisionIds,
        metadata: body.metadata,
        ocrText: body.ocrText,
        qrContent: body.qrContent,
        source: validation.normalized.sourceRefs[0] || null,
      };
      const corePreview = CommunityRepository.previewContribution(coreInput);
      if (corePreview.state !== "PREVIEW_READY") throw new CommunityMaxRepositoryError("PRIVACY_SCAN_BLOCKED", "The contribution contains identifying content and cannot be published.", 422);
      if (body.previewDigest !== corePreview.previewDigest) throw new CommunityMaxRepositoryError("PREVIEW_DIGEST_MISMATCH", "The privacy preview changed; generate a new preview before publishing.", 409);
      const saved = await CommunityRepository.createContribution({
        ...coreInput,
        authorId: actorId,
        privacyFindings: corePreview.scan.findings,
        idempotencyKey: idempotencyKey(request, body),
        correlationId: securityContext.correlationId,
      });
      return NextResponse.json({ success: true, state: saved.publicationState, contribution: saved, evidenceFirst: true, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: saved.idempotent ? 200 : 201 });
    }

    if (action === "DISCUSS") {
      const result = await repo.createClaimDiscussion({
        authorId: actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        claimId: body.claimId,
        action: body.discussionAction || body.actionType || body.kind,
        body: body.body || body.content,
        evidenceReferenceIds: body.evidenceReferenceIds || body.sourceReferenceIds,
        idempotencyKey: idempotencyKey(request, body),
      });
      return NextResponse.json({ success: true, ...result, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: result.idempotent ? 200 : 201 });
    }

    if (action === "ATTACH_SOURCES") {
      const result = await repo.attachSourceReferences({
        createdBy: actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        sources: body.sources || body.sourceRefs || [],
        idempotencyKey: idempotencyKey(request, body),
      });
      return NextResponse.json({ success: true, ...result, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: 201 });
    }

    if (action === "REQUEST_VERIFICATION") {
      const result = await repo.requestVerification({
        actorId: actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        sourceReferenceIds: body.sourceReferenceIds || [],
      });
      return NextResponse.json({ success: true, ...result, authorityOwner: "TRUST_V5", nextAction: "CANONICAL_TRUST_FLOW_REQUIRED", authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: result.idempotent ? 200 : 202 });
    }

    if (action === "REQUEST_REVIEW") {
      const result = await repo.createReviewCandidate({
        actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        claimId: body.claimId || null,
        supportSignals: body.supportSignals || [],
        challengeSignals: body.challengeSignals || [],
        sourceStates: body.sourceStates || [],
        evidenceStates: body.evidenceStates || [],
        discussionCount: body.discussionCount,
        idempotencyKey: idempotencyKey(request, body),
      });
      return NextResponse.json({ success: true, ...result, queueOnly: true, isAuthoritative: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: 202 });
    }

    if (action === "REQUEST_EXPERT") {
      const result = await repo.createExpertRequest({
        requesterId: actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        claimId: body.claimId || null,
        domainCode: body.domainCode || body.topic,
        reason: body.reason,
        priority: body.priority,
        idempotencyKey: idempotencyKey(request, body),
      });
      return NextResponse.json({ success: true, ...result, queueOnly: true, expertAuthorityMutation: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: result.idempotent ? 200 : 202 });
    }

    if (action === "SUMMARY") {
      const result = await repo.createDiscussionSummary({ actorId, contributionId: body.contributionId, contributionRevision: body.contributionRevision ?? body.revision });
      return NextResponse.json({ success: true, ...result, finalVerdict: false, providerStatus: result.summary?.providerStatus, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: result.idempotent ? 200 : 201 });
    }

    if (action === "RANK") {
      return NextResponse.json({ success: true, rankings: buildTransparentCommunityRanking(body.candidates || []), isTruthVerdict: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }

    if (action === "UPDATE_SOURCE_STATUS") {
      if (!principal.hasPermission("ADMIN.SECURITY") && !principal.hasPermission("COMMUNITY.MODERATE")) throw new CommunityMaxRepositoryError("COMMUNITY_MAX_MODERATION_REQUIRED", "An authorized moderator is required to update source status.", 403);
      const result = await repo.updateSourceState({
        actorId,
        sourceReferenceId: body.sourceReferenceId,
        sourceState: body.sourceState,
        reason: body.reason,
        actorType: principal.hasPermission("ADMIN.SECURITY") ? "SYSTEM" : "MODERATOR",
      });
      return NextResponse.json({ success: true, ...result, trustMutation: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId });
    }

    if (action === "CAMPUS_CONTEXT") {
      const result = await repo.upsertCampusContext({
        actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        institutionId: body.institutionId,
        universityLabel: body.universityLabel,
        faculty: body.faculty,
        major: body.major,
        topic: body.topic,
        visibility: body.visibility,
        consent: body.consent === true,
        consentState: body.consentState,
      });
      return NextResponse.json({ success: true, ...result, inferred: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: 200 });
    }

    if (action === "RISK_SIGNAL") {
      const result = await repo.clusterRiskSignal({
        actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        riskType: body.riskType,
        signalType: body.signalType,
        sourceDigest: body.sourceDigest,
        topic: body.topic,
        severity: body.severity,
        confidence: body.confidence,
      });
      return NextResponse.json({ success: true, ...result, private: true, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: 201 });
    }

    if (action === "CORRECTION") {
      const result = await repo.createCorrection({
        actorId,
        contributionId: body.contributionId,
        expectedRevision: body.expectedRevision ?? body.contributionRevision ?? body.revision,
        correctionType: body.correctionType,
        statement: body.statement || body.content,
        caseId: body.caseId || body.caseScope?.caseId,
        caseRevision: body.caseRevision ?? body.caseScope?.caseRevision,
        claimId: body.claimId,
        evidenceRefs: body.evidenceRefs || body.sourceRefs,
        evidenceRevisionIds: body.evidenceRevisionIds,
        metadata: body.metadata,
        ocrText: body.ocrText,
        qrContent: body.qrContent,
        source: body.source,
        contributionType: body.contributionType,
        privacyConfirmed: body.privacyConfirmed,
        previewDigest: body.previewDigest,
        idempotencyKey: idempotencyKey(request, body),
      });
      return NextResponse.json({ success: true, ...result, integritySignalOnly: true, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: result.idempotent ? 200 : 201 });
    }

    if (action === "DATA_CANDIDATE") {
      const result = await repo.createDataCandidate({
        actorId,
        contributionId: body.contributionId,
        contributionRevision: body.contributionRevision ?? body.revision,
        candidateType: body.candidateType,
      });
      return NextResponse.json({ success: true, ...result, trainingEligible: false, automaticTraining: false, authorityBoundary: AUTHORITY_BOUNDARY, correlationId: securityContext.correlationId }, { status: result.idempotent ? 200 : 201 });
    }

    throw new CommunityMaxRepositoryError("COMMUNITY_MAX_ACTION_INVALID", "The Community Max action is not supported.", 400);
  } catch (error) {
    return responseError(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_MAX", allowAnonymous: true, maxRequests: 90, maxBodyBytes: 0 }, readCommunityMax);
export const POST = SecurityFabric.wrapHandler({ action: "WRITE_COMMUNITY_MAX", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 512 * 1024 }, writeCommunityMax);
