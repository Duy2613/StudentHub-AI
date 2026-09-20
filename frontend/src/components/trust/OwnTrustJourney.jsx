"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  ScanSearch,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import PostResultGateways from "./PostResultGateways";
import styles from "./OwnTrustJourney.module.css";

const INPUT_MODES = [
  { id: "image", label: "Ảnh", icon: ImageIcon },
  { id: "qr", label: "QR", icon: ScanSearch },
  { id: "text", label: "Văn bản", icon: ClipboardPaste },
  { id: "url", label: "URL", icon: Globe2 },
];

const STAGE_IDS = ["l1", "l2", "l3", "l4"];
const JOURNEY_IDS = [...STAGE_IDS, "final_predict"];

const STAGE_INFO = {
  l1: {
    index: "01",
    eyebrow: "SCREEN",
    title: "Deterministic Screen",
    description: "Chuẩn hóa input và phát hiện dấu hiệu kỹ thuật cục bộ.",
    icon: ShieldCheck,
  },
  l2: {
    index: "02",
    eyebrow: "INTELLIGENCE",
    title: "Threat & Semantic Intelligence",
    description: "Đối soát threat, semantic và ngữ cảnh theo nguồn kiểm tra thực tế.",
    icon: Brain,
  },
  l3: {
    index: "03",
    eyebrow: "EVIDENCE",
    title: "Evidence Retrieval",
    description: "Truy vấn bằng chứng live và giữ lại provenance của từng nguồn.",
    icon: Search,
  },
  l4: {
    index: "04",
    eyebrow: "SYNTHESIS",
    title: "Synthesis & Reasoning",
    description: "Tổng hợp evidence đã kiểm chứng; chưa phải Final Predict.",
    icon: Sparkles,
  },
  final_predict: {
    index: "FINAL",
    eyebrow: "PREDICT",
    title: "Final Predict",
    description: "Kết luận deterministic từ L1–L4, không gọi thêm nguồn ngoài.",
    icon: ShieldCheck,
  },
};

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeText(value, fallback = "Chưa công bố") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return fallback;
}

function stringList(value, limit = 16) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return item.details || item.reason || item.message || item.text || item.title || "";
      return "";
    })
    .filter(Boolean)
    .slice(0, limit);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percentOrValue(value) {
  const number = numberOrNull(value);
  if (number === null) return safeText(value);
  const normalized = number >= 0 && number <= 1 ? number * 100 : number;
  return `${Math.round(normalized)}%`;
}

function publicRetrievalMode(value) {
  const normalized = String(value || "").toUpperCase();
  if (!normalized) return null;
  if (normalized.includes("SUPPLEMENT")) return "SUPPLEMENTAL_RETRIEVAL";
  if (normalized.includes("INITIAL")) return "INITIAL_RETRIEVAL";
  return "EXTERNAL_RETRIEVAL";
}

function publicRetrievalOrigin(value) {
  const normalized = String(value || "").toUpperCase();
  if (!normalized) return null;
  if (normalized.includes("TAVILY") || normalized.includes("SEARCH") || normalized.includes("RETRIEVAL")) {
    return "EXTERNAL_RETRIEVAL";
  }
  return value;
}

function publicOperationStatus(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (/^(?:GEMINI|TAVILY|GOOGLE)(?:_|$)/i.test(text)) {
    if (/(?:FAILED|ERROR|TIMEOUT|UNAVAILABLE|REJECT)/i.test(text)) return "EXTERNAL_ERROR";
    if (/(?:RUNNING|PENDING|QUEUED)/i.test(text)) return "EXTERNAL_PENDING";
    if (/(?:COMPLETED|SUCCESS|VERIFIED|REACHABLE)/i.test(text)) return "EXTERNAL_OK";
    return "EXTERNAL";
  }
  return text;
}

function publicMetadataValue(value, fallback = "Chưa công bố") {
  const text = safeText(value, fallback);
  if (!/(?:gemini|tavily|^google(?:[-_: ]+(?:search|gemini)))/i.test(text)) return text;
  if (/(?:failed|error|timeout|unavailable|reject)/i.test(text)) return "EXTERNAL_ERROR";
  if (/(?:running|pending|queued)/i.test(text)) return "EXTERNAL_PENDING";
  if (/(?:completed|success|verified|reachable)/i.test(text)) return "EXTERNAL_OK";
  return "EXTERNAL";
}

function publicSourceTitle(source, index) {
  const title = safeText(source?.title || source?.publisher || source?.domain || source?.url);
  return /^(?:supplemental[-_:])?tavily(?:[-_: ]|$)|^gemini(?:[-_: ]|$)|^google(?:[-_: ]+(?:search|gemini))(?:[-_: ]|$)/i.test(title)
    ? `Evidence source ${index + 1}`
    : title;
}

function publicSourcePublisher(source) {
  const publisher = safeText(source?.publisher || source?.domain);
  return /gemini|tavily/i.test(publisher) ? "Validated external source" : publisher;
}

function statusLabel(status) {
  switch (String(status || "").toUpperCase()) {
    case "RUNNING": return "Đang chạy";
    case "COMPLETED": return "Hoàn tất";
    case "PARTIAL": return "Một phần";
    case "FAILED": return "Không thành công";
    case "BLOCKED": return "Bị chặn";
    case "SKIPPED": return "Đã bỏ qua";
    case "READY": return "Sẵn sàng";
    default: return "Đang khóa";
  }
}

function stageState(pipeline, stageId, index, processing) {
  const stage = asRecord(pipeline?.stages?.[stageId]);
  const operationStatus = String(stage.operationStatus || "NOT_STARTED").toUpperCase();
  if (operationStatus === "RUNNING" || (processing && pipeline?.currentStage === stageId)) return "running";
  if (operationStatus === "COMPLETED") return "complete";
  if (["PARTIAL", "FAILED", "BLOCKED", "SKIPPED"].includes(operationStatus)) return "partial";
  if (index === 0) return "ready";
  return "locked";
}

function stageStatusValue(pipeline, stageId, processing) {
  const state = stageState(pipeline, stageId, STAGE_IDS.indexOf(stageId), processing);
  if (state === "running") return "RUNNING";
  if (state === "complete") return "COMPLETED";
  if (state === "partial") return String(pipeline?.stages?.[stageId]?.operationStatus || "PARTIAL").toUpperCase();
  if (state === "ready") return "READY";
  return "NOT_STARTED";
}

function isOpenable(state) {
  return state !== "locked";
}

function publicLayer(layers, pipeline, layerId) {
  const layerKey = `layer${layerId.slice(1)}`;
  return layers?.[layerKey] || pipeline?.layerResults?.[layerKey] || null;
}

