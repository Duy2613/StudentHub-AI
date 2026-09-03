import { z } from "zod";
import { safeFrontendErrorSchema, type ApiErrorCode, type SafeFrontendError } from "../api/errors";

export const UI_STATE_VALUES = [
  "IDLE",
  "VALIDATING",
  "LOADING",
  "SUBMITTING",
  "SUCCESS",
  "EMPTY",
  "PARTIAL",
  "UNKNOWN",
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
  "UNAVAILABLE",
  "ERROR",
  "OFFLINE",
  "CANCELLED",
  "AUTH_REQUIRED",
  "FORBIDDEN",
] as const;

export type UIState = typeof UI_STATE_VALUES[number];
export const uiStateSchema = z.enum(UI_STATE_VALUES);

export const SOURCE_MODE_VALUES = ["DEMO", "LIVE", "UNAVAILABLE"] as const;
export type SourceMode = typeof SOURCE_MODE_VALUES[number];
export const sourceModeSchema = z.enum(SOURCE_MODE_VALUES);

export const REQUESTED_MODE_VALUES = ["DEMO", "LIVE"] as const;
export type RequestedMode = typeof REQUESTED_MODE_VALUES[number];
export const requestedModeSchema = z.enum(REQUESTED_MODE_VALUES);

export const PROVENANCE_KIND_VALUES = [
  "DEMO_FIXTURE",
  "USER_SUBMITTED",
  "COMMUNITY",
  "EXPERT",
  "LIVE_PROVIDER",
  "DERIVED",
  "UNAVAILABLE",
] as const;
export type ProvenanceKind = typeof PROVENANCE_KIND_VALUES[number];
export const provenanceKindSchema = z.enum(PROVENANCE_KIND_VALUES);

export type SourceProvenance = Readonly<{
  requestedMode: RequestedMode;
  sourceMode: SourceMode;
  kind: ProvenanceKind;
  label: string;
  providerId?: string;
  fixtureId?: string;
  fixtureVersion?: string;
  disclosure?: string;
}>;

export const sourceProvenanceSchema = z.object({
  requestedMode: requestedModeSchema,
  sourceMode: sourceModeSchema,
  kind: provenanceKindSchema,
  label: z.string().trim().min(1).max(160),
  providerId: z.string().trim().min(1).max(160).optional(),
  fixtureId: z.string().trim().min(1).max(160).optional(),
  fixtureVersion: z.string().trim().min(1).max(80).optional(),
  disclosure: z.string().trim().min(1).max(240).optional(),
}).superRefine((value, context) => {
  if (value.sourceMode === "DEMO" && value.kind !== "DEMO_FIXTURE") {
    context.addIssue({ code: "custom", path: ["kind"], message: "DEMO sources must use DEMO_FIXTURE provenance." });
  }
  if (value.sourceMode === "UNAVAILABLE" && value.kind !== "UNAVAILABLE") {
    context.addIssue({ code: "custom", path: ["kind"], message: "UNAVAILABLE sources must use UNAVAILABLE provenance." });
  }
  if (value.kind === "DEMO_FIXTURE" && value.sourceMode !== "DEMO") {
    context.addIssue({ code: "custom", path: ["sourceMode"], message: "Demo provenance cannot be reported as live." });
  }
});

export const UNAVAILABLE_REASON_VALUES = [
  "NOT_CONFIGURED",
  "DISABLED",
  "UNREACHABLE",
  "TIMEOUT",
  "INVALID_RESPONSE",
  "UNKNOWN",
] as const;
export type UnavailableReason = typeof UNAVAILABLE_REASON_VALUES[number];
export const unavailableReasonSchema = z.enum(UNAVAILABLE_REASON_VALUES);

export type UnavailableDependency = Readonly<{
  dependency: string;
  reason: UnavailableReason;
}>;

export const unavailableDependencySchema = z.object({
  dependency: z.string().trim().min(1).max(160),
  reason: unavailableReasonSchema,
}).strict();

