import { z } from "zod";
import { ApiError, type ApiErrorCode, type SafeFrontendError } from "../api/errors";
import {
  createStateEnvelope,
  sourceProvenanceSchema,
  uiStateEnvelopeSchema,
  uiStateForApiError,
  type RequestedMode,
  type TrustSemantics,
  type UIAction,
  type SourceProvenance,
  type UnavailableDependency,
  type UIState,
  type UIStateEnvelope,
} from "../ui-state/model";

export const PROVIDER_MODE_VALUES = ["DEMO", "LIVE"] as const;
export type ProviderMode = typeof PROVIDER_MODE_VALUES[number];
export const providerModeSchema = z.enum(PROVIDER_MODE_VALUES);

export const PROVIDER_STATUS_VALUES = [
  "AVAILABLE",
  "PARTIAL",
  "UNKNOWN",
  "ERROR",
  "UNAVAILABLE",
  "OFFLINE",
  "CANCELLED",
  "AUTH_REQUIRED",
  "FORBIDDEN",
] as const;
export type ProviderStatus = typeof PROVIDER_STATUS_VALUES[number];
export const providerStatusSchema = z.enum(PROVIDER_STATUS_VALUES);

export const PROVIDER_FINDING_STATUS_VALUES = ["CLEAN", "FINDINGS", "UNKNOWN", "ERROR", "UNAVAILABLE"] as const;
export type ProviderFindingStatus = typeof PROVIDER_FINDING_STATUS_VALUES[number];
export const providerFindingStatusSchema = z.enum(PROVIDER_FINDING_STATUS_VALUES);

const identifierSchema = z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9._:-]+$/, "Identifier contains unsupported characters.");
const referenceSchema = z.string().trim().min(1).max(500).regex(/^[^\u0000-\u001F\u007F]+$/, "Reference contains unsupported control characters.");
const boundedTextSchema = z.string().trim().min(1).max(12_000);
const nullableTimestampSchema = z.string().datetime().nullable();

export const caseScopeSchema = z.object({
  caseId: identifierSchema,
  caseRevision: z.number().int().nonnegative(),
}).strict();
export type CaseScope = z.infer<typeof caseScopeSchema>;

export const workIdentitySchema = z.object({
  requestId: identifierSchema,
  runId: identifierSchema.optional(),
}).strict();
export type WorkIdentity = z.infer<typeof workIdentitySchema>;

export type ProviderResult<T> = UIStateEnvelope<T | null> & Readonly<{
  requestedMode: ProviderMode;
  providerStatus: ProviderStatus;
  provenance: SourceProvenance;
}>;

export const providerResultSchema = uiStateEnvelopeSchema.extend({
  requestedMode: providerModeSchema,
  providerStatus: providerStatusSchema,
  provenance: sourceProvenanceSchema,
});

export type ProviderResultOptions<T> = Readonly<{
  state: UIState;
  requestedMode: ProviderMode;
  providerStatus: ProviderStatus;
  provenance: SourceProvenance;
  phase?: string;
  data?: T;
  error?: SafeFrontendError;
  unknowns?: readonly string[];
  missing?: readonly string[];
  unavailable?: UnavailableDependency;
  requestId?: string;
  runId?: string;
  updatedAt?: string;
  retryable?: boolean;
  nextActions?: readonly UIAction[];
  trust?: TrustSemantics;
}>;

export function createProviderResult<T>(options: ProviderResultOptions<T>): ProviderResult<T> {
  const envelope = createStateEnvelope({
    state: options.state,
    phase: options.phase,
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.error ? { error: options.error } : {}),
    unknowns: options.unknowns,
    missing: options.missing,
    ...(options.unavailable ? { unavailable: options.unavailable } : {}),
    provenance: options.provenance,
    requestId: options.requestId,
    runId: options.runId,
    updatedAt: options.updatedAt,
    retryable: options.retryable,
    nextActions: options.nextActions,
    trust: options.trust,
  });
  return Object.freeze({
    ...envelope,
    requestedMode: options.requestedMode,
    providerStatus: options.providerStatus,
    provenance: options.provenance,
  });
}

export function demoProvenance(fixtureId: string, fixtureVersion = "f02.1"): SourceProvenance {
  return Object.freeze({
    requestedMode: "DEMO",
    sourceMode: "DEMO",
    kind: "DEMO_FIXTURE",
    label: "Deterministic demo fixture",
    fixtureId,
    fixtureVersion,
    disclosure: "Đây là fixture xác định để kiểm thử/trình diễn, không phải dữ liệu live hoặc xác minh tổ chức thật.",
  });
}

