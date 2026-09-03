import { ApiError } from "../../api/errors";
import {
  caseScopeSchema,
  communityObservationCommandSchema,
  communityObservationListSchema,
  communityObservationSchema,
  communityQuerySchema,
  createProviderResult,
  demoProvenance,
  expertAssessmentCommandSchema,
  expertAssessmentSchema,
  expertProfileSchema,
  expertQuerySchema,
  passportAppendRevisionCommandSchema,
  passportCreateCommandSchema,
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
  type PassportAppendRevisionCommand,
  type PassportCreateCommand,
  type PassportProvider,
  type PassportRevision,
  type ProviderBundle,
  type ProviderResult,
  type TrustInvestigationInput,
  type TrustInvestigationResult,
  type TrustProvider,
  trustInvestigationInputSchema,
  trustInvestigationResultSchema,
} from "../ports";

const FIXTURE_ID = "f02-foundation";
const FIXTURE_VERSION = "f02.1";
const FIXTURE_TIMESTAMP = "2026-09-01T00:00:00.000Z";

const DEMO_OBSERVATIONS: readonly CommunityObservation[] = Object.freeze([
  Object.freeze({
    observationId: "demo-observation-foundation-1",
    caseScope: null,
    title: "Demo observation",
    topic: "FOUNDATION_BOUNDARY",
    statement: "Fixture observation used to verify explicit Community provenance.",
    context: "This record is intentionally synthetic and is not a report about a real institution.",
    observedAt: FIXTURE_TIMESTAMP,
    submittedAt: FIXTURE_TIMESTAMP,
    evidenceRefs: [],
    freshnessStatus: "DEMO_ONLY",
    moderationStatus: "DEMO_ONLY",
  }),
]);

const DEMO_EXPERTS: readonly ExpertProfile[] = Object.freeze([
  Object.freeze({
    expertId: "demo-expert-foundation-1",
    name: "Demo domain reviewer",
    title: "Fixture profile",
    institution: "Demo fixture",
    department: "Foundation tests",
    isVerified: false,
    verificationStatus: "DEMO_ONLY",
    scopes: [{ domain: "FOUNDATION_BOUNDARY", level: "DEMO_ONLY" }],
  }),
]);

function validationResult<T>(requestId: string | undefined, runId: string | undefined, message = "Input does not match the canonical contract."): ProviderResult<T> {
  const error = new ApiError(message, "VALIDATION");
  return createProviderResult({
    state: "ERROR",
    phase: "VALIDATION",
    requestedMode: "DEMO",
    providerStatus: "ERROR",
    provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
    requestId,
    runId,
    error: error.toSafeError(),
    nextActions: [{ id: "CORRECT_INPUT", label: "Sửa thông tin đầu vào" }],
  });
}

function cancelledResult<T>(requestId: string | undefined, runId: string | undefined): ProviderResult<T> {
  return createProviderResult({
    state: "CANCELLED",
    phase: "CANCELLED",
    requestedMode: "DEMO",
    providerStatus: "CANCELLED",
    provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
    requestId,
    runId,
    nextActions: [{ id: "START_OVER", label: "Bắt đầu lại" }],
  });
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return Boolean(signal?.aborted);
}

function trustFixture(input: TrustInvestigationInput): TrustInvestigationResult {
  return {
    contractVersion: "trust.demo.v1",
    caseId: input.scope?.caseId || null,
    caseRevision: input.scope?.caseRevision ?? null,
    runId: input.runId,
    generatedAt: FIXTURE_TIMESTAMP,
    decision: {
      security: "UNKNOWN",
      truth: "INSUFFICIENT_EVIDENCE",
      action: "REVIEW",
      epistemicState: "INSUFFICIENT_EVIDENCE",
    },
    metrics: {
      risk: "UNKNOWN",
      confidence: null,
      evidenceCoverage: 0,
      sourceAgreement: "UNKNOWN",
      unresolvedSignals: ["Demo fixture contains no independent live evidence."],
    },
    reasons: ["The demo source is a deterministic fixture and does not verify the submitted content."],
    recommendedAction: "Đối chiếu với nguồn chính thức trước khi hành động.",
    unknowns: ["No live provider evidence was requested in this demo result."],
    stages: [
      {
        stageId: "l1",
        status: "AVAILABLE",
        finding: "INPUT_RECEIVED",
        summary: "Demo input accepted for contract and state testing.",
        missingScope: ["live verification", "independent evidence"],
      },
    ],
    evidence: [],
    providerObservations: [],
    relatedCases: [],
    links: [],
  };
}

