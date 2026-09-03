"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight, Check, ClipboardPaste, Clock3, FileImage, Globe2, Image as ImageIcon, LoaderCircle, Printer, ScanSearch, ShieldAlert, ShieldCheck, Upload, Users, UserRoundCheck, X } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";
import { deriveSafetyActions } from "@/lib/trust/safetyActions";
import { COMPETITION_DEMO_CASES } from "@/lib/trust/competitionDemoCases";
import { createErrorState, createWorkIdentity } from "@/lib/ui-state/model";
import StateBoundary from "@/components/ui/StateBoundary";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import { getRuntimeProviderBundle } from "@/lib/backend/runtimeProvider";
import TrustSectionBoundary from "./TrustSectionBoundary";
import TrustPipelineTimeline from "./TrustPipelineTimeline";
import SequentialFourLayerHUD from "./SequentialFourLayerHUD";
import {
  SEQUENTIAL_STATE,
  createInitialSequentialState,
  sequentialStateReducer,
} from "@/lib/ai-trust/sequential/SequentialTrustStateMachine";

const TrustGraph2D = dynamic(() => import("./TrustGraph2D"), {
  ssr: false,
  loading: () => <div className="intelligence-panel graph-loading"><LoaderCircle className="animate-spin" size={20} /><span>Đang tải TrustGraph theo yêu cầu...</span></div>,
});

const EMPTY_PIPELINE = [
  { id: "input", label: "Chuẩn hóa đầu vào", status: "waiting" },
  { id: "local", label: "Phân tích rủi ro cục bộ", status: "waiting" },
  { id: "external", label: "Đối soát bằng chứng", status: "waiting" },
  { id: "reasoning", label: "Tổng hợp phán quyết", status: "waiting" },
];

function readable(value, fallback = "Chưa xác định") {
  return String(value || fallback).replaceAll("_", " ");
}

function evidenceLevel(layer3, fallback) {
  const rawScore = layer3?.verificationCompleteness ?? layer3?.evidenceCompleteness ?? fallback;
  if (rawScore == null || rawScore === "") return "CHƯA CÓ";
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return "CHƯA CÓ";
  if (score >= .75) return "MẠNH";
  if (score >= .4) return "MỘT PHẦN";
  return "HẠN CHẾ";
}

function confidenceLevel(layer4, fallback) {
  const rawScore = layer4?.decisionConfidence ?? layer4?.confidence ?? layer4?.confidenceScore ?? layer4?.riskAssessment?.confidence ?? fallback;
  if (rawScore == null || rawScore === "") return "KHÔNG CÔNG BỐ";
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return "KHÔNG CÔNG BỐ";
  const normalized = score > 1 ? score / 100 : score;
  return normalized >= .8 ? "CAO" : normalized >= .55 ? "TRUNG BÌNH" : "THẤP";
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const SENSITIVE_FACT_KEY = /(token|secret|password|authorization|cookie|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key)/i;

function safeFactValue(value, depth = 0) {
  if (value == null || depth > 2) return null;
  if (typeof value === "string") return value.trim().slice(0, 600) || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const values = value.map((item) => safeFactValue(item, depth + 1)).filter(Boolean).slice(0, 8);
    return values.length ? values.join(" · ") : null;
  }
  if (typeof value === "object") {
    const values = Object.entries(value)
      .filter(([key]) => !SENSITIVE_FACT_KEY.test(key))
      .slice(0, 8)
      .map(([key, item]) => {
        const formatted = safeFactValue(item, depth + 1);
        return formatted ? `${readable(key)}: ${formatted}` : null;
      })
      .filter(Boolean);
    return values.length ? values.join(" · ") : null;
  }
  return null;
}

function factsFor(record, definitions) {
  const source = asRecord(record);
  return definitions.map(([key, label]) => {
    const value = safeFactValue(source[key]);
    return value ? { label, value } : null;
  }).filter(Boolean);
}

function buildReportLevel2Sections(layers, canonical) {
  const sections = [];
  const layer2 = asRecord(layers.layer2);
  const layer2A = asRecord(layers.layer2A);
  const layer2C = asRecord(layers.layer2C);
  const claims = Array.isArray(layer2.claims)
    ? layer2.claims.map((claim) => {
      const item = asRecord(claim);
      const text = safeFactValue(item.text || item.claim || item.statement);
      const status = safeFactValue(item.status);
      return text ? { label: status ? `Claim · ${readable(status)}` : "Claim", value: text } : null;
    }).filter(Boolean).slice(0, 8)
    : [];
  const contentFacts = [
    ...factsFor(layer2, [["summary", "Tóm tắt nội dung"], ["status", "Trạng thái semantic"]]),
    ...claims,
  ];
  if (contentFacts.length) sections.push({ id: "content", title: "Content & claims", facts: contentFacts });

  const reputationFacts = factsFor(layer2A, [["provider", "Nguồn reputation"], ["finding", "Finding"], ["providerStatus", "Trạng thái provider"], ["threatTypes", "Loại tín hiệu"]]);
  if (reputationFacts.length) sections.push({ id: "reputation", title: "Reputation / threat intelligence", facts: reputationFacts });

  const studentContextFacts = factsFor(layer2C, [["status", "Trạng thái StudentHub domain"], ["summary", "Tóm tắt ngữ cảnh"], ["finding", "Finding"], ["riskLevel", "Mức rủi ro ngữ cảnh"]]);
  if (studentContextFacts.length) sections.push({ id: "student-context", title: "Student context", facts: studentContextFacts });

  const categoryDefinitions = [
    ["identity", "Identity", [["status", "Trạng thái"], ["summary", "Tóm tắt"], ["entity", "Thực thể"], ["organization", "Tổ chức được nêu"], ["claimedBrand", "Thương hiệu được nêu"]]],
    ["technical", "Technical", [["status", "Trạng thái"], ["summary", "Tóm tắt"], ["finding", "Finding"]]],
    ["community", "Community", [["status", "Trạng thái"], ["summary", "Tóm tắt"], ["finding", "Finding"], ["corroboration", "Corroboration"]]],
    ["expert", "Expert", [["status", "Trạng thái"], ["summary", "Tóm tắt"], ["finding", "Finding"], ["scope", "Phạm vi"]]],
  ];
  for (const [id, title, definitions] of categoryDefinitions) {
    const facts = factsFor(layer2, definitions).length ? factsFor(layer2, definitions) : factsFor(layer2C, definitions);
    if (facts.length) sections.push({ id, title, facts });
  }

  const links = Array.isArray(canonical?.links) ? canonical.links : [];
  const linksByPillar = new Map();
  links.forEach((link) => {
    const item = asRecord(link);
    const pillar = typeof item.pillar === "string" ? item.pillar : null;
    const targetId = safeFactValue(item.targetId);
    if (!pillar || !targetId) return;
    const facts = linksByPillar.get(pillar) || [];
    facts.push({
      label: readable(item.relation, "Liên kết"),
      value: `${targetId}${item.caseScope ? ` · case ${safeFactValue(asRecord(item.caseScope).caseId) || "chưa định danh"} · revision ${safeFactValue(asRecord(item.caseScope).caseRevision) || "—"}` : ""}`,
    });
    linksByPillar.set(pillar, facts);
  });
  for (const [pillar, facts] of linksByPillar) sections.push({ id: `link-${pillar.toLowerCase()}`, title: `${readable(pillar)} handoff`, facts: facts.slice(0, 8) });

  return sections;
}