export const UI_ACTION_ID_VALUES = [
  "RETRY",
  "SIGN_IN",
  "CORRECT_INPUT",
  "REVIEW_UNKNOWN",
  "CHECK_OFFICIAL_SOURCE",
  "OPEN_COMMUNITY",
  "REQUEST_EXPERT",
  "OPEN_PASSPORT",
  "CANCEL",
  "START_OVER",
  "CONTACT_SUPPORT",
  "WAIT",
] as const;
export type UIActionId = typeof UI_ACTION_ID_VALUES[number];
export const uiActionIdSchema = z.enum(UI_ACTION_ID_VALUES);

export type UIAction = Readonly<{
  id: UIActionId;
  label: string;
}>;

export const uiActionSchema = z.object({
  id: uiActionIdSchema,
  label: z.string().trim().min(1).max(120),
}).strict();

export const TRUST_DECISION_VALUES = [
  "SAFE",
  "RISK",
  "UNKNOWN",
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
  "UNAVAILABLE",
] as const;
export type TrustDecision = typeof TRUST_DECISION_VALUES[number];
export const trustDecisionSchema = z.enum(TRUST_DECISION_VALUES);

export type TrustSemantics = Readonly<{
  kind: "TRUST_DECISION";
  value: TrustDecision;
}>;

export const trustSemanticsSchema = z.object({
  kind: z.literal("TRUST_DECISION"),
  value: trustDecisionSchema,
}).strict();

export type UIStateEnvelope<T> = Readonly<{
  state: UIState;
  phase: string;
  data?: T;
  error?: SafeFrontendError;
  unknowns: readonly string[];
  missing: readonly string[];
  unavailable?: UnavailableDependency;
  provenance?: SourceProvenance;
  requestId?: string;
  runId?: string;
  updatedAt?: string;
  retryable: boolean;
  nextActions: readonly UIAction[];
  trust?: TrustSemantics;
}>;

export const uiStateEnvelopeSchema = z.object({
  state: uiStateSchema,
  phase: z.string().trim().min(1).max(120),
  data: z.unknown().optional(),
  error: safeFrontendErrorSchema.optional(),
  unknowns: z.array(z.string().trim().min(1).max(240)).max(100),
  missing: z.array(z.string().trim().min(1).max(240)).max(100),
  unavailable: unavailableDependencySchema.optional(),
  provenance: sourceProvenanceSchema.optional(),
  requestId: z.string().trim().min(1).max(120).optional(),
  runId: z.string().trim().min(1).max(120).optional(),
  updatedAt: z.string().datetime().optional(),
  retryable: z.boolean(),
  nextActions: z.array(uiActionSchema).max(12),
  trust: trustSemanticsSchema.optional(),
}).passthrough();

export type StateEnvelopeOptions<T> = Readonly<{
  state: UIState;
  phase?: string;
  data?: T;
  error?: SafeFrontendError;
  unknowns?: readonly string[];
  missing?: readonly string[];
  unavailable?: UnavailableDependency;
  provenance?: SourceProvenance;
  requestId?: string;
  runId?: string;
  updatedAt?: string;
  retryable?: boolean;
  nextActions?: readonly UIAction[];
  trust?: TrustSemantics;
}>;

export class UIStateContractError extends Error {
  readonly code = "UI_STATE_CONTRACT_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "UIStateContractError";
  }
}

const UNCERTAIN_STATES = new Set<UIState>([
  "UNKNOWN",
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
  "UNAVAILABLE",
  "OFFLINE",
]);

function hasOwnData(value: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(value, "data") && value.data !== undefined;
}

function assertStringList(value: unknown, field: string): asserts value is readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    throw new UIStateContractError(`${field} must contain non-empty strings.`);
  }
}

export function assertTrustStateInvariant(state: UIState, trust?: TrustSemantics): void {
  if (trust?.value === "SAFE" && UNCERTAIN_STATES.has(state)) {
    throw new UIStateContractError(`${state} cannot be represented as a SAFE Trust decision.`);
  }
}

