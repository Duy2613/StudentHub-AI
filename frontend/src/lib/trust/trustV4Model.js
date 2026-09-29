// Presentation only: no scoring, inference, or backend state creation.
export const text = (value) => typeof value === "string" ? value.trim() : "";
const record = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const rows = (value) => Array.isArray(value) ? value : [];
const strings = (...values) => [...new Set(values.flatMap(rows).map(text).filter(Boolean))];
export const isUuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function safeTrustUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    if ([...url.searchParams.keys()].some((key) => /token|secret|password|authorization|api.?key|signature/i.test(key))) return null;
    return url.href;
  } catch { return null; }
}

const TRUTH = {
  SUPPORTED: "Bằng chứng hiện có ủng hộ nội dung",
  VERIFIED: "Nội dung được xác minh trong phạm vi đã kiểm tra",
  CONTRADICTED: "Bằng chứng hiện có phản bác nội dung",
  REFUTED: "Bằng chứng hiện có phản bác nội dung",
  FALSE: "Kết quả đối chiếu xác định nội dung sai",
  MIXED: "Bằng chứng chưa thống nhất",
  CONFLICTING_EVIDENCE: "Các nguồn đang mâu thuẫn",
  DISPUTED: "Nội dung còn tranh luận",
  INSUFFICIENT: "Chưa đủ bằng chứng để kết luận",
  INSUFFICIENT_EVIDENCE: "Chưa đủ bằng chứng để kết luận",
  UNKNOWN: "Chưa thể kết luận",
  UNVERIFIABLE: "Chưa xác minh được nội dung",
  NOT_APPLICABLE: "Không có kết luận kiểm chứng phù hợp",
  STALE: "Bằng chứng cần được cập nhật",
};
export const RELATION = {
  STRONGLY_SUPPORTS: "Ủng hộ mạnh", SUPPORTS: "Ủng hộ", PARTIALLY_SUPPORTS: "Ủng hộ một phần",
  STRONGLY_CONTRADICTS: "Phản bác mạnh", CONTRADICTS: "Phản bác", PARTIALLY_CONTRADICTS: "Phản bác một phần",
  CONTEXTUALIZES: "Bổ sung bối cảnh", NEUTRAL: "Trung lập", INSUFFICIENT: "Chưa đủ liên hệ",
};
export const STAGE_LABEL = { l1: "Sàng lọc đầu vào", l2: "Phân tích nội dung", l2a: "Đối soát nguy cơ", l2b: "Phân tích nội dung", l2c: "Đối soát ngữ cảnh", l3: "Đối chiếu bằng chứng", l4: "Tổng hợp nhận định", l5: "Kiểm tra kết luận" };
export const STATUS_LABEL = { NOT_STARTED: "Chưa bắt đầu", QUEUED: "Đang chờ", RUNNING: "Đang xử lý", COMPLETED: "Đã hoàn tất", PARTIAL: "Có kết quả một phần", FAILED: "Không hoàn tất", SKIPPED: "Không thực hiện", BLOCKED: "Chưa đủ điều kiện" };
export const truthLabel = (value) => TRUTH[text(value).toUpperCase()] || "Chưa có diễn giải cho trạng thái được trả về";
export const relationLabel = (value) => RELATION[text(value)] || "Liên hệ chưa được xác định";

export function hasFixtureMarker(value) {
  const source = record(value);
  return source.demo === true || source.fixture === true
    || [source.sourceState, source.sourceMode, source.meta?.sourceState, source.provenance?.sourceMode, source.provenance?.kind].some((v) => ["DEMO", "DEMO_FIXTURE", "FIXTURE"].includes(v))
    || rows(source.sources).some(hasFixtureMarker)
    || Object.values(record(source.layerResults)).some(hasFixtureMarker)
    || (source.data ? hasFixtureMarker(source.data) : false);
}

export function sameTrustIdentity(incoming, active) {
  if (!incoming || !active) return false;
  const nested = record(incoming.data);
  for (const key of ["requestId", "runId", "caseId", "caseRevision"]) {
    const supplied = incoming[key] ?? nested[key];
    if (incoming[key] != null && nested[key] != null && incoming[key] !== nested[key]) return false;
    if (active[key] != null && supplied != null && supplied !== active[key]) return false;
  }
  return (incoming.requestId || nested.requestId) === active.requestId;
}

