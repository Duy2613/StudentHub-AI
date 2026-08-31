"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight, Check, ClipboardPaste, Clock3, FileImage, Globe2, Image as ImageIcon, LoaderCircle, Printer, ScanSearch, ShieldAlert, ShieldCheck, Upload, Users, UserRoundCheck, X } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";
import { deriveSafetyActions } from "@/lib/trust/safetyActions";
import { COMPETITION_DEMO_CASES } from "@/lib/trust/competitionDemoCases";
import TrustSectionBoundary from "./TrustSectionBoundary";
import TrustPipelineTimeline from "./TrustPipelineTimeline";

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

function evidenceLevel(layer3) {
  if (!layer3) return "CHƯA CÓ";
  const score = Number(layer3.verificationCompleteness ?? layer3.evidenceCompleteness ?? 0);
  if (score >= .75) return "MẠNH";
  if (score >= .4) return "MỘT PHẦN";
  return "HẠN CHẾ";
}

function confidenceLevel(layer4) {
  const score = Number(layer4?.decisionConfidence ?? layer4?.confidence ?? layer4?.confidenceScore ?? layer4?.riskAssessment?.confidence);
  if (!Number.isFinite(score)) return "KHÔNG CÔNG BỐ";
  const normalized = score > 1 ? score / 100 : score;
  return normalized >= .8 ? "CAO" : normalized >= .55 ? "TRUNG BÌNH" : "THẤP";
}

function deriveReasons(layers) {
  const candidates = [layers.layer4?.userExplanation?.why, layers.layer4?.userExplanation?.riskSummary, layers.layer1?.details?.decisionRationale, layers.layer2?.summary];
  return [...new Set(candidates.filter(Boolean).map(String))].slice(0, 4);
}