export function liveProvenance(providerId: string): SourceProvenance {
  return Object.freeze({
    requestedMode: "LIVE",
    sourceMode: "LIVE",
    kind: "LIVE_PROVIDER",
    label: "Approved same-origin live provider",
    providerId: providerId.slice(0, 160),
  });
}

export function unavailableProvenance(requestedMode: ProviderMode, dependency: string): SourceProvenance {
  return Object.freeze({
    requestedMode,
    sourceMode: "UNAVAILABLE",
    kind: "UNAVAILABLE",
    label: "Provider unavailable",
    providerId: dependency.slice(0, 160),
    disclosure: "Nguồn được yêu cầu chưa khả dụng; hệ thống không thay thế bằng dữ liệu demo.",
  });
}

export function safeErrorFrom(error: unknown, fallbackCode: ApiErrorCode = "SERVER_ERROR"): SafeFrontendError {
  if (error instanceof ApiError) {
    const safe = error.toSafeError();
    return error.code === "RATE_LIMITED" && error.retryAfter
      ? { ...safe, userMessage: `Quá nhiều yêu cầu. Hãy thử lại sau ${error.retryAfter} giây.` }
      : safe;
  }
  return new ApiError("The provider request failed.", fallbackCode).toSafeError();
}

export function providerFailure<T>(options: {
  requestedMode: ProviderMode;
  dependency: string;
  error: unknown;
  requestId?: string;
  runId?: string;
  data?: T;
  missing?: readonly string[];
  unknowns?: readonly string[];
}): ProviderResult<T> {
  const apiError = options.error instanceof ApiError
    ? options.error
    : new ApiError("The provider request failed.", "SERVER_ERROR");
  const state = uiStateForApiError(apiError.code);
  const unavailable = state === "UNAVAILABLE"
    ? { dependency: options.dependency, reason: apiError.code === "TIMEOUT" ? "TIMEOUT" as const : "UNREACHABLE" as const }
    : undefined;
  const dataOption = options.data !== undefined
    ? { data: options.data }
    : state === "PARTIAL" || state === "CONFLICTING_EVIDENCE"
      ? { data: null as T | null }
      : {};
  const unknowns = options.unknowns || (state === "CONFLICTING_EVIDENCE" ? ["Transport reported conflicting or stale scope."] : []);
  const missing = options.missing || (state === "PARTIAL" ? [options.dependency] : []);
  return createProviderResult({
    state,
    requestedMode: options.requestedMode,
    providerStatus: statusForUiState(state),
    provenance: unavailableProvenance(options.requestedMode, options.dependency),
    requestId: options.requestId,
    runId: options.runId,
    ...dataOption,
    error: state === "CANCELLED" ? undefined : safeErrorFrom(apiError),
    unavailable,
    unknowns,
    missing,
    retryable: apiError.retryable,
    nextActions: actionsForUiState(state),
  });
}

export function unavailableResult<T>(options: {
  requestedMode: ProviderMode;
  dependency: string;
  reason: UnavailableDependency["reason"];
  requestId?: string;
  runId?: string;
  phase?: string;
}): ProviderResult<T> {
  const errorCode = options.reason === "TIMEOUT" ? "TIMEOUT" : "SERVICE_UNAVAILABLE";
  const error = new ApiError("The requested provider is unavailable.", errorCode, { retryable: true });
  return createProviderResult({
    state: "UNAVAILABLE",
    phase: options.phase || "PROVIDER_UNAVAILABLE",
    requestedMode: options.requestedMode,
    providerStatus: "UNAVAILABLE",
    provenance: unavailableProvenance(options.requestedMode, options.dependency),
    unavailable: { dependency: options.dependency, reason: options.reason },
    requestId: options.requestId,
    runId: options.runId,
    error: error.toSafeError(),
    retryable: true,
    nextActions: [{ id: "RETRY", label: "Thử lại khi nguồn khả dụng" }],
  });
}

function statusForUiState(state: UIState): ProviderStatus {
  if (state === "OFFLINE") return "OFFLINE";
  if (state === "CANCELLED") return "CANCELLED";
  if (state === "AUTH_REQUIRED") return "AUTH_REQUIRED";
  if (state === "FORBIDDEN") return "FORBIDDEN";
  if (state === "PARTIAL") return "PARTIAL";
  if (state === "UNAVAILABLE") return "UNAVAILABLE";
  if (state === "ERROR") return "ERROR";
  if (state === "UNKNOWN" || state === "INSUFFICIENT_EVIDENCE" || state === "CONFLICTING_EVIDENCE") return "UNKNOWN";
  return "AVAILABLE";
}