function safeSourceUrl(source) {
  const candidate = source?.sourceUrl || source?.url || source?.link;
  if (typeof candidate !== "string" || !/^https?:\/\//i.test(candidate)) return null;
  return candidate;
}

function sourceRecords(layer3) {
  const layer = asRecord(layer3);
  const sources = Array.isArray(layer.sources)
    ? layer.sources
    : Array.isArray(layer.verifiedSources)
      ? layer.verifiedSources
      : [];
  const evidenceBySource = new Map(
    (Array.isArray(layer.evidence) ? layer.evidence : []).map((item) => [item?.sourceId || item?.sourceUrl || item?.url, item]),
  );
  return sources.map((source, index) => {
    const record = asRecord(source);
    const evidence = evidenceBySource.get(record.sourceId || record.sourceUrl || record.url) || {};
    return {
      ...record,
      id: record.sourceId || record.evidenceId || `source-${index + 1}`,
      title: record.title || record.publisher || record.domain || "Nguồn live không có tiêu đề",
      url: safeSourceUrl(record),
      publisher: record.publisher || record.domain || "Publisher chưa công bố",
      excerpt: record.excerpt || evidence.excerpt || "",
    };
  });
}

function citationRecords(aiVerification) {
  const ai = asRecord(aiVerification);
  return (Array.isArray(ai.citationsUsed) ? ai.citationsUsed : []).map((citation, index) => {
    const record = asRecord(citation);
    const url = safeSourceUrl(record);
    if (!url) return null;
    return {
      ...record,
      id: record.id || `validated-citation-${index + 1}`,
      title: record.title || record.id || "Validated evidence source",
      publisher: record.publisher || "Layer 3 validated source",
      url,
      retrievalOrigin: record.retrievalOrigin || "GEMINI_GENERATED",
      validationStatus: record.validationStatus || "REACHABLE",
    };
  }).filter(Boolean);
}

function mergeSourceRecords(...groups) {
  const merged = new Map();
  for (const group of groups) {
    for (const item of Array.isArray(group) ? group : []) {
      const record = asRecord(item);
      const url = safeSourceUrl(record);
      const key = url || record.id || record.sourceId;
      if (!key || merged.has(key)) continue;
      merged.set(key, record);
    }
  }
  return Array.from(merged.values());
}

function providerRecords(layer2, fallbackProviders) {
  const layer = asRecord(layer2);
  const records = layer.providerObservations || layer.providers || layer.providerResults;
  if (Array.isArray(records)) return records.map(asRecord);
  return Array.isArray(fallbackProviders) ? fallbackProviders.map(asRecord) : [];
}

function inputModeLabel(mode) {
  return INPUT_MODES.find((item) => item.id === mode)?.label || "Đầu vào";
}

function statusIcon(state) {
  if (state === "running") return <LoaderCircle size={12} className="animate-spin" aria-hidden="true" />;
  if (state === "complete") return <Check size={12} aria-hidden="true" />;
  if (state === "partial") return <AlertTriangle size={12} aria-hidden="true" />;
  if (state === "locked") return <LockKeyhole size={12} aria-hidden="true" />;
  return <ShieldCheck size={12} aria-hidden="true" />;
}

function statusClass(state) {
  return state === "complete" ? "complete" : state === "partial" ? "partial" : state === "running" ? "running" : state === "locked" ? "locked" : "ready";
}

function DetailList({ title, items, empty = "Chưa có dữ liệu được công bố." }) {
  const values = stringList(items);
  return (
    <div className={styles.subPanel}>
      <h3>{title}</h3>
      {values.length ? (
        <ul className={styles.plainList}>
          {values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      ) : <div className={styles.empty}>{empty}</div>}
    </div>
  );
}

function CompatibilityResponsePanel({ value }) {
  if (!value || typeof value !== "object") return null;
  let serialized = "";
  try {
    serialized = JSON.stringify(value, null, 2);
  } catch {
    serialized = "Không thể serialize compatibility response.";
  }
  return (
    <details className={styles.compatibilityPanel} open data-testid="legacy-response-panel">
      <summary className={styles.compatibilitySummary}>Backend-compatible response · full JSON</summary>
      <pre className={styles.rawResponse}>{serialized}</pre>
    </details>
  );
}

function Metric({ label, value }) {
  return <div className={styles.metric}><span className={styles.metricLabel}>{label}</span><strong>{safeText(value)}</strong></div>;
}

function Stat({ label, value }) {
  return <div className={styles.stat}><span className={styles.metricLabel}>{label}</span><strong>{safeText(value)}</strong></div>;
}

function StageContractMeta({ stage }) {
  const value = asRecord(stage);
  const providers = Array.isArray(value.providers) ? value.providers.length : 0;
  const sources = Array.isArray(value.sources) ? value.sources.length : 0;
  const evidence = Array.isArray(value.evidence) ? value.evidence.length : 0;
  return (
    <div className={styles.subPanel} data-testid={`trust-stage-contract-${value.stageId || "unknown"}`}>
      <h3>Rich response contract</h3>
      <div className={styles.phaseStats}>
        <Metric label="Stage" value={value.stageName || value.stageId} />
        <Metric label="Operation" value={value.operationStatus} />
        <Metric label="Verdict / finding" value={value.verdict || value.finding} />
        <Metric label="Confidence" value={percentOrValue(value.confidence)} />
        <Metric label="Confidence kind" value={value.confidenceKind} />
        <Metric label="Execution checks" value={providers} />
        <Metric label="Sources" value={sources} />
        <Metric label="Evidence" value={evidence} />
        <Metric label="Latency" value={value.latencyMs != null ? `${value.latencyMs} ms` : null} />
        <Metric label="Request" value={value.requestId} />
      </div>
      <p className={styles.evidenceExcerpt}>{safeText(value.reason || value.explanation || value.summary)}</p>
      <small className={styles.phaseOrigin}>{safeText(value.confidenceExplanation, "Confidence semantics chưa được công bố.")}</small>
    </div>
  );
}

function claimText(claim) {
  const record = asRecord(claim);
  return record.rawText || record.text || record.claim || record.statement || record.targetClaim || "Claim chưa công bố";
}

function identity(value, fallback = "Chưa công bố") {
  if (value === null || value === undefined || value === "") return fallback;
  return safeText(value, fallback);
}

function TagRow({ items, empty = "Chưa có dữ liệu" }) {
  const values = (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === "string") return item;
    const record = asRecord(item);
    return record.code || record.type || record.status || record.label || record.name || "";
  }).filter(Boolean).slice(0, 24);
  return values.length ? (
    <div className={styles.tagRow}>{values.map((item, index) => <span className={styles.tag} key={`${item}-${index}`}>{item}</span>)}</div>
  ) : <div className={styles.empty}>{empty}</div>;
}

function SignalList({ title, items, empty = "Chưa có signal được công bố." }) {
  const values = Array.isArray(items) ? items.slice(0, 40) : [];
  return (
    <div className={styles.subPanel}>
      <h3>{title}</h3>
      {values.length ? (
        <div className={styles.recordList}>
          {values.map((item, index) => {
            const record = typeof item === "string" ? { code: item } : asRecord(item);
            return <article className={styles.recordCard} key={`${record.signalId || record.code || "signal"}-${index}`}>
              <div className={styles.recordHeader}><strong>{identity(record.code || record.type || record.signal, "Signal")}</strong><span className={styles.tag}>{identity(record.severity, "INFO")}</span></div>
              <p>{identity(record.details || record.description, "Không có mô tả signal.")}</p>
              <small>{[record.source, record.signalId].filter(Boolean).join(" · ") || "Nguồn signal chưa công bố"}</small>
            </article>;
          })}
        </div>
      ) : <div className={styles.empty}>{empty}</div>}
    </div>
  );
}

function ClaimList({ title, items, claimStatuses = {}, empty = "Chưa có claim được công bố." }) {
  const values = Array.isArray(items) ? items.slice(0, 40) : [];
  return (
    <div className={styles.subPanel}>
      <h3>{title}</h3>
      {values.length ? (
        <div className={styles.recordList}>
          {values.map((item, index) => {
            const record = asRecord(item);
            const claimId = record.claimId || `claim-${index + 1}`;
            return <article className={styles.recordCard} key={`${claimId}-${index}`}>
              <div className={styles.recordHeader}><strong>{claimId}</strong><span className={styles.tag}>{identity(claimStatuses[claimId], record.candidateOnly === true ? "CANDIDATE" : "UNSPECIFIED")}</span></div>
              <p>{claimText(record)}</p>
              <small>{[
                record.origin,
                record.sourceScope,
                record.verificationTaskId,
                record.candidateOnly === true ? "candidate-only" : null,
              ].filter(Boolean).join(" · ") || "Claim metadata chưa công bố"}</small>
            </article>;
          })}
        </div>
      ) : <div className={styles.empty}>{empty}</div>}
    </div>
  );
}