export function assertStateEnvelope<T = unknown>(value: unknown): asserts value is UIStateEnvelope<T> {
  const parsed = uiStateEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    throw new UIStateContractError(parsed.error.issues[0]?.message || "State envelope does not match the canonical contract.");
  }

  const record = value as Record<string, unknown>;
  const state = parsed.data.state;
  const unknowns = parsed.data.unknowns;
  const missing = parsed.data.missing;
  assertStringList(unknowns, "unknowns");
  assertStringList(missing, "missing");

  if ((state === "SUCCESS" || state === "EMPTY" || state === "PARTIAL") && !hasOwnData(record)) {
    throw new UIStateContractError(`${state} must preserve contract-valid data, including an empty collection when appropriate.`);
  }
  if (state === "PARTIAL" && missing.length === 0) {
    throw new UIStateContractError("PARTIAL must identify the missing scope.");
  }
  if ((state === "UNKNOWN" || state === "INSUFFICIENT_EVIDENCE") && unknowns.length === 0 && missing.length === 0) {
    throw new UIStateContractError(`${state} must identify an unresolved or missing fact.`);
  }
  if (state === "CONFLICTING_EVIDENCE" && unknowns.length === 0 && missing.length === 0 && !hasOwnData(record)) {
    throw new UIStateContractError("CONFLICTING_EVIDENCE must preserve competing data or identify the conflict.");
  }
  if (state === "UNAVAILABLE" && !parsed.data.unavailable) {
    throw new UIStateContractError("UNAVAILABLE must identify the unavailable dependency.");
  }
  if ((state === "ERROR" || state === "AUTH_REQUIRED" || state === "FORBIDDEN") && !parsed.data.error) {
    throw new UIStateContractError(`${state} must include a safe typed error.`);
  }
  if (state === "SUCCESS" && (parsed.data.error || parsed.data.unavailable)) {
    throw new UIStateContractError("SUCCESS cannot conceal an error or unavailable dependency.");
  }

  assertTrustStateInvariant(state, parsed.data.trust);
}

function copyStrings(values: readonly string[] | undefined): string[] {
  return [...(values || [])];
}

function copyActions(values: readonly UIAction[] | undefined): UIAction[] {
  return [...(values || [])];
}

export function createStateEnvelope<T>(options: StateEnvelopeOptions<T>): UIStateEnvelope<T> {
  const envelope: UIStateEnvelope<T> = Object.freeze({
    state: options.state,
    phase: options.phase || options.state,
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.error ? { error: options.error } : {}),
    unknowns: Object.freeze(copyStrings(options.unknowns)),
    missing: Object.freeze(copyStrings(options.missing)),
    ...(options.unavailable ? { unavailable: options.unavailable } : {}),
    ...(options.provenance ? { provenance: options.provenance } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.runId ? { runId: options.runId } : {}),
    ...(options.updatedAt ? { updatedAt: options.updatedAt } : {}),
    retryable: options.retryable ?? options.error?.retryable ?? false,
    nextActions: Object.freeze(copyActions(options.nextActions)),
    ...(options.trust ? { trust: options.trust } : {}),
  });
  assertStateEnvelope(envelope);
  return envelope;
}

export function createIdleState<T>(options: Omit<Partial<StateEnvelopeOptions<T>>, "state"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "IDLE" });
}

export function createLoadingState<T>(options: Omit<Partial<StateEnvelopeOptions<T>>, "state"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "LOADING" });
}

export function createSubmittingState<T>(options: Omit<Partial<StateEnvelopeOptions<T>>, "state"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "SUBMITTING" });
}

export function createSuccessState<T>(data: T, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "data"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "SUCCESS", data });
}

export function createEmptyState<T>(data: T, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "data"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "EMPTY", data });
}

export function createPartialState<T>(data: T, missing: readonly string[], options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "data" | "missing"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "PARTIAL", data, missing });
}

export function createUnknownState<T>(unknowns: readonly string[], data?: T, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "data" | "unknowns"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "UNKNOWN", ...(data !== undefined ? { data } : {}), unknowns });
}

export function createInsufficientEvidenceState<T>(unknowns: readonly string[], data?: T, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "data" | "unknowns"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "INSUFFICIENT_EVIDENCE", ...(data !== undefined ? { data } : {}), unknowns });
}

export function createConflictingEvidenceState<T>(data: T, unknowns: readonly string[], options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "data" | "unknowns"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "CONFLICTING_EVIDENCE", data, unknowns });
}

export function createUnavailableState<T>(options: Omit<Partial<StateEnvelopeOptions<T>>, "state"> & { unavailable: UnavailableDependency } ): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "UNAVAILABLE" });
}

export function createErrorState<T>(error: SafeFrontendError, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "error"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "ERROR", error });
}