function actionsForUiState(state: UIState): ProviderResultOptions<unknown>["nextActions"] {
  if (state === "AUTH_REQUIRED") return [{ id: "SIGN_IN", label: "Đăng nhập để tiếp tục" }];
  if (state === "FORBIDDEN") return [{ id: "START_OVER", label: "Quay lại phạm vi được phép" }];
  if (state === "OFFLINE") return [{ id: "RETRY", label: "Thử lại khi có mạng" }];
  if (state === "UNAVAILABLE") return [{ id: "RETRY", label: "Thử lại khi nguồn khả dụng" }];
  if (state === "CONFLICTING_EVIDENCE") return [{ id: "REVIEW_UNKNOWN", label: "Xem các điểm xung đột" }];
  if (state === "UNKNOWN" || state === "INSUFFICIENT_EVIDENCE") return [{ id: "CHECK_OFFICIAL_SOURCE", label: "Đối chiếu nguồn chính thức" }];
  if (state === "ERROR") return [{ id: "RETRY", label: "Thử lại" }];
  return [];
}

// Trust boundary ----------------------------------------------------------

export const TRUST_INPUT_TYPE_VALUES = ["URL", "TEXT", "IMAGE", "QR_READY"] as const;
export type TrustInputType = typeof TRUST_INPUT_TYPE_VALUES[number];
export const trustInputTypeSchema = z.enum(TRUST_INPUT_TYPE_VALUES);

export const trustInvestigationInputSchema = z.object({
  type: trustInputTypeSchema,
  content: z.string().trim().min(1).max(200_000),
  metadata: z.object({
    inputKind: z.enum(["URL", "TEXT", "MESSAGE", "IMAGE", "SCREENSHOT", "QR"]).optional(),
    extractionAuthority: z.string().trim().min(1).max(80).optional(),
    qrContent: z.string().trim().min(1).max(12_000).optional(),
    fileType: z.string().trim().min(1).max(80).optional(),
  }).strict().default({}),
  scope: caseScopeSchema.optional(),
  requestId: identifierSchema,
  runId: identifierSchema,
  confirmedEntities: z.array(z.string().trim().min(1).max(240)).max(50).default([]),
}).strict();
export type TrustInvestigationInput = z.infer<typeof trustInvestigationInputSchema>;

export const TRUST_DECISION_STATE_VALUES = [
  "SUPPORTED",
  "SUSPICIOUS",
  "HIGH_RISK",
  "DANGEROUS",
  "DISPUTED",
  "UNKNOWN",
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
] as const;
export type TrustDecisionState = typeof TRUST_DECISION_STATE_VALUES[number];
export const trustDecisionStateSchema = z.enum(TRUST_DECISION_STATE_VALUES);

export const trustStageSchema = z.object({
  stageId: identifierSchema,
  status: providerStatusSchema,
  finding: z.string().trim().min(1).max(160).nullable(),
  summary: boundedTextSchema,
  missingScope: z.array(z.string().trim().min(1).max(240)).max(50),
}).strict();
export type TrustStage = z.infer<typeof trustStageSchema>;

export const trustEvidenceItemSchema = z.object({
  evidenceId: identifierSchema,
  sourceId: referenceSchema,
  sourceType: z.enum(["OFFICIAL", "COMMUNITY", "EXPERT", "USER_SUBMITTED", "LIVE_PROVIDER", "DERIVED", "DEMO_FIXTURE"]),
  summary: boundedTextSchema.optional(),
  observedAt: nullableTimestampSchema,
  provenance: sourceProvenanceSchema,
}).strict();
export type TrustEvidenceItem = z.infer<typeof trustEvidenceItemSchema>;

export const trustProviderObservationSchema = z.object({
  providerId: referenceSchema,
  status: providerFindingStatusSchema,
  observedAt: nullableTimestampSchema,
  latencyMs: z.number().nonnegative().nullable(),
  signals: z.array(boundedTextSchema).max(50),
}).strict();
export type TrustProviderObservation = z.infer<typeof trustProviderObservationSchema>;

