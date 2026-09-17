"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardPaste,
  ExternalLink,
  FileImage,
  Globe2,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  LockKeyhole,
  Network,
  PanelTopOpen,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import SourceInspectorDrawer from "./SourceInspectorDrawer";
import AskExpertGatewayCard from "./AskExpertGatewayCard";
import TrustVsExpertComparisonMatrix from "./TrustVsExpertComparisonMatrix";
import {
  MASTER_ULTRA_LAYERS,
  MASTER_ULTRA_STATES,
  layerDefinition,
  normalizeMasterUltraRun,
} from "@/lib/ai-trust/v5/MasterUltraTrustModel.js";

const INPUT_MODES = [
  { id: "image", label: "Ảnh", icon: ImageIcon },
  { id: "qr", label: "QR", icon: ScanSearch },
  { id: "text", label: "Văn bản", icon: ClipboardPaste },
  { id: "url", label: "URL", icon: Globe2 },
];

const STATE_LABELS = {
  IDLE: "Sẵn sàng",
  INPUT_READY: "Đầu vào đã sẵn sàng",
  SUBMITTING: "Đang gửi đầu vào",
  L1_ENTER: "Claim Intelligence · bắt đầu",
  L1_RUNNING: "Claim Intelligence · đang đọc",
  L1_COMPLETE: "Claim Intelligence · hoàn tất",
  L2_ENTER: "Evidence Discovery · bắt đầu",
  L2_RUNNING: "Evidence Discovery · đang tìm",
  L2_COMPLETE: "Evidence Discovery · hoàn tất",
  L3_ENTER: "Evidence Forensics · bắt đầu",
  L3_RUNNING: "Evidence Forensics · đang đối chiếu",
  L3_COMPLETE: "Evidence Forensics · hoàn tất",
  L4_ENTER: "AI Verification · bắt đầu",
  L4_RUNNING: "AI Verification · Gemini đang đối chiếu",
  L4_COMPLETE: "AI Verification · hoàn tất",
  L5_ENTER: "Decision Intelligence · bắt đầu",
  L5_RUNNING: "Decision Intelligence · đang kết luận",
  L5_COMPLETE: "Decision Intelligence · hoàn tất",
  CONVERGENCE: "Đang hội tụ kết quả",
  COMPLETE_OVERVIEW: "Phân tích hoàn tất",
  INSPECT_LAYER: "Đang xem lớp đã lưu",
  ERROR_RECOVERABLE: "Có thể thử lại",
  ERROR_FATAL: "Trust Engine không thể tiếp tục",
};

function safeText(value, fallback = "Chưa công bố") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function statusLabel(status) {
  switch (String(status || "WAITING").toUpperCase()) {
    case "COMPLETE": return "Hoàn tất";
    case "RUNNING": return "Đang chạy";
    case "PARTIAL": return "Một phần";
    case "FAILED": return "Không thành công";
    default: return "Đang chờ";
  }
}

function inputTypeLabel(type) {
  const value = String(type || "").toUpperCase();
  if (value.includes("URL")) return "URL";
  if (value.includes("IMAGE")) return "Ảnh chụp";
  if (value.includes("QR")) return "QR";
  if (value.includes("TEXT")) return "Văn bản";
  return "Chưa công bố";
}

function objectLabel(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "Chưa công bố";
  return safeText(value.label || value.name || value.text || value.value || value.entity || value.type);
}

function stageStatusFor(layer, activeIndex, processing) {
  if (layer.status === "COMPLETE") return "complete";
  if (layer.status === "FAILED" || layer.status === "PARTIAL") return "attention";
  if (processing && layer.index === activeIndex) return "active";
  return "pending";
}

function EmptyData({ children = "Chưa có dữ liệu công bố." }) {
  return <p className="master-ultra-empty"><Info size={15} /> <span>{children}</span></p>;
}

function SectionLabel({ children, tone = "cyan" }) {
  return <span className={`master-ultra-section-label master-ultra-section-label-${tone}`}>{children}</span>;
}

function EvidenceSourceCard({ source, onSelect }) {
  const relation = String(source.relationship || "context").toLowerCase();
  const relationLabel = relation.includes("contrad") ? "Mâu thuẫn" : relation.includes("support") ? "Hỗ trợ" : "Bối cảnh";
  return (
    <article className={`master-ultra-source-card master-ultra-source-${relation.includes("contrad") ? "contradicting" : relation.includes("support") ? "supporting" : "context"}`}>
      <button type="button" onClick={() => onSelect?.(source)} className="master-ultra-source-main">
        <span className="master-ultra-source-topline">
          <span><LockKeyhole size={12} /> {safeText(source.domain, "domain chưa công bố")}</span>
          <ChevronRight size={14} />
        </span>
        <strong>{safeText(source.title)}</strong>
        <span className="master-ultra-source-meta">{safeText(source.sourceType, "Chưa phân loại")} · {relationLabel}</span>
        <p>{safeText(source.snippet, "Evidence record không có đoạn trích được công bố.")}</p>
      </button>
      <div className="master-ultra-source-footer">
        <span>{safeText(source.publishedAt, "Ngày chưa công bố")}</span>
        {source.url ? (
          <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
            Mở URL <ExternalLink size={12} />
          </a>
        ) : <span className="master-ultra-muted">Không có URL</span>}
      </div>
    </article>
  );
}

function ProgressRail({ normalized, activeIndex, processing, canInspect, onInspect }) {
  return (
    <nav className="master-ultra-rail" aria-label="Năm lớp Trust chính" data-primary-layer-count="5">
      {normalized.macroStages.map((layer, index) => {
        const visualStatus = stageStatusFor({ ...layer, index }, activeIndex, processing);
        const content = (
          <>
            <span className="master-ultra-rail-symbol" aria-hidden="true">
              {visualStatus === "complete" ? <Check size={14} /> : visualStatus === "active" ? <span className="master-ultra-rail-dot" /> : <span>{layer.code}</span>}
            </span>
            <span className="master-ultra-rail-copy">
              <span className="master-ultra-rail-code">{layer.shortName}</span>
              <strong>{layer.name}</strong>
              <small>{statusLabel(layer.status)}</small>
            </span>
          </>
        );
        return canInspect ? (
          <button key={layer.id} type="button" className={`master-ultra-rail-item is-${visualStatus}`} data-status={layer.status} onClick={() => onInspect?.(layer.id)}>
            {content}
          </button>
        ) : (
          <div key={layer.id} className={`master-ultra-rail-item is-${visualStatus}`} data-status={layer.status}>
            {content}
          </div>
        );
      })}
    </nav>
  );
}