export function createOfflineState<T>(options: Omit<Partial<StateEnvelopeOptions<T>>, "state"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "OFFLINE" });
}

export function createAuthRequiredState<T>(error: SafeFrontendError, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "error"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "AUTH_REQUIRED", error });
}

export function createForbiddenState<T>(error: SafeFrontendError, options: Omit<Partial<StateEnvelopeOptions<T>>, "state" | "error"> = {}): UIStateEnvelope<T> {
  return createStateEnvelope({ ...options, state: "FORBIDDEN", error });
}

export const UI_STATE_TRANSITIONS: Readonly<Record<UIState, readonly UIState[]>> = Object.freeze({
  IDLE: ["VALIDATING", "LOADING", "SUBMITTING", "AUTH_REQUIRED"],
  VALIDATING: ["LOADING", "SUBMITTING", "SUCCESS", "ERROR", "OFFLINE", "UNAVAILABLE", "AUTH_REQUIRED", "FORBIDDEN", "CANCELLED"],
  LOADING: ["SUCCESS", "EMPTY", "PARTIAL", "UNKNOWN", "INSUFFICIENT_EVIDENCE", "CONFLICTING_EVIDENCE", "UNAVAILABLE", "ERROR", "OFFLINE", "AUTH_REQUIRED", "FORBIDDEN", "CANCELLED"],
  SUBMITTING: ["SUCCESS", "EMPTY", "PARTIAL", "CONFLICTING_EVIDENCE", "UNAVAILABLE", "ERROR", "OFFLINE", "AUTH_REQUIRED", "FORBIDDEN", "CANCELLED"],
  SUCCESS: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  EMPTY: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  PARTIAL: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  UNKNOWN: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  INSUFFICIENT_EVIDENCE: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  CONFLICTING_EVIDENCE: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  UNAVAILABLE: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  ERROR: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  OFFLINE: ["VALIDATING", "LOADING", "SUBMITTING", "IDLE"],
  CANCELLED: ["IDLE", "VALIDATING", "LOADING", "SUBMITTING"],
  AUTH_REQUIRED: ["IDLE", "VALIDATING"],
  FORBIDDEN: ["IDLE", "VALIDATING"],
});

export function canTransition(from: UIState, to: UIState): boolean {
  return from === to || UI_STATE_TRANSITIONS[from].includes(to);
}

export function transitionState<T>(current: UIStateEnvelope<T>, next: UIStateEnvelope<T>): UIStateEnvelope<T> {
  assertStateEnvelope(current);
  assertStateEnvelope(next);
  if (!canTransition(current.state, next.state)) {
    throw new UIStateContractError(`Invalid UI state transition: ${current.state} → ${next.state}.`);
  }
  return next;
}

export type WorkIdentity = Readonly<{
  requestId: string;
  runId?: string;
}>;

let identityCounter = 0;

export function createWorkIdentity(prefix = "work"): WorkIdentity {
  const random = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${identityCounter += 1}`;
  return Object.freeze({
    requestId: `${prefix}:request:${random}`,
    runId: `${prefix}:run:${random}`,
  });
}

export function isCurrentWork(candidate: Pick<UIStateEnvelope<unknown>, "requestId" | "runId">, current: WorkIdentity): boolean {
  return Boolean(
    current.requestId
      && candidate.requestId === current.requestId
      && (!current.runId || candidate.runId === current.runId),
  );
}

export function commitIfCurrent<T>(current: UIStateEnvelope<T>, next: UIStateEnvelope<T>, identity: WorkIdentity): UIStateEnvelope<T> {
  return isCurrentWork(next, identity) ? next : current;
}

export function uiStateForApiError(code: ApiErrorCode): UIState {
  if (code === "UNAUTHORIZED") return "AUTH_REQUIRED";
  if (code === "FORBIDDEN") return "FORBIDDEN";
  if (code === "CONFLICT") return "CONFLICTING_EVIDENCE";
  if (code === "NETWORK_ERROR") return "OFFLINE";
  if (code === "TIMEOUT" || code === "UPSTREAM_UNAVAILABLE" || code === "SERVICE_UNAVAILABLE") return "UNAVAILABLE";
  if (code === "ABORTED") return "CANCELLED";
  if (code === "PROVIDER_PARTIAL") return "PARTIAL";
  return "ERROR";
}