export const trustRelatedCaseSchema = z.object({
  caseId: identifierSchema,
  title: z.string().trim().min(1).max(240).nullable(),
  similarity: z.number().min(0).max(1).nullable(),
  sharedSignals: z.array(boundedTextSchema).max(50),
  observedAt: nullableTimestampSchema,
}).strict();
export type TrustRelatedCase = z.infer<typeof trustRelatedCaseSchema>;

export const trustCrossPillarLinkSchema = z.object({
  pillar: z.enum(["COMMUNITY", "EXPERT", "PASSPORT"]),
  relation: z.enum(["CORROBORATION", "ESCALATION", "HISTORY"]),
  targetId: identifierSchema,
  caseScope: caseScopeSchema,
}).strict();

export const trustInvestigationResultSchema = z.object({
  contractVersion: z.string().trim().min(1).max(80),
  caseId: identifierSchema.nullable(),
  caseRevision: z.number().int().nonnegative().nullable(),
  runId: identifierSchema,
  generatedAt: nullableTimestampSchema,
  decision: z.object({
    security: z.string().trim().min(1).max(120),
    truth: z.string().trim().min(1).max(120),
    action: z.string().trim().min(1).max(120),
    epistemicState: trustDecisionStateSchema,
  }).strict(),
  metrics: z.object({
    risk: z.string().trim().min(1).max(80).nullable(),
    confidence: z.number().min(0).max(1).nullable(),
    evidenceCoverage: z.number().min(0).max(1).nullable(),
    sourceAgreement: z.string().trim().min(1).max(80).nullable(),
    unresolvedSignals: z.array(z.string().trim().min(1).max(240)).max(100),
  }).strict(),
  reasons: z.array(boundedTextSchema).max(100),
  recommendedAction: boundedTextSchema.nullable(),
  unknowns: z.array(boundedTextSchema).max(100),
  stages: z.array(trustStageSchema).max(20),
  evidence: z.array(trustEvidenceItemSchema).max(100),
  providerObservations: z.array(trustProviderObservationSchema).max(50),
  relatedCases: z.array(trustRelatedCaseSchema).max(50),
  links: z.array(trustCrossPillarLinkSchema).max(20),
}).strict();
export type TrustInvestigationResult = z.infer<typeof trustInvestigationResultSchema>;

// Community boundary ------------------------------------------------------

export const communityQuerySchema = z.object({
  topic: z.string().trim().min(1).max(160).optional(),
  cohort: z.string().trim().min(1).max(40).optional(),
  query: z.string().trim().min(1).max(240).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  requestId: identifierSchema,
  scope: caseScopeSchema.optional(),
}).strict();
export type CommunityQuery = z.infer<typeof communityQuerySchema>;

export const communityEvidenceSchema = z.object({
  evidenceId: identifierSchema,
  kind: z.enum(["URL", "TEXT", "IMAGE", "DOCUMENT", "OTHER"]),
  reference: referenceSchema,
  summary: boundedTextSchema.nullable(),
  observedAt: nullableTimestampSchema,
  provenance: sourceProvenanceSchema,
}).strict();
export type CommunityEvidence = z.infer<typeof communityEvidenceSchema>;

export const communityObservationSchema = z.object({
  observationId: identifierSchema,
  caseScope: caseScopeSchema.nullable(),
  title: z.string().trim().min(1).max(240).nullable(),
  topic: z.string().trim().min(1).max(160).nullable(),
  statement: boundedTextSchema,
  context: boundedTextSchema.nullable(),
  contextDetails: z.object({
    institution: z.string().trim().min(1).max(240).optional(),
    faculty: z.string().trim().min(1).max(160).optional(),
    department: z.string().trim().min(1).max(160).optional(),
    program: z.string().trim().min(1).max(160).optional(),
    cohort: z.string().trim().min(1).max(80).optional(),
    semester: z.string().trim().min(1).max(120).optional(),
    procedure: z.string().trim().min(1).max(160).optional(),
    channel: z.string().trim().min(1).max(120).optional(),
  }).strict().nullable().optional(),
  observedAt: nullableTimestampSchema,
  submittedAt: nullableTimestampSchema,
  evidenceRefs: z.array(referenceSchema).max(50),
  evidence: z.array(communityEvidenceSchema).max(50).optional(),
  freshnessStatus: z.string().trim().min(1).max(80).nullable(),
  moderationStatus: z.string().trim().min(1).max(80).nullable(),
}).strict();
export type CommunityObservation = z.infer<typeof communityObservationSchema>;