function buildGraph(input, layers) {
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
  const [pipeline, setPipeline] = useState(EMPTY_PIPELINE);
  const [v5Pipeline, setV5Pipeline] = useState(null);
  const [layers, setLayers] = useState({ layer1: null, layer2A: null, layer2: null, layer2C: null, layer3: null, layer4: null });
  const [timeline, setTimeline] = useState([]);
  const [demoCaseId, setDemoCaseId] = useState(null);
  const fileInput = useRef(null);
  const activeScan = useRef(null);
  const scanSequence = useRef(0);

  const updateStep = (id, status, detail = "") => setPipeline((items) => items.map((item) => item.id === id ? { ...item, status, detail } : item));
  const record = (label, status) => setTimeline((items) => [...items, { id: `${Date.now()}-${items.length}`, label, status, at: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);

  const acceptFile = (nextFile) => {
    setError(null);
    if (!nextFile || !["image/png", "image/jpeg", "image/webp"].includes(nextFile.type)) return setError({ message: "Định dạng này chưa được hỗ trợ. Hãy chọn PNG, JPG hoặc WEBP.", code: "VALIDATION" });
    if (nextFile.size > 8 * 1024 * 1024) return setError({ message: "Ảnh vượt quá giới hạn 8 MB.", code: "PAYLOAD_TOO_LARGE" });
    if (preview) URL.revokeObjectURL(preview);
    setMode("image"); setFile(nextFile); setPreview(URL.createObjectURL(nextFile)); setOcr(null);
  };

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => activeScan.current?.abort("component-unmounted"), []);
  useEffect(() => {
    const onPaste = (event) => {
      const image = [...(event.clipboardData?.files || [])].find((item) => item.type.startsWith("image/"));
      if (image) acceptFile(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    scanSequence.current += 1;
    activeScan.current?.abort("reset");
    setFile(null); setPreview(null); setContent(""); setError(null); setOcr(null); setDemoCaseId(null);
    setPipeline(EMPTY_PIPELINE); setV5Pipeline(null); setLayers({ layer1: null, layer2A: null, layer2: null, layer2C: null, layer3: null, layer4: null }); setTimeline([]);
  };

  const analyze = async () => {
    activeScan.current?.abort("superseded-by-new-scan");
    const controller = new AbortController();
    activeScan.current = controller;
    const scanId = ++scanSequence.current;
    setError(null); setProcessing(true); setPipeline(EMPTY_PIPELINE); setV5Pipeline(null); setTimeline([]);
    setLayers({ layer1: null, layer2A: null, layer2: null, layer2C: null, layer3: null, layer4: null });
    let extracted = content.trim();
    try {
      const demoCase = demoEnabled ? COMPETITION_DEMO_CASES.find((item) => item.id === demoCaseId) : null;
      if (demoCase) {
        updateStep("input", "done", "CHẾ ĐỘ TRÌNH DIỄN"); record("Đầu vào demo đã được nạp", "DEMO DATA");
        updateStep("local", "done", readable(demoCase.layers.layer1.status)); record("Phân tích rủi ro cục bộ", readable(demoCase.layers.layer1.status));
        updateStep("external", demoCase.layers.layer3.status === "PARTIAL" ? "partial" : "done", readable(demoCase.layers.layer3.status)); record("Đối soát bằng chứng", readable(demoCase.layers.layer3.status));
        updateStep("reasoning", "done", readable(demoCase.layers.layer4.status)); record("Phán quyết demo được tổng hợp", readable(demoCase.layers.layer4.status));
        setLayers(demoCase.layers);
        return;
      }
      updateStep("input", "running", mode === "image" ? "OCR đang chạy trong trình duyệt" : "Đang chuẩn hóa");
      if (mode === "image") {
        if (!file) throw new ApiError("Hãy chọn hoặc dán một ảnh trước khi phân tích.", "VALIDATION", { status: 400 });
        const { OcrService } = await import("@/lib/ai-trust/vision/OcrService");
        const result = await OcrService.extract(file);
        if (controller.signal.aborted || scanId !== scanSequence.current) return;
        extracted = String(result.text || result.qrContent || "").trim();
        setOcr({ ...result, authority: "CLIENT_OCR_HINT" });
        if (!extracted) throw new ApiError("OCR cục bộ không đọc được nội dung. Hãy dùng ảnh rõ hơn hoặc chuyển sang nhập văn bản.", "VALIDATION", { status: 422 });
      }
      if (mode === "url") {
        let parsedUrl;
        try { parsedUrl = new URL(extracted); }
        catch { throw new ApiError("URL không hợp lệ. Hãy nhập đầy đủ https://...", "VALIDATION", { status: 422 }); }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new ApiError("Chỉ hỗ trợ URL HTTP hoặc HTTPS.", "VALIDATION", { status: 422 });
      }
      const { trustApi } = await import("@/lib/api/trust");
      if (controller.signal.aborted || scanId !== scanSequence.current) return;
      const input = { type: mode === "url" ? "url" : "text", content: extracted, metadata: mode === "image" ? { extractionAuthority: "CLIENT_OCR_HINT", fileType: file?.type } : {} };
      updateStep("input", "done", mode === "image" ? "CLIENT_OCR_HINT" : "Đã chuẩn hóa"); record("Đầu vào đã được xử lý", "DONE");
      updateStep("local", "running");
      updateStep("external", "running", "Đang kiểm tra nguồn và luận điểm");
      updateStep("reasoning", "running", "Chờ phán quyết xác định");
      const response = await trustApi.sequential(input, controller.signal, (event) => {
        if (scanId !== scanSequence.current || !event?.data) return;
        setV5Pipeline(event.data);
        setPipeline((items) => legacyPipelineFromV5(event.data, items));
        if (event.event === "STAGE_STARTED" || event.event === "STAGE_COMPLETED" || event.event === "STAGE_RETRY_SCHEDULED") {
          record(`V5 ${String(event.stageId || "stage").toUpperCase()}`, readable(event.event));
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
      setV5Pipeline(response.data);
      const resultLayers = response.data.layerResults || {};
      const layer1 = resultLayers.layer1 || null;
      const layer2A = resultLayers.layer2A || null;
      const layer2 = resultLayers.layer2B || null;
      const layer2C = resultLayers.layer2C || null;
      const layer3 = resultLayers.layer3 || null;
      const layer4 = resultLayers.layer4 || null;
      setLayers({ layer1, layer2A, layer2, layer2C, layer3, layer4 });
      setPipeline((items) => legacyPipelineFromV5(response.data, items));
      record("V5 pipeline hoàn tất", readable(response.data.pipelineStatus));
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ABORTED" && scanId !== scanSequence.current) return;
      const message = caught instanceof ApiError ? apiErrorMessage(caught) : "Pipeline gặp lỗi ngoài dự kiến.";
      setError({ message, code: caught instanceof ApiError ? caught.code : "SERVER_ERROR", traceId: caught instanceof ApiError ? caught.traceId : null });
      setPipeline((items) => items.map((item) => item.status === "running" ? { ...item, status: "error", detail: message } : item));
    } finally { if (scanId === scanSequence.current) setProcessing(false); }
  };

  const hasNativeV5 = Boolean(v5Pipeline && v5Pipeline.pipelineVersion !== "trust-v5-compatibility");
  const hasResult = Boolean(layers.layer4 || v5Pipeline?.finalDecision);
  const risk = readable(layers.layer4?.riskAssessment?.level || layers.layer4?.riskLevel || (hasNativeV5 ? v5Pipeline?.finalDecision?.security : null) || layers.layer1?.riskLevel, "CHƯA XÁC ĐỊNH");
  const verdict = hasNativeV5 ? v5VerdictTitle(v5Pipeline?.finalDecision) : layers.layer4?.userExplanation?.verdictTitle || readable(layers.layer4?.status, "Đang chờ phân tích");
  const reasons = deriveReasons(layers);
  const graph = useMemo(() => buildGraph({ type: mode, content: content || "Ảnh đầu vào" }, layers), [mode, content, layers]);
  const layer2AProvider = layers.layer2A && !layers.layer2A.notApplicable ? [{
    provider: layers.layer2A.provider || "Layer 2A",
    status: String(layers.layer2A.providerStatus || "unknown").toLowerCase(),
    latencyMs: layers.layer2A.latencyMs,
    signals: [layers.layer2A.finding, ...(Array.isArray(layers.layer2A.threatTypes) ? layers.layer2A.threatTypes : [])].filter(Boolean),
  }] : [];
  const providers = [...layer2AProvider, ...(Array.isArray(layers.layer3?.providerResults) ? layers.layer3.providerResults : [])];
  const relatedCases = Array.isArray(layers.layer3?.relatedCases) ? layers.layer3.relatedCases : Array.isArray(layers.layer4?.relatedCases) ? layers.layer4.relatedCases : [];
  const safetyActions = useMemo(() => deriveSafetyActions({ input: content, status: layers.layer4?.status, risk }), [content, layers.layer4?.status, risk]);

  return <div className="product-workspace">
    <header className="product-hero"><div><p className="product-kicker">AI × Community × Human expertise</p><h1>Kiểm tra trước khi bạn tin.</h1><p>Đưa ảnh chụp, đường dẫn hoặc nội dung khả nghi vào một luồng phân tích có thể truy vết. AI phát hiện, cộng đồng bổ sung bằng chứng, chuyên gia xác minh.</p></div><div className="hero-seal"><ShieldCheck size={20} /><span>TRUST ENGINE</span><strong>Evidence first</strong></div></header>
    <section className="trust-input-grid" aria-labelledby="trust-input-title">
      <div className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">01 · Input</p><h2 id="trust-input-title" className="product-section-title">Bạn muốn kiểm tra gì?</h2></div>{(file || content) && <button className="text-link" onClick={reset}>Làm mới</button>}</div>
        {demoEnabled && <div className="demo-mode-panel" role="group" aria-label="Ba case trình diễn"><div><span className="signal-badge">CHẾ ĐỘ TRÌNH DIỄN</span><p>Dữ liệu xác định, chỉ dùng khi người vận hành chủ động chọn case.</p></div><div className="flex flex-wrap gap-2">{COMPETITION_DEMO_CASES.map((item) => <button type="button" key={item.id} className={`filter-chip ${demoCaseId === item.id ? "is-active" : ""}`} aria-pressed={demoCaseId === item.id} onClick={() => { setDemoCaseId(item.id); setMode("text"); setContent(item.input); setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); }}>{item.label}</button>)}</div></div>}
        <div className="mode-switch" role="tablist" aria-label="Loại đầu vào"><button role="tab" aria-selected={mode === "image"} onClick={() => { setDemoCaseId(null); setMode("image"); }}><ImageIcon size={15} /> Ảnh chụp</button><button role="tab" aria-selected={mode === "text"} onClick={() => { setDemoCaseId(null); setMode("text"); }}><ClipboardPaste size={15} /> Văn bản</button><button role="tab" aria-selected={mode === "url"} onClick={() => { setDemoCaseId(null); setMode("url"); }}><Globe2 size={15} /> URL</button></div>
        {mode === "image" ? <div className={`upload-zone ${dragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); setDemoCaseId(null); acceptFile(event.dataTransfer.files[0]); }}>{preview ? <><Image src={preview} alt="Ảnh sẽ được phân tích" width={1200} height={800} unoptimized /><button type="button" className="remove-upload" onClick={() => { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); }} aria-label="Xóa ảnh"><X size={16} /></button></> : <button type="button" className="upload-prompt" onClick={() => fileInput.current?.click()}><span><Upload size={22} /></span><strong>Thả hoặc chọn ảnh chụp</strong><small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small></button>}<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Chọn ảnh chụp cần phân tích" className="sr-only" onChange={(event) => { setDemoCaseId(null); acceptFile(event.target.files?.[0]); }} /></div> : <label className="trust-text-field"><span>{mode === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo"}</span><textarea value={content} onChange={(event) => { setDemoCaseId(null); setContent(event.target.value); }} rows={7} placeholder={mode === "url" ? "https://..." : "Dán nội dung khả nghi tại đây..."} /></label>}
        <div className="truth-note"><AlertTriangle size={15} /><span><strong>Ranh giới OCR:</strong> ảnh được đọc cục bộ trong trình duyệt và chỉ là <code>CLIENT_OCR_HINT</code>, không phải OCR máy chủ có thẩm quyền.</span></div>{error && <div className="error-callout" role="alert"><ShieldAlert size={17} /><span>{error.message}{error.traceId && <small>Reference: {error.traceId}</small>}</span></div>}
        <button type="button" className="primary-action trust-submit" disabled={(mode !== "image" && !content.trim()) || (mode === "image" && !file)} onClick={analyze}>{processing ? <LoaderCircle className="animate-spin" size={17} /> : <ScanSearch size={17} />}{processing ? "Chạy lại với dữ liệu mới" : "Phân tích rủi ro"}<ArrowRight size={16} /></button>
      </div>
      <aside className="intelligence-panel pipeline-panel"><div className="panel-heading"><div><p className="product-kicker">Live pipeline</p><h2 className="product-section-title">Dấu vết xử lý</h2></div><span className={`live-indicator ${processing ? "is-live" : ""}`}>{processing ? "RUNNING" : hasResult ? "COMPLETE" : "READY"}</span></div><ol className="pipeline-list">{pipeline.map((step, index) => <li key={step.id} data-status={step.status}><span className="pipeline-index">{step.status === "done" ? <Check size={14} /> : index + 1}</span><div><strong>{step.label}</strong><small>{step.detail || (step.status === "waiting" ? "Chờ bước trước" : readable(step.status))}</small></div></li>)}</ol>{ocr && <div className="ocr-readout"><div><FileImage size={15} /><span>OCR trong trình duyệt</span><strong>{ocr.authority}</strong></div><p>{String(ocr.text || ocr.qrContent).slice(0, 180)}{String(ocr.text || ocr.qrContent).length > 180 ? "..." : ""}</p></div>}</aside>
    </section>
    <TrustPipelineTimeline pipeline={v5Pipeline} processing={processing} />
    {hasResult && <div className="result-stack">
      <section className="verdict-panel" aria-labelledby="verdict-title"><div className="verdict-main"><div className="flex items-center justify-between gap-3"><p className="product-kicker">02 · Verdict</p><button type="button" className="text-link print-trigger" onClick={() => window.print()}><Printer size={14} /> In báo cáo</button></div><div className="verdict-icon"><ShieldAlert size={24} /></div><h2 id="verdict-title">{verdict}</h2><p>{layers.layer4?.userExplanation?.recommendedActionNote || "Đọc các lý do và bằng chứng trước khi thực hiện hành động tiếp theo."}</p></div><dl className="verdict-metrics"><div><dt>Rủi ro</dt><dd data-risk={risk}>{risk}</dd><dd className="metric-note">Mức tác hại tiềm năng</dd></div><div><dt>Độ chắc quyết định</dt><dd>{confidenceLevel(layers.layer4)}</dd><dd className="metric-note">Không phải bằng chứng an toàn</dd></div><div><dt>Bằng chứng</dt><dd>{evidenceLevel(layers.layer3)}</dd><dd className="metric-note">Mức đủ của nguồn</dd></div><div><dt>Source agreement</dt><dd>{readable(layers.layer3?.sourceAgreement || layers.layer3?.status, "CHƯA CÓ")}</dd><dd className="metric-note">Mức đồng thuận nguồn</dd></div></dl></section>
      <section className="intelligence-panel safety-actions" aria-labelledby="safety-actions-title"><div className="panel-heading"><div><p className="product-kicker">Hành động an toàn · Quy tắc xác định</p><h2 id="safety-actions-title" className="product-section-title">Bạn nên làm gì?</h2></div><ShieldCheck size={18} /></div><ol className="reason-list">{safetyActions.map((action, index) => <li key={action}><span>{index + 1}</span><p>{action}</p></li>)}</ol><p className="product-copy mt-3">Khuyến nghị này được chọn theo loại tín hiệu, không phải nội dung sinh ngẫu nhiên.</p></section>
      <section className="result-grid"><div className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">03 · Evidence</p><h2 className="product-section-title">Vì sao có phán quyết này?</h2></div><span className="signal-badge">{reasons.length} tín hiệu</span></div>{reasons.length ? <ol className="reason-list">{reasons.map((reason, index) => <li key={reason}><span>{String(index + 1).padStart(2, "0")}</span><p>{reason}</p></li>)}</ol> : <div className="empty-state">Pipeline chưa trả về diễn giải đủ để hiển thị. StudentHub không tự tạo lý do thay thế.</div>}</div><div className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">Case timeline</p><h2 className="product-section-title">Trình tự kiểm chứng</h2></div><Clock3 size={18} /></div><ol className="case-timeline">{timeline.map((event) => <li key={event.id || `${event.label}-${event.at}`}><time>{event.at}</time><span /><div><strong>{event.label}</strong><small>{event.status}</small></div></li>)}</ol></div></section>
      {providers.length > 0 && <section className="intelligence-panel" aria-labelledby="provider-status-title"><div className="panel-heading"><div><p className="product-kicker">Provider status</p><h2 id="provider-status-title" className="product-section-title">Tình trạng nguồn đối soát</h2></div><span className="signal-badge">{providers.some((item) => ["error", "unavailable", "unknown", "not_configured", "timeout", "invalid_response", "circuit_open", "rate_limited"].includes(item.status)) ? "PARTIAL" : "COMPLETE"}</span></div><div className="provider-grid">{providers.map((provider) => <article key={provider.provider} className="provider-row"><div><strong>{provider.provider}</strong><small>{provider.latencyMs != null ? `${provider.latencyMs} ms` : "Không có latency"}</small></div><span data-provider-status={provider.status}>{readable(provider.status)}</span><p>{provider.signals?.length ? provider.signals.join(" · ") : provider.status === "clean" ? "Không phát hiện tín hiệu trong lần kiểm tra này." : "Không đủ dữ liệu để kết luận sạch."}</p></article>)}</div></section>}
      <section className="intelligence-panel"><div className="panel-heading"><div><p className="product-kicker">04 · Related intelligence</p><h2 className="product-section-title">Case liên quan</h2></div><span className="signal-badge">{relatedCases.length} case</span></div>{relatedCases.length ? <div className="related-case-list">{relatedCases.map((item) => <article key={item.id}><div><strong>{item.title || item.id}</strong><span>{Math.round(item.similarity * 100)}% tương đồng</span></div><p>{item.sharedSignals.join(" · ") || "Không có tín hiệu dùng chung được công bố."}</p></article>)}</div> : <div className="empty-state">Không tìm thấy case liên quan.</div>}</section>
      <TrustSectionBoundary section="trustgraph" fallbackTitle="TrustGraph không tải được">
        <TrustGraph2D graph={graph} />
      </TrustSectionBoundary>
      <section className="network-handoff"><div><Users size={20} /><p className="product-kicker">Community</p><h2>Bổ sung bằng chứng thực tế</h2><p>Đối chiếu trải nghiệm sinh viên và các cảnh báo cùng chủ đề.</p><Link href="/community" className="text-link">Mở Collective Intelligence <ArrowRight size={14} /></Link></div><div><UserRoundCheck size={20} /><p className="product-kicker">Expert</p><h2>Yêu cầu xác minh đúng chuyên môn</h2><p>Chọn chuyên gia theo phạm vi, lịch sử và mẫu đánh giá.</p><Link href="/expert" className="text-link">Mở Expert Network <ArrowRight size={14} /></Link></div></section>
    </div>}
  </div>;
}