const TECHNICAL_FACT_DEFINITIONS = [
  ["url", "URL"],
  ["domain", "Domain"],
  ["redirects", "Redirects"],
  ["dns", "DNS"],
  ["tls", "TLS"],
  ["certificate", "Certificate"],
  ["headers", "Headers"],
  ["infrastructure", "Infrastructure"],
  ["rawObservations", "Raw observations"],
  ["observedAt", "Observed at"],
  ["sourceTimestamps", "Source timestamps"],
  ["provenance", "Provenance"],
];

function buildTechnicalFacts(layers) {
  const layer3 = asRecord(layers.layer3);
  const technical = asRecord(layer3.technical || layer3.technicalDetails || layer3.technicalEvidence);
  const facts = [...factsFor(layer3, TECHNICAL_FACT_DEFINITIONS), ...factsFor(technical, TECHNICAL_FACT_DEFINITIONS)];
  return facts.filter((fact, index, values) => values.findIndex((item) => item.label === fact.label && item.value === fact.value) === index).slice(0, 20);
}

function buildEvidenceRecords(layers, canonical) {
  const layer3 = asRecord(layers.layer3);
  const rawEvidence = Array.isArray(canonical?.evidence) && canonical.evidence.length
    ? canonical.evidence
      : Array.isArray(layer3.evidence)
      ? layer3.evidence
      : [];
  const records = rawEvidence.map((value) => {
    const item = asRecord(value);
    const source = safeFactValue(item.sourceId || item.publisher || item.title || item.url);
    const summary = safeFactValue(item.summary || item.title || item.status);
    if (!source && !summary) return null;
    return {
      source: source || "Nguồn không có định danh",
      summary: summary || "Không có tóm tắt được công bố.",
      sourceType: safeFactValue(item.sourceType || item.status) || "Chưa phân loại",
      observedAt: safeFactValue(item.observedAt),
      provenance: safeFactValue(asRecord(item.provenance).label || item.publisher),
    };
  }).filter(Boolean).slice(0, 50);
  if (records.length) return records;
  return (Array.isArray(layer3.evidenceRefs) ? layer3.evidenceRefs : [])
    .map((reference) => safeFactValue(reference))
    .filter(Boolean)
    .slice(0, 50)
    .map((reference) => ({ source: reference, summary: "Evidence reference được stage công bố; nội dung chi tiết chưa có.", sourceType: "LIVE_PROVIDER", observedAt: null, provenance: null }));
}

function buildUnresolvedSignals(layers, canonical, envelope) {
  const values = [
    ...(Array.isArray(envelope?.unknowns) ? envelope.unknowns : []),
    ...(Array.isArray(envelope?.missing) ? envelope.missing.map((item) => `Thiếu phạm vi: ${item}`) : []),
    ...(Array.isArray(canonical?.unknowns) ? canonical.unknowns : []),
    ...(Array.isArray(canonical?.metrics?.unresolvedSignals) ? canonical.metrics.unresolvedSignals : []),
    ...(Array.isArray(asRecord(layers.layer4).unknowns) ? asRecord(layers.layer4).unknowns : []),
    ...(Array.isArray(asRecord(layers.layer3).unknowns) ? asRecord(layers.layer3).unknowns : []),
  ];
  return values.map((value) => safeFactValue(value)).filter(Boolean).filter((value, index, list) => list.indexOf(value) === index).slice(0, 12);
}

function deriveReasons(layers, canonical) {
  const candidates = [layers.layer4?.userExplanation?.why, layers.layer4?.userExplanation?.riskSummary, layers.layer1?.details?.decisionRationale, layers.layer2?.summary, ...(Array.isArray(canonical?.reasons) ? canonical.reasons : [])];
  return [...new Set(candidates.filter(Boolean).map(String))].slice(0, 4);
}

function buildGraph(input, layers, canonical, pipeline) {
  if (pipeline?.graph && Array.isArray(pipeline.graph.nodes) && Array.isArray(pipeline.graph.edges)) {
    return pipeline.graph;
  }
  const nodes = [{ id: "input", kind: "INPUT", label: input.type === "url" ? input.content : "Nội dung được kiểm tra", detail: "Đầu vào gốc của phiên phân tích hiện tại." }];
  const edges = [];
  const claims = Array.isArray(layers.layer2?.claims) ? layers.layer2.claims.slice(0, 4) : [];
  claims.forEach((claim, index) => {
    const id = `claim-${index}`;
    nodes.push({ id, kind: "CLAIM", label: claim.text || claim.claim || claim.statement || `Luận điểm ${index + 1}`, detail: readable(claim.status, "Luận điểm được trích xuất") });
    edges.push({ from: "input", to: id, label: "contains" });
  });
  const rawSources = layers.layer3?.sources || layers.layer3?.verifiedSources || layers.layer3?.evidence || layers.layer3?.evidenceItems || [];
  (Array.isArray(rawSources) ? rawSources : []).slice(0, 4).forEach((source, index) => {
    const id = `source-${index}`;
    nodes.push({ id, kind: "SOURCE", label: source.publisher || source.title || source.domain || source.url || `Nguồn ${index + 1}`, detail: source.url || source.status || "Nguồn do tầng bằng chứng trả về." });
    edges.push({ from: claims.length ? `claim-${Math.min(index, claims.length - 1)}` : "input", to: id, label: "supported_by" });
  });
  const related = Array.isArray(layers.layer3?.relatedCases) ? layers.layer3.relatedCases : Array.isArray(layers.layer4?.relatedCases) ? layers.layer4.relatedCases : canonical?.relatedCases || [];
  related.slice(0, 4).forEach((item, index) => {
    const id = `case-${index}`;
    nodes.push({ id, kind: "CASE", label: item.title || item.caseId || item.id || `Case liên quan ${index + 1}`, detail: item.similarity != null ? `${Math.round(item.similarity * 100)}% tương đồng` : "Case được nối từ lớp bằng chứng." });
    edges.push({ from: "input", to: id, label: "related_case" });
  });
  (canonical?.links || []).slice(0, 3).forEach((link, index) => {
    const kind = link.pillar === "COMMUNITY" ? "COMMUNITY" : link.pillar === "EXPERT" ? "EXPERT" : "PASSPORT";
    const id = `pillar-${kind.toLowerCase()}-${index}`;
    nodes.push({ id, kind, label: `${kind} · ${link.targetId}`, detail: `${link.relation} · case ${link.caseScope?.caseId || "chưa định danh"}` });
    edges.push({ from: "input", to: id, label: link.relation === "CORROBORATION" ? "supported_by" : link.relation === "HISTORY" ? "related_case" : "reviewed_by" });
  });
  return { nodes, edges };
}