export const communityObservationListSchema = z.array(communityObservationSchema).max(50);

export const communityObservationCommandSchema = z.object({
  scope: caseScopeSchema,
  statement: boundedTextSchema,
  evidenceRefs: z.array(referenceSchema).max(50),
  requestId: identifierSchema,
  idempotencyKey: identifierSchema,
}).strict();
export type CommunityObservationCommand = z.infer<typeof communityObservationCommandSchema>;

// Expert boundary ---------------------------------------------------------

export const expertQuerySchema = z.object({
  topic: z.string().trim().min(1).max(160).optional(),
  domain: z.string().trim().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  requestId: identifierSchema,
}).strict();
export type ExpertQuery = z.infer<typeof expertQuerySchema>;

export const expertScopeSchema = z.object({
  domain: z.string().trim().min(1).max(120),
  level: z.string().trim().min(1).max(80),
  subdomain: z.string().trim().min(1).max(160).nullable().optional(),
  jurisdiction: z.string().trim().min(1).max(160).nullable().optional(),
  citationCount: z.number().int().nonnegative().optional(),
  recencyYear: z.number().int().min(1900).max(2200).nullable().optional(),
  isEstablished: z.boolean().optional(),
}).strict();

export const expertCredentialSchema = z.object({
  credentialId: identifierSchema,
  type: z.string().trim().min(1).max(160),
  field: z.string().trim().min(1).max(160).nullable(),
  issuer: z.string().trim().min(1).max(240).nullable(),
  issuedYear: z.number().int().min(1900).max(2200).nullable(),
  status: z.string().trim().min(1).max(100),
}).strict();
export type ExpertCredential = z.infer<typeof expertCredentialSchema>;

export const expertPublicationSchema = z.object({
  pubId: identifierSchema,
  title: z.string().trim().min(1).max(400),
  venue: z.string().trim().min(1).max(240).nullable(),
  year: z.number().int().min(1900).max(2200).nullable(),
  domain: z.string().trim().min(1).max(160).nullable(),
  doi: z.string().trim().min(1).max(240).nullable(),
}).strict();
export type ExpertPublication = z.infer<typeof expertPublicationSchema>;

export const expertVerificationSummarySchema = z.object({
  status: z.string().trim().min(1).max(120),
  identity: z.enum(["VERIFIED", "UNVERIFIED"]),
  affiliation: z.string().trim().min(1).max(120),
  verifiedCredentials: z.number().int().nonnegative(),
  groundedPublications: z.number().int().nonnegative(),
  latestResearchYear: z.number().int().min(1900).max(2200).nullable(),
  researchFreshness: z.string().trim().min(1).max(80),
  activeConflicts: z.number().int().nonnegative(),
  lastCheckedAt: nullableTimestampSchema,
  evidenceGrade: z.enum(["A", "B", "C", "D"]).nullable(),
}).strict();

export const expertAuthorityBoundariesSchema = z.object({
  establishedDomains: z.array(z.string().trim().min(1).max(160)).max(50),
  limitedDomains: z.array(z.string().trim().min(1).max(160)).max(50),
  outOfScopeDomains: z.array(z.string().trim().min(1).max(160)).max(50),
  institutionalAuthority: z.boolean(),
  warning: z.string().trim().min(1).max(400),
}).strict();

export const expertProfileSchema = z.object({
  expertId: identifierSchema,
  name: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(240).nullable(),
  institution: z.string().trim().min(1).max(240).nullable(),
  department: z.string().trim().min(1).max(240).nullable(),
  isVerified: z.boolean(),
  verificationStatus: z.string().trim().min(1).max(100).nullable(),
  scopes: z.array(expertScopeSchema).max(50),
  credentials: z.array(expertCredentialSchema).max(50).optional(),
  publications: z.array(expertPublicationSchema).max(100).optional(),
  hasRegistrarAuthority: z.boolean().optional(),
  verificationSummary: expertVerificationSummarySchema.nullable().optional(),
  authorityBoundaries: expertAuthorityBoundariesSchema.nullable().optional(),
}).strict();
export type ExpertProfile = z.infer<typeof expertProfileSchema>;

export const expertAssessmentCommandSchema = z.object({
  scope: caseScopeSchema,
  expertId: identifierSchema,
  claim: z.object({
    text: boundedTextSchema,
    domain: z.string().trim().min(1).max(120),
    claimJurisdiction: z.string().trim().min(1).max(160),
  }).strict(),
  requestId: identifierSchema,
  idempotencyKey: identifierSchema,
}).strict();
export type ExpertAssessmentCommand = z.infer<typeof expertAssessmentCommandSchema>;