function TaskList({ title, tasks, empty = "Không có verification task được công bố." }) {
  const values = Array.isArray(tasks) ? tasks.slice(0, 40) : [];
  return (
    <div className={styles.subPanel}>
      <h3>{title}</h3>
      {values.length ? (
        <div className={styles.recordList}>
          {values.map((item, index) => {
            const record = asRecord(item);
            return <article className={styles.recordCard} key={`${record.taskId || "task"}-${index}`}>
              <div className={styles.recordHeader}><strong>{identity(record.taskId, `task-${index + 1}`)}</strong><span className={styles.tag}>{identity(record.priority, "MEDIUM")}</span></div>
              <p>{identity(record.purpose || record.targetClaim, "Task purpose chưa công bố")}</p>
              <small>{[
                record.type,
                record.classification,
                record.claimId,
                record.origin,
                record.sourceScope,
              ].filter(Boolean).join(" · ") || "Task metadata chưa công bố"}</small>
              {Array.isArray(record.evidenceRequirements) && record.evidenceRequirements.length ? <TagRow items={record.evidenceRequirements} /> : null}
            </article>;
          })}
        </div>
      ) : <div className={styles.empty}>{empty}</div>}
    </div>
  );
}

function evidenceRecords(layer3) {
  const layer = asRecord(layer3);
  const sources = sourceRecords(layer);
  const sourceById = new Map(sources.map((source) => [source.sourceId || source.id, source]));
  return (Array.isArray(layer.evidence) ? layer.evidence : []).map((item, index) => {
    const record = asRecord(item);
    const source = sourceById.get(record.sourceId) || {};
    return {
      ...record,
      id: record.evidenceId || `evidence-${index + 1}`,
      title: record.sourceTitle || source.title || source.domain || "Evidence chưa có tiêu đề",
      url: safeSourceUrl(record) || source.url,
      sourceType: record.sourceType || source.sourceType,
      liveEvidence: record.liveEvidence === true || source.liveEvidence === true,
    };
  });
}

function EvidenceList({ layer3 }) {
  const values = evidenceRecords(layer3);
  const hasContextualEvidence = values.some((item) => item.evidenceScope === "input_context");
  return (
    <div className={styles.subPanel}>
      <h3>{hasContextualEvidence ? "Evidence & contextual references" : "Claim-specific evidence"}</h3>
      {values.length ? (
        <div className={styles.evidenceList}>
          {values.map((item) => <article className={styles.evidenceCard} key={item.id}>
            <div className={styles.recordHeader}><strong>{identity(item.relation, "RELATION UNKNOWN")}</strong><span className={styles.tag}>{item.liveEvidence ? "LIVE" : "NOT LIVE"}</span></div>
            <p>{identity(item.excerpt, "Excerpt chưa công bố")}</p>
            <small>{[
              item.evidenceScope === "input_context" ? "input context" : item.claimId,
              item.sourceId,
              item.freshness,
              item.authorityTier,
              item.sourceType,
              item.relevance != null ? `relevance ${percentOrValue(item.relevance)}` : null,
              item.strength != null ? `strength ${percentOrValue(item.strength)}` : null,
            ].filter(Boolean).join(" · ")}</small>
            {item.url ? <a className={styles.reasonLink} href={item.url} target="_blank" rel="noreferrer">{item.title} <ExternalLink size={12} aria-hidden="true" /></a> : null}
          </article>)}
        </div>
      ) : <div className={styles.empty}>Chưa có claim-specific evidence; source có thể đã được fetch nhưng chưa có claim để đối soát.</div>}
    </div>
  );
}

function ConflictList({ conflicts, empty = "Không có conflict được công bố." }) {
  const values = Array.isArray(conflicts) ? conflicts.slice(0, 30) : [];
  return (
    <div className={styles.subPanel}>
      <h3>Conflicts</h3>
      {values.length ? (
        <div className={styles.recordList}>
          {values.map((item, index) => {
            const record = typeof item === "string" ? { details: item } : asRecord(item);
            return <article className={styles.recordCard} key={`${record.conflictId || record.claimId || "conflict"}-${index}`}>
              <div className={styles.recordHeader}><strong>{identity(record.conflictType || record.type, "CONFLICT")}</strong><span className={styles.tag}>{identity(record.claimId, "claim scope unknown")}</span></div>
              <p>{identity(record.details || record.resolutionRecommendation, "Conflict details chưa công bố")}</p>
              <small>{[record.conflictId, ...(Array.isArray(record.evidenceIds) ? record.evidenceIds : [])].filter(Boolean).join(" · ") || "Conflict provenance chưa công bố"}</small>
            </article>;
          })}
        </div>
      ) : <div className={styles.empty}>{empty}</div>}
    </div>
  );
}

function AdvisoryPanel({ value, title = "Legacy advisory (separate provenance)" }) {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;
  const sources = sourceRecords(record);
  return (
    <div className={styles.subPanel}>
      <h3>{title}</h3>
      <div className={styles.phaseStats}>
        <Metric label="Status" value={record.status} />
        <Metric label="Stop" value={record.stop} />
        <Metric label="Continue L4" value={record.canContinueToLayer4} />
        <Metric label="Confidence" value={percentOrValue(record.assessmentConfidence)} />
        <Metric label="Sources" value={sources.length} />
      </div>
      <p className={styles.evidenceExcerpt}>{identity(record.reason, "Advisory reason chưa công bố.")}</p>
      <TagRow items={[...(record.contradictoryEvidence || []), ...(record.unresolvedSignals || [])]} empty="Không có advisory contradiction/unresolved signal." />
      {sources.length ? <div className={styles.sourceList}>{sources.map((source, index) => source.url ? <a className={styles.sourceCard} href={source.url} target="_blank" rel="noreferrer" key={source.id}><strong>{publicSourceTitle(source, index)}</strong><span>{source.url}</span><small>{[source.sourceScope, source.sourceType, publicRetrievalOrigin(source.sourceOrigin)].filter(Boolean).join(" · ") || "Legacy provenance metadata"}</small><ExternalLink size={13} aria-hidden="true" /></a> : <div className={styles.sourceCard} key={source.id}><strong>{publicSourceTitle(source, index)}</strong><small>URL chưa công bố</small></div>)}</div> : null}
      <DetailList title="Advisory limitations" items={record.limitations} />
    </div>
  );
}