function legacyStatusFromV5(status) {
  if (status === "RUNNING") return "running";
  if (status === "PARTIAL") return "partial";
  if (["FAILED", "BLOCKED", "SKIPPED"].includes(status)) return "error";
  if (status === "COMPLETED") return "done";
  return "waiting";
}

function legacyPipelineFromV5(currentPipeline, previousPipeline = EMPTY_PIPELINE) {
  const stages = currentPipeline?.stages || {};
  const l1 = stages.l1;
  const externalStages = [stages.l2a, stages.l2b, stages.l2c, stages.l3].filter(Boolean);
  const reasoningStages = [stages.l4, stages.l5].filter(Boolean);
  const external = externalStages.find((stage) => stage.operationStatus === "RUNNING") || externalStages.find((stage) => stage.operationStatus === "PARTIAL" || stage.operationStatus === "FAILED") || externalStages[externalStages.length - 1];
  const reasoning = reasoningStages.find((stage) => stage.operationStatus === "RUNNING") || reasoningStages.find((stage) => stage.operationStatus === "PARTIAL" || stage.operationStatus === "FAILED") || reasoningStages[reasoningStages.length - 1];
  const copy = previousPipeline.map((item) => ({ ...item }));
  const update = (id, stage, fallbackDetail) => {
    const item = copy.find((entry) => entry.id === id);
    if (!item || !stage) return;
    item.status = legacyStatusFromV5(stage.operationStatus);
    item.detail = stage.finding || stage.summary || fallbackDetail;
  };
  update("local", l1, "Đang chờ Layer 1");
  update("external", external, "Đang chờ các nguồn đối soát");
  update("reasoning", reasoning, "Đang chờ policy và assurance");
  return copy;
}

function v5VerdictTitle(decision) {
  switch (decision?.epistemicState) {
    case "DANGEROUS": return "NGUY HIỂM · KHÔNG NÊN TIẾP TỤC";
    case "HIGH_RISK": return "RỦI RO CAO · CẦN THẬN TRỌNG";
    case "SUSPICIOUS": return "ĐÁNG NGỜ · CẦN ĐỐI SOÁT";
    case "DISPUTED": return "ĐANG TRANH CHẤP · CHƯA THỂ KẾT LUẬN";
    case "SUPPORTED": return "CÓ CƠ SỞ HỖ TRỢ · KHÔNG ĐỒNG NGHĨA AN TOÀN";
    case "CONFLICTING_EVIDENCE": return "CÁC NGUỒN XUNG ĐỘT · CHƯA AN TOÀN";
    case "INSUFFICIENT_EVIDENCE": return "CHƯA ĐỦ BẰNG CHỨNG";
    case "UNKNOWN": return "CHƯA THỂ KẾT LUẬN";
    default: break;
  }
  switch (decision?.security) {
    case "MALICIOUS": return "NGUY HIỂM · ĐÃ CHẶN";
    case "SUSPICIOUS": return "ĐÁNG NGỜ · CẦN THẬN TRỌNG";
    case "NO_KNOWN_THREAT": return "CHƯA THẤY MỐI ĐE DỌA ĐÃ BIẾT";
    case "NOT_APPLICABLE": return "KHÔNG ÁP DỤNG";
    default: return "CHƯA ĐỦ BẰNG CHỨNG";
  }
}