export const expertAssessmentSchema = z.object({
  assessmentId: identifierSchema.nullable(),
  expertId: identifierSchema,
  caseScope: caseScopeSchema,
  claimStatus: z.string().trim().min(1).max(120).nullable(),
  explanation: boundedTextSchema.nullable(),
  evidenceReviewedIds: z.array(identifierSchema).max(50),
  confidence: z.number().min(0).max(1).nullable(),
  limitations: z.array(boundedTextSchema).max(50),
  disagreementStatus: z.string().trim().min(1).max(120).nullable(),
  assessedAt: nullableTimestampSchema,
}).strict();
export type ExpertAssessment = z.infer<typeof expertAssessmentSchema>;

// Evidence Passport boundary ---------------------------------------------

export const passportRevisionSchema = z.object({
  revisionId: identifierSchema,
  passportId: identifierSchema,
  caseScope: caseScopeSchema,
  status: z.string().trim().min(1).max(120),
  eventType: z.string().trim().min(1).max(120),
  evidenceRefs: z.array(referenceSchema).max(100),
  occurredAt: nullableTimestampSchema,
  provenance: sourceProvenanceSchema,
}).strict();
export type PassportRevision = z.infer<typeof passportRevisionSchema>;

export const evidencePassportSchema = z.object({
  passportId: identifierSchema,
  caseScope: caseScopeSchema,
  currentRevisionId: identifierSchema.nullable(),
  revisions: z.array(passportRevisionSchema).max(100),
  sourceMode: z.enum(["DEMO", "LIVE", "UNAVAILABLE"]),
}).strict();
export type EvidencePassport = z.infer<typeof evidencePassportSchema>;

export const passportCreateCommandSchema = z.object({
  scope: caseScopeSchema,
  title: z.string().trim().min(1).max(240),
  subjectType: z.string().trim().min(1).max(120),
  subjectId: identifierSchema,
  requestId: identifierSchema,
  idempotencyKey: identifierSchema,
}).strict();
export type PassportCreateCommand = z.infer<typeof passportCreateCommandSchema>;

export const passportAppendRevisionCommandSchema = z.object({
  scope: caseScopeSchema,
  passportId: identifierSchema,
  eventType: z.string().trim().min(1).max(120),
  evidenceRefs: z.array(referenceSchema).max(100),
  requestId: identifierSchema,
  idempotencyKey: identifierSchema,
}).strict();
export type PassportAppendRevisionCommand = z.infer<typeof passportAppendRevisionCommandSchema>;

export interface TrustProvider {
  investigate(input: TrustInvestigationInput, signal?: AbortSignal, onEvent?: (event: unknown) => void): Promise<ProviderResult<TrustInvestigationResult>>;
}

export interface CommunityProvider {
  listObservations(query: CommunityQuery, signal?: AbortSignal): Promise<ProviderResult<readonly CommunityObservation[]>>;
  getObservation(observationId: string, scope: CaseScope, requestId: string, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation | null>>;
  submitObservation(command: CommunityObservationCommand, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation>>;
}

export interface ExpertProvider {
  listExperts(query: ExpertQuery, signal?: AbortSignal): Promise<ProviderResult<readonly ExpertProfile[]>>;
  getExpert(expertId: string, requestId: string, signal?: AbortSignal): Promise<ProviderResult<ExpertProfile | null>>;
  requestAssessment(command: ExpertAssessmentCommand, signal?: AbortSignal): Promise<ProviderResult<ExpertAssessment>>;
}

export interface PassportProvider {
  getPassport(scope: CaseScope, requestId: string, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport | null>>;
  createPassport(command: PassportCreateCommand, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport>>;
  appendRevision(command: PassportAppendRevisionCommand, signal?: AbortSignal): Promise<ProviderResult<PassportRevision>>;
}

export type ProviderBundle = Readonly<{
  mode: ProviderMode;
  sourceMode: "DEMO" | "LIVE" | "UNAVAILABLE";
  availability: "AVAILABLE" | "UNAVAILABLE";
  trust: TrustProvider;
  community: CommunityProvider;
  expert: ExpertProvider;
  passport: PassportProvider;
}>;

export function requestedModeForSource(source: SourceProvenance): RequestedMode {
  return source.requestedMode;
}
