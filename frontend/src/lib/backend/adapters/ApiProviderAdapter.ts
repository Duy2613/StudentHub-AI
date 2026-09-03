import { z } from "zod";
import { ApiError } from "../../api/errors";
import { apiRequest } from "../../api/client";
import {
  communityExperienceResponseSchema,
  communityPostSchema,
  communityPostResponseSchema,
  createCommunityPost,
  getCommunityExperience,
  getCommunityPosts,
  type CommunityPostsOptions,
} from "../../api/community";
import {
  evaluateExpertClaim,
  expertDetailResponseSchema,
  expertEvaluationResponseSchema,
  expertListResponseSchema,
  listExperts,
  getExpert as getExpertProfile,
  type ExpertClaimInput,
  type ExpertListQuery,
} from "../../api/experts";
import { trustApi, type TrustInput, type TrustV5Event } from "../../api/trust";
import { trustV5ResponseSchema } from "../../api/schemas/trust";
import {
  caseScopeSchema,
  communityEvidenceSchema,
  communityObservationCommandSchema,
  communityObservationListSchema,
  communityObservationSchema,
  communityQuerySchema,
  createProviderResult,
  expertAssessmentCommandSchema,
  expertAssessmentSchema,
  expertProfileSchema,
  expertQuerySchema,
  evidencePassportSchema,
  passportAppendRevisionCommandSchema,
  passportCreateCommandSchema,
  passportRevisionSchema,
  providerFailure,
  trustInvestigationInputSchema,
  trustProviderObservationSchema,
  trustRelatedCaseSchema,
  trustInvestigationResultSchema,
  unavailableResult,
  type CommunityObservation,
  type CommunityObservationCommand,
  type CommunityProvider,
  type CommunityQuery,
  type EvidencePassport,
  type ExpertAssessment,
  type ExpertAssessmentCommand,
  type ExpertProfile,
  type ExpertProvider,
  type ExpertQuery,
  type PassportAppendRevisionCommand,
  type PassportCreateCommand,
  type PassportProvider,
  type PassportRevision,
  type ProviderBundle,
  type ProviderResult,
  type TrustInvestigationInput,
  type TrustInvestigationResult,
  type TrustProvider,
} from "../ports";

