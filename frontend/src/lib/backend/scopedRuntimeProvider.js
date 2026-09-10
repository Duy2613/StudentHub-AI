import { apiRequest } from "@/lib/api/runtimeClient";
import { ApiError } from "@/lib/api/runtimeError";
import { createStateEnvelope } from "@/lib/ui-state/clientModel";

const configuredProviderMode = process.env.NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE;
export const SCOPED_PROVIDER_MODE = configuredProviderMode === "DEMO" || configuredProviderMode === "LIVE"
  ? configuredProviderMode
  : process.env.NEXT_PUBLIC_COMPETITION_DEMO === "true"
    ? "DEMO"
    : "LIVE";

const COMMUNITY_PROVENANCE = Object.freeze({ requestedMode: "LIVE", sourceMode: "LIVE", kind: "COMMUNITY", label: "Live community observations", providerId: "community-api" });
const EXPERT_PROVENANCE = Object.freeze({ requestedMode: "LIVE", sourceMode: "LIVE", kind: "EXPERT", label: "Live expert profiles", providerId: "experts-api" });

function asRecord(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function nullableText(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function caseScope(value) {
  const scope = asRecord(value);
  return typeof scope.caseId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scope.caseId)
    && Number.isInteger(scope.caseRevision)
    && scope.caseRevision >= 1
    ? { caseId: scope.caseId, caseRevision: scope.caseRevision }
    : null;
}
function references(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string" ? item : asRecord(item).id).filter((item) => typeof item === "string" && item.trim()).slice(0, 50);
}

function normalizeObservation(post) {
  const raw = asRecord(post);
  return {
    observationId: String(raw.postId || raw.observationId || raw.id || "community-observation"),
    caseScope: caseScope(raw.caseScope || raw.scope),
    title: nullableText(raw.title),
    topic: nullableText(raw.topic),
    statement: String(raw.content || raw.body || raw.statement || "").slice(0, 12_000),
    context: nullableText(typeof raw.context === "string" ? raw.context : null),
    observedAt: nullableText(raw.observedAt || raw.publishedAt || raw.createdAt || raw.timestamp),
    submittedAt: nullableText(raw.submittedAt || raw.createdAt || raw.timestamp),
    evidenceRefs: references(raw.evidenceRefs || raw.references),
    freshnessStatus: nullableText(raw.freshnessStatus || raw.recency),
    moderationStatus: nullableText(raw.moderationStatus || raw.moderationState || raw.publicationState || raw.status),
    evidenceState: nullableText(raw.evidenceState),
    reviewState: nullableText(raw.reviewState),
    contributionType: nullableText(raw.contributionType),
    schoolId: nullableText(raw.schoolId || raw.institution),
    authorName: nullableText(raw.authorName || asRecord(raw.author).name),
  };
}

function normalizeExpert(value) {
  const raw = asRecord(value);
  return {
    expertId: String(raw.expertId || raw.id || "expert-unknown"),
    name: String(raw.name || "Chuyên gia chưa công bố tên"),
    title: nullableText(raw.title || raw.academicTitle),
    institution: nullableText(raw.institution),
    department: nullableText(raw.department),
    isVerified: raw.isVerified === true,
    verificationStatus: nullableText(raw.verificationStatus || raw.status),
    scopes: Array.isArray(raw.scopes) ? raw.scopes.filter((scope) => asRecord(scope).domain && asRecord(scope).level).slice(0, 50) : [],
    credentials: Array.isArray(raw.credentials) ? raw.credentials.slice(0, 50) : [],
    publications: Array.isArray(raw.publications) ? raw.publications.slice(0, 100) : [],
    hasRegistrarAuthority: raw.hasRegistrarAuthority === true,
    verificationSummary: raw.verificationSummary || undefined,
    authorityBoundaries: raw.authorityBoundaries || undefined,
  };
}

function safeError(caught) {
  if (caught instanceof ApiError) return { error: caught.toSafeError(), state: caught.code === "UNAUTHORIZED" ? "AUTH_REQUIRED" : caught.code === "FORBIDDEN" ? "FORBIDDEN" : caught.code === "TIMEOUT" || caught.code === "SERVICE_UNAVAILABLE" || caught.code === "PROMAX_MIGRATION_REQUIRED" ? "UNAVAILABLE" : caught.code === "NETWORK_ERROR" ? "OFFLINE" : "ERROR" };
  const error = new ApiError("Provider request failed.", "SERVER_ERROR", { retryable: true });
  return { error: error.toSafeError(), state: "ERROR" };
}

function providerFailure(caught, dependency, phase, requestId) {
  const failure = safeError(caught, dependency);
  const migrationRequired = failure.error?.code === "PROMAX_MIGRATION_REQUIRED";
  return createStateEnvelope({
    state: failure.state,
    phase,
    error: failure.error,
    requestId,
    retryable: failure.error.retryable,
    unavailable: failure.state === "UNAVAILABLE" ? { dependency, reason: migrationRequired ? "MIGRATION_REQUIRED" : "UNREACHABLE" } : undefined,
    nextActions: migrationRequired
      ? []
      : [{ id: failure.state === "AUTH_REQUIRED" ? "SIGN_IN" : "RETRY", label: failure.state === "AUTH_REQUIRED" ? "Đăng nhập để tiếp tục" : "Thử lại" }],
  });
}

export function getCommunityRuntimeProvider() {
  if (SCOPED_PROVIDER_MODE === "DEMO") {
    let bundlePromise;
    return {
      listObservations: (...args) => (bundlePromise ||= import("./runtimeProvider").then(({ getRuntimeProviderBundle }) => getRuntimeProviderBundle().community)).then((provider) => provider.listObservations(...args)),
      getObservation: (...args) => (bundlePromise ||= import("./runtimeProvider").then(({ getRuntimeProviderBundle }) => getRuntimeProviderBundle().community)).then((provider) => provider.getObservation(...args)),
      submitObservation: (...args) => (bundlePromise ||= import("./runtimeProvider").then(({ getRuntimeProviderBundle }) => getRuntimeProviderBundle().community)).then((provider) => provider.submitObservation(...args)),
    };
  }

  return {
    async listObservations(query, signal) {
      try {
        const params = new URLSearchParams();
        if (query.topic) params.set("topic", query.topic);
        if (query.sort) params.set("sort", query.sort);
        const payload = await apiRequest(`/api/intelligence/community/posts${params.size ? `?${params}` : ""}`, { signal, requestId: query.requestId });
        const posts = Array.isArray(payload?.posts) ? payload.posts : [];
        const data = posts.slice(0, query.limit || 50).map(normalizeObservation);
        return createStateEnvelope({ state: data.length ? "SUCCESS" : "EMPTY", phase: data.length ? "COMMUNITY_OBSERVATIONS" : "COMMUNITY_EMPTY", data, provenance: COMMUNITY_PROVENANCE, requestId: query.requestId, nextActions: data.length ? [] : [{ id: "START_OVER", label: "Đổi phạm vi tìm kiếm" }] });
      } catch (caught) { return providerFailure(caught, "community-api", "COMMUNITY_LIST_FAILED", query.requestId); }
    },
    async getObservation(observationId, scope, requestId, signal) {
      try {
        const payload = await apiRequest(`/api/intelligence/community/experiences/${encodeURIComponent(observationId)}`, { signal, requestId });
        const observation = normalizeObservation(payload?.experience);
        const matches = observation.caseScope?.caseId === scope.caseId && observation.caseScope?.caseRevision === scope.caseRevision;
        if (!matches) return createStateEnvelope({ state: "PARTIAL", phase: "COMMUNITY_OBSERVATION_SCOPE_UNCONFIRMED", data: observation, provenance: { ...COMMUNITY_PROVENANCE, label: "Live community observation; requested case scope not confirmed" }, requestId, missing: ["community-case-scope-match"], unknowns: ["The community detail endpoint did not confirm that this observation belongs to the requested case revision."], nextActions: [{ id: "OPEN_COMMUNITY", label: "Xem thêm bối cảnh cộng đồng" }] });
        return createStateEnvelope({ state: "SUCCESS", phase: "COMMUNITY_OBSERVATION_READ", data: observation, provenance: COMMUNITY_PROVENANCE, requestId, nextActions: [] });
      } catch (caught) { return providerFailure(caught, "community-api", "COMMUNITY_DETAIL_FAILED", requestId); }
    },
    async submitObservation(command, signal) {
      try {
        const draft = { content: command.statement, evidenceRefs: command.evidenceRefs, caseScope: command.scope, claimId: command.claimId, contributionType: command.contributionType, source: command.source, phase: "PREVIEW" };
        const previewPayload = await apiRequest("/api/intelligence/community/posts", { method: "POST", body: JSON.stringify(draft), signal, requestId: command.requestId, headers: { "Idempotency-Key": command.idempotencyKey } });
        if (previewPayload?.state === "BLOCKED" || previewPayload?.preview?.state === "BLOCKED") {
          return createStateEnvelope({ state: "BLOCKED", phase: "COMMUNITY_PRIVACY_BLOCKED", data: previewPayload.preview, requestId: command.requestId, nextActions: [{ id: "REMOVE_IDENTIFIERS", label: "Xóa thông tin nhận diện rồi thử lại" }] });
        }
        const payload = await apiRequest("/api/intelligence/community/posts", { method: "POST", body: JSON.stringify({ ...draft, phase: "PUBLISH", privacyConfirmed: true, previewDigest: previewPayload?.preview?.previewDigest }), signal, requestId: command.requestId, headers: { "Idempotency-Key": command.idempotencyKey } });
        const observation = normalizeObservation(payload?.post);
        if (!observation.caseScope) return createStateEnvelope({ state: "PARTIAL", phase: "COMMUNITY_OBSERVATION_CREATED_SCOPE_UNCONFIRMED", data: observation, provenance: { ...COMMUNITY_PROVENANCE, label: "Live community observation; case scope not echoed by compatibility endpoint" }, requestId: command.requestId, missing: ["community-case-scope-persistence"], unknowns: ["The compatibility community endpoint did not echo the requested case scope."], nextActions: [{ id: "WAIT", label: "Chờ backend hỗ trợ scope của case" }] });
        return createStateEnvelope({ state: "SUCCESS", phase: "COMMUNITY_OBSERVATION_CREATED", data: observation, provenance: COMMUNITY_PROVENANCE, requestId: command.requestId, nextActions: [] });
      } catch (caught) { return providerFailure(caught, "community-api", "COMMUNITY_SUBMIT_FAILED", command.requestId); }
    },
  };
}

export function getExpertRuntimeProvider() {
  if (SCOPED_PROVIDER_MODE === "DEMO") {
    let bundlePromise;
    return {
      listExperts: (...args) => (bundlePromise ||= import("./runtimeProvider").then(({ getRuntimeProviderBundle }) => getRuntimeProviderBundle().expert)).then((provider) => provider.listExperts(...args)),
      requestAssessment: (...args) => (bundlePromise ||= import("./runtimeProvider").then(({ getRuntimeProviderBundle }) => getRuntimeProviderBundle().expert)).then((provider) => provider.requestAssessment(...args)),
    };
  }

  return {
    async listExperts(query, signal) {
      try {
        const params = new URLSearchParams({ limit: String(query.limit || 50) });
        const payload = await apiRequest(`/api/v1/experts?${params}`, { signal, requestId: query.requestId });
        const experts = Array.isArray(payload?.data?.experts) ? payload.data.experts : Array.isArray(payload?.experts) ? payload.experts : [];
        const data = experts.map(normalizeExpert);
        return createStateEnvelope({ state: data.length ? "SUCCESS" : "EMPTY", phase: data.length ? "EXPERT_PROFILES" : "EXPERT_EMPTY", data, provenance: EXPERT_PROVENANCE, requestId: query.requestId, nextActions: data.length ? [] : [{ id: "START_OVER", label: "Đổi phạm vi tìm kiếm" }] });
      } catch (caught) { return providerFailure(caught, "experts-api", "EXPERT_LIST_FAILED", query.requestId); }
    },
    async requestAssessment(command, signal) {
      try {
        const payload = await apiRequest("/api/expert/evaluate", { method: "POST", body: JSON.stringify({ expertId: command.expertId, claim: command.claim }), signal, requestId: command.requestId, headers: { "Idempotency-Key": command.idempotencyKey } });
        const evaluation = asRecord(payload?.evaluation);
        const data = { assessmentId: null, expertId: command.expertId, caseScope: caseScope(command.scope), claimStatus: nullableText(evaluation.claimStatus), explanation: nullableText(evaluation.explanation), evidenceReviewedIds: [], confidence: null, limitations: ["Scope check is non-persistent. Submit a revision-bound assessment through the Promax assessment endpoint to create an authority record."], disagreementStatus: nullableText(asRecord(evaluation.expertConsensus).disagreementLevel), assessedAt: null };
        return createStateEnvelope({ state: "SUCCESS", phase: "EXPERT_SCOPE_CHECK", data, provenance: { ...EXPERT_PROVENANCE, label: "Live expert scope check (non-persistent)", providerId: "expert-evaluate-api" }, requestId: command.requestId, nextActions: [] });
      } catch (caught) { return providerFailure(caught, "expert-evaluate-api", "EXPERT_ASSESSMENT_FAILED", command.requestId); }
    },
  };
}
