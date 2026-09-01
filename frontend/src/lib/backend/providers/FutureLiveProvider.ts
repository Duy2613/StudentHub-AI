import {
  caseScopeSchema,
  communityObservationCommandSchema,
  communityQuerySchema,
  createProviderResult,
  expertAssessmentCommandSchema,
  expertQuerySchema,
  passportAppendRevisionCommandSchema,
  passportCreateCommandSchema,
  trustInvestigationInputSchema,
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

const LIVE_DEPENDENCY = "live-provider";

function cancelledResult<T>(requestId?: string, runId?: string): ProviderResult<T> {
  return createProviderResult({
    state: "CANCELLED",
    phase: "CANCELLED",
    requestedMode: "LIVE",
    providerStatus: "CANCELLED",
    provenance: {
      requestedMode: "LIVE",
      sourceMode: "UNAVAILABLE",
      kind: "UNAVAILABLE",
      label: "Live provider unavailable",
      providerId: LIVE_DEPENDENCY,
      disclosure: "Live backend chưa được cấu hình; không dùng dữ liệu demo thay thế.",
    },
    requestId,
    runId,
    nextActions: [{ id: "START_OVER", label: "Bắt đầu lại" }],
  });
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return Boolean(signal?.aborted);
}

function hasIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,160}$/.test(value.trim());
}

function invalidInput<T>(requestId?: string): ProviderResult<T> {
  return createProviderResult({
    state: "ERROR",
    phase: "VALIDATION",
    requestedMode: "LIVE",
    providerStatus: "ERROR",
    provenance: {
      requestedMode: "LIVE",
      sourceMode: "UNAVAILABLE",
      kind: "UNAVAILABLE",
      label: "Live provider unavailable",
      providerId: LIVE_DEPENDENCY,
      disclosure: "Input không hợp lệ; chưa gọi live provider.",
    },
    requestId,
    error: {
      code: "VALIDATION",
      userMessage: "Thông tin gửi lên chưa hợp lệ.",
      requestId: requestId || null,
      retryable: false,
    },
    nextActions: [{ id: "CORRECT_INPUT", label: "Sửa thông tin đầu vào" }],
  });
}

export class FutureLiveProvider implements TrustProvider, CommunityProvider, ExpertProvider, PassportProvider {
  readonly mode = "LIVE" as const;
  readonly dependency: string;

  constructor(dependency = LIVE_DEPENDENCY) {
    this.dependency = dependency.slice(0, 160);
  }

  async investigate(input: TrustInvestigationInput, signal?: AbortSignal): Promise<ProviderResult<TrustInvestigationResult>> {
    const requestId = typeof input?.requestId === "string" ? input.requestId : undefined;
    const runId = typeof input?.runId === "string" ? input.runId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId, runId);
    const parsed = trustInvestigationInputSchema.safeParse(input);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({
      requestedMode: "LIVE",
      dependency: this.dependency,
      reason: "NOT_CONFIGURED",
      requestId: parsed.data.requestId,
      runId: parsed.data.runId,
      phase: "LIVE_NOT_CONFIGURED",
    });
  }

  async listObservations(query: CommunityQuery, signal?: AbortSignal): Promise<ProviderResult<readonly CommunityObservation[]>> {
    const requestId = typeof query?.requestId === "string" ? query.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId);
    const parsed = communityQuerySchema.safeParse(query);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async getObservation(observationId: string, scope: { caseId: string; caseRevision: number }, requestId: string, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation | null>> {
    if (isAborted(signal)) return cancelledResult(requestId);
    if (!hasIdentifier(observationId) || !caseScopeSchema.safeParse(scope).success || !hasIdentifier(requestId)) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async submitObservation(command: CommunityObservationCommand, signal?: AbortSignal): Promise<ProviderResult<CommunityObservation>> {
    const requestId = typeof command?.requestId === "string" ? command.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId);
    const parsed = communityObservationCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async listExperts(query: ExpertQuery, signal?: AbortSignal): Promise<ProviderResult<readonly ExpertProfile[]>> {
    const requestId = typeof query?.requestId === "string" ? query.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId);
    const parsed = expertQuerySchema.safeParse(query);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async getExpert(expertId: string, requestId: string, signal?: AbortSignal): Promise<ProviderResult<ExpertProfile | null>> {
    if (isAborted(signal)) return cancelledResult(requestId);
    if (!hasIdentifier(expertId) || !hasIdentifier(requestId)) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async requestAssessment(command: ExpertAssessmentCommand, signal?: AbortSignal): Promise<ProviderResult<ExpertAssessment>> {
    const requestId = typeof command?.requestId === "string" ? command.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId);
    const parsed = expertAssessmentCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async getPassport(scope: { caseId: string; caseRevision: number }, requestId: string, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport | null>> {
    if (isAborted(signal)) return cancelledResult(requestId);
    if (!caseScopeSchema.safeParse(scope).success || !hasIdentifier(requestId)) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async createPassport(command: PassportCreateCommand, signal?: AbortSignal): Promise<ProviderResult<EvidencePassport>> {
    const requestId = typeof command?.requestId === "string" ? command.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId);
    const parsed = passportCreateCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "LIVE_NOT_CONFIGURED" });
  }

  async appendRevision(command: PassportAppendRevisionCommand, signal?: AbortSignal): Promise<ProviderResult<PassportRevision>> {
    const requestId = typeof command?.requestId === "string" ? command.requestId : undefined;
    if (isAborted(signal)) return cancelledResult(requestId);
    const parsed = passportAppendRevisionCommandSchema.safeParse(command);
    if (!parsed.success) return invalidInput(requestId);
    return unavailableResult({ requestedMode: "LIVE", dependency: this.dependency, reason: "NOT_CONFIGURED", requestId: parsed.data.requestId, phase: "LIVE_NOT_CONFIGURED" });
  }
}

export function createFutureLiveProviderBundle(dependency = LIVE_DEPENDENCY): ProviderBundle {
  const provider = new FutureLiveProvider(dependency);
  return Object.freeze({ mode: "LIVE" as const, sourceMode: "UNAVAILABLE" as const, availability: "UNAVAILABLE" as const, trust: provider, community: provider, expert: provider, passport: provider });
}