type TrustTransport = (input: TrustInput, signal?: AbortSignal, onEvent?: (event: TrustV5Event) => void, requestId?: string) => Promise<unknown>;
type CommunityTransport = (options?: CommunityPostsOptions) => Promise<unknown>;
type CommunityCreateTransport = (input: { content: string; evidenceRefs: readonly string[]; caseScope: { caseId: string; caseRevision: number } }, signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type CommunityReadTransport = (observationId: string, signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type ExpertListTransport = (query?: ExpertListQuery, signal?: AbortSignal) => Promise<unknown>;
type ExpertReadTransport = (expertId: string, signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type ExpertAssessmentTransport = (input: ExpertClaimInput, signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type PassportListTransport = (signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type PassportReadTransport = (passportId: string, signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type PassportCreateTransport = (input: { title: string; subjectType: string; subjectId: string }, signal?: AbortSignal, requestId?: string) => Promise<unknown>;
type PassportAppendTransport = (passportId: string, input: { summary: string; metadata?: Record<string, unknown> }, signal?: AbortSignal, requestId?: string) => Promise<unknown>;

export type ApiProviderTransport = Readonly<{
  trustInvestigate: TrustTransport;
  listCommunityPosts: CommunityTransport;
  createCommunityPost: CommunityCreateTransport;
  readCommunityObservation: CommunityReadTransport;
  listExperts: ExpertListTransport;
  readExpert: ExpertReadTransport;
  evaluateExpertClaim: ExpertAssessmentTransport;
  listPassports: PassportListTransport;
  readPassport: PassportReadTransport;
  createPassport: PassportCreateTransport;
  appendPassport: PassportAppendTransport;
}>;

const passportListResponseSchema = z.object({ success: z.literal(true), passports: z.array(z.unknown()) }).passthrough();
const passportResponseSchema = z.object({ success: z.literal(true), passport: z.unknown() }).passthrough();

const DEFAULT_TRANSPORT: ApiProviderTransport = {
  trustInvestigate: (input, signal, onEvent, requestId) => trustApi.sequential(input, signal, onEvent, requestId),
  listCommunityPosts: (options) => getCommunityPosts(options),
  createCommunityPost: (input, signal, requestId) => createCommunityPost(input, signal, requestId),
  readCommunityObservation: (observationId, signal, requestId) => getCommunityExperience(observationId, signal, requestId),
  listExperts: (query, signal) => listExperts(query, signal),
  readExpert: (expertId, signal, requestId) => getExpertProfile(expertId, signal, requestId),
  evaluateExpertClaim: (input, signal, requestId) => evaluateExpertClaim(input, signal, requestId),
  listPassports: (signal, requestId) => apiRequest("/api/v1/passports", { signal, requestId, schema: passportListResponseSchema }),
  readPassport: (passportId, signal, requestId) => apiRequest(`/api/v1/passports/${encodeURIComponent(passportId)}`, { signal, requestId, schema: passportResponseSchema }),
  createPassport: (input, signal, requestId) => apiRequest("/api/v1/passports", { method: "POST", body: JSON.stringify(input), signal, requestId, schema: passportResponseSchema }),
  appendPassport: (passportId, input, signal, requestId) => apiRequest(`/api/v1/passports/${encodeURIComponent(passportId)}`, { method: "PATCH", body: JSON.stringify(input), signal, requestId, schema: passportResponseSchema }),
};

function errorIssues(error: { issues?: readonly { path: PropertyKey[]; message: string }[] }): string[] {
  return (error.issues || []).slice(0, 5).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

function invalidResponse<T>(requestId?: string, runId?: string, issues: string[] = []): ProviderResult<T> {
  return providerFailure({
    requestedMode: "LIVE",
    dependency: "same-origin-api",
    error: new ApiError("The provider response did not match the approved contract.", "SCHEMA_MISMATCH", { issues }),
    requestId,
    runId,
  });
}

function invalidInput<T>(requestId?: string, runId?: string, issues: string[] = []): ProviderResult<T> {
  return providerFailure({
    requestedMode: "LIVE",
    dependency: "same-origin-api",
    error: new ApiError("Input does not match the canonical contract.", "VALIDATION", { issues }),
    requestId,
    runId,
  });
}

function transportInput(input: TrustInvestigationInput): TrustInput | null {
  if (input.type === "QR_READY") {
    return {
      type: "text",
      content: input.content,
      metadata: { ...input.metadata, inputKind: "QR", extractionAuthority: input.metadata.extractionAuthority || "CLIENT_QR_HINT", qrContent: input.content },
    };
  }
  return {
    type: input.type === "URL" ? "url" : input.type === "IMAGE" ? "image" : "text",
    content: input.content,
    metadata: input.metadata,
  };
}

function statusForStage(operationStatus: string): "AVAILABLE" | "PARTIAL" | "UNKNOWN" | "ERROR" | "UNAVAILABLE" {
  if (operationStatus === "COMPLETED") return "AVAILABLE";
  if (operationStatus === "PARTIAL") return "PARTIAL";
  if (operationStatus === "FAILED") return "ERROR";
  if (operationStatus === "RUNNING" || operationStatus === "QUEUED") return "UNKNOWN";
  return "UNAVAILABLE";
}

function decisionState(value: { security: string; truth: string; action: string }): TrustInvestigationResult["decision"]["epistemicState"] {
  const text = `${value.security} ${value.truth} ${value.action}`.toUpperCase();
  if (text.includes("CONFLICT") || text.includes("DISPUTED") || text.includes("MIXED")) return "CONFLICTING_EVIDENCE";
  if (text.includes("INSUFFICIENT") || text.includes("BLOCKED_BY_MISSING_EVIDENCE")) return "INSUFFICIENT_EVIDENCE";
  if (text.includes("UNKNOWN")) return "UNKNOWN";
  if (text.includes("DANGEROUS") || text.includes("MALICIOUS")) return "DANGEROUS";
  if (text.includes("HIGH_RISK")) return "HIGH_RISK";
  if (text.includes("SUSPICIOUS")) return "SUSPICIOUS";
  return "SUPPORTED";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizedScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const normalized = value > 1 && value <= 100 ? value / 100 : value;
  return normalized >= 0 && normalized <= 1 ? normalized : null;
}

function normalizedFindingStatus(value: unknown): "CLEAN" | "FINDINGS" | "UNKNOWN" | "ERROR" | "UNAVAILABLE" {
  const status = String(value || "UNKNOWN").toUpperCase();
  if (status === "CLEAN" || status === "PASS" || status === "NO_KNOWN_THREAT") return "CLEAN";
  if (status === "FINDINGS" || status === "THREAT_MATCH" || status === "SUSPICIOUS") return "FINDINGS";
  if (status === "ERROR" || status === "FAILED") return "ERROR";
  if (status === "UNAVAILABLE" || status === "NOT_CONFIGURED" || status === "TIMEOUT") return "UNAVAILABLE";
  return "UNKNOWN";
}

function nullableTimestamp(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function providerObservationsFromPipeline(pipeline: Record<string, unknown>): TrustInvestigationResult["providerObservations"] | null {
  const layerResults = asRecord(pipeline.layerResults);
  const layer3 = asRecord(layerResults.layer3);
  const rawProviders = Array.isArray(layer3.providerResults) ? layer3.providerResults : [];
  const normalized = rawProviders.map((value) => {
    const provider = asRecord(value);
    return trustProviderObservationSchema.safeParse({
      providerId: typeof provider.provider === "string" ? provider.provider : "",
      status: normalizedFindingStatus(provider.status),
      observedAt: nullableTimestamp(provider.observedAt),
      latencyMs: typeof provider.latencyMs === "number" && Number.isFinite(provider.latencyMs) && provider.latencyMs >= 0 ? provider.latencyMs : null,
      signals: Array.isArray(provider.signals) && provider.signals.every((item) => typeof item === "string") ? provider.signals.slice(0, 50) : [],
    });
  });
  return normalized.every((item) => item.success) ? normalized.map((item) => item.data) : null;
}

function relatedCasesFromPipeline(pipeline: Record<string, unknown>): TrustInvestigationResult["relatedCases"] | null {
  const layerResults = asRecord(pipeline.layerResults);
  const layer3 = asRecord(layerResults.layer3);
  const layer4 = asRecord(layerResults.layer4);
  const rawCases = Array.isArray(layer3.relatedCases) ? layer3.relatedCases : Array.isArray(layer4.relatedCases) ? layer4.relatedCases : [];
  const normalized = rawCases.map((value) => {
    const related = asRecord(value);
    return trustRelatedCaseSchema.safeParse({
      caseId: typeof related.id === "string" ? related.id : "",
      title: typeof related.title === "string" && related.title.trim() ? related.title : null,
      similarity: normalizedScore(related.similarity),
      sharedSignals: Array.isArray(related.sharedSignals) && related.sharedSignals.every((item) => typeof item === "string") ? related.sharedSignals.slice(0, 50) : [],
      observedAt: nullableTimestamp(related.observedAt),
    });
  });
  return normalized.every((item) => item.success) ? normalized.map((item) => item.data) : null;
}

function trustResultFromResponse(input: TrustInvestigationInput, raw: unknown): ProviderResult<TrustInvestigationResult> {
  const parsed = trustV5ResponseSchema.safeParse(raw);
  if (!parsed.success) return invalidResponse(input.requestId, input.runId, errorIssues(parsed.error));

  const pipeline = parsed.data.data;
  const pipelineRecord = pipeline as unknown as Record<string, unknown>;
  const finalDecision = pipeline.finalDecision;
  const providerObservations = providerObservationsFromPipeline(pipelineRecord);
  const relatedCases = relatedCasesFromPipeline(pipelineRecord);
  if (!providerObservations || !relatedCases) return invalidResponse(input.requestId, input.runId, ["trust presentation records failed canonical normalization"]);
  const layerResults = asRecord(pipelineRecord.layerResults);
  const layer3 = asRecord(layerResults.layer3);
  const layer4 = asRecord(layerResults.layer4);
  const layer4Explanation = asRecord(layer4.userExplanation);

  const stageValues = Object.values(pipeline.stages);
  const stages = stageValues.map((stage) => ({
    stageId: stage.stageId,
    status: statusForStage(stage.operationStatus),
    finding: stage.finding,
    summary: stage.summary,
    missingScope: statusForStage(stage.operationStatus) === "AVAILABLE" ? [] : [stage.stageId],
  }));
  const provenance = {
    requestedMode: "LIVE" as const,
    sourceMode: "LIVE" as const,
    kind: "LIVE_PROVIDER" as const,
    label: "Approved same-origin live provider",
    providerId: "trust-api",
  };
  const evidence = stageValues.flatMap((stage) => stage.evidenceRefs.map((sourceId, index) => ({
    evidenceId: `trust-ref:${stage.stageId}:${index}`,
    sourceId,
    sourceType: "LIVE_PROVIDER" as const,
    summary: stage.summary,
    observedAt: stage.completedAt,
    provenance,
  })));
  const missing = stages.flatMap((stage) => stage.missingScope);
  const unresolvedSignals = [
    ...(pipeline.assurance?.assuranceReasons || []),
    ...stages.filter((stage) => stage.status === "UNKNOWN").map((stage) => `${stage.stageId} returned no determinate finding.`),
  ];
  const resolvedMissing = pipeline.pipelineStatus === "PARTIAL" && missing.length === 0
    ? ["trust-pipeline-completion"]
    : missing;
  if (!finalDecision) {
    const incompleteState = pipeline.pipelineStatus === "PARTIAL"
      ? "PARTIAL" as const
      : pipeline.pipelineStatus === "FAILED"
        ? "ERROR" as const
        : pipeline.pipelineStatus === "CANCELLED"
          ? "CANCELLED" as const
          : pipeline.pipelineStatus === "IDLE" || pipeline.pipelineStatus === "RUNNING"
            ? "LOADING" as const
            : "INSUFFICIENT_EVIDENCE" as const;
    const incompleteUnknowns = [...unresolvedSignals, "Live Trust pipeline did not return a final decision."];
    return createProviderResult({
      state: incompleteState,
      phase: `TRUST_${pipeline.pipelineStatus}`,
      requestedMode: "LIVE",
      providerStatus: incompleteState === "PARTIAL" ? "PARTIAL" : incompleteState === "ERROR" ? "ERROR" : incompleteState === "CANCELLED" ? "CANCELLED" : "UNKNOWN",
      provenance,
      ...(incompleteState === "PARTIAL" ? { data: null } : {}),
      requestId: input.requestId,
      runId: input.runId,
      unknowns: incompleteUnknowns,
      missing: resolvedMissing.length ? resolvedMissing : ["trust-final-decision"],
      ...(incompleteState === "ERROR" ? { error: new ApiError("The Trust pipeline failed.", "SERVER_ERROR", { retryable: true }).toSafeError() } : {}),
      retryable: incompleteState === "ERROR" || incompleteState === "PARTIAL" || incompleteState === "LOADING",
      nextActions: incompleteState === "CANCELLED" ? [{ id: "START_OVER", label: "Bắt đầu lại" }] : incompleteState === "LOADING" ? [{ id: "CANCEL", label: "Dừng kiểm tra" }] : [{ id: "RETRY", label: "Thử lại" }],
    });
  }
  const decision = decisionState(finalDecision);
  const state = pipeline.pipelineStatus === "IDLE" || pipeline.pipelineStatus === "RUNNING"
    ? "UNKNOWN" as const
    : decision === "CONFLICTING_EVIDENCE"
      ? "CONFLICTING_EVIDENCE" as const
      : decision === "INSUFFICIENT_EVIDENCE"
        ? "INSUFFICIENT_EVIDENCE" as const
        : decision === "UNKNOWN"
          ? "UNKNOWN" as const
          : "SUCCESS" as const;
  const unknowns = unresolvedSignals.length || !["UNKNOWN", "INSUFFICIENT_EVIDENCE", "CONFLICTING_EVIDENCE"].includes(state)
    ? unresolvedSignals
    : [`Trust decision is ${state}; no stronger conclusion is supported by this response.`];
  const data: TrustInvestigationResult = {
    contractVersion: parsed.data.contractVersion,
    caseId: input.scope?.caseId || null,
    caseRevision: input.scope?.caseRevision ?? null,
    runId: input.runId,
    generatedAt: pipeline.completedAt,
    decision: {
      security: finalDecision.security,
      truth: finalDecision.truth,
      action: finalDecision.action,
       epistemicState: decision,
    },
    metrics: {
      risk: finalDecision.security || null,
      confidence: normalizedScore(layer4.confidence ?? layer4.decisionConfidence ?? asRecord(layer4.riskAssessment).confidence),
      evidenceCoverage: normalizedScore(layer3.verificationCompleteness ?? layer3.evidenceCompleteness),
      sourceAgreement: typeof layer3.sourceAgreement === "string" && layer3.sourceAgreement.trim() ? layer3.sourceAgreement : null,
      unresolvedSignals,
    },
    reasons: [
      ...(typeof layer4Explanation.why === "string" ? [layer4Explanation.why] : []),
      ...(typeof layer4Explanation.riskSummary === "string" ? [layer4Explanation.riskSummary] : []),
      ...(pipeline.assurance?.assuranceReasons || []),
    ].filter((reason, index, values) => values.indexOf(reason) === index).slice(0, 100),
    recommendedAction: typeof layer4Explanation.recommendedActionNote === "string" && layer4Explanation.recommendedActionNote.trim()
      ? layer4Explanation.recommendedActionNote
      : finalDecision.action || null,
    unknowns,
    stages,
    evidence,
    providerObservations,
    relatedCases,
    links: [],
  };
  const contract = trustInvestigationResultSchema.safeParse(data);
  if (!contract.success) return invalidResponse(input.requestId, input.runId, errorIssues(contract.error));

  const base = {
    requestedMode: "LIVE" as const,
    providerStatus: pipeline.pipelineStatus === "PARTIAL"
      ? "PARTIAL" as const
      : pipeline.pipelineStatus === "FAILED"
        ? "ERROR" as const
        : pipeline.pipelineStatus === "IDLE" || pipeline.pipelineStatus === "RUNNING"
          ? "UNKNOWN" as const
          : "AVAILABLE" as const,
    provenance,
    data: contract.data,
    requestId: input.requestId,
    runId: input.runId,
    unknowns,
    missing: resolvedMissing,
  };
  if (pipeline.pipelineStatus === "FAILED") {
    return createProviderResult({
      ...base,
      state: "ERROR",
      error: new ApiError("The Trust pipeline failed.", "SERVER_ERROR").toSafeError(),
      nextActions: [{ id: "RETRY", label: "Thử lại" }],
    });
  }
  if (pipeline.pipelineStatus === "CANCELLED") return createProviderResult({ ...base, state: "CANCELLED", nextActions: [{ id: "START_OVER", label: "Bắt đầu lại" }] });
  if (state === "CONFLICTING_EVIDENCE") return createProviderResult({ ...base, state, trust: { kind: "TRUST_DECISION", value: state }, nextActions: [{ id: "REVIEW_UNKNOWN", label: "Xem các điểm xung đột" }] });
  if (state === "INSUFFICIENT_EVIDENCE") return createProviderResult({ ...base, state, trust: { kind: "TRUST_DECISION", value: state }, nextActions: [{ id: "CHECK_OFFICIAL_SOURCE", label: "Đối chiếu nguồn chính thức" }] });
  if (state === "UNKNOWN") return createProviderResult({ ...base, state, trust: { kind: "TRUST_DECISION", value: state }, nextActions: [{ id: "REVIEW_UNKNOWN", label: "Xem điểm chưa biết" }] });
  if (pipeline.pipelineStatus === "PARTIAL" || resolvedMissing.length) return createProviderResult({ ...base, state: "PARTIAL", nextActions: [{ id: "RETRY", label: "Thử lại phần còn thiếu" }] });
  return createProviderResult({ ...base, state: "SUCCESS", nextActions: [] });
}

function contextDetailsFromApi(value: unknown): Record<string, string> | null {
  const raw = asRecord(value);
  const fields = ["institution", "faculty", "department", "program", "cohort", "semester", "procedure", "channel"];
  const details = Object.fromEntries(fields.flatMap((field) => {
    const item = raw[field];
    return typeof item === "string" && item.trim() ? [[field, item.trim().slice(0, 240)]] : [];
  }));
  return Object.keys(details).length ? details : null;
}

function contextSummaryFromApi(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 12_000);
  const details = contextDetailsFromApi(value);
  if (!details) return null;
  return Object.values(details).join(" · ").slice(0, 12_000);
}

function caseScopeFromApi(value: unknown) {
  const candidate = asRecord(value);
  const parsed = caseScopeSchema.safeParse({ caseId: candidate.caseId, caseRevision: candidate.caseRevision });
  return parsed.success ? parsed.data : null;
}

function referencesFromApi(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    const reference = asRecord(item);
    return typeof reference.id === "string" ? reference.id : null;
  }).filter((item): item is string => Boolean(item && item.trim())).slice(0, 50);
}

function evidenceFromApi(value: unknown): CommunityObservation["evidence"] {
  if (!Array.isArray(value)) return [];
  const provenance = { requestedMode: "LIVE" as const, sourceMode: "LIVE" as const, kind: "COMMUNITY" as const, label: "Live community evidence", providerId: "community-api" };
  return value.map((item, index) => {
    const evidence = asRecord(item);
    const reference = typeof evidence.reference === "string" ? evidence.reference : typeof evidence.url === "string" ? evidence.url : typeof evidence.id === "string" ? evidence.id : "";
    const parsed = communityEvidenceSchema.safeParse({
      evidenceId: typeof evidence.evidenceId === "string" ? evidence.evidenceId : typeof evidence.id === "string" ? evidence.id : `community-evidence:${index}`,
      kind: ["URL", "TEXT", "IMAGE", "DOCUMENT", "OTHER"].includes(String(evidence.kind).toUpperCase()) ? String(evidence.kind).toUpperCase() : "OTHER",
      reference,
      summary: typeof evidence.summary === "string" && evidence.summary.trim() ? evidence.summary : null,
      observedAt: nullableTimestamp(evidence.observedAt),
      provenance,
    });
    return parsed.success ? parsed.data : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function observationFromPost(post: Record<string, unknown>): CommunityObservation | null {
  const observedAt = nullableTimestamp(post.observedAt || post.publishedAt || post.createdAt || post.timestamp);
  const submittedAt = nullableTimestamp(post.submittedAt || post.createdAt || post.timestamp);
  const contextDetails = contextDetailsFromApi(post.context);
  const evidenceRefs = referencesFromApi(post.evidenceRefs || post.references);
  const candidate = {
    observationId: post.postId,
    caseScope: caseScopeFromApi(post.caseScope || post.scope),
    title: typeof post.title === "string" && post.title.trim() ? post.title : null,
    topic: typeof post.topic === "string" && post.topic.trim() ? post.topic : null,
    statement: typeof post.content === "string" ? post.content : typeof post.body === "string" ? post.body : post.statement,
    context: contextSummaryFromApi(post.context),
    contextDetails,
    observedAt,
    submittedAt,
    evidenceRefs,
    evidence: evidenceFromApi(post.evidence),
    freshnessStatus: typeof post.freshnessStatus === "string" ? post.freshnessStatus : typeof post.recency === "string" ? post.recency : null,
    moderationStatus: typeof post.moderationStatus === "string" ? post.moderationStatus : typeof post.moderationState === "string" ? post.moderationState : typeof post.status === "string" && post.status.trim() ? post.status : null,
  };
  const parsed = communityObservationSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function profileFromApi(value: Record<string, unknown>): ExpertProfile | null {
  const scopes = Array.isArray(value.scopes) ? value.scopes.map((scope) => {
    const raw = asRecord(scope);
    const domain = typeof raw.domain === "string" ? raw.domain : "";
    const level = typeof raw.level === "string" ? raw.level : "";
    return {
      domain,
      level,
      ...(typeof raw.subdomain === "string" ? { subdomain: raw.subdomain } : {}),
      ...(typeof raw.jurisdiction === "string" ? { jurisdiction: raw.jurisdiction } : {}),
      ...(typeof raw.citationCount === "number" && Number.isInteger(raw.citationCount) && raw.citationCount >= 0 ? { citationCount: raw.citationCount } : {}),
      ...(typeof raw.recencyYear === "number" && Number.isInteger(raw.recencyYear) ? { recencyYear: raw.recencyYear } : {}),
      ...(typeof raw.isEstablished === "boolean" ? { isEstablished: raw.isEstablished } : {}),
    };
  }).filter((scope) => scope.domain && scope.level) : [];
  const credentials = Array.isArray(value.credentials) ? value.credentials.map((credential) => {
    const raw = asRecord(credential);
    return {
      credentialId: raw.credentialId,
      type: raw.type,
      field: typeof raw.field === "string" ? raw.field : null,
      issuer: typeof raw.issuer === "string" ? raw.issuer : null,
      issuedYear: typeof raw.issuedYear === "number" && Number.isInteger(raw.issuedYear) ? raw.issuedYear : null,
      status: typeof raw.status === "string" ? raw.status : "UNKNOWN",
    };
  }).filter((credential) => typeof credential.credentialId === "string" && typeof credential.type === "string") : [];
  const publications = Array.isArray(value.publications) ? value.publications.map((publication) => {
    const raw = asRecord(publication);
    return {
      pubId: raw.pubId,
      title: raw.title,
      venue: typeof raw.venue === "string" ? raw.venue : null,
      year: typeof raw.year === "number" && Number.isInteger(raw.year) ? raw.year : null,
      domain: typeof raw.domain === "string" ? raw.domain : null,
      doi: typeof raw.doi === "string" ? raw.doi : null,
    };
  }).filter((publication) => typeof publication.pubId === "string" && typeof publication.title === "string") : [];
  const verification = asRecord(value.verificationSummary);
  const verificationSummary = typeof value.verificationSummary === "object" && value.verificationSummary
    ? {
      status: typeof verification.status === "string" ? verification.status : "UNKNOWN",
      identity: verification.identity === "VERIFIED" ? "VERIFIED" as const : "UNVERIFIED" as const,
      affiliation: typeof verification.affiliation === "string" ? verification.affiliation : "UNKNOWN",
      verifiedCredentials: typeof verification.verifiedCredentials === "number" && Number.isInteger(verification.verifiedCredentials) ? verification.verifiedCredentials : 0,
      groundedPublications: typeof verification.groundedPublications === "number" && Number.isInteger(verification.groundedPublications) ? verification.groundedPublications : 0,
      latestResearchYear: typeof verification.latestResearchYear === "number" && Number.isInteger(verification.latestResearchYear) ? verification.latestResearchYear : null,
      researchFreshness: typeof verification.researchFreshness === "string" ? verification.researchFreshness : "UNKNOWN",
      activeConflicts: typeof verification.activeConflicts === "number" && Number.isInteger(verification.activeConflicts) ? verification.activeConflicts : 0,
      lastCheckedAt: nullableTimestamp(verification.lastCheckedAt),
      evidenceGrade: ["A", "B", "C", "D"].includes(String(verification.evidenceGrade)) ? String(verification.evidenceGrade) as "A" | "B" | "C" | "D" : null,
    }
    : undefined;
  const boundaries = asRecord(value.authorityBoundaries);
  const authorityBoundaries = typeof value.authorityBoundaries === "object" && value.authorityBoundaries
    ? {
      establishedDomains: referencesFromApi(boundaries.establishedDomains),
      limitedDomains: referencesFromApi(boundaries.limitedDomains),
      outOfScopeDomains: referencesFromApi(boundaries.outOfScopeDomains),
      institutionalAuthority: boundaries.institutionalAuthority === true,
      warning: typeof boundaries.warning === "string" ? boundaries.warning : "Chuyên môn không tự tạo ra thẩm quyền ban hành quy chế.",
    }
    : undefined;
  const candidate = {
    expertId: value.expertId,
    name: value.name,
    title: typeof value.title === "string" ? value.title : typeof value.academicTitle === "string" ? value.academicTitle : null,
    institution: typeof value.institution === "string" ? value.institution : null,
    department: typeof value.department === "string" ? value.department : null,
    isVerified: value.isVerified === true,
    verificationStatus: typeof value.verificationStatus === "string" ? value.verificationStatus : typeof value.status === "string" ? value.status : null,
    scopes,
    credentials,
    publications,
    hasRegistrarAuthority: value.hasRegistrarAuthority === true,
    ...(verificationSummary ? { verificationSummary } : {}),
    ...(authorityBoundaries ? { authorityBoundaries } : {}),
  };
  const parsed = expertProfileSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function passportEventProvenance(value: unknown) {
  const source = String(value || "LIVE_PROVIDER").toUpperCase();
  const kind = source === "COMMUNITY" ? "COMMUNITY" : source === "EXPERT" ? "EXPERT" : source === "USER_SUBMISSION" ? "USER_SUBMITTED" : "LIVE_PROVIDER";
  return {
    requestedMode: "LIVE" as const,
    sourceMode: "LIVE" as const,
    kind: kind as "COMMUNITY" | "EXPERT" | "USER_SUBMITTED" | "LIVE_PROVIDER",
    label: `Evidence Passport event · ${source}`,
    providerId: "passport-api",
  };
}

function passportFromApi(value: unknown): EvidencePassport | null {
  const raw = asRecord(value);
  const passportId = typeof raw.id === "string" ? raw.id : typeof raw.passportId === "string" ? raw.passportId : "";
  const subjectId = typeof raw.subjectId === "string" ? raw.subjectId : "";
  const revision = typeof raw.revision === "number" && Number.isInteger(raw.revision) && raw.revision >= 0 ? raw.revision : null;
  if (revision === null) return null;
  if (!passportId || !subjectId) return null;
  const caseScope = { caseId: subjectId, caseRevision: revision };
  if (!caseScopeSchema.safeParse(caseScope).success) return null;
  const events = Array.isArray(raw.events) ? raw.events : [];
  const revisions = events.map((eventValue) => {
    const event = asRecord(eventValue);
    const eventId = typeof event.id === "string" ? event.id : "";
    const eventType = typeof event.type === "string" ? event.type : "";
    const status = typeof event.newStatus === "string" ? event.newStatus : typeof raw.currentStatus === "string" ? raw.currentStatus : "UNKNOWN";
    const evidenceRefs = Array.isArray(event.references)
      ? event.references.map((reference) => asRecord(reference).id).filter((id): id is string => typeof id === "string" && id.trim().length > 0).slice(0, 100)
      : [];
    return passportRevisionSchema.safeParse({
      revisionId: `${passportId}:${eventId}`.slice(0, 160),
      passportId,
      caseScope,
      status,
      eventType,
      evidenceRefs,
      occurredAt: nullableTimestamp(event.occurredAt),
      provenance: passportEventProvenance(event.provenanceClass),
    });
  });
  if (revisions.some((revisionResult) => !revisionResult.success)) return null;
  const normalizedRevisions = revisions.map((revisionResult) => revisionResult.data);
  const candidate = {
    passportId,
    caseScope,
    currentRevisionId: normalizedRevisions.at(-1)?.revisionId || null,
    revisions: normalizedRevisions,
    sourceMode: "LIVE" as const,
  };
  const parsed = evidencePassportSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export class ApiProviderAdapter implements TrustProvider, CommunityProvider, ExpertProvider, PassportProvider {
  readonly mode = "LIVE" as const;
  private readonly transport: ApiProviderTransport;

  constructor(transport: Partial<ApiProviderTransport> = {}) {
    this.transport = { ...DEFAULT_TRANSPORT, ...transport };
  }

  async investigate(input: TrustInvestigationInput, signal?: AbortSignal, onEvent?: (event: unknown) => void): Promise<ProviderResult<TrustInvestigationResult>> {
    const parsed = trustInvestigationInputSchema.safeParse(input);
    if (!parsed.success) return invalidInput(typeof input?.requestId === "string" ? input.requestId : undefined, typeof input?.runId === "string" ? input.runId : undefined, errorIssues(parsed.error));
    const request = transportInput(parsed.data);
    if (!request) return unavailableResult({ requestedMode: "LIVE", dependency: "trust-qr-transport", reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, runId: parsed.data.runId, phase: "QR_TRANSPORT_NOT_CONFIGURED" });
    try {
      return trustResultFromResponse(parsed.data, await this.transport.trustInvestigate(request, signal, onEvent, parsed.data.requestId));
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "trust-api", error, requestId: parsed.data.requestId, runId: parsed.data.runId });
    }
  }

  async listObservations(query: CommunityQuery, signal?: AbortSignal): Promise<ProviderResult<readonly CommunityObservation[]>> {
    const parsed = communityQuerySchema.safeParse(query);
    if (!parsed.success) return invalidInput(typeof query?.requestId === "string" ? query.requestId : undefined, undefined, errorIssues(parsed.error));
    if (parsed.data.cohort || parsed.data.query) return unavailableResult({ requestedMode: "LIVE", dependency: "community-query-compatibility", reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "COMMUNITY_QUERY_NOT_CONFIGURED" });
    try {
      const raw = await this.transport.listCommunityPosts({ topic: parsed.data.topic, signal, requestId: parsed.data.requestId });
      const posts = Array.isArray(raw) ? raw : null;
      const validatedPosts = posts ? z.array(communityPostSchema).safeParse(posts) : null;
      if (!validatedPosts?.success) return invalidResponse(parsed.data.requestId, undefined, validatedPosts ? errorIssues(validatedPosts.error) : ["posts: expected array"]);
      const normalizedPosts = validatedPosts.data.slice(0, parsed.data.limit).map((post) => observationFromPost(post));
      if (normalizedPosts.some((post) => !post)) return invalidResponse(parsed.data.requestId, undefined, ["posts: one or more records failed canonical observation normalization"]);
      const data = normalizedPosts as CommunityObservation[];
      const contract = communityObservationListSchema.safeParse(data);
      if (!contract.success) return invalidResponse(parsed.data.requestId, undefined, errorIssues(contract.error));
      const provenance = { requestedMode: "LIVE" as const, sourceMode: "LIVE" as const, kind: "COMMUNITY" as const, label: "Live community observations", providerId: "community-api" };
      return createProviderResult({
        state: contract.data.length ? "SUCCESS" : "EMPTY",
        phase: contract.data.length ? "COMMUNITY_OBSERVATIONS" : "COMMUNITY_EMPTY",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance,
        data: contract.data,
        requestId: parsed.data.requestId,
        nextActions: contract.data.length ? [] : [{ id: "START_OVER", label: "Đổi phạm vi tìm kiếm" }],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "community-api", error, requestId: parsed.data.requestId });
    }
  }

  async getObservation(observationId: string, scope: { caseId: string; caseRevision: number }, requestId: string, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation | null>> {
    if (signal?.aborted) return providerFailure({ requestedMode: "LIVE", dependency: "community-api", error: new ApiError("Request aborted.", "ABORTED"), requestId });
    if (!communityObservationSchema.shape.observationId.safeParse(observationId).success || !caseScopeSchema.safeParse(scope).success || !workRequestId(requestId)) return invalidInput(requestId, undefined, ["observation scope: invalid"]);
    try {
      const raw = await this.transport.readCommunityObservation(observationId, signal, requestId);
      const response = communityExperienceResponseSchema.safeParse(raw);
      const observation = response.success ? observationFromPost(response.data.experience) : null;
      if (!response.success || !observation) return invalidResponse(requestId, undefined, response.success ? ["community experience: failed canonical observation normalization"] : errorIssues(response.error));
      if (!observation.caseScope || observation.caseScope.caseId !== scope.caseId || observation.caseScope.caseRevision !== scope.caseRevision) {
        return createProviderResult({
          state: "PARTIAL",
          phase: "COMMUNITY_OBSERVATION_SCOPE_UNCONFIRMED",
          requestedMode: "LIVE",
          providerStatus: "PARTIAL",
          provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "COMMUNITY", label: "Live community observation; requested case scope not confirmed", providerId: "community-api" },
          data: observation,
          requestId,
          missing: ["community-case-scope-match"],
          unknowns: ["The community detail endpoint did not confirm that this observation belongs to the requested case revision."],
          nextActions: [{ id: "OPEN_COMMUNITY", label: "Xem thêm bối cảnh cộng đồng" }],
        });
      }
      return createProviderResult({
        state: "SUCCESS",
        phase: "COMMUNITY_OBSERVATION_READ",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "COMMUNITY", label: "Live community observation", providerId: "community-api" },
        data: observation,
        requestId,
        nextActions: [],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "community-api", error, requestId });
    }
  }

  async submitObservation(command: CommunityObservationCommand, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation>> {
    const parsed = communityObservationCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(typeof command?.requestId === "string" ? command.requestId : undefined, undefined, errorIssues(parsed.error));
    if (signal?.aborted) return providerFailure({ requestedMode: "LIVE", dependency: "community-api", error: new ApiError("Request aborted.", "ABORTED"), requestId: parsed.data.requestId });
    try {
      const raw = await this.transport.createCommunityPost({
        content: parsed.data.statement,
        evidenceRefs: parsed.data.evidenceRefs,
        caseScope: parsed.data.scope,
      }, signal, parsed.data.requestId);
      const response = communityPostResponseSchema.safeParse(raw);
      const observation = response.success ? observationFromPost(response.data.post) : null;
      if (!response.success || !observation) return invalidResponse(parsed.data.requestId, undefined, response.success ? ["community post: failed canonical observation normalization"] : errorIssues(response.error));
      if (!observation.caseScope) {
        return createProviderResult({
          state: "PARTIAL",
          phase: "COMMUNITY_OBSERVATION_CREATED_SCOPE_UNCONFIRMED",
          requestedMode: "LIVE",
          providerStatus: "PARTIAL",
          provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "COMMUNITY", label: "Live community observation; case scope not echoed by compatibility endpoint", providerId: "community-api" },
          data: observation,
          requestId: parsed.data.requestId,
          missing: ["community-case-scope-persistence"],
          unknowns: ["The compatibility community endpoint did not echo the requested case scope."],
          retryable: false,
          nextActions: [{ id: "WAIT", label: "Chờ backend hỗ trợ scope của case" }],
        });
      }
      return createProviderResult({
        state: "SUCCESS",
        phase: "COMMUNITY_OBSERVATION_CREATED",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "COMMUNITY", label: "Live community observation", providerId: "community-api" },
        data: observation,
        requestId: parsed.data.requestId,
        nextActions: [],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "community-api", error, requestId: parsed.data.requestId });
    }
  }

  async listExperts(query: ExpertQuery, signal?: AbortSignal): Promise<ProviderResult<readonly ExpertProfile[]>> {
    const parsed = expertQuerySchema.safeParse(query);
    if (!parsed.success) return invalidInput(typeof query?.requestId === "string" ? query.requestId : undefined, undefined, errorIssues(parsed.error));
    try {
      const raw = await this.transport.listExperts({ topic: parsed.data.topic, domain: parsed.data.domain, limit: parsed.data.limit, requestId: parsed.data.requestId }, signal);
      const response = expertListResponseSchema.safeParse(raw);
      if (!response.success) return invalidResponse(parsed.data.requestId, undefined, errorIssues(response.error));
      const normalizedProfiles = response.data.data.experts.map((expert) => profileFromApi(expert));
      if (normalizedProfiles.some((expert) => !expert)) return invalidResponse(parsed.data.requestId, undefined, ["experts: one or more records failed canonical profile normalization"]);
      const data = normalizedProfiles as ExpertProfile[];
      return createProviderResult({
        state: data.length ? "SUCCESS" : "EMPTY",
        phase: data.length ? "EXPERT_PROFILES" : "EXPERT_EMPTY",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "EXPERT", label: "Live expert profiles", providerId: "experts-api" },
        data,
        requestId: parsed.data.requestId,
        nextActions: data.length ? [] : [{ id: "START_OVER", label: "Đổi phạm vi tìm kiếm" }],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "experts-api", error, requestId: parsed.data.requestId });
    }
  }

  async getExpert(expertId: string, requestId: string, signal?: AbortSignal): Promise<ProviderResult<ExpertProfile | null>> {
    if (signal?.aborted) return providerFailure({ requestedMode: "LIVE", dependency: "experts-api", error: new ApiError("Request aborted.", "ABORTED"), requestId });
    if (!workRequestId(expertId) || !workRequestId(requestId)) return invalidInput(requestId, undefined, ["expert scope: invalid"]);
    try {
      const raw = await this.transport.readExpert(expertId, signal, requestId);
      const response = expertDetailResponseSchema.safeParse(raw);
      const profile = response.success ? profileFromApi(response.data.data.expert) : null;
      if (!response.success || !profile) return invalidResponse(requestId, undefined, response.success ? ["expert profile: failed canonical normalization"] : errorIssues(response.error));
      return createProviderResult({
        state: "SUCCESS",
        phase: "EXPERT_PROFILE_READ",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "EXPERT", label: "Live expert profile", providerId: "experts-api" },
        data: profile,
        requestId,
        nextActions: [],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "experts-api", error, requestId });
    }
  }

  async requestAssessment(command: ExpertAssessmentCommand, signal?: AbortSignal): Promise<ProviderResult<ExpertAssessment>> {
    const parsed = expertAssessmentCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(typeof command?.requestId === "string" ? command.requestId : undefined, undefined, errorIssues(parsed.error));
    try {
      const raw = await this.transport.evaluateExpertClaim({ expertId: parsed.data.expertId, claim: parsed.data.claim }, signal, parsed.data.requestId);
      const response = expertEvaluationResponseSchema.safeParse(raw);
      if (!response.success || response.data.success !== true || !response.data.evaluation) return invalidResponse(parsed.data.requestId, undefined, response.success ? ["evaluation: required"] : errorIssues(response.error));
      const evaluation = response.data.evaluation;
      const data = expertAssessmentSchema.parse({
        assessmentId: null,
        expertId: parsed.data.expertId,
        caseScope: parsed.data.scope,
        claimStatus: typeof evaluation.claimStatus === "string" ? evaluation.claimStatus : null,
        explanation: typeof evaluation.explanation === "string" ? evaluation.explanation : null,
        evidenceReviewedIds: [],
        confidence: null,
        limitations: ["Compatibility assessment does not expose a persisted assessment ID or evidence list."],
        disagreementStatus: evaluation.expertConsensus?.disagreementLevel || null,
        assessedAt: null,
      });
      return createProviderResult({
        state: "SUCCESS",
        phase: "EXPERT_ASSESSMENT",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "EXPERT", label: "Live expert assessment compatibility endpoint", providerId: "expert-evaluate-api" },
        data,
        requestId: parsed.data.requestId,
        nextActions: [],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "expert-evaluate-api", error, requestId: parsed.data.requestId });
    }
  }

  async getPassport(scope: { caseId: string; caseRevision: number }, requestId: string, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport | null>> {
    if (signal?.aborted) return providerFailure({ requestedMode: "LIVE", dependency: "passport-api", error: new ApiError("Request aborted.", "ABORTED"), requestId });
    if (!caseScopeSchema.safeParse(scope).success || !workRequestId(requestId)) return invalidInput(requestId, undefined, ["passport scope: invalid"]);
    try {
      const raw = await this.transport.listPassports(signal, requestId);
      const response = passportListResponseSchema.safeParse(raw);
      if (!response.success) return invalidResponse(requestId, undefined, errorIssues(response.error));
      const matches = response.data.passports.map((passport) => passportFromApi(passport)).filter((passport): passport is EvidencePassport => Boolean(
        passport
        && passport.caseScope.caseId === scope.caseId
        && passport.caseScope.caseRevision === scope.caseRevision,
      ));
      if (matches.length > 1) return invalidResponse(requestId, undefined, ["passport scope resolved to more than one record"]);
      const data = matches[0] || null;
      return createProviderResult({
        state: data ? "SUCCESS" : "EMPTY",
        phase: data ? "PASSPORT_READ" : "PASSPORT_EMPTY",
        requestedMode: "LIVE",
        providerStatus: "AVAILABLE",
        provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "LIVE_PROVIDER", label: "Live Evidence Passport", providerId: "passport-api" },
        data,
        requestId,
        nextActions: data ? [] : [{ id: "START_OVER", label: "Tạo hoặc chọn case khác" }],
      });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "passport-api", error, requestId });
    }
  }

  async createPassport(command: PassportCreateCommand, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport>> {
    const parsed = passportCreateCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(typeof command?.requestId === "string" ? command.requestId : undefined, undefined, errorIssues(parsed.error));
    if (signal?.aborted) return providerFailure({ requestedMode: "LIVE", dependency: "passport-api", error: new ApiError("Request aborted.", "ABORTED"), requestId: parsed.data.requestId });
    try {
      const raw = await this.transport.createPassport({ title: parsed.data.title, subjectType: parsed.data.subjectType, subjectId: parsed.data.subjectId }, signal, parsed.data.requestId);
      const response = passportResponseSchema.safeParse(raw);
      const data = response.success ? passportFromApi(response.data.passport) : null;
      if (!response.success || !data) return invalidResponse(parsed.data.requestId, undefined, response.success ? ["passport: failed canonical normalization"] : errorIssues(response.error));
      return createProviderResult({ state: "SUCCESS", phase: "PASSPORT_CREATED", requestedMode: "LIVE", providerStatus: "AVAILABLE", provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "LIVE_PROVIDER", label: "Live Evidence Passport", providerId: "passport-api" }, data, requestId: parsed.data.requestId, nextActions: [] });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "passport-api", error, requestId: parsed.data.requestId });
    }
  }

  async appendRevision(command: PassportAppendRevisionCommand, signal?: AbortSignal): Promise<ProviderResult<PassportRevision>> {
    const parsed = passportAppendRevisionCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(typeof command?.requestId === "string" ? command.requestId : undefined, undefined, errorIssues(parsed.error));
    if (signal?.aborted) return providerFailure({ requestedMode: "LIVE", dependency: "passport-api", error: new ApiError("Request aborted.", "ABORTED"), requestId: parsed.data.requestId });
    try {
      const raw = await this.transport.appendPassport(parsed.data.passportId, { summary: parsed.data.eventType, metadata: { evidenceRefs: parsed.data.evidenceRefs } }, signal, parsed.data.requestId);
      const response = passportResponseSchema.safeParse(raw);
      const passport = response.success ? passportFromApi(response.data.passport) : null;
      const revision = passport?.revisions.at(-1) || null;
      if (!response.success || !revision) return invalidResponse(parsed.data.requestId, undefined, response.success ? ["passport revision: failed canonical normalization"] : errorIssues(response.error));
      return createProviderResult({ state: "SUCCESS", phase: "PASSPORT_REVISION_APPENDED", requestedMode: "LIVE", providerStatus: "AVAILABLE", provenance: { requestedMode: "LIVE", sourceMode: "LIVE", kind: "LIVE_PROVIDER", label: "Live Evidence Passport", providerId: "passport-api" }, data: revision, requestId: parsed.data.requestId, nextActions: [] });
    } catch (error) {
      return providerFailure({ requestedMode: "LIVE", dependency: "passport-api", error, requestId: parsed.data.requestId });
    }
  }
}

function workRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,160}$/.test(value.trim());
}

export function createApiProviderBundle(transport: Partial<ApiProviderTransport> = {}): ProviderBundle {
  const provider = new ApiProviderAdapter(transport);
  return Object.freeze({ mode: "LIVE" as const, sourceMode: "LIVE" as const, availability: "AVAILABLE" as const, trust: provider, community: provider, expert: provider, passport: provider });
}