function normalizeExpert(value: unknown): ExpertProfile | null {
  const parsed = expertProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function invalidCommand<T>(requestId: string | undefined): ProviderResult<T> {
  return validationResult(requestId, undefined, "Command does not match the canonical contract.");
}

export class DemoProvider implements TrustProvider, CommunityProvider, ExpertProvider, PassportProvider {
  readonly mode = "DEMO" as const;

  async investigate(input: TrustInvestigationInput, signal?: AbortSignal): Promise<ProviderResult<TrustInvestigationResult>> {
    const requestId = typeof input?.requestId === "string" ? input.requestId : undefined;
    const runId = typeof input?.runId === "string" ? input.runId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId, runId);
    const parsed = trustInvestigationInputSchema.safeParse(input);
    if (!parsed.success) return validationResult(requestId, runId);

    const data = trustFixture(parsed.data);
    const contract = trustInvestigationResultSchema.safeParse(data);
    if (!contract.success) return validationResult(requestId, runId, "Demo fixture failed its own contract.");
    return createProviderResult({
      state: "INSUFFICIENT_EVIDENCE",
      phase: "DEMO_RESULT",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: contract.data,
      requestId: parsed.data.requestId,
      runId: parsed.data.runId,
      unknowns: contract.data.unknowns,
      missing: ["LIVE_PROVIDER_EVIDENCE"],
      trust: { kind: "TRUST_DECISION", value: "INSUFFICIENT_EVIDENCE" },
      nextActions: [{ id: "CHECK_OFFICIAL_SOURCE", label: "Đối chiếu nguồn chính thức" }],
    });
  }

  async listObservations(query: CommunityQuery, signal?: AbortSignal): Promise<ProviderResult<readonly CommunityObservation[]>> {
    const requestId = typeof query?.requestId === "string" ? query.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId, undefined);
    const parsed = communityQuerySchema.safeParse(query);
    if (!parsed.success) return validationResult(requestId, undefined);

    const filtered = DEMO_OBSERVATIONS.filter((observation) => {
      if (parsed.data.topic && observation.topic !== parsed.data.topic) return false;
      if (parsed.data.query && !`${observation.title || ""} ${observation.statement}`.toLowerCase().includes(parsed.data.query.toLowerCase())) return false;
      return true;
    }).slice(0, parsed.data.limit);
    const contract = communityObservationListSchema.safeParse(filtered);
    if (!contract.success) return validationResult(requestId, undefined, "Demo Community fixture failed its own contract.");
    return createProviderResult({
      state: contract.data.length ? "SUCCESS" : "EMPTY",
      phase: contract.data.length ? "DEMO_OBSERVATIONS" : "DEMO_EMPTY",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: contract.data,
      requestId,
      nextActions: contract.data.length ? [] : [{ id: "START_OVER", label: "Đổi phạm vi tìm kiếm" }],
    });
  }

  async getObservation(observationId: string, scope: { caseId: string; caseRevision: number }, requestId: string, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation | null>> {
    if (isAborted(signal)) return cancelledResult(requestId, undefined);
    if (!communityObservationSchema.shape.observationId.safeParse(observationId).success || !caseScopeSchema.safeParse(scope).success) return validationResult(requestId, undefined);
    const observation = DEMO_OBSERVATIONS.find((item) => item.observationId === observationId) || null;
    return createProviderResult({
      state: observation ? "SUCCESS" : "EMPTY",
      phase: observation ? "DEMO_OBSERVATION" : "DEMO_EMPTY",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: observation,
      requestId,
      nextActions: observation ? [] : [{ id: "START_OVER", label: "Quay lại danh sách" }],
    });
  }

  async submitObservation(command: CommunityObservationCommand, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation>> {
    if (isAborted(signal)) return cancelledResult(command?.requestId, undefined);
    const parsed = communityObservationCommandSchema.safeParse(command);
    if (!parsed.success) return invalidCommand(typeof command?.requestId === "string" ? command.requestId : undefined);
    return unavailableResult({
      requestedMode: "DEMO",
      dependency: "demo-community-write",
      reason: "DISABLED",
      requestId: parsed.data.requestId,
      phase: "DEMO_WRITE_DISABLED",
    });
  }

  async listExperts(query: { topic?: string; domain?: string; limit: number; requestId: string }, signal?: AbortSignal): Promise<ProviderResult<readonly ExpertProfile[]>> {
    const requestId = typeof query?.requestId === "string" ? query.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId, undefined);
    const parsed = expertQuerySchema.safeParse(query);
    if (!parsed.success) return validationResult(requestId, undefined);
    const filtered = DEMO_EXPERTS.filter((expert) => !parsed.data.domain || expert.scopes.some((scope) => scope.domain === parsed.data.domain)).slice(0, parsed.data.limit);
    const contract = filtered.map(normalizeExpert).filter((expert): expert is ExpertProfile => Boolean(expert));
    return createProviderResult({
      state: contract.length ? "SUCCESS" : "EMPTY",
      phase: contract.length ? "DEMO_EXPERTS" : "DEMO_EMPTY",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: contract,
      requestId,
      nextActions: contract.length ? [] : [{ id: "START_OVER", label: "Đổi phạm vi tìm kiếm" }],
    });
  }

  async getExpert(expertId: string, requestId: string, signal?: AbortSignal): Promise<ProviderResult<ExpertProfile | null>> {
    if (isAborted(signal)) return cancelledResult(requestId, undefined);
    if (!expertProfileSchema.shape.expertId.safeParse(expertId).success || !expertProfileSchema.shape.expertId.safeParse(requestId).success) return validationResult(requestId, undefined);
    const expert = DEMO_EXPERTS.find((item) => item.expertId === expertId) || null;
    return createProviderResult({
      state: expert ? "SUCCESS" : "EMPTY",
      phase: expert ? "DEMO_EXPERT" : "DEMO_EMPTY",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: expert,
      requestId,
      nextActions: expert ? [] : [{ id: "START_OVER", label: "Quay lại danh sách" }],
    });
  }

  async requestAssessment(command: ExpertAssessmentCommand, signal?: AbortSignal): Promise<ProviderResult<ExpertAssessment>> {
    if (isAborted(signal)) return cancelledResult(command?.requestId, undefined);
    const parsed = expertAssessmentCommandSchema.safeParse(command);
    if (!parsed.success) return invalidCommand(typeof command?.requestId === "string" ? command.requestId : undefined);
    const expert = DEMO_EXPERTS.find((item) => item.expertId === parsed.data.expertId);
    if (!expert) return createProviderResult({
      state: "EMPTY",
      phase: "DEMO_EXPERT_NOT_FOUND",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: null,
      requestId: parsed.data.requestId,
      nextActions: [{ id: "START_OVER", label: "Chọn hồ sơ khác" }],
    });
    const data: ExpertAssessment = {
      assessmentId: `demo-assessment:${parsed.data.expertId}:${parsed.data.scope.caseId}`,
      expertId: parsed.data.expertId,
      caseScope: parsed.data.scope,
      claimStatus: "DEMO_ONLY",
      explanation: "This assessment is a deterministic fixture and is not an expert verification.",
      evidenceReviewedIds: [],
      confidence: null,
      limitations: ["No live expert review was performed."],
      disagreementStatus: "UNKNOWN",
      assessedAt: FIXTURE_TIMESTAMP,
    };
    const contract = expertAssessmentSchema.safeParse(data);
    if (!contract.success) return validationResult(parsed.data.requestId, undefined, "Demo Expert fixture failed its own contract.");
    return createProviderResult({
      state: "SUCCESS",
      phase: "DEMO_ASSESSMENT",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: contract.data,
      requestId: parsed.data.requestId,
      nextActions: [{ id: "REVIEW_UNKNOWN", label: "Đọc giới hạn của fixture" }],
    });
  }

  async getPassport(scope: { caseId: string; caseRevision: number }, requestId: string, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport | null>> {
    if (isAborted(signal)) return cancelledResult(requestId, undefined);
    if (!caseScopeSchema.safeParse(scope).success || !caseScopeSchema.shape.caseId.safeParse(requestId).success) return validationResult(requestId, undefined);
    return createProviderResult({
      state: "EMPTY",
      phase: "NO_DEMO_PASSPORT",
      requestedMode: "DEMO",
      providerStatus: "AVAILABLE",
      provenance: demoProvenance(FIXTURE_ID, FIXTURE_VERSION),
      data: null,
      requestId,
      nextActions: [{ id: "START_OVER", label: "Quay lại case" }],
    });
  }

  async createPassport(command: PassportCreateCommand, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport>> {
    if (isAborted(signal)) return cancelledResult(command?.requestId, undefined);
    const parsed = passportCreateCommandSchema.safeParse(command);
    if (!parsed.success) return invalidCommand(typeof command?.requestId === "string" ? command.requestId : undefined);
    return unavailableResult({
      requestedMode: "DEMO",
      dependency: "demo-passport-write",
      reason: "DISABLED",
      requestId: parsed.data.requestId,
      phase: "DEMO_WRITE_DISABLED",
    });
  }

  async appendRevision(command: PassportAppendRevisionCommand, signal?: AbortSignal): Promise<ProviderResult<PassportRevision>> {
    if (isAborted(signal)) return cancelledResult(command?.requestId, undefined);
    const parsed = passportAppendRevisionCommandSchema.safeParse(command);
    if (!parsed.success) return invalidCommand(typeof command?.requestId === "string" ? command.requestId : undefined);
    return unavailableResult({
      requestedMode: "DEMO",
      dependency: "demo-passport-write",
      reason: "DISABLED",
      requestId: parsed.data.requestId,
      phase: "DEMO_WRITE_DISABLED",
    });
  }
}

export function createDemoProviderBundle(): ProviderBundle {
  const provider = new DemoProvider();
  return Object.freeze({ mode: "DEMO" as const, sourceMode: "DEMO" as const, availability: "AVAILABLE" as const, trust: provider, community: provider, expert: provider, passport: provider });
}