export function AiTrustStudioView() {
  const demoEnabled = process.env.NEXT_PUBLIC_COMPETITION_DEMO === "true";
  const [mode, setMode] = useState("image");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [ocr, setOcr] = useState(null);
  const [confirmedEntities, setConfirmedEntities] = useState([]);
  const [pipeline, setPipeline] = useState(EMPTY_PIPELINE);
  const [v5Pipeline, setV5Pipeline] = useState(null);
  const [layers, setLayers] = useState({ layer1: null, layer2A: null, layer2: null, layer2C: null, layer3: null, layer4: null });
  const [seqState, dispatchSeq] = useReducer(sequentialStateReducer, undefined, createInitialSequentialState);
  const [timeline, setTimeline] = useState([]);
  const [demoCaseId, setDemoCaseId] = useState(null);
  const [providerResult, setProviderResult] = useState(null);
  const [sourceProvenance, setSourceProvenance] = useState(null);
  const [passportQuery, setPassportQuery] = useState(null);
  const [passportRetryKey, setPassportRetryKey] = useState(0);
  const fileInput = useRef(null);
  const activeScan = useRef(null);
  const scanSequence = useRef(0);

  const updateStep = (id, status, detail = "") => setPipeline((items) => items.map((item) => item.id === id ? { ...item, status, detail } : item));
  const record = (label, status) => setTimeline((items) => [...items, { id: `${Date.now()}-${items.length}`, label, status, at: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);

  const acceptFile = useCallback((nextFile) => {
    setError(null);
    if (!nextFile || !["image/png", "image/jpeg", "image/webp"].includes(nextFile.type)) return setError({ message: "Định dạng này chưa được hỗ trợ. Hãy chọn PNG, JPG hoặc WEBP.", code: "VALIDATION" });
    if (nextFile.size > 8 * 1024 * 1024) return setError({ message: "Ảnh vượt quá giới hạn 8 MB.", code: "PAYLOAD_TOO_LARGE" });
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile); setPreview(URL.createObjectURL(nextFile)); setOcr(null); setConfirmedEntities([]);
  }, [preview]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => activeScan.current?.abort("component-unmounted"), []);
  useEffect(() => {
    const onPaste = (event) => {
      const image = [...(event.clipboardData?.files || [])].find((item) => item.type.startsWith("image/"));
      if (image) acceptFile(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    scanSequence.current += 1;
    activeScan.current?.abort("reset");
    dispatchSeq({ type: "RESET" });
    setFile(null); setPreview(null); setContent(""); setError(null); setOcr(null); setConfirmedEntities([]); setDemoCaseId(null); setProviderResult(null); setSourceProvenance(null);
    setPipeline(EMPTY_PIPELINE); setV5Pipeline(null); setLayers({ layer1: null, layer2A: null, layer2: null, layer2C: null, layer3: null, layer4: null }); setTimeline([]);
  };

  const analyze = async () => {
    activeScan.current?.abort("superseded-by-new-scan");
    const controller = new AbortController();
    activeScan.current = controller;
    const scanId = ++scanSequence.current;
    setError(null); setProcessing(true); setPipeline(EMPTY_PIPELINE); setV5Pipeline(null); setProviderResult(null); setSourceProvenance(null); setTimeline([]);
    setLayers({ layer1: null, layer2A: null, layer2: null, layer2C: null, layer3: null, layer4: null });
    dispatchSeq({ type: "START", payload: { requestId: `scan-${scanId}` } });
    let extracted = content.trim();
    try {
      const demoCase = demoEnabled ? COMPETITION_DEMO_CASES.find((item) => item.id === demoCaseId) : null;
      if (demoCase) {
        updateStep("input", "done", "CHẾ ĐỘ TRÌNH DIỄN"); record("Đầu vào demo đã được nạp", "DEMO DATA");
        dispatchSeq({ type: "START", payload: { requestId: "demo-" + demoCase.id } });
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        updateStep("local", "done", readable(demoCase.layers.layer1.status)); record("Phân tích rủi ro cục bộ", readable(demoCase.layers.layer1.status));
        dispatchSeq({ type: "L1_SUCCESS", payload: { result: demoCase.layers.layer1 } });
        await new Promise((r) => setTimeout(r, 400));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "START_L2" });
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;
        const l2Result = demoCase.layers.layer2A || demoCase.layers.layer2 || { finding: "NO_KNOWN_THREAT", status: "PASS" };
        dispatchSeq({ type: "L2_SUCCESS", payload: { result: l2Result } });
        await new Promise((r) => setTimeout(r, 400));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        updateStep("external", demoCase.layers.layer3.status === "PARTIAL" ? "partial" : "done", readable(demoCase.layers.layer3.status)); record("Đối soát bằng chứng", readable(demoCase.layers.layer3.status));
        dispatchSeq({ type: "START_L3" });
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;
        dispatchSeq({ type: "L3_SUCCESS", payload: { result: demoCase.layers.layer3 } });
        await new Promise((r) => setTimeout(r, 400));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        updateStep("reasoning", "done", readable(demoCase.layers.layer4.status)); record("Phán quyết demo được tổng hợp", readable(demoCase.layers.layer4.status));
        dispatchSeq({ type: "START_L4" });
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;
        dispatchSeq({ type: "L4_SUCCESS", payload: { result: demoCase.layers.layer4 } });
        dispatchSeq({ type: "FINAL_VERDICT", payload: { verdict: demoCase.layers.layer4 } });

        setLayers(demoCase.layers);
        setSourceProvenance({ requestedMode: "DEMO", sourceMode: "DEMO", kind: "DEMO_FIXTURE", label: "Deterministic competition demo case", fixtureId: demoCase.id, fixtureVersion: "competition-v1", disclosure: "Case được chọn chủ động từ fixture trình diễn; không phải xác minh live." });
        return;
      }
      updateStep("input", "running", mode === "image" || mode === "qr" ? "OCR đang chạy trong trình duyệt" : "Đang chuẩn hóa");
      if (mode === "image" || mode === "qr") {
        if (!file) throw new ApiError("Hãy chọn hoặc dán một ảnh trước khi phân tích.", "VALIDATION", { status: 400 });
        const { OcrService } = await import("@/lib/ai-trust/vision/OcrService");
        const result = await OcrService.extract(file);
        if (controller.signal.aborted || scanId !== scanSequence.current) return;
        extracted = String(mode === "qr" ? result.qrContent || "" : result.text || result.qrContent || "").trim();
        setOcr({ ...result, authority: "CLIENT_OCR_HINT" });
        if (!extracted) throw new ApiError(mode === "qr" ? "Không đọc được mã QR. Hãy dùng ảnh QR rõ hơn hoặc chuyển sang nhập URL/văn bản." : "OCR cục bộ không đọc được nội dung. Hãy dùng ảnh rõ hơn hoặc chuyển sang nhập văn bản.", "VALIDATION", { status: 422 });
      }
      if (mode === "url") {
        let parsedUrl;
        try { parsedUrl = new URL(extracted); }
        catch { throw new ApiError("URL không hợp lệ. Hãy nhập đầy đủ https://...", "VALIDATION", { status: 422 }); }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new ApiError("Chỉ hỗ trợ URL HTTP hoặc HTTPS.", "VALIDATION", { status: 422 });
      }
      if (controller.signal.aborted || scanId !== scanSequence.current) return;
      const identity = createWorkIdentity("trust");
      const input = {
        type: mode === "url" ? "URL" : mode === "image" ? "IMAGE" : mode === "qr" ? "QR_READY" : "TEXT",
        content: extracted,
        metadata: mode === "image" || mode === "qr"
          ? { inputKind: mode === "qr" ? "QR" : "IMAGE", extractionAuthority: "CLIENT_OCR_HINT", fileType: file?.type, ...(mode === "qr" ? { qrContent: extracted } : {}) }
          : { inputKind: mode === "url" ? "URL" : "TEXT" },
        requestId: identity.requestId,
        runId: identity.runId,
        confirmedEntities,
      };
      updateStep("input", "done", mode === "image" || mode === "qr" ? "CLIENT_OCR_HINT" : "Đã chuẩn hóa"); record("Đầu vào đã được xử lý", "DONE");
      updateStep("local", "running");
      updateStep("external", "running", "Đang kiểm tra nguồn và luận điểm");
      updateStep("reasoning", "running", "Chờ phán quyết xác định");
      let streamedPipeline = null;
      const provider = getRuntimeProviderBundle();
      const response = await provider.trust.investigate(input, controller.signal, (event) => {
        if (scanId !== scanSequence.current || !event?.data) return;
        streamedPipeline = event.data;
        setV5Pipeline(event.data);
        setPipeline((items) => legacyPipelineFromV5(event.data, items));
        if (event.event === "STAGE_STARTED" || event.event === "STAGE_COMPLETED" || event.event === "STAGE_RETRY_SCHEDULED") {
          record(`V5 ${String(event.stageId || "stage").toUpperCase()}`, readable(event.event));
        }
        if (event.event === "STAGE_STARTED") {
          if (event.stageId === "l1") dispatchSeq({ type: "START", payload: { requestId: identity.requestId } });
          else if (["l2a", "l2b", "l2c"].includes(event.stageId)) dispatchSeq({ type: "START_L2" });
          else if (event.stageId === "l3") dispatchSeq({ type: "START_L3" });
          else if (["l4", "l5"].includes(event.stageId)) dispatchSeq({ type: "START_L4" });
        }
        if (event.event === "STAGE_COMPLETED") {
          if (event.stageId === "l1") dispatchSeq({ type: "L1_SUCCESS", payload: { result: event.data?.layerResults?.layer1 || {} } });
          else if (["l2a", "l2b", "l2c"].includes(event.stageId)) dispatchSeq({ type: "L2_SUCCESS", payload: { result: event.data?.layerResults?.layer2B || event.data?.layerResults?.layer2A || {} } });
          else if (event.stageId === "l3") dispatchSeq({ type: "L3_SUCCESS", payload: { result: event.data?.layerResults?.layer3 || {} } });
          else if (["l4", "l5"].includes(event.stageId)) dispatchSeq({ type: "L4_SUCCESS", payload: { result: event.data?.layerResults?.layer4 || {} } });
        }
        const eventLayers = event.data.layerResults;
        if (eventLayers) setLayers({
          layer1: eventLayers.layer1 || null,
          layer2A: eventLayers.layer2A || null,
          layer2: eventLayers.layer2B || null,
          layer2C: eventLayers.layer2C || null,
          layer3: eventLayers.layer3 || null,
          layer4: eventLayers.layer4 || null,
        });
      });
      if (scanId !== scanSequence.current) return;
      setProviderResult(response);
      setSourceProvenance(response.provenance);
      if (["ERROR", "UNAVAILABLE", "OFFLINE", "AUTH_REQUIRED", "FORBIDDEN", "CANCELLED"].includes(response.state)) {
        const safeMessage = response.error?.userMessage || (response.state === "UNAVAILABLE" ? "Nguồn live chưa khả dụng; không có dữ liệu demo thay thế." : response.state === "CANCELLED" ? "Yêu cầu đã được dừng." : "Trust Engine chưa trả về kết quả hợp lệ.");
        if (response.state !== "CANCELLED") setError({ message: safeMessage, code: response.error?.code || response.state, traceId: response.error?.details?.traceId || response.error?.requestId || null });
        setPipeline((items) => items.map((item) => item.status === "running" ? { ...item, status: response.state === "CANCELLED" ? "waiting" : "error", detail: safeMessage } : item));
        if (response.state === "CANCELLED") {
          dispatchSeq({ type: "CANCEL" });
        } else {
          dispatchSeq({
            type: "FAIL_LAYER",
            payload: {
              layer: seqState.activeLayer || 2,
              code: response.error?.code || response.state,
              message: safeMessage,
            },
          });
        }
        return;
      }
      if (!response.data) {
        setError({ message: "Trust Engine chưa trả về dữ liệu đủ để hiển thị.", code: "INVALID_RESPONSE", traceId: response.requestId || null });
        dispatchSeq({ type: "FAIL_LAYER", payload: { layer: 4, code: "INVALID_RESPONSE", message: "Trust Engine chưa trả về dữ liệu đủ để hiển thị." } });
        return;
      }
      const displayPipeline = streamedPipeline || (response.data && response.data.layerResults ? response.data : null);
      if (displayPipeline) setV5Pipeline(displayPipeline);
      const resultLayers = displayPipeline?.layerResults || {};
      const layer1 = resultLayers.layer1 || null;
      const layer2A = resultLayers.layer2A || null;
      const layer2 = resultLayers.layer2B || null;
      const layer2C = resultLayers.layer2C || null;
      const layer3 = resultLayers.layer3 || null;
      const layer4 = resultLayers.layer4 || null;
      setLayers({ layer1, layer2A, layer2, layer2C, layer3, layer4 });
      if (layer1) dispatchSeq({ type: "L1_SUCCESS", payload: { result: layer1 } });
      if (layer2A || layer2) dispatchSeq({ type: "L2_SUCCESS", payload: { result: layer2A || layer2 } });
      if (layer3) dispatchSeq({ type: "L3_SUCCESS", payload: { result: layer3 } });
      if (layer4) dispatchSeq({ type: "L4_SUCCESS", payload: { result: layer4 } });
      dispatchSeq({ type: "FINAL_VERDICT", payload: { verdict: displayPipeline?.finalDecision || response.data } });
      setPipeline((items) => displayPipeline ? legacyPipelineFromV5(displayPipeline, items) : items.map((item) => item.status === "running" ? { ...item, status: "done", detail: "Canonical result" } : item));
      record("Trust provider hoàn tất", readable(response.state));
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ABORTED" && scanId !== scanSequence.current) {
        dispatchSeq({ type: "CANCEL" });
        return;
      }
      const message = caught instanceof ApiError ? apiErrorMessage(caught) : "Pipeline gặp lỗi ngoài dự kiến.";
      setError({ message, code: caught instanceof ApiError ? caught.code : "SERVER_ERROR", traceId: caught instanceof ApiError ? caught.traceId : null });
      setPipeline((items) => items.map((item) => item.status === "running" ? { ...item, status: "error", detail: message } : item));
      dispatchSeq({
        type: "FAIL_LAYER",
        payload: {
          layer: seqState.activeLayer || 1,
          code: caught instanceof ApiError ? caught.code : "SERVER_ERROR",
          message,
        },
      });
    } finally { if (scanId === scanSequence.current) setProcessing(false); }
  };

  const hasNativeV5 = Boolean(v5Pipeline && v5Pipeline.pipelineVersion !== "trust-v5-compatibility");
  const canonicalResult = providerResult?.data || null;
  const hasResult = Boolean(layers.layer4 || v5Pipeline?.finalDecision || canonicalResult || seqState.state === SEQUENTIAL_STATE.FINAL);
  const risk = readable(layers.layer4?.riskAssessment?.level || layers.layer4?.riskLevel || (hasNativeV5 ? v5Pipeline?.finalDecision?.security : null) || layers.layer1?.riskLevel || canonicalResult?.metrics?.risk || canonicalResult?.decision?.security, "CHƯA XÁC ĐỊNH");
  const verdict = hasNativeV5 ? v5VerdictTitle(v5Pipeline?.finalDecision) : layers.layer4?.userExplanation?.verdictTitle || (canonicalResult ? v5VerdictTitle(canonicalResult.decision) : readable(layers.layer4?.status, "Đang chờ phân tích"));
  const reasons = deriveReasons(layers, canonicalResult);
  const graph = useMemo(() => buildGraph({ type: mode, content: content || "Ảnh đầu vào" }, layers, canonicalResult, v5Pipeline), [mode, content, layers, canonicalResult, v5Pipeline]);
  const layer2AProvider = layers.layer2A && !layers.layer2A.notApplicable ? [{
    provider: layers.layer2A.provider || "Layer 2A",
    status: String(layers.layer2A.providerStatus || "unknown").toLowerCase(),
    latencyMs: layers.layer2A.latencyMs,
    signals: [layers.layer2A.finding, ...(Array.isArray(layers.layer2A.threatTypes) ? layers.layer2A.threatTypes : [])].filter(Boolean),
  }] : [];
  const canonicalProviders = Array.isArray(canonicalResult?.providerObservations) ? canonicalResult.providerObservations.map((item) => ({ provider: item.providerId, status: String(item.status || "UNKNOWN").toLowerCase(), latencyMs: item.latencyMs, signals: item.signals })) : [];
  const providerRecords = [...layer2AProvider, ...(Array.isArray(layers.layer3?.providerResults) ? layers.layer3.providerResults : []), ...canonicalProviders];
  const providers = [...new Map(providerRecords
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ ...item, provider: item.provider || item.providerId }))
    .filter((item) => typeof item.provider === "string" && item.provider.trim())
    .map((item) => [item.provider, item])).values()];
  const canonicalCases = Array.isArray(canonicalResult?.relatedCases) ? canonicalResult.relatedCases.map((item) => ({ id: item.caseId, title: item.title || item.caseId, similarity: item.similarity ?? 0, sharedSignals: item.sharedSignals })) : [];
  const rawRelatedCases = Array.isArray(layers.layer3?.relatedCases) ? layers.layer3.relatedCases : Array.isArray(layers.layer4?.relatedCases) ? layers.layer4.relatedCases : canonicalCases;
  const relatedCases = rawRelatedCases.map((item, index) => ({
    id: item.id || item.caseId || `related-case-${index}`,
    title: item.title || item.caseId || item.id || `Case liên quan ${index + 1}`,
    similarity: Number.isFinite(Number(item.similarity)) ? Math.max(0, Math.min(1, Number(item.similarity))) : 0,
    sharedSignals: Array.isArray(item.sharedSignals) ? item.sharedSignals : [],
  }));
  const reportLevel2Sections = buildReportLevel2Sections(layers, canonicalResult);
  const technicalFacts = buildTechnicalFacts(layers);
  const evidenceRecords = buildEvidenceRecords(layers, canonicalResult);
  const unresolvedSignals = buildUnresolvedSignals(layers, canonicalResult, providerResult);
  const safetyActions = useMemo(() => deriveSafetyActions({ input: content, status: layers.layer4?.status || canonicalResult?.decision?.epistemicState, risk }), [content, layers.layer4?.status, canonicalResult?.decision?.epistemicState, risk]);
  const passportCaseId = canonicalResult?.caseId || null;
  const passportCaseRevision = Number.isInteger(canonicalResult?.caseRevision) ? canonicalResult.caseRevision : null;
  const passportCaseRunId = canonicalResult?.runId || null;
  const passportScopeKey = passportCaseId && passportCaseRevision !== null ? `${passportCaseId}:${passportCaseRevision}:${passportCaseRunId || "latest"}` : null;

  useEffect(() => {
    if (!passportScopeKey || !passportCaseId || passportCaseRevision === null) return undefined;
    const controller = new AbortController();
    const identity = createWorkIdentity("passport");
    getRuntimeProviderBundle().passport.getPassport({ caseId: passportCaseId, caseRevision: passportCaseRevision }, identity.requestId, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setPassportQuery({ key: passportScopeKey, result }); })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        const error = caught instanceof ApiError ? caught : new ApiError("Evidence Passport request failed.", "SERVER_ERROR");
        setPassportQuery({
          key: passportScopeKey,
          result: createErrorState(error.toSafeError(), {
            phase: "PASSPORT_READ_FAILED",
            requestId: identity.requestId,
            retryable: error.retryable,
            nextActions: [{ id: "RETRY", label: "Thử đọc lại Passport" }],
          }),
        });
      });
    return () => controller.abort("passport-scope-changed");
  }, [passportCaseId, passportCaseRevision, passportScopeKey, passportRetryKey]);

  const passportResult = passportQuery?.key === passportScopeKey ? passportQuery.result : null;
  const handleTrustStateAction = (action) => {
    if (action.id === "RETRY") analyze();
    if (action.id === "START_OVER") reset();
    if (["REVIEW_UNKNOWN", "CHECK_OFFICIAL_SOURCE"].includes(action.id)) document.getElementById("trust-v5-timeline-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className="product-workspace">
    <header className="product-hero"><div><p className="product-kicker">AI × Community × Human expertise</p><h1>Kiểm tra trước khi bạn tin.</h1><p>Đưa ảnh chụp, đường dẫn hoặc nội dung khả nghi vào một luồng phân tích có thể truy vết. AI phát hiện, cộng đồng bổ sung bằng chứng, chuyên gia xác minh.</p><SourceDisclosure provenance={sourceProvenance} sourceMode={sourceProvenance?.sourceMode || (demoEnabled ? "DEMO" : "LIVE")} /></div><div className="hero-seal"><ShieldCheck size={20} /><span>TRUST ENGINE</span><strong>Evidence first</strong></div></header>
    <section className="trust-input-grid" aria-labelledby="trust-input-title">
      <div className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">01 · Input</p><h2 id="trust-input-title" className="product-section-title">Bạn muốn kiểm tra gì?</h2></div>{(file || content) && <button className="text-link" onClick={reset}>Làm mới</button>}</div>
        {demoEnabled && <div className="demo-mode-panel" role="group" aria-label="Ba case trình diễn"><div><span className="signal-badge">CHẾ ĐỘ TRÌNH DIỄN</span><p>Dữ liệu xác định, chỉ dùng khi người vận hành chủ động chọn case.</p></div><div className="flex flex-wrap gap-2">{COMPETITION_DEMO_CASES.map((item) => <button type="button" key={item.id} className={`filter-chip ${demoCaseId === item.id ? "is-active" : ""}`} aria-pressed={demoCaseId === item.id} onClick={() => { setDemoCaseId(item.id); setMode("text"); setContent(item.input); setFile(null); setConfirmedEntities([]); if (preview) URL.revokeObjectURL(preview); setPreview(null); }}>{item.label}</button>)}</div></div>}
         <div className="mode-switch" role="tablist" aria-label="Loại đầu vào"><button role="tab" aria-selected={mode === "image"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("image"); }}><ImageIcon size={15} /> Ảnh chụp</button><button role="tab" aria-selected={mode === "qr"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("qr"); }}><ScanSearch size={15} /> QR</button><button role="tab" aria-selected={mode === "text"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("text"); }}><ClipboardPaste size={15} /> Văn bản</button><button role="tab" aria-selected={mode === "url"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("url"); }}><Globe2 size={15} /> URL</button></div>
         {mode === "image" || mode === "qr" ? <div className={`upload-zone ${dragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); setDemoCaseId(null); acceptFile(event.dataTransfer.files[0]); }}>{preview ? <><div className="ocr-preview-wrap"><Image src={preview} alt={mode === "qr" ? "Ảnh mã QR sẽ được phân tích" : "Ảnh sẽ được phân tích"} width={1200} height={800} unoptimized />{ocr?.regions?.map((region) => <span key={region.id} className="ocr-region" style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }} aria-label={`${region.label} overlay`} />)}</div><button type="button" className="remove-upload" onClick={() => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); setOcr(null); }} aria-label="Xóa ảnh"><X size={16} /></button></> : <button type="button" className="upload-prompt" onClick={() => fileInput.current?.click()}><span>{mode === "qr" ? <ScanSearch size={22} /> : <Upload size={22} />}</span><strong>{mode === "qr" ? "Thả hoặc chọn ảnh mã QR" : "Thả hoặc chọn ảnh chụp"}</strong><small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small></button>}<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label={mode === "qr" ? "Chọn ảnh mã QR cần phân tích" : "Chọn ảnh chụp cần phân tích"} className="sr-only" onChange={(event) => { setDemoCaseId(null); acceptFile(event.target.files?.[0]); }} /></div> : <label className="trust-text-field"><span>{mode === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo"}</span><textarea value={content} onChange={(event) => { setDemoCaseId(null); setContent(event.target.value); }} rows={7} placeholder={mode === "url" ? "https://..." : "Dán nội dung khả nghi tại đây..."} /></label>}
        <div className="truth-note"><AlertTriangle size={15} /><span><strong>Ranh giới OCR:</strong> ảnh được đọc cục bộ trong trình duyệt và chỉ là <code>CLIENT_OCR_HINT</code>, không phải OCR máy chủ có thẩm quyền.</span></div>{error && <div className="error-callout" role="alert"><ShieldAlert size={17} /><span>{error.message}{error.traceId && <small>Reference: {error.traceId}</small>}</span></div>}
         <button type="button" className="primary-action trust-submit" disabled={((mode !== "image" && mode !== "qr") && !content.trim()) || ((mode === "image" || mode === "qr") && !file)} onClick={analyze}>{processing ? <LoaderCircle className="animate-spin" size={17} /> : <ScanSearch size={17} />}{processing ? "Chạy lại với dữ liệu mới" : "Phân tích rủi ro"}<ArrowRight size={16} /></button>
      </div>
      <aside className="intelligence-panel pipeline-panel"><div className="panel-heading"><div><p className="product-kicker">Live pipeline</p><h2 className="product-section-title">Dấu vết xử lý</h2></div><span className={`live-indicator ${processing ? "is-live" : ""}`}>{processing ? "RUNNING" : hasResult ? "COMPLETE" : "READY"}</span></div><ol className="pipeline-list">{pipeline.map((step, index) => <li key={step.id} data-status={step.status}><span className="pipeline-index">{step.status === "done" ? <Check size={14} /> : index + 1}</span><div><strong>{step.label}</strong><small>{step.detail || (step.status === "waiting" ? "Chờ bước trước" : readable(step.status))}</small></div></li>)}</ol>{ocr && <><div className="ocr-readout"><div><FileImage size={15} /><span>OCR trong trình duyệt</span><strong>{ocr.authority}</strong></div><p>{String(ocr.text || ocr.qrContent || "").slice(0, 180)}{String(ocr.text || ocr.qrContent || "").length > 180 ? "..." : ""}</p></div><div className="entity-inspector" aria-label="Các thực thể trích xuất"><div className="panel-heading"><span className="data-label">Entity inspector</span><span className="metadata-chip">HINT · không thẩm quyền</span></div><p className="entity-disclosure">Chọn thực thể để gửi kèm như một gợi ý có xác nhận. Việc chọn không biến OCR cục bộ thành bằng chứng.</p>{Object.entries(ocr.entities || {}).filter(([, values]) => Array.isArray(values) && values.length).map(([type, values]) => <div className="entity-row" key={type}><strong>{type.replaceAll(/([A-Z])/g, " $1")}</strong><div className="entity-values">{values.map((value) => <label key={value}><input type="checkbox" checked={confirmedEntities.includes(value)} onChange={() => setConfirmedEntities((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].slice(0, 50))} /><span>{value}</span></label>)}</div></div>)}</div></>}</aside>
    </section>
    {providerResult && providerResult.state !== "SUCCESS" && <StateBoundary envelope={providerResult} onAction={handleTrustStateAction} />}
    {seqState.state !== SEQUENTIAL_STATE.IDLE && (
      <SequentialFourLayerHUD
        sequentialState={seqState}
        onToggleCollapse={(layer) => dispatchSeq({ type: "TOGGLE_COLLAPSE", payload: { layer } })}
        onRetry={() => {
          dispatchSeq({ type: "RETRY" });
          analyze();
        }}
      />
    )}
    <TrustPipelineTimeline pipeline={v5Pipeline} processing={processing} />
    {hasResult && <div className="result-stack">
      <section className="verdict-panel" aria-labelledby="verdict-title"><div className="verdict-main"><div className="flex items-center justify-between gap-3"><p className="product-kicker">02 · Verdict</p><button type="button" className="text-link print-trigger" onClick={() => window.print()}><Printer size={14} /> In báo cáo</button></div><div className="verdict-icon"><ShieldAlert size={24} /></div><h2 id="verdict-title">{verdict}</h2><p>{layers.layer4?.userExplanation?.recommendedActionNote || canonicalResult?.recommendedAction || "Đọc các lý do và bằng chứng trước khi thực hiện hành động tiếp theo."}</p></div></section>
      <section className="intelligence-panel safety-actions" aria-labelledby="safety-actions-title"><div className="panel-heading"><div><p className="product-kicker">Hành động an toàn · Quy tắc xác định</p><h2 id="safety-actions-title" className="product-section-title">Bạn nên làm gì?</h2></div><ShieldCheck size={18} /></div><ol className="reason-list">{safetyActions.map((action, index) => <li key={action}><span>{index + 1}</span><p>{action}</p></li>)}</ol><p className="product-copy mt-3">Khuyến nghị này được chọn theo loại tín hiệu, không phải nội dung sinh ngẫu nhiên.</p></section>
      <section className="result-grid"><div className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">03 · Level 1 · Top reasons</p><h2 className="product-section-title">Vì sao có phán quyết này?</h2></div><span className="signal-badge">{reasons.length} tín hiệu</span></div>{reasons.length ? <ol className="reason-list">{reasons.map((reason, index) => <li key={reason}><span>{String(index + 1).padStart(2, "0")}</span><p>{reason}</p></li>)}</ol> : <div className="empty-state">Pipeline chưa trả về diễn giải đủ để hiển thị. StudentHub không tự tạo lý do thay thế.</div>}</div><div className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">Level 1 · Unknowns</p><h2 className="product-section-title">Điều còn chưa biết</h2></div><span className="signal-badge">{unresolvedSignals.length}</span></div>{unresolvedSignals.length ? <ul className="report-unknown-list">{unresolvedSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul> : <div className="empty-state">Phản hồi không công bố unresolved signal nào; điều này không chứng minh an toàn.</div>}</div></section>
      <section className="intelligence-panel report-metrics" aria-labelledby="report-metrics-title"><div className="panel-heading"><div><p className="product-kicker">Level 1 · Independent measures</p><h2 id="report-metrics-title" className="product-section-title">Đọc các chỉ số riêng biệt</h2></div><span className="metadata-chip">Không có điểm an toàn tổng hợp</span></div><dl className="verdict-metrics"><div><dt>Rủi ro</dt><dd data-risk={risk}>{risk}</dd><dd className="metric-note">Mức tác hại tiềm năng</dd></div><div><dt>Độ chắc quyết định</dt><dd>{confidenceLevel(layers.layer4, canonicalResult?.metrics?.confidence)}</dd><dd className="metric-note">Không phải bằng chứng an toàn</dd></div><div><dt>Bằng chứng</dt><dd>{evidenceLevel(layers.layer3, canonicalResult?.metrics?.evidenceCoverage)}</dd><dd className="metric-note">Mức đủ của nguồn</dd></div><div><dt>Source agreement</dt><dd>{readable(layers.layer3?.sourceAgreement || layers.layer3?.status || canonicalResult?.metrics?.sourceAgreement, "CHƯA CÓ")}</dd><dd className="metric-note">Mức đồng thuận nguồn</dd></div></dl></section>
      <section className="report-level-grid" aria-label="Trust Report Level 2"><div className="intelligence-panel report-level-panel"><div className="panel-heading"><div><p className="product-kicker">04 · Level 2 · Human-readable evidence</p><h2 className="product-section-title">Ngữ cảnh để đọc kết quả</h2></div><span className="signal-badge">{reportLevel2Sections.length} nhóm</span></div>{reportLevel2Sections.length ? <div className="report-fact-grid">{reportLevel2Sections.map((section) => <article className="report-fact-card" key={section.id}><h3>{section.title}</h3><dl>{section.facts.map((fact) => <div key={`${fact.label}-${fact.value}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></article>)}</div> : <StateBoundary state="UNKNOWN" title="Chưa có bằng chứng diễn giải Level 2" description="Phản hồi hiện tại chưa công bố nhóm identity, technical, content, reputation, community hoặc expert đủ để hiển thị." />}</div></section>
      <section className="intelligence-panel report-technical-panel" aria-labelledby="report-technical-title"><div className="panel-heading"><div><p className="product-kicker">05 · Level 3 · Technical evidence</p><h2 id="report-technical-title" className="product-section-title">Chi tiết kỹ thuật có thể truy vết</h2></div><span className="signal-badge">{technicalFacts.length + evidenceRecords.length} bản ghi</span></div>{technicalFacts.length ? <dl className="technical-fact-list">{technicalFacts.map((fact) => <div key={`${fact.label}-${fact.value}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : <StateBoundary state="UNKNOWN" title="Chưa có quan sát kỹ thuật được công bố" description="Không có URL, domain, redirect, DNS, TLS, certificate, headers, infrastructure hoặc raw observation đủ dữ liệu trong phản hồi này." />}{evidenceRecords.length ? <div className="technical-evidence-list"><p className="data-label">Evidence sources</p>{evidenceRecords.map((record, index) => <article key={`${record.source}-${index}`}><div><strong>{record.source}</strong><span>{record.sourceType}</span></div><p>{record.summary}</p><small>{record.observedAt || "Chưa có timestamp"}{record.provenance ? ` · ${record.provenance}` : ""}</small></article>)}</div> : <div className="empty-state">Không có evidence item hoặc reference chi tiết được công bố ở Level 3.</div>}</section>
      <section className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">Case timeline</p><h2 className="product-section-title">Trình tự kiểm chứng</h2></div><Clock3 size={18} /></div><ol className="case-timeline">{timeline.map((event) => <li key={event.id || `${event.label}-${event.at}`}><time>{event.at}</time><span /><div><strong>{event.label}</strong><small>{event.status}</small></div></li>)}</ol></section>
      {providers.length > 0 && <section className="intelligence-panel" aria-labelledby="provider-status-title"><div className="panel-heading"><div><p className="product-kicker">Provider status</p><h2 id="provider-status-title" className="product-section-title">Tình trạng nguồn đối soát</h2></div><span className="signal-badge">{providers.some((item) => ["error", "unavailable", "unknown", "not_configured", "timeout", "invalid_response", "circuit_open", "rate_limited"].includes(item.status)) ? "PARTIAL" : "COMPLETE"}</span></div><div className="provider-grid">{providers.map((provider) => <article key={provider.provider} className="provider-row"><div><strong>{provider.provider}</strong><small>{provider.latencyMs != null ? `${provider.latencyMs} ms` : "Không có latency"}</small></div><span data-provider-status={provider.status}>{readable(provider.status)}</span><p>{provider.signals?.length ? provider.signals.join(" · ") : provider.status === "clean" ? "Không phát hiện tín hiệu trong lần kiểm tra này." : "Không đủ dữ liệu để kết luận sạch."}</p></article>)}</div></section>}
      <section className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">04 · Related intelligence</p><h2 className="product-section-title">Case liên quan</h2></div><span className="signal-badge">{relatedCases.length} case</span></div>{relatedCases.length ? <div className="related-case-list">{relatedCases.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{Math.round(item.similarity * 100)}% tương đồng</span></div><p>{item.sharedSignals.join(" · ") || "Không có tín hiệu dùng chung được công bố."}</p></article>)}</div> : <div className="empty-state">Không tìm thấy case liên quan.</div>}</section>
      <TrustSectionBoundary section="trustgraph" fallbackTitle="TrustGraph không tải được">
        <TrustGraph2D graph={graph} />
      </TrustSectionBoundary>
      <section className="intelligence-panel passport-live-panel" aria-labelledby="passport-live-title"><div className="panel-heading"><div><p className="product-kicker">05 · Evidence Passport</p><h2 id="passport-live-title" className="product-section-title">Lịch sử case có thể truy vết</h2></div><span className="metadata-chip">Không ghi đè lịch sử</span></div>{passportCaseId && passportCaseRevision !== null ? passportResult ? passportResult.state === "SUCCESS" && passportResult.data ? <ol className="passport-revision-list">{passportResult.data.revisions.map((revision, index) => <li key={revision.revisionId}><span>{index + 1}</span><div><strong>{readable(revision.status)}</strong><p>{readable(revision.eventType)} · {revision.evidenceRefs.length} evidence refs</p><small>{revision.occurredAt ? new Date(revision.occurredAt).toLocaleString("vi-VN") : "Chưa có thời điểm"}</small></div></li>)}</ol> : <StateBoundary envelope={passportResult} onAction={(action) => { if (action.id === "RETRY") setPassportRetryKey((value) => value + 1); if (action.id === "START_OVER") setPassportQuery(null); }} /> : <StateBoundary state="LOADING" title="Đang đọc Evidence Passport" /> : <StateBoundary state="UNKNOWN" title="Case chưa có định danh Passport" description="Kết quả này chưa chứa case ID và revision đủ để đọc lịch sử bền vững." />}</section>
      <section className="network-handoff"><div><Users size={20} /><p className="product-kicker">Community</p><h2>Bổ sung bằng chứng thực tế</h2><p>Đối chiếu trải nghiệm sinh viên và các cảnh báo cùng chủ đề.</p><Link href="/community" className="text-link">Mở Collective Intelligence <ArrowRight size={14} /></Link></div><div><UserRoundCheck size={20} /><p className="product-kicker">Expert</p><h2>Yêu cầu xác minh đúng chuyên môn</h2><p>Chọn chuyên gia theo phạm vi, lịch sử và mẫu đánh giá.</p><Link href="/expert" className="text-link">Mở Expert Network <ArrowRight size={14} /></Link></div></section>
    </div>}
  </div>;
}