// Snapshot order is enforced using actual stage status/timestamps, never a
// timer. A late running snapshot cannot undo a completed stage.
export function advancesTrustSnapshot(incoming, previous) {
  if (!previous) return true;
  if (["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(previous.pipelineStatus) && incoming.pipelineStatus === "RUNNING") return false;
  for (const [key, old] of Object.entries(record(previous.stages))) {
    const next = incoming.stages?.[key];
    if (!next) continue;
    if (["COMPLETED", "PARTIAL", "FAILED", "SKIPPED", "BLOCKED"].includes(old.operationStatus) && ["NOT_STARTED", "QUEUED", "RUNNING"].includes(next.operationStatus)) return false;
    if (old.completedAt && next.completedAt && Date.parse(next.completedAt) < Date.parse(old.completedAt)) return false;
  }
  return true;
}

export function projectTrust(response) {
  if (hasFixtureMarker(response)) throw new Error("FIXTURE_REJECTED");
  const pipeline = record(response?.data);
  const layers = record(pipeline.layerResults);
  const l2 = record(layers.layer2 || layers.layer2B);
  const l3 = record(layers.layer3);
  const l4 = record(layers.layer4);
  const final = record(pipeline.finalPredict);
  const decision = record(pipeline.finalDecision);
  const truth = text(final.truthVerdict || final.truthStatus || final.truthAssessment || decision.truth || decision.truthStatus);
  const sourceRows = rows(l3.sources);
  const sources = sourceRows.map((s, index) => ({
    key: `source-${index}`, id: text(s.sourceId || s.id) || null,
    title: text(s.title || s.publisher) || "Nguồn chưa có tiêu đề",
    url: safeTrustUrl(s.url), publisher: text(s.publisher || s.domain),
    type: text(s.sourceType), origin: text(s.retrievalOrigin || s.origin),
    availability: text(s.validationStatus || s.availability || s.providerStatus),
    publishedAt: text(s.publishedAt), effectiveAt: text(s.effectiveAt), retrievedAt: text(s.retrievedAt),
  }));
  const evidence = rows(l3.evidence).map((e, index) => ({
    key: `evidence-${index}`, id: text(e.evidenceId || e.id) || null,
    claimId: text(e.claimId) || null, sourceId: text(e.sourceId) || null,
    excerpt: text(e.excerpt), summary: text(e.summary), relation: text(e.relation),
    revision: e.revision ?? e.evidenceRevision ?? null,
    retrievedAt: text(e.retrievedAt),
    source: sources.find((s) => s.id && s.id === e.sourceId) || null,
  }));
  const aiVerification = record(l4.aiVerification);
  const aiCitationValidation = record(aiVerification.citationValidation);
  const supportingCitationIds = new Set(rows(aiVerification.supportingSourceIds).map(text).filter(Boolean));
  const contradictingCitationIds = new Set(rows(aiVerification.contradictingSourceIds).map(text).filter(Boolean));
  const citationUrls = new Set();
  const aiCitations = rows(aiVerification.citationsUsed).flatMap((citation, index) => {
    const url = safeTrustUrl(citation?.url);
    if (!url || citationUrls.has(url)) return [];
    citationUrls.add(url);
    const id = text(citation.id) || url;
    const relatedEvidence = evidence.find((item) => item.id === id || item.sourceId === id || item.source?.id === id || item.source?.url === url);
    const source = sources.find((item) => item.id === id || item.url === url) || relatedEvidence?.source || null;
    const supports = supportingCitationIds.has(id);
    const contradicts = contradictingCitationIds.has(id);
    return [{
      key: `ai-citation-${index}`,
      id,
      url,
      requestedUrl: safeTrustUrl(citation.requestedUrl),
      title: source?.title || new URL(url).hostname,
      publisher: source?.publisher || new URL(url).hostname,
      origin: text(citation.retrievalOrigin).slice(0, 120),
      validationStatus: text(citation.validationStatus).slice(0, 80).toUpperCase(),
      httpStatus: Number.isInteger(Number(citation.httpStatus)) && Number(citation.httpStatus) >= 100 && Number(citation.httpStatus) <= 599
        ? Number(citation.httpStatus)
        : null,
      relation: supports && contradicts ? "MIXED" : supports ? "SUPPORTS" : contradicts ? "CONTRADICTS" : "UNSPECIFIED",
      evidenceRevision: relatedEvidence?.revision ?? null,
    }];
  });
  const caseId = text(response.caseId || response.persistence?.caseId);
  const rawCaseRevision = response.caseRevision ?? response.persistence?.caseRevision;
  const caseRevision = Number(rawCaseRevision);
  const runId = text(response.runId || response.persistence?.runId);
  const revisionBound = response.persistence?.persisted === true
    && isUuid(caseId)
    && rawCaseRevision != null
    && Number.isInteger(caseRevision)
    && caseRevision >= 1
    && Boolean(runId);
  const aiStatus = text(l4.aiVerificationStatus || aiVerification.status || l4.ai?.status || l4.aiProviderStatus).slice(0, 80).toUpperCase();
  const aiProvenance = {
    available: Object.keys(aiVerification).length > 0 || record(l4.ai).executed === true,
    revisionBound,
    caseRevision: revisionBound ? caseRevision : null,
    runId: revisionBound ? runId : null,
    requestId: text(response.requestId),
    status: aiStatus || "UNKNOWN",
    citationValidation: Object.keys(aiCitationValidation).length ? {
      checkedCount: Number.isInteger(Number(aiCitationValidation.checkedCount)) && Number(aiCitationValidation.checkedCount) >= 0 ? Number(aiCitationValidation.checkedCount) : 0,
      acceptedCount: Number.isInteger(Number(aiCitationValidation.acceptedCount)) && Number(aiCitationValidation.acceptedCount) >= 0 ? Number(aiCitationValidation.acceptedCount) : 0,
      rejectedCount: Number.isInteger(Number(aiCitationValidation.rejectedCount)) && Number(aiCitationValidation.rejectedCount) >= 0 ? Number(aiCitationValidation.rejectedCount) : 0,
      allLinksValidated: aiCitationValidation.allLinksValidated === true,
    } : null,
    citations: aiCitations,
  };
  const claims = rows(l2.claims).map((c, index) => ({
    key: `claim-${index}`, id: text(c.claimId || c.id) || null,
    statement: text(c.text || c.statement || c.claim) || "Mệnh đề chưa có nội dung",
    status: text(c.status), revision: c.revision ?? null,
    origin: text(c.origin || c.extractionOrigin), context: text(c.context || c.originText || c.originalText),
  }));
  const stages = Object.values(record(pipeline.stages)).map((s) => ({ id: s.stageId, name: STAGE_LABEL[s.stageId] || text(s.stageName), status: text(s.operationStatus), summary: text(s.summary), limitations: strings(s.limitations) }));
  const metrics = [
    ["Mức đủ của bằng chứng", final.evidenceSufficiency],
    ["Phạm vi kiểm chứng", final.verificationCompleteness],
    ["Chất lượng nguồn", final.sourceQuality],
    ["Đồng thuận bằng chứng", final.evidenceAgreement],
  ].filter(([,v]) => (typeof v === "number" && Number.isFinite(v)) || (typeof v === "string" && v.trim()));
  return {
    requestId: response.requestId, caseId: response.caseId || null, caseRevision: response.caseRevision ?? null,
    runId: response.runId || null, persisted: response.persistence?.persisted === true,
    state: pipeline.pipelineStatus || "UNKNOWN", completedAt: pipeline.completedAt,
    truth, title: truth ? truthLabel(truth) : "Chưa có kết luận được trả về",
    hasConclusion: Boolean(pipeline.finalPredict || pipeline.finalDecision),
    security: text(final.securityClassification || final.security || decision.security),
    reasons: strings(final.keyReasons, [l4.userExplanation?.why, final.reason]),
    uncertainty: strings(final.remainingUncertainty, final.uncertainties, l4.limitations),
    action: text(l4.userExplanation?.recommendedActionNote || final.recommendedAction || decision.action),
    confidence: typeof final.assessmentConfidence === "number" ? final.assessmentConfidence : null,
    confidenceExplanation: text(final.confidenceExplanation), confidenceKind: text(final.confidenceKind),
    metrics, claims, evidence, sources, stages, aiProvenance,
    domain: text(l2.domainCode),
  };
}

export function trustFailure(code) {
  return ({
    UNAUTHORIZED: "Phiên đăng nhập chưa sẵn sàng. Hãy đăng nhập để tiếp tục.",
    FORBIDDEN: "Bạn không có quyền xem hoặc kiểm chứng nội dung này.",
    RATE_LIMITED: "Bạn đã gửi quá nhiều yêu cầu. Hãy chờ trước khi thử lại.",
    TIMEOUT: "Chưa nhận được kết quả đúng hạn. Yêu cầu có thể vẫn đang được xử lý; hãy kiểm tra hồ sơ đã lưu trước khi gửi lại.",
    NETWORK_ERROR: "Kết nối bị gián đoạn. Chưa thể xác nhận yêu cầu đã hoàn tất.",
    UPSTREAM_UNAVAILABLE: "Dịch vụ đối chiếu đang không khả dụng. Chưa có kết luận mới.",
    SERVICE_UNAVAILABLE: "Dịch vụ kiểm chứng đang không khả dụng. Chưa có kết luận mới.",
    SCHEMA_MISMATCH: "Kết quả chưa đúng định dạng để hiển thị an toàn.",
    FIXTURE_REJECTED: "Dữ liệu thử nghiệm không được dùng làm kết quả kiểm chứng.",
    IDENTITY_MISMATCH: "Kết quả không khớp yêu cầu đang xem nên chưa được hiển thị.",
  })[code] || "Không thể hoàn tất kiểm chứng. Nội dung của bạn vẫn được giữ để kiểm tra lại.";
}