function OwnTrustJourney({
  mode,
  content,
  file,
  preview,
  dragging,
  processing,
  error,
  ocr,
  confirmedEntities,
  hasResult,
  demoEnabled,
  sourceProvenance,
  providers,
  analysisSummary,
  pipeline,
  canonicalResult,
  layers,
  input,
  hideHero,
  fileInputRef,
  onModeChange,
  onDragStateChange,
  onContentChange,
  onFileSelect,
  onClearFile,
  onAnalyze,
  onReset,
  onNewAnalysis,
  onPrint,
  caseId,
  caseRevision,
  claimId,
  domainCode,
}) {
  const [selected, setSelected] = useState("l1");
  const [chainOpen, setChainOpen] = useState(false);

  const backendFinalPredict = useMemo(() => (
    pipeline?.finalPredict
    || canonicalResult?.finalPredict
    || canonicalResult?.data?.finalPredict
    || null
  ), [canonicalResult, pipeline]);

  const [demoSafePresentation, setDemoSafePresentation] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Read the client-only query flag after hydration to avoid an SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemoSafePresentation(params.get("demoSafe") === "1");
  }, []);

  const finalPredict = useMemo(() => {
    if (!demoSafePresentation || !backendFinalPredict) return backendFinalPredict;

    return {
      ...backendFinalPredict,
      // Presentation-only override for the recording link. The backend result,
      // pipeline events, persistence, and security policy remain untouched.
      securityClassification: "SAFE",
      security: "SAFE",
      securityRisk: "LOW",
      recommendedAction: "ALLOW",
      action: "ALLOW",
      enforcement: "ALLOW",
      keyReasons: [
        "DEMO SAFE PRESENTATION ONLY — backend Final Predict được giữ nguyên.",
        ...(Array.isArray(backendFinalPredict.keyReasons) ? backendFinalPredict.keyReasons : []),
      ].slice(0, 20),
    };
  }, [backendFinalPredict, demoSafePresentation]);
  const finalReady = Boolean(finalPredict && typeof finalPredict === "object");
  const finalState = finalReady ? (pipeline?.pipelineStatus === "PARTIAL" ? "partial" : "complete") : "locked";
  const currentStage = pipeline?.currentStage;

  useEffect(() => {
    // Backend stage events are the external source that drives this local
    // presentation selection; no timer or provider call is started here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (processing && STAGE_IDS.includes(currentStage)) setSelected(currentStage);
    else if (!processing && finalReady) setSelected("final_predict");
  }, [currentStage, finalReady, processing]);

  const navigate = useCallback((direction) => {
    const currentIndex = JOURNEY_IDS.indexOf(selected);
    const targetIndex = Math.max(0, Math.min(JOURNEY_IDS.length - 1, currentIndex + direction));
    const target = JOURNEY_IDS[targetIndex];
    if (target === "final_predict" && !finalReady) return;
    const targetState = target === "final_predict"
      ? finalState
      : stageState(pipeline, target, STAGE_IDS.indexOf(target), processing);
    if (isOpenable(targetState)) setSelected(target);
  }, [finalReady, finalState, pipeline, processing, selected]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (target?.closest?.("input, textarea, select, button, [contenteditable='true']")) return;
      if (!hasResult && !finalReady) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        setSelected("l1");
      }
      if (event.key === "End" && finalReady) {
        event.preventDefault();
        setSelected("final_predict");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finalReady, hasResult, navigate]);

  const l1 = publicLayer(layers, pipeline, "l1");
  const l2 = publicLayer(layers, pipeline, "l2");
  const l3 = publicLayer(layers, pipeline, "l3");
  const l4 = publicLayer(layers, pipeline, "l4");
  const layerMap = { l1, l2, l3, l4 };
  const legacyResponse = pipeline?.legacyResponse || canonicalResult?.legacyResponse || null;
  const finalSources = sourceRecords(l3);
  const geminiCitationSources = citationRecords(l4?.aiVerification);
  const finalKeySources = mergeSourceRecords(
    Array.isArray(finalPredict?.keySources) && finalPredict.keySources.length ? finalPredict.keySources : [],
    finalSources,
    geminiCitationSources,
  );

  const renderLayerBody = (stageId, rawLayer, stage, state) => {
    const raw = asRecord(rawLayer);
    if (state === "locked") {
      return <div className={styles.empty}>Lớp này chỉ mở sau khi backend hoàn tất lớp trước.</div>;
    }

    if (stageId === "l1") {
      const checks = Array.isArray(raw.checksPerformed) ? raw.checksPerformed : [];
      const metrics = asRecord(raw.metrics);
      return (
        <>
          <div className={styles.statGrid}>
            <Stat label="Finding" value={stage?.finding || raw.finding || raw.status} />
            <Stat label="Execution status" value={publicMetadataValue(stage?.providerStatus || raw.providerStatus)} />
            <Stat label="Detectors" value={checks.length || metrics.signalCount || null} />
            <Stat label="Confidence" value={percentOrValue(stage?.confidence ?? raw.confidence)} />
          </div>
          <div className={styles.listGrid}>
            <div className={styles.subPanel}>
              <h3>Checks thực thi</h3>
              {checks.length ? (
                <ul className={styles.checkList}>
                  {checks.map((check, index) => <li key={`${check.check || check.name || "check"}-${index}`}><Check size={13} /> <span>{safeText(check.name || check.check || check.id)} · {publicMetadataValue(check.status, "EXECUTED")}</span></li>)}
                </ul>
              ) : <div className={styles.empty}>Backend chưa công bố danh sách checks cho lần chạy này.</div>}
            </div>
            <DetailList title="Signals" items={raw.signals || stage?.signals} />
          </div>
          <DetailList title="Reasons" items={raw.reasons || stage?.reasons} />
        </>
      );
    }

    if (stageId === "l2") {
      const observations = providerRecords(raw, providers);
      const claims = Array.isArray(raw.claims) ? raw.claims : [];
      const entities = Array.isArray(raw.entities) ? raw.entities : [];
      const contextSignals = Array.isArray(raw.contextSignals) ? raw.contextSignals : [];
      const semanticSignals = Array.isArray(raw.semanticSignals) ? raw.semanticSignals : [];
      const riskSignals = Array.isArray(raw.riskSignals) ? raw.riskSignals : [];
      const verificationPackage = asRecord(raw.verificationPackage);
      const verificationTasks = Array.isArray(verificationPackage.verificationTasks)
        ? verificationPackage.verificationTasks
        : (Array.isArray(raw.verificationTasks) ? raw.verificationTasks : []);
      return (
        <>
          <div className={styles.statGrid}>
            <Stat label="Finding" value={stage?.finding || raw.finding || raw.classification} />
            <Stat label="Execution status" value={publicMetadataValue(raw.providerStatus || stage?.providerStatus)} />
            <Stat label="Execution checks" value={observations.length || null} />
            <Stat label="Confidence" value={percentOrValue(raw.confidence ?? stage?.confidence)} />
            <Stat label="Claims" value={claims.length} />
            <Stat label="Entities" value={entities.length} />
            <Stat label="Threat types" value={Array.isArray(raw.threatTypes) ? raw.threatTypes.length : 0} />
            <Stat label="Verification tasks" value={verificationTasks.length} />
          </div>
          <div className={styles.subPanel}>
            <h3>Execution observations</h3>
            {observations.length ? (
              <div className={styles.providerList}>
                {observations.map((provider, index) => {
                  const status = publicMetadataValue(provider.status, "UNKNOWN");
                  return <article className={styles.provider} key={`${provider.providerId || provider.provider || "provider"}-${index}`}>
                    <strong>Semantic check {index + 1}</strong>
                    <span className={styles.providerStatus} data-status={status}>{status}</span>
                    <small>{provider.latencyMs != null ? `${provider.latencyMs} ms` : "Latency chưa công bố"}</small>
                    <p>{publicMetadataValue(provider.message || provider.verdict || provider.finding)}</p>
                    <small>{[
                      provider.finding,
                      provider.verdict,
                      provider.confidence != null ? `confidence ${percentOrValue(provider.confidence)}` : null,
                      publicMetadataValue(provider.errorCode),
                      provider.executed === false ? "not executed" : "executed",
                    ].filter(Boolean).join(" · ")}</small>
                    {Array.isArray(provider.signals) && provider.signals.length ? <TagRow items={provider.signals} /> : null}
                  </article>;
                })}
              </div>
            ) : <div className={styles.empty}>Không có execution observation được backend công bố.</div>}
          </div>
          <div className={styles.listGrid}>
            <SignalList title="Semantic signals" items={semanticSignals.length ? semanticSignals : (raw.contextSignals || stage?.signals)} />
            <SignalList title="Student context / risk signals" items={riskSignals.length ? riskSignals : contextSignals} />
          </div>
          <div className={styles.listGrid}>
            <ClaimList title="AI candidate claims" items={claims} />
            <ClaimList title="Entities / extracted objects" items={entities} empty="Không có entity được công bố." />
          </div>
          <div className={styles.listGrid}>
            <div className={styles.subPanel}>
              <h3>Analysis boundary</h3>
              <div className={styles.phaseStats}>
                <Metric label="Analysis status" value={publicMetadataValue(raw.modelStatus || raw.details?.semanticProviderStatus)} />
                <Metric label="Confidence kind" value={raw.confidenceKind} />
                <Metric label="Input type" value={raw.details?.inputType} />
                <Metric label="External check partial" value={raw.details?.providerPartial} />
                <Metric label="Prompt injection" value={raw.details?.promptInjectionDetected} />
              </div>
              <TagRow items={raw.threatTypes} empty="Không có threat type được công bố." />
            </div>
            <div className={styles.subPanel}>
              <h3>Verification package</h3>
              <div className={styles.phaseStats}>
                <Metric label="Status" value={verificationPackage.status} />
                <Metric label="Schema" value={verificationPackage.schemaVersion} />
                <Metric label="Candidate-only" value={verificationPackage.candidateOnly} />
                <Metric label="Input trust" value={verificationPackage.inputTrust} />
                <Metric label="Domain claims" value={verificationPackage.domainClaims?.length} />
                <Metric label="Tasks" value={verificationTasks.length} />
              </div>
              <TagRow items={verificationPackage.evidenceRequirements} empty="Không có evidence requirement được công bố." />
            </div>
          </div>
          <TaskList title="Layer 2 → Layer 3 verification tasks" tasks={verificationTasks} />
          <DetailList title="Reasons / conclusion" items={[...(raw.reasons || []), raw.conclusion, raw.details?.decisionRationale]} />
          <p className={styles.stageSummary}>{safeText(raw.conclusion || raw.semanticSummary || stage?.summary)}</p>
        </>
      );
    }

    if (stageId === "l3") {
      const metrics = asRecord(raw.metrics);
      const sources = sourceRecords(raw);
      const running = state === "running";
      const retrievalPhases = asRecord(raw.retrievalPhases);
      const phaseCards = [
        ["Initial Search", asRecord(retrievalPhases.initialSearch)],
        ["Supplemental Search", asRecord(retrievalPhases.supplementalSearch)],
        ["Final Validated Evidence Set", asRecord(retrievalPhases.finalValidatedEvidenceSet)],
      ];
      return (
        <>
          <div className={styles.statGrid}>
            <Stat label="Execution" value={raw.executionStatus || (stage?.operationStatus === "COMPLETED" ? "COMPLETED" : stage?.operationStatus)} />
            <Stat label="Retrieval status" value={publicMetadataValue(raw.retrievalStatus || stage?.providerStatus)} />
            <Stat label="Retrieval mode" value={publicRetrievalMode(raw.retrievalMode || metrics.retrievalMode)} />
            <Stat label="Sources" value={metrics.sourcesRetrievedCount ?? raw.sourceCount ?? (sources.length || null)} />
            <Stat label="Live sources" value={metrics.finalValidatedSourceCount ?? sources.filter((source) => source.liveEvidence === true).length} />
            <Stat label="Direct input" value={metrics.directInputSourceCount ?? sources.filter((source) => source.retrievalOrigin === "DIRECT_INPUT").length} />
            <Stat label="Claims" value={Array.isArray(raw.claims) ? raw.claims.length : 0} />
            <Stat label="Independent domains" value={metrics.independentHostCount ?? metrics.independentClusterCount ?? raw.independentSourceCount} />
            <Stat label="Evidence" value={metrics.evidenceItemsCount ?? (Array.isArray(raw.evidence) ? raw.evidence.length : null)} />
            <Stat label="Evidence confidence" value={percentOrValue(raw.evidenceConfidence)} />
            <Stat label="Agreement" value={percentOrValue(raw.crossSourceAgreement?.agreementScore ?? raw.evidenceAgreement)} />
            <Stat label="Sufficiency" value={raw.evidenceSufficiency || stage?.finding} />
          </div>
          <div className={styles.retrievalPhaseGrid}>
            {phaseCards.map(([title, phase]) => (
              <div className={styles.subPanel} key={title}>
                <h3>{title}</h3>
                <div className={styles.phaseStats}>
                  <Metric label="Status" value={phase.status} />
                  <Metric label="Queries" value={phase.queryCount} />
                  <Metric label="Sources" value={phase.sourceCount} />
                  <Metric label="Validated" value={phase.validatedSourceCount} />
                  <Metric label="Direct input" value={phase.directInputSourceCount} />
                </div>
                <small className={styles.phaseOrigin}>{safeText(publicRetrievalOrigin(phase.retrievalOrigin), "Origin chưa công bố")}</small>
              </div>
            ))}
          </div>
          {running && <div className={styles.notice}><LoaderCircle size={14} className="animate-spin" /> <span>Đang truy vấn external retrieval của Layer 3…</span></div>}
          <div className={styles.subPanel}>
            <h3>Evidence collected</h3>
            {sources.length ? (
              <div className={styles.sourceList}>
                {sources.map((source, index) => {
                  const sourceMeta = [source.sourceType, source.sourceScope, source.authorityTier, source.publishedAt].filter(Boolean).join(" · ");
                  const content = <><strong>{publicSourceTitle(source, index)}</strong><span>{publicSourcePublisher(source)}</span><span>{source.url || "URL chưa công bố"}</span><div className={styles.tagRow}><span className={styles.tag}>{source.liveEvidence ? "LIVE FETCH" : "NOT LIVE"}</span><span className={styles.tag}>{publicMetadataValue(source.providerStatus, "external status unknown")}</span><span className={styles.tag}>{publicMetadataValue(source.retrievalOutcome, "outcome unknown")}</span></div><small>{safeText(source.excerpt, "Excerpt chưa công bố")}{sourceMeta ? ` · ${sourceMeta}` : ""}</small><small>{[source.authorityScore != null ? `authority ${percentOrValue(source.authorityScore)}` : null, source.httpStatus ? `HTTP ${source.httpStatus}` : null, source.sourceFingerprint ? `fingerprint ${source.sourceFingerprint.slice(0, 16)}…` : null].filter(Boolean).join(" · ") || "Provenance metadata chưa công bố"}</small></>;
                  return source.url
                    ? <a className={styles.sourceCard} href={source.url} target="_blank" rel="noreferrer" key={source.id}>{content}<ExternalLink size={13} aria-hidden="true" /></a>
                    : <div className={styles.sourceCard} key={source.id}>{content}</div>;
                })}
              </div>
            ) : <div className={styles.empty}>{running ? "Chưa có source nào được trả về." : "Không có source live usable được backend công bố; trạng thái là chưa đủ/không xác định."}</div>}
          </div>
          <AdvisoryPanel value={raw.legacyIntegration} />
          <EvidenceList layer3={raw} />
          <div className={styles.listGrid}>
            <ClaimList title="Claims & claim statuses" items={raw.claims} claimStatuses={raw.claimStatuses} />
            <div className={styles.subPanel}>
              <h3>Source independence / freshness</h3>
              <div className={styles.phaseStats}>
                <Metric label="Evaluated" value={raw.sourceAuthority?.totalEvaluated} />
                <Metric label="Primary" value={raw.sourceAuthority?.primaryCount} />
                <Metric label="Clusters" value={raw.sourceIndependence?.totalClusters} />
                <Metric label="Independent" value={raw.sourceIndependence?.independentSourcesCount} />
                <Metric label="All current" value={raw.temporalAssessment?.allCurrent} />
                <Metric label="Outdated" value={raw.temporalAssessment?.outdatedEvidenceCount} />
                <Metric label="Unknown date" value={raw.temporalAssessment?.unknownDateCount} />
                <Metric label="External calls" value={metrics.providerCallCount} />
              </div>
              <TagRow items={raw.candidateClaimOrigins} empty="Không có claim origin được công bố." />
            </div>
          </div>
          <TaskList title="Verification tasks / evidence requirements" tasks={raw.verificationTasks} empty="Không có task; URL-only có thể không tạo factual claim." />
          <div className={styles.listGrid}>
            <div className={styles.subPanel}>
              <h3>Retrieval diagnostics</h3>
              <div className={styles.phaseStats}>
                <Metric label="Raw results" value={metrics.providerRawResultCount} />
                <Metric label="Accepted results" value={metrics.providerAcceptedResultCount} />
                <Metric label="Accepted hosts" value={metrics.providerAcceptedHostCount} />
                <Metric label="Rejected results" value={metrics.providerRejectedResultCount} />
                <Metric label="External status" value={publicMetadataValue(metrics.retrievalStatus)} />
                <Metric label="Timeout class" value={metrics.providerTimeoutClassification} />
              </div>
              <TagRow items={metrics.providerRejectionReasons} empty="Không có rejection reason được công bố." />
            </div>
            <ConflictList conflicts={raw.conflicts} />
          </div>
          <div className={styles.listGrid}>
            <DetailList title="Evidence requirements" items={raw.evidenceRequirements} />
            <DetailList title="Limitations" items={[...(raw.limitations || []), ...(stage?.limitations || [])]} />
          </div>
        </>
      );
    }

    const ai = asRecord(raw.aiVerification || stage?.aiVerification);
    const evidenceLayer = asRecord(l3);
    const evidenceMetrics = asRecord(evidenceLayer.metrics);
    const evidenceSources = sourceRecords(evidenceLayer);
    const validatedLinkSources = mergeSourceRecords(evidenceSources, citationRecords(ai));
    const retrievalPhases = asRecord(evidenceLayer.retrievalPhases);
    const initialSearch = asRecord(retrievalPhases.initialSearch);
    const supplementalSearch = asRecord(retrievalPhases.supplementalSearch);
    const finalEvidence = asRecord(retrievalPhases.finalValidatedEvidenceSet);
    const explanation = asRecord(raw.userExplanation);
    const gapAnalysis = asRecord(raw.evidenceGapAnalysis);
    const supplementalRetrieval = asRecord(raw.supplementalRetrieval);
    const executionTrace = Array.isArray(raw.aiModelTrace) ? raw.aiModelTrace : [];
    return (
      <>
        <div className={styles.statGrid}>
          <Stat label="Execution" value={raw.executionStatus || (stage?.operationStatus === "COMPLETED" ? "COMPLETED" : stage?.operationStatus)} />
          <Stat label="Synthesis status" value={publicOperationStatus(raw.aiVerificationStatus || stage?.aiVerificationStatus || raw.aiProviderStatus)} />
          <Stat label="Truth" value={raw.truthStatus || stage?.finding} />
          <Stat label="Security" value={raw.securityClassification || raw.enforcement} />
          <Stat label="Action" value={raw.recommendedAction || raw.enforcement} />
          <Stat label="Confidence" value={percentOrValue(raw.decisionConfidence ?? stage?.confidence)} />
          <Stat label="Reasoning operation" value={publicMetadataValue(raw.aiOperationStatus)} />
          <Stat label="Fallback" value={raw.aiFallbackUsed} />
          <Stat label="Fallback reason" value={raw.aiFallbackReason} />
          <Stat label="Evidence agreement" value={percentOrValue(evidenceLayer.crossSourceAgreement?.agreementScore ?? finalPredict?.evidenceAgreement)} />
          <Stat label="Source quality" value={percentOrValue(finalPredict?.sourceQuality)} />
          <Stat label="Evidence sufficiency" value={finalPredict?.evidenceSufficiency || evidenceLayer.evidenceSufficiency || evidenceLayer.finding || stage?.finding} />
          <Stat label="Evidence items" value={evidenceMetrics.evidenceItemsCount ?? (Array.isArray(evidenceLayer.evidence) ? evidenceLayer.evidence.length : null)} />
          <Stat label="Initial sources" value={initialSearch.sourceCount ?? evidenceMetrics.initialSourceCount} />
          <Stat label="Supplemental sources" value={supplementalSearch.sourceCount ?? evidenceMetrics.supplementalSourceCount} />
          <Stat label="Total validated sources" value={finalEvidence.validatedSourceCount ?? evidenceMetrics.finalValidatedSourceCount} />
          <Stat label="Validated links" value={ai.citationValidation?.acceptedCount ?? citationRecords(ai).length} />
          <Stat label="Evidence refs" value={Array.isArray(raw.evidenceRefs) ? raw.evidenceRefs.length : 0} />
          <Stat label="Gap analysis" value={gapAnalysis.status} />
        </div>
        {state === "running" && <div className={styles.notice}><LoaderCircle size={14} className="animate-spin" /> <span>Đang tổng hợp evidence đã kiểm chứng; chưa hiển thị kết luận thay thế.</span></div>}
        <div className={styles.subPanel}>
          <h3>Validated evidence & Gemini links</h3>
          <small className={styles.phaseOrigin}>Gemini links validated</small>
          {validatedLinkSources.length ? (
            <div className={styles.sourceList}>
              {validatedLinkSources.map((source, index) => {
                const sourceMeta = [publicMetadataValue(source.validationStatus), source.authorityTier, source.publishedAt, source.httpStatus ? `HTTP ${source.httpStatus}` : null].filter(Boolean).join(" · ");
                const content = <><strong>{publicSourceTitle(source, index)}</strong><span>{publicSourcePublisher(source)}</span><span>{source.url || "URL chưa công bố"}</span><small>{safeText(source.excerpt, "Excerpt chưa công bố")}{sourceMeta ? ` · ${sourceMeta}` : ""}</small></>;
                return source.url
                  ? <a className={styles.sourceCard} href={source.url} target="_blank" rel="noreferrer" key={source.id}>{content}<ExternalLink size={13} aria-hidden="true" /></a>
                  : <div className={styles.sourceCard} key={source.id}>{content}</div>;
              })}
            </div>
          ) : <div className={styles.empty}>Chưa có URL evidence đã validate để mở.</div>}
        </div>
        <AdvisoryPanel value={raw.legacyIntegration} title="Layer 4 legacy advisory (separate provenance)" />
        <div className={styles.listGrid}>
          <div className={styles.subPanel}>
            <h3>AI verification boundary</h3>
            <div className={styles.phaseStats}>
              <Metric label="Verdict signal" value={ai.verdictSignal} />
              <Metric label="Transport" value={raw.aiVerificationTransport} />
              <Metric label="Thinking level" value={raw.aiVerificationThinkingLevel} />
              <Metric label="Latency" value={raw.aiVerificationLatencyMs != null ? `${raw.aiVerificationLatencyMs} ms` : null} />
              <Metric label="HTTP" value={raw.aiVerificationHttpStatus} />
              <Metric label="Validation" value={ai.citationValidation?.allLinksValidated} />
            </div>
            <p className={styles.evidenceExcerpt}>{identity(ai.uncertainty, "AI uncertainty chưa công bố.")}</p>
            <TagRow items={ai.supportingSourceIds} empty="AI chưa công bố supporting source ID." />
            <TagRow items={ai.contradictingSourceIds} empty="AI chưa công bố contradicting source ID." />
          </div>
          <div className={styles.subPanel}>
            <h3>Execution trace</h3>
            {executionTrace.length ? <div className={styles.recordList}>{executionTrace.map((trace, index) => <article className={styles.recordCard} key={`${trace.attemptNumber || "attempt"}-${index}`}>
              <div className={styles.recordHeader}><strong>Attempt {trace.attemptNumber || index + 1}</strong><span className={styles.tag}>{identity(trace.result, "FAILED")}</span></div>
              <p>{[trace.attemptNumber ? `attempt ${trace.attemptNumber}` : null, trace.durationMs != null ? `${trace.durationMs} ms` : null, trace.httpStatus ? `HTTP ${trace.httpStatus}` : null].filter(Boolean).join(" · ") || "Trace metadata chưa công bố"}</p>
              <small>{[publicMetadataValue(trace.providerErrorCode), trace.startedAt].filter(Boolean).join(" · ") || "Không có external error"}</small>
            </article>)}</div> : <div className={styles.empty}>Không có execution trace được công bố.</div>}
          </div>
        </div>
        <div className={styles.listGrid}>
          <div className={styles.subPanel}>
            <h3>User explanation / policy boundary</h3>
            <p className={styles.evidenceExcerpt}>{identity(explanation.why, "Why chưa công bố.")}</p>
            <div className={styles.phaseStats}>
              <Metric label="Verdict title" value={explanation.verdictTitle} />
              <Metric label="Risk summary" value={explanation.riskSummary} />
              <Metric label="Recommended note" value={explanation.recommendedActionNote} />
              <Metric label="Rule version" value={raw.auditTrail?.ruleVersion} />
              <Metric label="Fused evidence" value={raw.auditTrail?.fusedEvidenceCount} />
              <Metric label="Evidence bound" value={raw.auditTrail?.evidenceBound} />
            </div>
            <TagRow items={raw.policyPrecedence} empty="Không có policy precedence được công bố." />
            <TagRow items={raw.evidenceRefs} empty="Không có evidence reference được công bố." />
          </div>
          <div className={styles.subPanel}>
            <h3>AI evidence gap / supplemental retrieval</h3>
            <div className={styles.phaseStats}>
              <Metric label="Gap status" value={gapAnalysis.status} />
              <Metric label="Needs more" value={gapAnalysis.needsMoreEvidence} />
              <Metric label="Requested queries" value={gapAnalysis.requestedQueryCount} />
              <Metric label="Executed queries" value={gapAnalysis.executedQueryCount} />
              <Metric label="Supplement status" value={supplementalRetrieval.status} />
              <Metric label="Supplement sources" value={supplementalRetrieval.sourceCount} />
              <Metric label="Supplement validated" value={supplementalRetrieval.validatedSourceCount} />
              <Metric label="External status" value={publicMetadataValue(gapAnalysis.providerStatus || supplementalRetrieval.providerStatus)} />
            </div>
            <DetailList title="Evidence gaps" items={(gapAnalysis.evidenceGaps || []).map((gap) => gap.reason || gap.suggestedQuery || gap.targetClaimId)} />
          </div>
        </div>
        <div className={styles.listGrid}>
          <DetailList title="Support reasons" items={ai.supportReasons} />
          <DetailList title="Contradictions / missing evidence" items={[...(ai.contradictionReasons || []), ...(ai.missingEvidence || [])]} />
        </div>
        <div className={styles.listGrid}>
          <ClaimList title="L4 claims carried into synthesis" items={raw.claims} />
          <ConflictList conflicts={raw.conflicts} />
        </div>
        <DetailList title="Key findings" items={raw.keyReasons || stage?.reasons} />
        <DetailList title="L4 limitations" items={[...(raw.limitations || []), raw.aiVerificationErrorType, raw.aiFallbackReason]} />
        {ai.uncertainty && <div className={styles.notice}><AlertTriangle size={14} /> <span>{ai.uncertainty}</span></div>}
      </>
    );
  };

  const canSubmit = !processing && ((mode === "image" || mode === "qr") ? Boolean(file) : Boolean(String(content || "").trim()));
  const stageSummary = (stageId, raw, stage, state) => {
    if (stage?.summary) return stage.summary;
    if (raw?.conclusion) return raw.conclusion;
    if (raw?.semanticSummary) return raw.semanticSummary;
    if (state === "ready") return "Sẵn sàng nhận input.";
    if (state === "locked") return "Đang chờ lớp trước.";
    return STAGE_INFO[stageId].description;
  };

  const renderStageCard = (stageId, index) => {
    const info = STAGE_INFO[stageId];
    const stage = asRecord(pipeline?.stages?.[stageId]);
    const raw = asRecord(layerMap[stageId]);
    const state = stageState(pipeline, stageId, index, processing);
    const selectedStage = selected === stageId;
    const Icon = info.icon;
    return (
      <article className={styles.stageCard} data-state={statusClass(state)} data-selected={selectedStage} key={stageId}>
        <button
          type="button"
          className={styles.stageButton}
          disabled={!isOpenable(state)}
          aria-expanded={selectedStage}
          onClick={() => isOpenable(state) && setSelected(stageId)}
        >
          <span className={styles.stageTitle}>
            <span className={styles.stageIcon}><Icon size={18} aria-hidden="true" /></span>
            <span className={styles.stageName}>
              <strong>{info.index} · {info.title}</strong>
              <small>{stageSummary(stageId, raw, stage, state)}</small>
            </span>
            <span className={styles.stageMeta}>
              <span className={styles.statusPill}>{statusIcon(state)} {statusLabel(stageStatusValue(pipeline, stageId, processing))}</span>
              {selectedStage ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
            </span>
          </span>
        </button>
        {selectedStage && <div className={styles.stageBody}><p className={styles.stageSummary}>{info.description}</p><StageContractMeta stage={stage} />{renderLayerBody(stageId, raw, stage, state)}</div>}
      </article>
    );
  };

  const finalStatusText = finalReady ? (finalState === "partial" ? "Một phần" : "Hoàn tất") : "Đang khóa";
  const finalVerdict = finalPredict?.truthVerdict || finalPredict?.truthStatus || finalPredict?.verdict || finalPredict?.truthAssessment;
  const finalReasons = finalPredict?.keyReasons;
  const finalUncertainty = finalPredict?.remainingUncertainty;
  const finalSecurityClassification = finalPredict?.securityClassification || finalPredict?.security || "UNKNOWN";
  const finalSecurityRisk = finalPredict?.securityRisk || "UNKNOWN";
  const finalHeadline = finalSecurityClassification || finalVerdict;
  const finalAction = finalPredict?.recommendedAction || finalPredict?.action;

  const renderFinalCard = () => (
    <section className={styles.finalCard} data-status={finalState}>
      <div className={styles.finalHeader}>
        <div className={styles.finalSeal}>{finalReady ? <Sparkles size={22} /> : <LockKeyhole size={21} />}</div>
        <div>
          <p className={styles.eyebrow}>FINAL PREDICT · {demoSafePresentation ? "DEMO SAFE" : "DETERMINISTIC"}</p>
          <h2>{finalReady ? safeText(finalHeadline) : "Final Predict đang khóa"}</h2>
          <p className={styles.finalCaption}>{finalReady ? (demoSafePresentation ? "SAFE chỉ là hiển thị demo; kết quả backend gốc vẫn được giữ nguyên." : "Kết quả được suy ra từ dữ liệu đã lưu của bốn lớp.") : "Chỉ mở khi backend công bố kết quả cuối cùng."}</p>
        </div>
        <span className={styles.statusPill}>{finalReady ? <Check size={12} /> : <LockKeyhole size={12} />} {finalStatusText}</span>
      </div>
      {finalReady && (
        <>
          <div className={styles.finalMetrics}>
            <Metric label="Truth assessment" value={finalVerdict} />
            <Metric label="Security classification" value={finalSecurityClassification} />
            <Metric label="Security risk" value={finalSecurityRisk} />
            <Metric label="Recommended action" value={finalAction} />
            <Metric label="Confidence" value={percentOrValue(finalPredict.assessmentConfidence ?? finalPredict.decisionConfidence)} />
            <Metric label="Confidence kind" value={finalPredict.confidenceKind} />
            <Metric label="Authoritative component" value={finalPredict.authoritativeComponent} />
            <Metric label="Evidence health" value={finalPredict.evidenceSufficiency} />
            <Metric label="Evidence agreement" value={percentOrValue(finalPredict.evidenceAgreement)} />
            <Metric label="Source quality" value={percentOrValue(finalPredict.sourceQuality)} />
            <Metric label="Independent sources" value={finalPredict.independentSourceCount} />
          </div>
          <div className={styles.finalDetails}>
            <DetailList title="Why this result?" items={finalReasons} />
            <DetailList title="Remaining uncertainty" items={finalUncertainty} />
            <div className={styles.subPanel}>
              <h3>Key sources</h3>
              {finalKeySources.length ? (
                <ul className={styles.reasonList}>
                  {finalKeySources.map((source, index) => {
                    const url = safeSourceUrl(source);
                    const label = publicSourceTitle(source, index);
                    return <li key={source?.sourceId || source?.evidenceId || source?.url || index}>{url ? <a className={styles.reasonLink} href={url} target="_blank" rel="noreferrer">{label} <ExternalLink size={12} aria-hidden="true" /></a> : label}</li>;
                  })}
                </ul>
              ) : <div className={styles.empty}>Final Predict không công bố key source.</div>}
            </div>
          </div>
          <div className={styles.derived}>
            {STAGE_IDS.map((stageId) => <span key={stageId}><Check size={11} /> {stageId.toUpperCase()}</span>)}
            <span><ShieldCheck size={11} /> No external call after Final Predict</span>
          </div>
          <button type="button" className={styles.chainButton} onClick={() => setChainOpen((value) => !value)} aria-expanded={chainOpen}>
            {chainOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Evidence chain {chainOpen ? "ẩn" : "hiện"}
          </button>
          {chainOpen && <div className={styles.chainCard}>
            <h2>Evidence chain</h2>
            <p className={styles.statusNote}>Điều hướng giữa các kết quả đã lưu; các node này không tạo run mới.</p>
            <div className={styles.chain}>
              {[...STAGE_IDS, "final_predict"].map((nodeId) => {
                const info = STAGE_INFO[nodeId];
                const state = nodeId === "final_predict" ? finalState : stageState(pipeline, nodeId, STAGE_IDS.indexOf(nodeId), processing);
                return <button type="button" className={styles.chainNode} key={nodeId} disabled={!isOpenable(state)} onClick={() => isOpenable(state) && setSelected(nodeId)}><strong>{info.index}</strong><span>{info.title} · {statusLabel(nodeId === "final_predict" ? (finalReady ? "COMPLETED" : "NOT_STARTED") : stageStatusValue(pipeline, nodeId, processing))}</span></button>;
              })}
            </div>
          </div>}
        </>
      )}
    </section>
  );

  return (
    <main className={styles.root} data-pipeline-model={pipeline?.pipelineModel || "FOUR_LAYER"} data-processing={processing ? "true" : "false"} data-demo-safe-presentation={demoSafePresentation ? "true" : "false"}>
      {!hideHero && <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>TRUST ENGINE · EVIDENCE FIRST</p>
          <h1>Kiểm tra trước khi bạn tin.</h1>
          <p>Luồng kiểm chứng thuộc StudentHub: deterministic screen, threat intelligence, evidence retrieval và synthesis. Final Predict chỉ đọc kết quả bốn lớp đã hoàn tất.</p>
        </div>
        <div className={styles.heroSeal}><ShieldCheck size={18} /><span>OWN BACKEND</span><strong>4 LAYERS</strong></div>
      </header>}

      <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); if (canSubmit) onAnalyze?.(); }}>
        <div className={styles.composerMain}>
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>INPUT</p><h2>Đưa dữ liệu cần kiểm tra</h2></div><span className={styles.statusPill}>{processing ? "RUNNING" : hasResult ? "RESULT" : "READY"}</span></div>
          <div className={styles.modeSwitch} role="tablist" aria-label="Loại đầu vào">
            {INPUT_MODES.map(({ id, label, icon: Icon }) => <button type="button" className={styles.modeButton} data-active={mode === id} key={id} onClick={() => onModeChange?.(id)} role="tab" aria-selected={mode === id}><Icon size={14} /> {label}</button>)}
          </div>
          {(mode === "image" || mode === "qr") ? (
            <div className={styles.uploadZone} data-dragging={dragging} onDragEnter={(event) => { event.preventDefault(); onDragStateChange?.(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => onDragStateChange?.(false)} onDrop={(event) => { event.preventDefault(); onDragStateChange?.(false); const nextFile = [...(event.dataTransfer?.files || [])][0]; if (nextFile) onFileSelect?.(nextFile); }}>
              {preview ? <div className={styles.preview}><Image src={preview} alt="Xem trước input" fill sizes="(max-width: 640px) 100vw, 50vw" unoptimized /><button type="button" className={styles.removeFile} onClick={onClearFile} aria-label="Xóa file"><X size={15} /></button></div> : <button type="button" className={styles.uploadPrompt} onClick={() => fileInputRef?.current?.click()}><Upload size={20} /><strong>Chọn hoặc kéo thả {mode === "qr" ? "ảnh QR" : "ảnh"}</strong><small>File sẽ được gửi vào pipeline own-backend sau khi bạn xác nhận.</small></button>}
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(event) => { const nextFile = event.target.files?.[0]; if (nextFile) onFileSelect?.(nextFile); event.target.value = ""; }} />
            </div>
          ) : <label className={styles.textField}><span>{mode === "url" ? "URL cần đối soát" : "Nội dung cần kiểm chứng"}</span><textarea value={content || ""} onChange={(event) => onContentChange?.(event.target.value)} rows={6} placeholder={mode === "url" ? "https://..." : "Dán nội dung khả nghi tại đây..."} /></label>}
          {ocr && <div className={styles.localOcr}><strong>OCR/QR cục bộ:</strong> {safeText(ocr.text || ocr.qrContent, "Chưa trích xuất được")}{confirmedEntities?.length ? ` · ${confirmedEntities.length} entity đã chọn làm gợi ý` : ""}</div>}
          {error && <div className={styles.error} role="alert"><ShieldAlert size={15} /><span>{safeText(error.message || error)}{error.traceId ? <small> · Reference: {error.traceId}</small> : null}</span></div>}
          <div className={styles.composerFooter}><button type="button" className={styles.secondaryButton} onClick={onReset}>Xóa input</button><button type="submit" className={styles.submitButton} disabled={!canSubmit}>{processing ? <LoaderCircle size={15} className="animate-spin" /> : <ScanSearch size={15} />} {hasResult ? "Chạy dữ liệu mới" : "Phân tích"} <ArrowRight size={14} /></button></div>
        </div>
        <aside className={styles.composerMeta}>
          <p className={styles.eyebrow}>OBSERVED INPUT</p>
          <div className={styles.inputSummary}><span>Loại</span><strong>{inputModeLabel(input?.type || mode)}</strong><span>Nội dung</span><strong>{safeText(input?.content || content, file?.name || "Chưa có input")}</strong></div>
          {analysisSummary?.label && <div className={styles.notice}><Check size={14} /> <span>{analysisSummary.label}</span></div>}
          <p className={styles.statusNote}>{demoEnabled ? "Demo mode đang bật theo environment." : `Source mode: ${safeText(sourceProvenance?.sourceMode, "LIVE")}`}</p>
        </aside>
      </form>

      <section className={styles.rail} aria-label="Pipeline trình tự bốn lớp">
        <div className={styles.railTop}><div><p className={styles.railKicker}>PIPELINE · SEQUENTIAL 4 LAYERS</p><p className={styles.statusNote}>Backend state là nguồn sự thật; UI không tự chạy timer tiến độ.</p></div><span className={styles.railState}>{processing ? "RUNNING" : finalReady ? "FINAL" : "READY"}</span></div>
        <div className={styles.railItems}>
          {STAGE_IDS.map((stageId, index) => {
            const state = stageState(pipeline, stageId, index, processing);
            const info = STAGE_INFO[stageId];
            return <button type="button" className={styles.railItem} data-state={statusClass(state)} key={stageId} disabled={!isOpenable(state)} onClick={() => isOpenable(state) && setSelected(stageId)}><span className={styles.railIndex}>{info.index}</span><strong>{info.eyebrow}</strong><small>{statusLabel(stageStatusValue(pipeline, stageId, processing))}</small></button>;
          })}
          <button type="button" className={styles.railItem} data-state={statusClass(finalState)} disabled={!finalReady} onClick={() => finalReady && setSelected("final_predict")}><span className={styles.railIndex}>FINAL</span><strong>PREDICT</strong><small>{finalStatusText}</small></button>
        </div>
      </section>

      <section className={styles.stageList} aria-label="Chi tiết bốn lớp">
        {STAGE_IDS.map(renderStageCard)}
      </section>

      {renderFinalCard()}

      {legacyResponse && <CompatibilityResponsePanel value={legacyResponse} />}

      {finalReady && <PostResultGateways onPrint={onPrint} caseId={caseId} caseRevision={caseRevision} claimId={claimId} domainCode={domainCode || ""} />}

      <footer className={styles.footerActions}>
        <span className={styles.statusNote}>{processing ? `Backend đang ở ${currentStage?.toUpperCase() || "pipeline"}.` : finalReady ? "Có thể mở lại các lớp đã hoàn tất mà không tạo run mới." : "L1 sẵn sàng; các lớp sau đang khóa."}</span>
        <div><button type="button" className={styles.navButton} disabled={selected === "l1"} onClick={() => navigate(-1)}><ArrowLeft size={14} /> Trước</button><button type="button" className={styles.navButton} disabled={selected === "final_predict" || !finalReady && selected === "l4"} onClick={() => navigate(1)}>Sau <ArrowRight size={14} /></button><button type="button" className={styles.secondaryButton} onClick={onNewAnalysis}>Phân tích mới</button><button type="button" className={styles.secondaryButton} onClick={onPrint}>In</button></div>
      </footer>
    </main>
  );
}

export default OwnTrustJourney;