function InputComposer({
  mode,
  content,
  file,
  preview,
  dragging,
  error,
  ocr,
  confirmedEntities = [],
  processing,
  hasResult,
  demoEnabled,
  sourceProvenance,
  fileInputRef,
  onModeChange,
  onContentChange,
  onFileSelect,
  onDragStateChange,
  onClearFile,
  onAnalyze,
  onReset,
}) {
  const canSubmit = mode === "image" || mode === "qr" ? Boolean(file) : Boolean(content?.trim());
  return (
    <section className="master-ultra-composer" aria-labelledby="master-ultra-input-title">
      <div className="master-ultra-composer-copy">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          TRUST ENGINE
        </div>
        <h1 id="master-ultra-input-title" className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
          Kiểm tra thông tin
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
          Đưa ảnh chụp, mã QR, văn bản hoặc URL vào luồng đối chiếu 5 tầng độc lập.
        </p>
      </div>
      <div className="master-ultra-composer-panel">
        <div className="master-ultra-mode-switch" role="tablist" aria-label="Loại đầu vào Trust">
          {INPUT_MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => onModeChange?.(id)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        {mode === "image" || mode === "qr" ? (
          <div
            className={`master-ultra-upload ${dragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); onDragStateChange?.(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { event.preventDefault(); onDragStateChange?.(false); }}
            onDrop={(event) => { event.preventDefault(); onDragStateChange?.(false); onFileSelect?.(event.dataTransfer.files?.[0]); }}
          >
            {preview ? (
              <>
                <div className="master-ultra-upload-preview">
                  <Image src={preview} alt={mode === "qr" ? "Ảnh mã QR sẽ được phân tích" : "Ảnh sẽ được phân tích"} width={1200} height={800} unoptimized />
                  {ocr?.regions?.map((region) => <span key={region.id} className="master-ultra-ocr-region" style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }} aria-label={`${region.label} overlay`} />)}
                </div>
                <button type="button" className="master-ultra-upload-remove" onClick={onClearFile} aria-label="Xóa ảnh đã chọn"><X size={15} /></button>
              </>
            ) : (
              <button type="button" className="master-ultra-upload-prompt" onClick={() => fileInputRef?.current?.click()}>
                <span className="master-ultra-upload-icon">{mode === "qr" ? <ScanSearch size={25} /> : <Upload size={25} />}</span>
                <strong>{mode === "qr" ? "Thả hoặc chọn ảnh mã QR" : "Thả hoặc chọn ảnh chụp"}</strong>
                <small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label={mode === "qr" ? "Chọn ảnh mã QR cần phân tích" : "Chọn ảnh chụp cần phân tích"} className="sr-only" onChange={(event) => onFileSelect?.(event.target.files?.[0])} />
          </div>
        ) : (
          <label className="master-ultra-text-field">
            <span>{mode === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo"}</span>
            <textarea value={content} onChange={(event) => onContentChange?.(event.target.value)} rows={6} placeholder={mode === "url" ? "https://..." : "Dán nội dung cần đối soát tại đây..."} />
          </label>
        )}
        <div className="master-ultra-composer-footer">
          <span className="master-ultra-quiet-note"><Info size={14} /> OCR ảnh là gợi ý cục bộ, không phải bằng chứng máy chủ.</span>
          <button type="button" className="master-ultra-submit" disabled={!canSubmit || processing} onClick={onAnalyze}>
            {processing ? <LoaderCircle className="animate-spin" size={16} /> : <ScanSearch size={16} />}
            {hasResult ? "Chạy phiên mới" : "Phân tích rủi ro"} <ArrowRight size={15} />
          </button>
        </div>
        {error && <div className="master-ultra-error" role="alert"><ShieldAlert size={16} /><span>{error.message || "Trust Engine chưa thể hoàn tất."}{error.traceId ? <small>Reference: {error.traceId}</small> : null}</span></div>}
        {ocr && <div className="master-ultra-ocr-note"><FileImage size={14} /><span>CLIENT_OCR_HINT</span><p>{safeText(ocr.text || ocr.qrContent, "Không có văn bản OCR được đọc.")}</p>{confirmedEntities.length ? <small>{confirmedEntities.length} entity đã được người dùng xác nhận kèm theo</small> : null}</div>}
        <SourceDisclosure provenance={sourceProvenance} sourceMode={sourceProvenance?.sourceMode || (demoEnabled ? "DEMO" : "LIVE")} />
        {(file || content) && <button type="button" className="master-ultra-reset" onClick={onReset}>Làm mới đầu vào</button>}
      </div>
    </section>
  );
}

function ClaimLayer({ layer }) {
  return (
    <div className="master-ultra-layer-content">
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
        <div className="w-28 h-20 sm:w-36 sm:h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <img
            src="/media/v3/trust/l1-claim.webp"
            alt="Minh họa cấu trúc bóc tách mệnh đề Layer 1"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="master-ultra-claim-object flex-1">
          <SectionLabel tone="ice">Claim object</SectionLabel>
          <blockquote>{layer.claims[0]?.text ? `“${layer.claims[0].text}”` : safeText(layer.inputExcerpt, "Nội dung đầu vào chưa có claim đã tách.")}</blockquote>
          <span className="master-ultra-object-caption">{layer.claims.length ? `${layer.claims.length} claim đã được trích xuất từ phiên này` : "Claim chưa được công bố từ runtime"}</span>
        </div>
      </div>
      <div className="master-ultra-data-grid">
        <article><SectionLabel>Entities</SectionLabel>{layer.entities.length ? <div className="master-ultra-chip-list">{layer.entities.map((entity, index) => <span key={`${objectLabel(entity)}-${index}`}>{objectLabel(entity)}</span>)}</div> : <EmptyData>Không có entity đã tách được công bố.</EmptyData>}</article>
        <article><SectionLabel>Input type</SectionLabel><strong className="master-ultra-data-value">{inputTypeLabel(layer.inputType)}</strong><small>Chỉ phản ánh loại dữ liệu đã gửi.</small></article>
        <article><SectionLabel>Technical signals</SectionLabel>{layer.technicalSignals.length ? <ul className="master-ultra-signal-list">{layer.technicalSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul> : <EmptyData>Chưa có runtime check được công bố.</EmptyData>}</article>
      </div>
    </div>
  );
}

function DiscoveryLayer({ layer, onSelectSource }) {
  return (
    <div className="master-ultra-layer-content">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-center">
        <div className="md:col-span-4 rounded overflow-hidden border border-white/10 aspect-video bg-black/40">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/media/v3/trust/l2-discovery-poster.webp"
            src="/media/v3/trust/l2-discovery.mp4"
            className="w-full h-full object-cover"
          />
          <img
            src="/media/v3/trust/l2-discovery-poster.webp"
            alt="Evidence discovery visual loop"
            className="video-fallback-poster hidden w-full h-full object-cover"
          />
        </div>
        <div className="md:col-span-8 master-ultra-network-intro m-0">
          <div className="master-ultra-claim-node"><span>CLAIM</span><strong>{layer.sources.length ? "Evidence pool" : "Awaiting sources"}</strong></div>
          <Network size={22} />
          <div className="master-ultra-network-copy"><SectionLabel tone="cyan">Source field</SectionLabel><p>{layer.sources.length ? "Nguồn thật xuất hiện quanh claim; official không đồng nghĩa với đúng." : "Runtime chưa công bố source record để dựng mạng bằng chứng."}</p></div>
        </div>
      </div>
      {layer.sources.length ? <div className="master-ultra-source-grid">{layer.sources.map((source) => <EvidenceSourceCard key={source.id} source={source} onSelect={onSelectSource} />)}</div> : <EmptyData>Không có source card để hiển thị. StudentHub không dựng URL thay thế.</EmptyData>}
      <div className="master-ultra-discovery-footer">
        <div className="flex items-center gap-3">
          <img src="/media/v3/trust/official-source.webp" alt="Official source mark" className="w-8 h-8 rounded object-cover border border-white/10" />
          <div><SectionLabel>Authority signal</SectionLabel><strong>{layer.officialCount == null ? "Chưa công bố" : `${layer.officialCount} official / primary source`}</strong><small>Official là tín hiệu về provenance, không phải verdict.</small></div>
        </div>
        <div className="flex items-center gap-3">
          <img src="/media/v3/trust/source-independence.webp" alt="Source independence mark" className="w-8 h-8 rounded object-cover border border-white/10" />
          <div><SectionLabel>Independence signature</SectionLabel>{layer.groups.length ? <strong>{layer.groups.length} cluster{layer.groups.length === 1 ? "" : "s"} đã được công bố</strong> : <strong>Chưa công bố</strong>}<small>Copy lại không được tính như nguồn độc lập mới.</small></div>
        </div>
      </div>
    </div>
  );
}

function ForensicsBucket({ title, items, tone }) {
  return <article className={`master-ultra-forensics-bucket master-ultra-forensics-${tone}`}><div className="master-ultra-forensics-heading"><SectionLabel tone={tone}>{title}</SectionLabel><span>{items.length || "—"}</span></div>{items.length ? <ul>{items.slice(0, 8).map((item) => <li key={item.id}><strong>{safeText(item.title)}</strong><small>{safeText(item.snippet, "Evidence record không có tóm tắt.")}</small></li>)}</ul> : <EmptyData>Chưa có item</EmptyData>}</article>;
}

function ForensicsLayer({ layer, onSelectSource }) {
  return (
    <div className="master-ultra-layer-content">
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
        <div className="w-full sm:w-44 h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <img
            src="/media/v3/trust/l3-forensics.webp"
            alt="Forensics comparison visual"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="master-ultra-forensics-map flex-1 m-0" aria-hidden="true"><span>SUPPORTING</span><i /><b>CLAIM</b><i /><span>CONTRADICTING</span></div>
      </div>
      <div className="master-ultra-forensics-grid">
        <ForensicsBucket title="Supporting evidence" items={layer.supporting} tone="support" />
        <ForensicsBucket title="Contradicting evidence" items={layer.contradicting} tone="contradict" />
        <ForensicsBucket title="Context" items={layer.context} tone="context" />
      </div>
      <div className="master-ultra-forensics-notes">
        <article><SectionLabel tone="tension">Source conflicts</SectionLabel>{layer.conflicts.length ? <ul>{layer.conflicts.slice(0, 6).map((item, index) => <li key={`${objectLabel(item)}-${index}`}>{objectLabel(item)}</li>)}</ul> : <EmptyData>Chưa có conflict record được công bố.</EmptyData>}</article>
        <article><SectionLabel tone="ice">Uncertainty</SectionLabel>{layer.uncertainty.length ? <ul>{layer.uncertainty.map((item) => <li key={item}>{item}</li>)}</ul> : <EmptyData>Chưa có uncertainty signal được công bố.</EmptyData>}</article>
      </div>
      {(layer.supporting.length || layer.contradicting.length || layer.context.length) ? <button type="button" className="master-ultra-inline-action" onClick={() => onSelectSource?.(layer.supporting[0] || layer.contradicting[0] || layer.context[0])}>Mở source đầu tiên <ArrowRight size={14} /></button> : null}
    </div>
  );
}

function AiVerificationLayer({ layer }) {
  const ai = layer.aiVerification || {};
  const status = String(layer.aiVerificationStatus || "NOT_REQUESTED").toUpperCase();
  const modelTrace = Array.isArray(layer.aiModelTrace) ? layer.aiModelTrace : [];
  const citationCount = Array.isArray(ai.citationsUsed) ? ai.citationsUsed.length : 0;
  const isRateLimited = status === "RATE_LIMITED" || ai.errorStatus === 429 || ai.status === 429 || /rate limit|429/i.test(ai.error || "");
  const isTimeout = status === "TIMEOUT" || ai.errorStatus === 504 || ai.status === 504 || /timeout|504/i.test(ai.error || "");
  const isUnavailable = ["UNAVAILABLE", "FAILED", "DEGRADED", "ERROR", "PARTIAL", "MODEL_NOT_AVAILABLE", "AUTH_FAILED", "PERMISSION_DENIED"].includes(status) || ai.errorStatus === 503 || ai.status === 503 || isRateLimited || isTimeout;
  const fallbackUsed = layer.aiFallbackUsed === true && !isUnavailable;
  const attemptedModels = modelTrace.map((attempt) => attempt?.model).filter(Boolean).filter((model, index, all) => all.indexOf(model) === index);
  const displayModel = (model) => {
    const value = safeText(model, "Chưa công bố");
    return value.replace(/^gemini-/i, "Gemini ").replace(/-flash$/i, " Flash").replace(/-it$/i, "");
  };
  const fallbackReason = ({
    PRIMARY_RATE_LIMITED: "Primary model reached rate limit",
    PRIMARY_RESOURCE_EXHAUSTED: "Primary model quota was exhausted",
    PRIMARY_SERVICE_UNAVAILABLE: "Primary model was temporarily unavailable",
    PRIMARY_MODEL_NOT_FOUND: "Primary model was unavailable to this project",
    PRIMARY_TIMEOUT: "Primary model timed out",
    PRIMARY_NETWORK_TIMEOUT: "Primary model network timed out",
    PRIMARY_COOLDOWN: "Primary model was in temporary cooldown",
  }[layer.aiFallbackReason] || "Primary model was unavailable");

  const degradedReason = isRateLimited
    ? "Rate limit"
    : isTimeout
    ? "Timeout"
    : "Rate limit / timeout / unavailable";

  return (
    <div className="master-ultra-layer-content">
      <div className="master-ultra-operation-grid">{layer.operations.map((operation) => <article key={operation.id} className={operation.available ? "is-observed" : "is-unknown"}><span className="master-ultra-operation-icon">{operation.available ? <Check size={15} /> : <span>—</span>}</span><strong>{operation.label}</strong><small>{operation.available ? "Observed in this run" : "Chưa công bố từ runtime"}</small></article>)}</div>

      {isUnavailable ? (
        <div className="trust-ai-degraded-card my-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-slate-300" role="status">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle size={15} /> AI Verification: Không khả dụng
          </div>
          <div className="mt-3 text-xs space-y-1.5 font-mono">
             <p><span className="text-slate-400">Provider: </span><strong className="text-slate-100">Google Gemini</strong></p>
             <p><span className="text-slate-400">Reason: </span><strong className="text-amber-300">{degradedReason}</strong></p>
             <p><span className="text-slate-400">Models attempted: </span><strong className="text-slate-100">{attemptedModels.length ? attemptedModels.map(displayModel).join(" / ") : "Chưa có attempt được công bố"}</strong></p>
             <p className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
               Decision Intelligence continued using deterministic Trust policy without AI advisory; the policy remains authoritative.
             </p>
          </div>
        </div>
      ) : (
        <div className="master-ultra-ai-verification-banner" data-ai-verification-status={status}>
          <div className="relative rounded overflow-hidden aspect-video max-w-xs mb-3 border border-white/10 bg-black/40">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/media/v3/trust/l4-multiai-poster.webp"
              src="/media/v3/trust/l4-multiai.mp4"
              className="w-full h-full object-cover opacity-80"
            />
            <img
              src="/media/v3/trust/l4-multiai-poster.webp"
              alt="Multi-AI verification preview"
              className="video-fallback-poster hidden w-full h-full object-cover"
            />
          </div>
          <div><SectionLabel tone="violet">AI VERIFICATION — GEMINI (CỐ VẤN NGỮ NGHĨA)</SectionLabel><strong>{status === "VERIFIED" ? "AI Verification — Hoàn tất" : "AI verification active / advisory"}</strong><small>Đầu ra AI mang tính chất khuyến nghị tra cứu, không thay thế cơ chế xác minh nguồn cấp 1. Quyết định tất định thuộc Layer 05.</small></div>
          <dl><div><dt>Provider</dt><dd>{safeText(ai.provider, "Google Gemini")}</dd></div><div><dt>Model</dt><dd>{displayModel(ai.model)}</dd></div><div><dt>Thinking</dt><dd>{safeText(layer.aiVerificationThinkingLevel, "low")}</dd></div><div><dt>Transport</dt><dd>{safeText(layer.aiVerificationTransport, "Chưa công bố")}</dd></div><div><dt>Citations</dt><dd>{citationCount}</dd></div></dl>
          {fallbackUsed ? <div className="mt-3 p-3 rounded border border-violet-400/30 bg-violet-400/5 text-xs font-mono space-y-1.5"><strong className="text-violet-200">Fallback completed successfully</strong><p><span className="text-slate-400">Provider: </span><strong className="text-slate-100">Google Gemini</strong></p><p><span className="text-slate-400">Model used: </span><strong className="text-slate-100">{displayModel(layer.aiExecutedModel || ai.model)}</strong></p><p><span className="text-slate-400">Primary model: </span><strong className="text-slate-100">{displayModel(layer.aiRequestedPrimaryModel)}</strong></p><p><span className="text-slate-400">Fallback reason: </span><strong className="text-violet-200">{fallbackReason}</strong></p></div> : null}
          <p className="master-ultra-ai-uncertainty"><strong>Uncertainty:</strong> {safeText(ai.uncertainty, "Chưa công bố")}</p>
        </div>
      )}

      <div className="master-ultra-analysis-lanes">
        <SectionLabel tone="violet">Analysis streams</SectionLabel>
        {layer.streams.length ? layer.streams.map((stream) => <article key={stream.id}><div className="master-ultra-lane-line" /><div><strong>{safeText(stream.label)}</strong><span>{safeText(stream.provider, "Provider chưa công bố")}{stream.model ? ` · ${stream.model}` : ""}</span><small>{safeText(stream.summary, `Execution status: ${safeText(stream.status)}`)}</small></div></article>) : <EmptyData>Runtime không công bố analysis stream riêng.</EmptyData>}
      </div>
      <div className="master-ultra-provider-strip"><div><SectionLabel>Gemini status</SectionLabel><strong>{status}</strong></div><div><SectionLabel>Evidence references</SectionLabel><strong>{citationCount ? `${citationCount} citation${citationCount === 1 ? "" : "s"}` : "Chưa công bố"}</strong></div></div>
      {layer.sequentialSignals.length ? <div className="master-ultra-sequential-signal"><SectionLabel tone="gold">Sequential verification signal</SectionLabel>{layer.sequentialSignals.map((signal, index) => <article key={`${signal.provider}-${index}`}><strong>{safeText(signal.provider, "Provider chưa công bố")}</strong><span>{safeText(signal.status)}</span><p>{safeText(signal.verdict, "Verdict chưa công bố")} · {safeText(signal.reasoning, "Reasoning chưa công bố")}</p></article>)}</div> : null}
    </div>
  );
}

function DecisionLayer({ layer }) {
  const review = layer.humanReview;
  const twin = layer.decisionTwin;
  const drivers = twin && Array.isArray(twin.decisionDrivers) ? twin.decisionDrivers : [];
  const reversal = twin && Array.isArray(twin.reversalConditions) ? twin.reversalConditions : [];
  return (
    <div className="master-ultra-layer-content">
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
        <div className="w-24 h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <img
            src="/media/v3/trust/l5-decision.webp"
            alt="Decision intelligence seal"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="master-ultra-decision-hero flex-1 m-0">
          <SectionLabel tone="gold">Final assessment / Main Trust V5 authority</SectionLabel>
          <strong>{safeText(layer.verdict, "Chưa có kết luận")}</strong>
          <p>{safeText(layer.nextAction, "Hành động tiếp theo chưa được công bố.")}</p>
        </div>
      </div>
      <dl className="master-ultra-decision-metrics">
        <div><dt>Confidence</dt><dd>{safeText(layer.confidence)}</dd></div>
        <div><dt>Evidence sufficiency</dt><dd>{safeText(layer.evidenceSufficiency)}</dd></div>
        <div><dt>Source agreement</dt><dd>{safeText(layer.sourceAgreement)}</dd></div>
        <div><dt>Human review</dt><dd>{review ? safeText(review.status || review.state || review.reason) : "Chưa công bố"}</dd></div>
      </dl>
      <div className="master-ultra-decision-columns">
        <article><SectionLabel tone="gold">Key reasons</SectionLabel>{layer.reasons.length ? <ul>{layer.reasons.slice(0, 6).map((reason) => <li key={reason}>{reason}</li>)}</ul> : <EmptyData>Chưa có reason được công bố.</EmptyData>}</article>
        <article><SectionLabel tone="tension">Contradictions / uncertainty</SectionLabel>{[...layer.contradictions, ...layer.uncertainty].length ? <ul>{[...layer.contradictions, ...layer.uncertainty].slice(0, 8).map((item) => <li key={item}>{item}</li>)}</ul> : <EmptyData>Chưa có contradiction hoặc uncertainty được công bố.</EmptyData>}</article>
      </div>
      {twin ? <div className="master-ultra-decision-twin"><div><SectionLabel tone="violet">Decision Twin</SectionLabel><p>So sánh kết luận máy với các điều kiện có thể đảo chiều.</p></div><div><strong>Decision drivers</strong>{drivers.length ? <ul>{drivers.slice(0, 5).map((item, index) => <li key={`${objectLabel(item)}-${index}`}>{objectLabel(item)}</li>)}</ul> : <small>Chưa công bố</small>}</div><div><strong>Reversal conditions</strong>{reversal.length ? <ul>{reversal.slice(0, 5).map((item, index) => <li key={`${objectLabel(item)}-${index}`}>{objectLabel(item)}</li>)}</ul> : <small>Chưa công bố</small>}</div></div> : null}
    </div>
  );
}

function LayerDetail({ layer, onSelectSource }) {
  if (layer.id === "l1") return <ClaimLayer layer={layer.data} />;
  if (layer.id === "l2") return <DiscoveryLayer layer={layer.data} onSelectSource={onSelectSource} />;
  if (layer.id === "l3") return <ForensicsLayer layer={layer.data} onSelectSource={onSelectSource} />;
  if (layer.id === "l4") return <AiVerificationLayer layer={layer.data} />;
  return <DecisionLayer layer={layer.data} />;
}

function JourneyStage({ layer, normalized, journeyState, transitioning, transitionTo, onSelectSource }) {
  const definition = layerDefinition(layer.id);
  const transitionTarget = transitionTo == null ? null : normalized.macroStages[transitionTo];
  return (
    <section className={`master-ultra-journey-stage master-ultra-tone-${definition.tone} ${transitioning ? "is-transitioning" : ""}`} data-layer-id={layer.id} data-journey-state={journeyState} aria-live="polite">
      <div className="master-ultra-stage-aura" aria-hidden="true" />
      <div className="master-ultra-stage-header">
        <div><SectionLabel tone={definition.tone}>{definition.code} / Active layer</SectionLabel><h2>{definition.name}</h2><p>{definition.questionVi}</p></div>
        <div className="master-ultra-stage-state"><Activity size={14} className={journeyState.includes("RUNNING") ? "is-spinning" : ""} /><span>{STATE_LABELS[journeyState] || journeyState}</span></div>
      </div>
      <div className="master-ultra-stage-transition-label" aria-hidden={!transitionTarget}>{transitionTarget ? <><span>travelling deeper</span><ArrowRight size={14} /><strong>{transitionTarget.name}</strong></> : null}</div>
      <div className="master-ultra-stage-summary"><p>{safeText(layer.summary, "Chưa có summary được công bố.")}</p><span>{safeText(layer.metricLabel, "Signal chưa công bố")}</span></div>
      <LayerDetail layer={layer} onSelectSource={onSelectSource} />
    </section>
  );
}

function Overview({ normalized, onInspect, onReplay, onNewAnalysis, onPrint, onSelectSource }) {
  const decision = normalized.layers.l5;
  return (
    <section className="master-ultra-overview" aria-labelledby="master-ultra-overview-title">
      <div className="master-ultra-overview-heading"><div><SectionLabel tone="gold">Trust case / analysis complete</SectionLabel><h2 id="master-ultra-overview-title">Thông tin đã đi hết năm lớp.</h2><p>Đây là kết quả đã lưu của phiên hiện tại. Mở bất kỳ lớp nào để xem bằng chứng, không chạy lại phân tích.</p></div><div className="master-ultra-overview-actions"><button type="button" onClick={onReplay}><RefreshCw size={14} /> Replay journey</button><button type="button" onClick={onNewAnalysis}>Phiên mới</button><button type="button" onClick={onPrint}>In</button></div></div>
      <div className="master-ultra-verdict-banner"><div><SectionLabel tone="gold">Final decision / Main Trust V5 authority</SectionLabel><strong>{safeText(decision.verdict, "Chưa có kết luận")}</strong><p>{safeText(decision.nextAction, "Hành động tiếp theo chưa được công bố.")}</p></div><div className="master-ultra-verdict-side"><span>Source mode</span><strong>{safeText(normalized.provenance?.sourceMode, "Chưa công bố")}</strong><small>Sequential chỉ là adapter signal khi có dữ liệu.</small></div></div>
      <div className="master-ultra-overview-grid">{normalized.macroStages.map((layer) => <button key={layer.id} type="button" className={`master-ultra-overview-card master-ultra-tone-${layer.tone}`} onClick={() => onInspect(layer.id)}><div className="master-ultra-overview-card-top"><span>{layer.code}</span>{layer.status === "COMPLETE" ? <Check size={14} /> : layer.status === "PARTIAL" || layer.status === "FAILED" ? <ShieldAlert size={14} /> : <span aria-hidden="true">○</span>}</div><strong>{layer.name}</strong><small>{statusLabel(layer.status)}</small><p>{safeText(layer.summary)}</p><span className="master-ultra-inspect-link">Inspect <ArrowRight size={13} /></span></button>)}</div>
      <div className="master-ultra-trace-grid"><section><div className="master-ultra-subheading"><div><SectionLabel>Traceability / source inspector</SectionLabel><h3>Source → evidence → decision</h3></div><PanelTopOpen size={18} /></div>{normalized.sources.length ? <div className="master-ultra-trace-list">{normalized.sources.slice(0, 8).map((source) => <button key={source.id} type="button" onClick={() => onSelectSource?.(source)}><span>{safeText(source.domain, "domain chưa công bố")}</span><strong>{safeText(source.title)}</strong><small>{safeText(source.relationship, "context")} {source.usedBy.length ? `· ${source.usedBy.join(" · ")}` : "· layer usage chưa công bố"}</small></button>)}</div> : <EmptyData>Không có source URL/record để mở.</EmptyData>}</section><section><div className="master-ultra-subheading"><div><SectionLabel tone="violet">Provider transparency</SectionLabel><h3>Những gì runtime thực sự công bố</h3></div><Activity size={18} /></div>{normalized.providers.length ? <ul className="master-ultra-provider-list">{normalized.providers.slice(0, 8).map((provider) => <li key={`${provider.provider}-${provider.model}`}><strong>{provider.provider}</strong><span>{safeText(provider.model, "Model chưa công bố")}</span><small>{safeText(provider.status)}</small></li>)}</ul> : <EmptyData>Chưa có provider provenance được công bố.</EmptyData>}</section></div>

      {/* Post-Result Gateway: Ask Expert */}
      <AskExpertGatewayCard
        claim={normalized.layers.l1?.claims?.[0]?.text || normalized.input?.excerpt || ""}
        trustVerdict={decision.verdict}
      />

      {/* Dialectic Comparison: Trust vs Expert */}
      <TrustVsExpertComparisonMatrix
        trustResult={decision}
        expertAssessment={decision.expertAssessment || normalized.canonical?.expertAssessment || null}
      />

      <p className="master-ultra-integrity-note"><ShieldCheck size={15} /> Main Trust V5 là authority cuối. Inspection không tạo API call mới và không làm mất dữ liệu layer đã lưu.</p>
    </section>
  );
}

function Inspection({ normalized, selectedLayerId, onBack, onNavigate, onSelectSource }) {
  const index = Math.max(0, normalized.macroStages.findIndex((layer) => layer.id === selectedLayerId));
  const layer = normalized.macroStages[index] || normalized.macroStages[0];
  return (
    <section className="master-ultra-inspection" aria-labelledby="master-ultra-inspection-title">
      <div className="master-ultra-inspection-heading"><button type="button" className="master-ultra-back-button" onClick={onBack}><ArrowLeft size={15} /> All layers</button><div><SectionLabel tone={layer.tone}>{layer.code} / saved inspection</SectionLabel><h2 id="master-ultra-inspection-title">{layer.name}</h2><p>{layer.questionVi}</p></div><div className="master-ultra-inspection-nav"><button type="button" disabled={index === 0} onClick={() => onNavigate(normalized.macroStages[index - 1]?.id)}><ArrowLeft size={14} /> Trước</button><button type="button" disabled={index === normalized.macroStages.length - 1} onClick={() => onNavigate(normalized.macroStages[index + 1]?.id)}>Sau <ArrowRight size={14} /></button></div></div>
      <div className="master-ultra-inspection-body"><div className="master-ultra-inspection-index">{layer.code}<span>NO RERUN</span></div><div className="master-ultra-inspection-panel"><div className="master-ultra-stage-summary"><p>{safeText(layer.summary)}</p><span>{statusLabel(layer.status)}</span></div><LayerDetail layer={layer} onSelectSource={onSelectSource} /></div></div>
      <p className="master-ultra-keyboard-note"><kbd>←</kbd><kbd>→</kbd> đổi layer <kbd>Home</kbd> overview <kbd>Esc</kbd> đóng inspection</p>
    </section>
  );
}

export default function TrustMasterUltraJourney({
  mode = "image",
  content = "",
  file = null,
  preview = null,
  dragging = false,
  processing = false,
  error = null,
  ocr = null,
  confirmedEntities = [],
  hasResult = false,
  demoEnabled = false,
  sourceProvenance = null,
  providers = [],
  analysisSummary = null,
  pipeline = null,
  canonicalResult = null,
  layers = {},
  presentation = null,
  input = null,
  hideHero = true,
  fileInputRef,
  onModeChange,
  onContentChange,
  onFileSelect,
  onDragStateChange,
  onClearFile,
  onAnalyze,
  onReset,
  onNewAnalysis,
  onPrint,
}) {
  const normalized = useMemo(() => normalizeMasterUltraRun({ pipeline, canonicalResult, layers, presentation, input: input || { type: mode, content }, sourceProvenance, providers, processing }), [pipeline, canonicalResult, layers, presentation, input, mode, content, sourceProvenance, providers, processing]);
  const [journeyState, setJourneyState] = useState(hasResult ? "COMPLETE_OVERVIEW" : "IDLE");
  const [view, setView] = useState(hasResult ? "overview" : "input");
  const [displayIndex, setDisplayIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionTo, setTransitionTo] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState("l1");
  const [inspectedSource, setInspectedSource] = useState(null);
  const [replaying, setReplaying] = useState(false);
  const activeIndexRef = useRef(null);
  const transitionRef = useRef(null);
  const timersRef = useRef([]);
  const convergenceStartedRef = useRef(hasResult);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const motionDuration = useCallback(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 760, []);

  const showLayer = useCallback((index, nextState) => {
    setDisplayIndex(index);
    setSelectedLayerId(normalized.macroStages[index]?.id || "l1");
    setTransitioning(false);
    setTransitionTo(null);
    setJourneyState(nextState);
  }, [normalized.macroStages]);

  const startTransition = useCallback((fromIndex, toIndex) => {
    if (transitionRef.current === toIndex) return;
    transitionRef.current = toIndex;
    const from = fromIndex + 1;
    const to = Math.min(fromIndex + 2, 5);
    setView("journey");
    setJourneyState(`L${from}_COMPLETE`);
    schedule(() => {
      setTransitioning(true);
      setTransitionTo(toIndex);
      setJourneyState(`TRANSITION_${from}_${to}`);
    }, motionDuration() ? 180 : 0);
    schedule(() => {
      transitionRef.current = null;
      activeIndexRef.current = toIndex;
      showLayer(toIndex, `L${toIndex + 1}_ENTER`);
      schedule(() => setJourneyState(`L${toIndex + 1}_RUNNING`), motionDuration() ? 240 : 0);
    }, motionDuration() ? 180 + motionDuration() : 0);
  }, [motionDuration, schedule, showLayer]);

  useEffect(() => {
    if (!processing || replaying) return;
    setView("journey");
    const statusIndex = normalized.macroStages.findIndex((layer) => layer.status === "RUNNING" || layer.status === "PARTIAL" || layer.status === "FAILED");
    const firstPending = normalized.macroStages.findIndex((layer) => layer.status !== "COMPLETE");
    const targetIndex = statusIndex >= 0 ? statusIndex : firstPending >= 0 ? firstPending : 0;
    if (activeIndexRef.current == null) {
      activeIndexRef.current = targetIndex;
      setJourneyState("SUBMITTING");
      schedule(() => { showLayer(targetIndex, `L${targetIndex + 1}_ENTER`); schedule(() => setJourneyState(`L${targetIndex + 1}_RUNNING`), motionDuration() ? 240 : 0); }, motionDuration() ? 220 : 0);
      return;
    }
    if (targetIndex > activeIndexRef.current) {
      startTransition(activeIndexRef.current, targetIndex);
      return;
    }
    setDisplayIndex(targetIndex);
    setSelectedLayerId(normalized.macroStages[targetIndex]?.id || "l1");
    setJourneyState(`L${targetIndex + 1}_RUNNING`);
  }, [processing, replaying, normalized.macroStages, motionDuration, schedule, showLayer, startTransition]);

  useEffect(() => {
    if (!hasResult) {
      convergenceStartedRef.current = false;
      return;
    }
    if (processing || replaying || convergenceStartedRef.current) return;
    convergenceStartedRef.current = true;
    clearTimers();
    setView("overview");
    setTransitioning(false);
    setTransitionTo(null);
    setJourneyState("L5_COMPLETE");
    schedule(() => {
      setJourneyState("CONVERGENCE");
      schedule(() => setJourneyState("COMPLETE_OVERVIEW"), motionDuration() ? 540 : 0);
    }, motionDuration() ? 180 : 0);
  }, [processing, hasResult, replaying, clearTimers, motionDuration, schedule]);

  useEffect(() => {
    if (hasResult || processing || view !== "overview") return;
    clearTimers();
    activeIndexRef.current = null;
    setView("input");
    setJourneyState(error ? "ERROR_RECOVERABLE" : "IDLE");
  }, [clearTimers, error, hasResult, processing, view]);

  const replayJourney = useCallback(() => {
    if (!hasResult) return;
    clearTimers();
    setReplaying(true);
    setView("journey");
    setTransitioning(false);
    setTransitionTo(null);
    activeIndexRef.current = 0;
    setDisplayIndex(0);
    setSelectedLayerId("l1");
    setJourneyState("L1_ENTER");
    const duration = motionDuration() ? 860 : 0;
    const settleDelay = duration ? 180 : 0;
    MASTER_ULTRA_LAYERS.slice(1).forEach((_, index) => {
      schedule(() => setJourneyState(`L${index + 1}_COMPLETE`), duration * (index + 1) - settleDelay);
      schedule(() => {
        setDisplayIndex(index + 1);
        setSelectedLayerId(MASTER_ULTRA_LAYERS[index + 1].id);
        setJourneyState(`TRANSITION_${index + 1}_${index + 2}`);
        schedule(() => setJourneyState(`L${index + 2}_RUNNING`), duration ? 260 : 0);
      }, duration * (index + 1));
    });
    schedule(() => setJourneyState("L5_COMPLETE"), duration * 5);
    schedule(() => setJourneyState("CONVERGENCE"), duration * 5 + settleDelay);
    schedule(() => { setReplaying(false); setView("overview"); setJourneyState("COMPLETE_OVERVIEW"); }, duration * 5 + (settleDelay ? 720 : 0));
  }, [clearTimers, hasResult, motionDuration, schedule]);

  const inspectLayer = useCallback((id) => {
    if (!hasResult || processing) return;
    setSelectedLayerId(id);
    setView("inspect");
    setJourneyState("INSPECT_LAYER");
    setInspectedSource(null);
  }, [hasResult, processing]);

  const backToOverview = useCallback(() => {
    setView("overview");
    setJourneyState("COMPLETE_OVERVIEW");
    setInspectedSource(null);
  }, []);

  const navigateInspection = useCallback((id) => {
    if (!id) return;
    setSelectedLayerId(id);
    setJourneyState("INSPECT_LAYER");
    setInspectedSource(null);
  }, []);

  useEffect(() => {
    if (view !== "inspect") return undefined;
    const onKeyDown = (event) => {
      const index = normalized.macroStages.findIndex((layer) => layer.id === selectedLayerId);
      if (event.key === "Escape" || event.key === "Home") { event.preventDefault(); backToOverview(); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); navigateInspection(normalized.macroStages[Math.max(0, index - 1)]?.id); }
      if (event.key === "ArrowRight") { event.preventDefault(); navigateInspection(normalized.macroStages[Math.min(4, index + 1)]?.id); }
      if (event.key === "End") { event.preventDefault(); navigateInspection("l5"); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backToOverview, navigateInspection, normalized.macroStages, selectedLayerId, view]);

  const activeLayer = normalized.macroStages[displayIndex] || normalized.macroStages[0];
  const inspectedLayer = normalized.macroStages.find((layer) => layer.id === selectedLayerId) || normalized.macroStages[0];
  const isJourney = view === "journey" && !hasResult;
  const showComposer = !processing && (view === "input" || (!hasResult && view !== "inspect"));

  return (
    <section className="master-ultra-trust" data-master-ultra-state={journeyState} data-state-known={MASTER_ULTRA_STATES.includes(journeyState) ? "true" : "false"} data-main-authority="MAIN_TRUST_V5" data-sequential-authority={normalized.authority.sequential} data-primary-layer-count="5" data-inspection-rerun="0">
      <div className="master-ultra-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      {showComposer ? (
        <div className="master-ultra-workspace-stack space-y-4">
          <InputComposer mode={mode} content={content} file={file} preview={preview} dragging={dragging} error={error} ocr={ocr} confirmedEntities={confirmedEntities} processing={processing} hasResult={hasResult} demoEnabled={demoEnabled} sourceProvenance={sourceProvenance} fileInputRef={fileInputRef} onModeChange={onModeChange} onContentChange={onContentChange} onFileSelect={onFileSelect} onDragStateChange={onDragStateChange} onClearFile={onClearFile} onAnalyze={onAnalyze} onReset={onReset} />
          <ProgressRail normalized={normalized} activeIndex={0} processing={false} canInspect={false} />
        </div>
      ) : null}
      {(processing || isJourney || replaying) && <div className="master-ultra-run-shell"><div className="master-ultra-run-heading"><div><SectionLabel tone="violet">Analytical journey / one layer at a time</SectionLabel><h2>{replaying ? "Replaying the saved journey" : "Information is travelling deeper."}</h2></div><div className="master-ultra-run-status"><LoaderCircle size={15} className={processing || replaying ? "animate-spin" : ""} /> {STATE_LABELS[journeyState] || journeyState}</div></div><ProgressRail normalized={normalized} activeIndex={displayIndex} processing={processing || replaying} canInspect={false} /><JourneyStage layer={activeLayer} normalized={normalized} journeyState={journeyState} transitioning={transitioning || replaying && journeyState.includes("TRANSITION")} transitionTo={transitionTo} onSelectSource={setInspectedSource} /></div>}
      {hasResult && view === "overview" && !replaying ? <><ProgressRail normalized={normalized} activeIndex={4} processing={false} canInspect onInspect={inspectLayer} /><Overview normalized={normalized} onInspect={inspectLayer} onReplay={replayJourney} onNewAnalysis={onNewAnalysis} onPrint={onPrint} onSelectSource={setInspectedSource} /></> : null}
      {hasResult && view === "inspect" ? <><ProgressRail normalized={normalized} activeIndex={normalized.macroStages.findIndex((layer) => layer.id === selectedLayerId)} processing={false} canInspect onInspect={inspectLayer} /><Inspection normalized={normalized} selectedLayerId={inspectedLayer.id} onBack={backToOverview} onNavigate={navigateInspection} onSelectSource={setInspectedSource} /></> : null}
      {!processing && !hasResult && error && view !== "input" ? <div className="master-ultra-recoverable-error"><ShieldAlert size={17} /><span>{safeText(error.message, "Trust Engine chưa thể hoàn tất.")}</span><button type="button" onClick={onReset}>Về input</button></div> : null}
      <SourceInspectorDrawer isOpen={Boolean(inspectedSource)} source={inspectedSource} onClose={() => setInspectedSource(null)} />
      {analysisSummary && (processing || hasResult) ? <div className="master-ultra-input-chip"><span className={processing ? "is-live" : "is-done"} /> <span>{processing ? "Đang phân tích" : "Phiên đã lưu"} · {analysisSummary.type}</span><strong>{analysisSummary.label}</strong></div> : null}
      <footer className="master-ultra-footer"><span><LockKeyhole size={13} /> No fake metrics. No hidden sources. No authority confusion.</span><span><Users size={13} /> Human review stays with Decision Intelligence, not a sixth layer.</span></footer>
    </section>
  );
}
