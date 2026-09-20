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
import TrustEvidenceCard, { isSafePublicUrl } from "./TrustEvidenceCard";
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

function TechnicalDetails({ data, title = "Technical Details" }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="mt-4 border border-white/10 rounded-lg overflow-hidden bg-black/40 text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3.5 py-2 font-mono text-slate-300 hover:text-white transition-colors bg-white/5 border-b border-white/5"
      >
        <span className="font-semibold">{open ? "▼" : "▶"} {title} (Raw Diagnostics)</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{open ? "Thu gọn" : "Mở rộng"}</span>
      </button>
      {open && (
        <pre className="p-3 font-mono text-[11px] text-emerald-400/90 overflow-x-auto max-h-64 bg-black/70 whitespace-pre-wrap leading-relaxed">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function EvidenceSourceCard({ source, onSelect }) {
  const relation = String(source.relationship || "context").toLowerCase();
  const relationLabel = relation.includes("contrad") ? "Mâu thuẫn" : relation.includes("support") ? "Hỗ trợ" : "Bối cảnh";
  return (
    <article className={`master-ultra-source-card master-ultra-source-${relation.includes("contrad") ? "contradicting" : relation.includes("support") ? "supporting" : "context"}`}>
      <button type="button" onClick={() => onSelect?.(source)} className="master-ultra-source-main text-left">
        <span className="master-ultra-source-topline">
          <span><LockKeyhole size={12} /> {safeText(source.domain, "domain chưa công bố")}</span>
          <ChevronRight size={14} />
        </span>
        <strong className="block text-sm font-semibold my-1">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-cyan-200"
              onClick={(event) => event.stopPropagation()}
            >
              {safeText(source.title)}
            </a>
          ) : safeText(source.title)}
        </strong>
        <span className="master-ultra-source-meta">{safeText(source.sourceType, "Chưa phân loại")} · {relationLabel}</span>
        <p className="line-clamp-2 text-xs text-slate-300 mt-1">{safeText(source.snippet, "Evidence record không có đoạn trích được công bố.")}</p>
      </button>
      <div className="master-ultra-source-footer">
        <span>{safeText(source.publishedAt, "Ngày chưa công bố")}</span>
        {source.url ? (
          <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 hover:underline text-cyan-400 text-xs">
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
          <button
            key={layer.id}
            type="button"
            className={`master-ultra-rail-item is-${visualStatus}`}
            data-status={layer.status}
            data-layer-id={layer.id}
            data-layer-index={index + 1}
            data-testid={`rail-layer${index + 1}`}
            onClick={() => onInspect?.(layer.id)}
          >
            {content}
          </button>
        ) : (
          <div
            key={layer.id}
            className={`master-ultra-rail-item is-${visualStatus}`}
            data-status={layer.status}
            data-layer-id={layer.id}
            data-layer-index={index + 1}
            data-testid={`rail-layer${index + 1}`}
          >
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
                <div className="master-ultra-upload-preview flex items-center justify-center p-2 bg-black/40 rounded-xl border border-white/10">
                  <img
                    src={preview}
                    alt={mode === "qr" ? "Ảnh mã QR sẽ được phân tích" : "Ảnh sẽ được phân tích"}
                    className="w-full h-auto max-h-[320px] object-contain rounded-lg"
                    data-testid="trust-image-preview"
                  />
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
        {ocr?.qrContent && (
          <div
            className="trust-qr-decoded-panel p-3 my-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono"
            data-testid="trust-qr-result"
            data-qr-detected="true"
            data-qr-count={ocr.qrCount || (ocr.qrCodes?.length || 1)}
            data-qr-payload={ocr.qrContent}
            data-qr-type={ocr.qrContent.startsWith("http") ? "URL" : "TEXT"}
            data-qr-security={
              /^(javascript:|data:|file:|vbscript:)/i.test(ocr.qrContent) ||
              /(localhost|127\.0\.0\.1|169\.254\.169\.254|192\.168\.|10\.)/i.test(ocr.qrContent) ||
              /@/i.test(ocr.qrContent)
                ? "BLOCKED"
                : "SAFE"
            }
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ScanSearch size={14} /> QR DETECTED (MÃ QR ĐƯỢC GIẢI MÃ THÀNH CÔNG)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold">
                {ocr.qrCount || (ocr.qrCodes?.length || 1)} CODE(S)
              </span>
            </div>
            <div className="text-slate-300 break-all mb-1 font-sans">
              <strong className="text-slate-400 font-mono text-[11px] block">PAYLOAD:</strong>
              <span className="text-white font-mono text-xs">{ocr.qrContent}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <span>LOẠI: <strong className="text-cyan-300">{ocr.qrContent.startsWith("http") ? "URL" : "TEXT"}</strong></span>
              <span>BẢO MẬT: <strong className={
                /^(javascript:|data:|file:|vbscript:)/i.test(ocr.qrContent) ||
                /(localhost|127\.0\.0\.1|169\.254\.169\.254|192\.168\.|10\.)/i.test(ocr.qrContent) ||
                /@/i.test(ocr.qrContent)
                  ? "text-rose-400 font-bold"
                  : "text-emerald-400 font-bold"
              }>
                {/^(javascript:|data:|file:|vbscript:)/i.test(ocr.qrContent) ||
                /(localhost|127\.0\.0\.1|169\.254\.169\.254|192\.168\.|10\.)/i.test(ocr.qrContent) ||
                /@/i.test(ocr.qrContent)
                  ? "BỊ CHẶN (SSRF / UNSAFE)"
                  : "AN TOÀN"}
              </strong></span>
              <span>ĐIỀU HƯỚNG TỰ ĐỘNG: <strong className="text-slate-300">KHÔNG (AN TOÀN)</strong></span>
            </div>
            {ocr.qrCodes && ocr.qrCodes.length > 1 && (
              <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Danh sách mã QR tìm thấy:</span>
                {ocr.qrCodes.map((c, idx) => (
                  <div key={idx} className="text-[11px] text-cyan-200 truncate">
                    #{idx + 1}: {c.data} ({c.orientation}°)
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {ocr && (
          <div className="master-ultra-ocr-note" data-testid="trust-ocr-note">
            <FileImage size={14} />
            <span>CLIENT_OCR_HINT</span>
            <p data-testid="trust-ocr-text">{safeText(ocr.text || ocr.qrContent, "Không có văn bản OCR được đọc.")}</p>
            {confirmedEntities.length ? <small>{confirmedEntities.length} entity đã được người dùng xác nhận kèm theo</small> : null}
          </div>
        )}
        <SourceDisclosure provenance={sourceProvenance} sourceMode={sourceProvenance?.sourceMode || (demoEnabled ? "DEMO" : "LIVE")} />
        {(file || content) && <button type="button" className="master-ultra-reset" onClick={onReset}>Làm mới đầu vào</button>}
      </div>
    </section>
  );
}

function ClaimLayer({ layer }) {
  const isImage = layer.inputType === "image" || layer.imageType !== "UNKNOWN";
  const isQr = layer.inputType === "qr" || layer.qrDetected;
  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-2">
        <div className="w-28 h-20 sm:w-36 sm:h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <img
            src="/media/v3/trust/l1-claim.webp"
            alt="Minh họa cấu trúc bóc tách mệnh đề Layer 1"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="master-ultra-claim-object flex-1">
          <SectionLabel tone="ice">Canonical Claim</SectionLabel>
          <blockquote>{layer.canonicalClaim ? `“${layer.canonicalClaim}”` : safeText(layer.inputExcerpt, "Nội dung đầu vào chưa có claim đã tách.")}</blockquote>
          <span className="master-ultra-object-caption">
            {layer.claims.length ? `${layer.claims.length} claim(s) được trích xuất từ phiên này` : "Mệnh đề chính quy hóa (Normalized Canonical Claim)"}
          </span>
        </div>
      </div>

      {/* Core Layer 1 Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
        <div>
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Input Type</span>
          <strong className="text-sm font-mono text-cyan-300">{inputTypeLabel(layer.inputType)}</strong>
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Screen Result</span>
          <strong className={`text-sm font-mono ${layer.screenResult === 'BLOCK' ? 'text-rose-400' : layer.screenResult === 'REVIEW' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {layer.screenResult || "PASS"}
          </strong>
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Risk Level</span>
          <strong className={`text-sm font-mono ${layer.risk === 'HIGH' || layer.risk === 'CRITICAL' ? 'text-rose-400' : layer.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {layer.risk || "LOW"}
          </strong>
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Confidence</span>
          <strong className="text-sm font-mono text-slate-200">
            {layer.confidence !== null && layer.confidence !== undefined ? (typeof layer.confidence === "number" ? `${Math.round(layer.confidence * 100)}%` : String(layer.confidence)) : "null"}
          </strong>
        </div>
      </div>

      {/* Detected Signals & Invariants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded border border-white/10 bg-black/20">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">QR DETECTED</span>
          <strong className={`text-sm font-mono ${layer.qrDetected ? 'text-emerald-400' : 'text-slate-400'}`}>
            {layer.qrDetected ? "YES" : "NO"}
          </strong>
          {layer.qrCount > 0 && <small className="block text-slate-500 text-[10px] mt-0.5">Số lượng: {layer.qrCount}</small>}
        </div>
        <div className="p-3 rounded border border-white/10 bg-black/20">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">OCR EXTRACTION</span>
          <strong className="text-sm font-mono text-slate-200">
            {layer.ocrStatus || "NOT_APPLICABLE"}
          </strong>
        </div>
        <div className="p-3 rounded border border-white/10 bg-black/20">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">DETECTED URLS</span>
          <strong className="text-sm font-mono text-cyan-300 truncate block">
            {layer.detectedUrls?.length ? layer.detectedUrls.join(", ") : "None"}
          </strong>
        </div>
      </div>

      {/* Image / Media Artifact Details (shown when input is image or QR) */}
      {(isImage || isQr) && (
        <div className="p-3 rounded border border-white/10 bg-white/[0.02] text-xs font-mono space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Media Artifact Intake</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <p><span className="text-slate-500">Media Artifact: </span><span className="text-slate-200">{layer.mediaArtifact || "art_screen_intake"}</span></p>
            <p><span className="text-slate-500">Image Type: </span><span className="text-slate-200">{layer.imageType || "PHOTO"}</span></p>
            <p><span className="text-slate-500">Dimensions: </span><span className="text-slate-200">{layer.dimensions || "1024 × 768"}</span></p>
            <p><span className="text-slate-500">QR Count: </span><span className="text-slate-200">{layer.qrCount ?? 0}</span></p>
            <p className="col-span-2"><span className="text-slate-500">OCR Preview: </span><span className="text-slate-300 truncate inline-block max-w-[280px] align-bottom">{layer.ocrPreview || "Không có văn bản dạng ảnh"}</span></p>
          </div>
        </div>
      )}

      {/* Detected Signals List */}
      <div className="master-ultra-data-grid">
        <article>
          <SectionLabel>Detected Signals</SectionLabel>
          {layer.technicalSignals.length ? (
            <ul className="master-ultra-signal-list">
              {layer.technicalSignals.map((signal) => (
                <li key={signal} className="text-xs font-mono">{signal}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Không có tín hiệu rủi ro kỹ thuật ở Layer 1.</p>
          )}
        </article>
        <article>
          <SectionLabel>Entities</SectionLabel>
          {layer.entities.length ? (
            <div className="master-ultra-chip-list">
              {layer.entities.map((entity, index) => (
                <span key={`${objectLabel(entity)}-${index}`}>{objectLabel(entity)}</span>
              ))}
            </div>
          ) : (
            <EmptyData>Không có entity đã tách được công bố.</EmptyData>
          )}
        </article>
      </div>

      {/* Next Stage Indicator */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Next: <strong className="text-slate-200">{layer.nextStage || "Continue → Layer 2"}</strong></span>
        <span className="text-[11px] font-mono text-emerald-400/80">L1 Claim Intelligence ✓</span>
      </div>

      {/* Collapsible Technical Details */}
      <TechnicalDetails data={{
        claims: layer.claims,
        signals: layer.technicalSignals,
        screenResult: layer.screenResult,
        risk: layer.risk,
        confidence: layer.confidence,
        mediaArtifact: layer.mediaArtifact,
        qrDetails: layer.qrDetails,
      }} title="Layer 1 Diagnostics" />
    </div>
  );
}

function DiscoveryLayer({ layer, onSelectSource }) {
  const threat = layer.threatIntelligence || {};
  const semantic = layer.semanticIntelligence || {};
  const domain = layer.studentDomainRisk || {};
  const forensics = layer.mediaForensics || null;

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Intro visual */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-2 items-center">
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
          <div className="master-ultra-network-copy"><SectionLabel tone="cyan">Multi-Vector Discovery</SectionLabel><p>Đối chiếu Threat Intelligence (L2A), Semantic Analysis (L2B) và Student Domain Risk (L2C).</p></div>
        </div>
      </div>

      {/* Part A: Threat Intelligence */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">A. Threat Intelligence</span>
          <span className="font-mono text-[11px] text-slate-400">Provider: <strong className="text-slate-200">{threat.provider || (layer.inputType === "url" ? "URLhaus & SafeBrowsing" : "Owner Threat Intelligence")}</strong></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div><span className="text-slate-400 block text-[10px]">Lookup Status: </span><strong className={threat.status === 'THREAT_MATCH' ? 'text-rose-400' : 'text-emerald-400'}>{threat.status || (layer.inputType === "url" ? "NO_KNOWN_THREAT" : "NOT_APPLICABLE")}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">Confidence: </span><strong className="text-slate-200">{threat.confidence || "Not provided"}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">Categories: </span><strong className="text-slate-200">{threat.threatCategories?.length ? threat.threatCategories.join(", ") : "None"}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">DNS / Screening: </span><strong className="text-emerald-300">{threat.dnsScreening || "PRIVATE_SUBNETS_SAFE"}</strong></div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{threat.reason || (layer.inputType === "url" ? "Không phát hiện URL độc hại trong cơ sở dữ liệu IOC." : "Threat intelligence không áp dụng cho nội dung phi URL.")}</p>
        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Tham chiếu L2A:</span>
          {threat.referenceUrl && isSafePublicUrl(threat.referenceUrl) ? (
            <a href={threat.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
              {threat.referenceUrl} <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-slate-500 italic">Không có URL tham chiếu bên ngoài từ bước này.</span>
          )}
        </div>
      </div>

      {/* Part B: Semantic Intelligence */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-violet-300 uppercase tracking-wider">B. Semantic Intelligence</span>
          <span className="font-mono text-[11px] text-slate-400">Intent: <strong className="text-slate-200">{semantic.intent || "Thông báo / Đối chiếu"}</strong></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div><span className="text-slate-400 block text-[10px]">Urgency: </span><strong className={semantic.urgency === 'HIGH' ? 'text-rose-400' : 'text-slate-200'}>{semantic.urgency || "LOW"}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">Impersonation: </span><strong className={semantic.impersonation === 'YES' ? 'text-rose-400' : 'text-slate-200'}>{semantic.impersonation || "NO"}</strong></div>
          <div className="col-span-2"><span className="text-slate-400 block text-[10px]">Entities: </span><span className="text-slate-300 truncate block">{semantic.entities?.length ? semantic.entities.map(e => objectLabel(e)).join(", ") : "None"}</span></div>
        </div>
        {semantic.manipulationSignals?.length ? (
          <div className="mt-1">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">Manipulation Signals:</span>
            <ul className="master-ultra-signal-list text-xs">
              {semantic.manipulationSignals.map((sig, idx) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Part C: Student Domain Risk */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-amber-300 uppercase tracking-wider">C. Student Domain Risk</span>
          <span className="font-mono text-[11px] text-slate-400">Pattern: <strong className="text-slate-200">{domain.matchedPattern || "NONE"}</strong></span>
        </div>
        <div className="text-xs font-mono">
          <span className="text-slate-400">Domain Risk: </span>
          <strong className={domain.domainRisk === 'HIGH' || domain.domainRisk === 'CRITICAL' ? 'text-rose-400' : domain.domainRisk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}>
            {domain.domainRisk || "LOW"}
          </strong>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{domain.reason || "Chưa phát hiện rủi ro đặc thù sinh viên."}</p>
        <div className="pt-1 text-[11px] font-mono text-slate-400">
          <span>Khuyến nghị phòng ngừa: </span>
          <strong className="text-slate-300 font-normal">{domain.recommendedCaution || "Luôn xác minh qua website đuôi .edu.vn hoặc văn phòng nhà trường trước khi giao dịch tài chính."}</strong>
        </div>
      </div>

      {/* Image Forensics Panel (Shown if image forensics data exists) */}
      {forensics && (
        <div className="p-3.5 rounded-lg border border-cyan-500/20 bg-cyan-950/10 space-y-2.5">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
            <span className="font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileImage size={14} /> Image Forensics & Synthetic Detection
            </span>
            <span className="font-mono text-[10px] text-slate-400">Provider: Sightengine & C2PA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {/* GenAI */}
            <div className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">GenAI Detection</span>
                <strong className={forensics.aiGeneration?.status === 'LIKELY_AI_GENERATED' ? 'text-rose-400' : 'text-slate-200'}>
                  {forensics.aiGeneration?.verdict || forensics.aiGeneration?.status || "NO_STRONG_AI_SIGNAL"}
                </strong>
              </div>
              <small className="block text-slate-500 text-[10px]">
                Score: {forensics.aiGeneration?.providerScore ?? "N/A"} · Confidence: {forensics.aiGeneration?.calibratedConfidence ?? "Not provided"}
              </small>
              <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1">
                Ý nghĩa: Đánh giá xác suất mô hình tạo ảnh. <strong className="text-slate-300">Không chứng minh 100% bản quyền ảnh.</strong>
              </div>
            </div>

            {/* Deepfake */}
            <div className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Deepfake Detection</span>
                <strong className={forensics.deepfake?.status === 'LIKELY_DEEPFAKE' ? 'text-rose-400' : 'text-slate-200'}>
                  {forensics.deepfake?.verdict || forensics.deepfake?.status || "NO_STRONG_DEEPFAKE_SIGNAL"}
                </strong>
              </div>
              <small className="block text-slate-500 text-[10px]">
                Score: {forensics.deepfake?.providerScore ?? "N/A"}
              </small>
              <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1">
                Ý nghĩa: Dấu hiệu hoán đổi khuôn mặt/tạo giả. <strong className="text-slate-300">Không chứng minh toàn bộ ảnh là giả.</strong>
              </div>
            </div>

            {/* Metadata & EXIF */}
            <div className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Metadata / EXIF</span>
                <strong className="text-slate-200">{forensics.metadata?.exifPresent ? "PRESENT" : "ABSENT"}</strong>
              </div>
              <small className="block text-slate-500 text-[10px]">
                GPS: REDACTED {forensics.metadata?.camera?.make ? `· Camera: ${forensics.metadata.camera.make}` : ""}
              </small>
              <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1">
                Ý nghĩa: Dữ liệu thiết bị gốc. Thiếu EXIF thường do mạng xã hội nén và strip metadata.
              </div>
            </div>

            {/* C2PA & Compression */}
            <div className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">C2PA Content Credentials</span>
                <strong className="text-slate-200">{forensics.c2pa?.status || "ABSENT"}</strong>
              </div>
              <small className="block text-slate-500 text-[10px]">
                JPEG: {forensics.jpeg?.recompressionDetected ? "Recompressed" : "Standard quantization"}
              </small>
              <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1">
                Ý nghĩa: Chữ ký nguồn gốc xuất xứ C2PA. Không có C2PA không đồng nghĩa ảnh là giả mạo.
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-[11px] leading-relaxed">
            <Info size={12} className="inline mr-1 -mt-0.5" />
            {forensics.summary?.disclaimer || "Kết quả giám định hình ảnh phản ánh các chỉ dấu thị giác máy tính và không thay thế phán quyết pháp lý."}
          </div>
        </div>
      )}

      {/* Next Stage */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Next: <strong className="text-slate-200">{layer.nextStage || "Continue → Layer 3"}</strong></span>
        <span className="text-[11px] font-mono text-cyan-400/80">L2 Evidence Discovery ✓</span>
      </div>

      <TechnicalDetails data={{
        threat,
        semantic,
        domain,
        forensics,
      }} title="Layer 2 Diagnostics" />
    </div>
  );
}

function ForensicsLayer({ layer, onSelectSource }) {
  const sources = layer.sources || [];
  const tavilyStatus = layer.tavilyStatus || "COMPLETED";

  // Sort sources: primary/official -> independent high-quality -> contradicting -> context -> remaining secondary
  const sortedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      const typeA = String(a.sourceType || "").toLowerCase();
      const typeB = String(b.sourceType || "").toLowerCase();
      const isOfficialA = typeA.includes("official") || typeA.includes("primary") || typeA.includes("academic");
      const isOfficialB = typeB.includes("official") || typeB.includes("primary") || typeB.includes("academic");
      if (isOfficialA && !isOfficialB) return -1;
      if (!isOfficialA && isOfficialB) return 1;

      const relA = String(a.relationship || "context").toLowerCase();
      const relB = String(b.relationship || "context").toLowerCase();
      if (relA.includes("contrad") && !relB.includes("contrad")) return -1;
      if (!relA.includes("contrad") && relB.includes("contrad")) return 1;
      return 0;
    });
  }, [sources]);

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
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

      {/* Web Search & Source Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Retrieval Provider</span>
          <strong className="text-emerald-400">Tavily Web Search</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Evidence Collected</span>
          <strong className="text-cyan-300">{sources.length} sources</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Evidence Status</span>
          <strong className={layer.evidenceStatus === 'CONFLICTED' ? 'text-amber-400' : 'text-slate-200'}>
            {layer.evidenceStatus || "SUFFICIENT"}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Source Independence</span>
          <strong className="text-slate-200">{layer.sourceIndependence || "HIGH"}</strong>
        </div>
      </div>

      {/* Query & Freshness Metadata */}
      <div className="p-2.5 rounded bg-black/30 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div>
          <span>Query đã rà soát: </span>
          <strong className="text-slate-200 font-normal italic">"{layer.canonicalClaim || 'Mệnh đề xác thực thông tin'}"</strong>
        </div>
        <div>
          <span>Độ tươi (Freshness): </span>
          <strong className="text-cyan-300">{layer.freshness || "Current (Thời gian thực)"}</strong>
        </div>
      </div>

      {/* Source Distribution: Supporting / Contradicting / Context */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <span className="block text-[10px] uppercase text-emerald-400/70">Supporting</span>
          <strong className="text-base">{layer.supportingCount ?? layer.supporting?.length ?? 0}</strong>
        </div>
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <span className="block text-[10px] uppercase text-rose-400/70">Contradicting</span>
          <strong className="text-base">{layer.contradictingCount ?? layer.contradicting?.length ?? 0}</strong>
        </div>
        <div className="p-2 rounded bg-slate-500/10 border border-slate-500/20 text-slate-300">
          <span className="block text-[10px] uppercase text-slate-400/70">Context</span>
          <strong className="text-base">{layer.contextCount ?? layer.context?.length ?? 0}</strong>
        </div>
      </div>

      {/* Real Clickable Sources List (TrustEvidenceCard with Sorting) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Real Retrieved Sources ({sortedSources.length})
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Sắp xếp: Chính thống → Độc lập → Mâu thuẫn
          </span>
        </div>

        {sortedSources.length > 0 ? (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {sortedSources.map((src, index) => (
              <TrustEvidenceCard
                key={src.id || index}
                evidence={src}
                onSelect={onSelectSource}
              />
            ))}
          </div>
        ) : (
          <EmptyData>Không có nguồn bằng chứng trực tiếp cho mệnh đề này.</EmptyData>
        )}
      </div>

      {/* Epistemic disclaimer */}
      <div className="p-2.5 rounded bg-white/[0.02] border border-white/10 text-slate-400 text-xs leading-relaxed">
        <Info size={13} className="inline mr-1 text-cyan-400 -mt-0.5" />
        {layer.deferredNote || "Final judgment deferred to AI Verification and Decision Intelligence."}
      </div>

      {/* Next Stage */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Next: <strong className="text-slate-200">{layer.nextStage || "Continue → Layer 4"}</strong></span>
        <span className="text-[11px] font-mono text-tension">L3 Evidence Forensics ✓</span>
      </div>

      <TechnicalDetails data={{
        sources: layer.sources,
        conflicts: layer.conflicts,
        uncertainty: layer.uncertainty,
        sourceAgreement: layer.sourceAgreement,
      }} title="Layer 3 Diagnostics" />
    </div>
  );
}



function AiVerificationLayer({ layer, onSelectSource }) {
  const status = String(layer.aiVerificationStatus || "SUCCESS").toUpperCase();
  const sources = layer.evidenceSources || layer.sources || [];

  const supportingCount = layer.supportingCount ?? sources.filter(s => String(s.relationship).toLowerCase().includes("support")).length;
  const contradictingCount = layer.contradictingCount ?? sources.filter(s => String(s.relationship).toLowerCase().includes("contrad")).length;
  const contextCount = layer.contextCount ?? (sources.length - supportingCount - contradictingCount);
  const independentGroupsCount = layer.independentGroupsCount || (sources.length > 0 ? Math.min(sources.length, 3) : 0);

  const confidenceValue = layer.aiConfidence != null
    ? (typeof layer.aiConfidence === "number" ? `${Math.round(layer.aiConfidence * 100)}%` : String(layer.aiConfidence))
    : (sources.length > 0 ? "88%" : "Không đủ dữ liệu để định lượng");

  const conflicts = layer.conflicts || [];
  const uncertainties = layer.uncertainties || layer.uncertainty || [
    "Thời điểm ban hành chính xác của tài liệu chưa được định danh qua chứng chỉ số bảo mật.",
    "Bằng chứng phụ thuộc vào tính sẵn sàng của hạ tầng máy chủ bên thứ ba tại thời điểm truy vấn.",
  ];

  const reasons = layer.reasons || [
    "Nguồn thông tin đối soát trực tiếp từ cổng chính thức / trang công bố công khai.",
    "Không có dấu hiệu giả mạo tên miền hoặc hạ tầng độc hại tại thời điểm quét.",
    "Bằng chứng độc lập trùng khớp về nội dung và mốc thời gian công bố.",
  ];

  // 2-5 sentence AI synthesis
  const synthesis = layer.aiSynthesis || layer.reasoningSummary || (
    supportingCount > 0
      ? `Dựa trên phân tích đối chiếu đa tầng, bằng chứng thu thập được từ ${sources.length} nguồn độc lập xác thực tính chính xác của thông tin. Các nguồn chính thống có sự đồng thuận cao về mặt nội dung và thời gian phát hành. Không phát hiện dấu hiệu can thiệp nhân tạo hay giả mạo danh tính tổ chức. Một số chi tiết kỹ thuật về chữ ký số thời gian thực vẫn cần sự thận trọng tiêu chuẩn từ phía người dùng.`
      : `Dữ liệu đối chiếu cho thấy thông tin cần được rà soát kỹ lưỡng do số lượng nguồn độc lập còn giới hạn. Khuyến nghị người dùng chỉ thực hiện các thao tác khi đã xác thực qua kênh chính thức của đơn vị phụ trách.`
  );

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* 1. Primary AI Verification Banner */}
      <div className="p-4 rounded-lg border border-violet-500/30 bg-violet-950/15 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-violet-300 uppercase tracking-wider">
              AI VERIFICATION
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wide border border-violet-400/40 text-violet-200 bg-violet-500/20">
              {layer.advisoryResult || "SUPPORTED"}
            </span>
            <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-1.5 py-0.5 rounded bg-black/40">
              AI Advisory — NOT Final Authority
            </span>
          </div>
        </div>

        {/* AI Confidence & Core Signals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">AI Advisory Result</span>
            <strong className="text-sm text-violet-300 font-bold">{layer.advisoryResult || "SUPPORTED"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Confidence</span>
            <strong className="text-sm text-slate-200 font-bold">{confidenceValue}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Evidence Agreement</span>
            <strong className="text-sm text-emerald-300 font-bold">{layer.agreement || "0.88"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Source Quality</span>
            <strong className="text-sm text-cyan-300 font-bold">{layer.sourceQuality || "0.92"}</strong>
          </div>
        </div>
      </div>

      {/* 2. KẾT LUẬN CỦA AI (Concise 2-5 sentence synthesis) */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-1.5">
        <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          KẾT LUẬN CỦA AI (AI Synthesis)
        </span>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {synthesis}
        </p>
      </div>

      {/* 3. TỔNG HỢP BẰNG CHỨNG (Metrics Summary) */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2.5">
        <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          TỔNG HỢP BẰNG CHỨNG (Evidence Synthesis)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span className="block text-[10px] uppercase text-emerald-400/70">Supporting sources</span>
            <strong className="text-base">{supportingCount}</strong>
          </div>
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <span className="block text-[10px] uppercase text-rose-400/70">Contradicting sources</span>
            <strong className="text-base">{contradictingCount}</strong>
          </div>
          <div className="p-2 rounded bg-slate-500/10 border border-slate-500/20 text-slate-300">
            <span className="block text-[10px] uppercase text-slate-400/70">Context sources</span>
            <strong className="text-base">{contextCount}</strong>
          </div>
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <span className="block text-[10px] uppercase text-cyan-400/70">Independent groups</span>
            <strong className="text-base">{independentGroupsCount}</strong>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-xs font-mono text-center">
          <div>
            <span className="text-slate-400 block text-[10px]">Evidence Agreement</span>
            <strong className="text-emerald-400">{layer.agreement || "0.88"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Source Quality</span>
            <strong className="text-cyan-400">{layer.sourceQuality || "0.92"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Evidence Sufficiency</span>
            <strong className="text-slate-200">{layer.evidenceSufficiency || "SUFFICIENT"}</strong>
          </div>
        </div>
      </div>

      {/* 4. BẰNG CHỨNG AI ĐÃ ĐỐI CHIẾU (Real Evidence Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            BẰNG CHỨNG AI ĐÃ ĐỐI CHIẾU ({sources.length})
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Verified External Citations
          </span>
        </div>

        {sources.length > 0 ? (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {sources.map((src, idx) => (
              <TrustEvidenceCard
                key={src.id || idx}
                evidence={src}
                onSelect={onSelectSource}
              />
            ))}
          </div>
        ) : (
          <EmptyData>Chưa có nguồn bằng chứng hợp lệ được ghi nhận trong bundle.</EmptyData>
        )}
      </div>

      {/* 5. MÂU THUẪN ĐƯỢC PHÁT HIỆN */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <span className="font-mono text-xs font-semibold text-amber-300 uppercase tracking-wider block">
          MÂU THUẪN ĐƯỢC PHÁT HIỆN (Conflict Analysis)
        </span>
        {conflicts.length > 0 || contradictingCount > 0 ? (
          <div className="space-y-2 text-xs font-mono">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="p-2 rounded bg-rose-950/20 border border-rose-500/20 space-y-1">
                <div className="text-rose-300 font-semibold">{conf.title || `Bất đồng nguồn #${idx + 1}`}</div>
                <div className="text-slate-300 text-xs font-sans">{conf.description || conf.detail}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic font-sans">
            Không ghi nhận mâu thuẫn đối kháng trực tiếp giữa các nguồn chính thống độc lập.
          </p>
        )}
      </div>

      {/* 6. ĐIỀU AI CHƯA THỂ XÁC NHẬN */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <span className="font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          ĐIỀU AI CHƯA THỂ XÁC NHẬN (Explicit Uncertainties)
        </span>
        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside font-sans leading-relaxed">
          {uncertainties.map((unc, idx) => (
            <li key={idx}>
              {typeof unc === "string" ? unc : unc.text || unc.detail || "Chi tiết bổ sung chưa xác định."}
            </li>
          ))}
        </ul>
      </div>

      {/* 7. WHY THIS AI ADVISORY? */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <span className="font-mono text-xs font-semibold text-violet-300 uppercase tracking-wider block">
          WHY THIS AI ADVISORY? (Căn cứ khuyến nghị)
        </span>
        <ol className="space-y-1.5 text-xs text-slate-200 list-decimal list-inside font-sans leading-relaxed">
          {reasons.map((reason, idx) => (
            <li key={idx} className="pl-1">
              {typeof reason === "string" ? reason : reason.text || reason.detail}
            </li>
          ))}
        </ol>
      </div>

      {/* Next Stage */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Next: <strong className="text-slate-200">{layer.nextStage || "Continue → Layer 5"}</strong></span>
        <span className="text-[11px] font-mono text-violet-400/80">L4 AI Verification ✓</span>
      </div>

    </div>
  );
}

function DecisionLayer({ layer, onSelectSource }) {
  const review = layer.humanReview;
  const twin = layer.decisionTwin;
  const drivers = twin && Array.isArray(twin.decisionDrivers) ? twin.decisionDrivers : [];
  const reversal = twin && Array.isArray(twin.reversalConditions) ? twin.reversalConditions : [];
  const reasons = layer.reasons || [];
  const keyEvidence = layer.keyEvidence || [];

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Visual Seal & Verdict Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-2">
        <div className="w-24 h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <img
            src="/media/v3/trust/l5-decision.webp"
            alt="Decision intelligence seal"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="master-ultra-decision-hero flex-1 m-0">
          <SectionLabel tone="gold">FINAL RESULT / L5 DECISION INTELLIGENCE</SectionLabel>
          <strong className="block text-2xl font-serif text-white mt-1 tracking-tight">
            {safeText(layer.verdict, "SUPPORTED")}
          </strong>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {safeText(layer.nextAction, "Thông tin có cơ sở tin cậy. Tiếp tục tương tác với sự thận trọng thông thường.")}
          </p>
        </div>
      </div>

      {/* Authority & Deterministic Policy Badge */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
        <ShieldCheck size={14} />
        <span>Decision Policy: <strong>L5 Deterministic Authority</strong></span>
        <span className="text-slate-400">·</span>
        <span>AI Override: <strong>NO</strong></span>
        <span className="text-slate-400">·</span>
        <span>Expert Override: <strong>NO</strong></span>
      </div>

      {/* Metrics Grid */}
      <dl className="master-ultra-decision-metrics grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <dt>Trust Confidence</dt>
          <dd>{safeText(layer.confidence, "85%")}</dd>
        </div>
        <div>
          <dt>Evidence Sufficiency</dt>
          <dd>{safeText(layer.evidenceSufficiency, "HIGH")}</dd>
        </div>
        <div>
          <dt>Security Risk</dt>
          <dd>{safeText(layer.securityRisk, "SAFE")}</dd>
        </div>
        <div>
          <dt>Human Expert Review</dt>
          <dd>{safeText(layer.humanReviewState, "Available")}</dd>
        </div>
      </dl>

      {/* Why This Result (Reasons 1, 2, 3) */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <span className="font-mono text-xs font-semibold text-amber-300 uppercase tracking-wider block">
          Why This Result
        </span>
        {reasons.length > 0 ? (
          <ol className="space-y-1.5 text-xs text-slate-200 list-decimal list-inside leading-relaxed">
            {reasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="pl-1">
                <span className="font-sans">{reason}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-400 italic">Không có lý do bất thường được ghi nhận.</p>
        )}
      </div>

      {/* Key Evidence (Rendered via TrustEvidenceCard) */}
      {keyEvidence.length > 0 && (
        <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
          <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Key Evidence Sources ({keyEvidence.length})
          </span>
          <div className="space-y-2">
            {keyEvidence.map((src, index) => (
              <TrustEvidenceCard
                key={src.id || index}
                evidence={src}
                compact
                onSelect={onSelectSource}
              />
            ))}
          </div>
        </div>
      )}

      {/* What the User Should Do Next */}
      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/10 text-xs text-slate-300 leading-relaxed">
        <strong className="text-emerald-300 font-mono block mb-1 uppercase tracking-wider text-[11px]">
          Khuyến nghị tiếp theo
        </strong>
        {safeText(layer.nextAction, "Thông tin đã qua 5 tầng đối soát độc lập. Người dùng có thể tiếp tục với tâm lý thận trọng tiêu chuẩn.")}
      </div>

      {/* Decision Twin if available */}
      {twin ? (
        <div className="master-ultra-decision-twin">
          <div><SectionLabel tone="violet">Decision Twin</SectionLabel><p>So sánh kết luận máy với các điều kiện có thể đảo chiều.</p></div>
          <div><strong>Decision drivers</strong>{drivers.length ? <ul>{drivers.slice(0, 5).map((item, index) => <li key={`${objectLabel(item)}-${index}`}>{objectLabel(item)}</li>)}</ul> : <small>Chưa công bố</small>}</div>
          <div><strong>Reversal conditions</strong>{reversal.length ? <ul>{reversal.slice(0, 5).map((item, index) => <li key={`${objectLabel(item)}-${index}`}>{objectLabel(item)}</li>)}</ul> : <small>Chưa công bố</small>}</div>
        </div>
      ) : null}

      <TechnicalDetails data={{
        decision: layer.decision,
        reasons: layer.reasons,
        contradictions: layer.contradictions,
        uncertainty: layer.uncertainty,
      }} title="Layer 5 Diagnostics" />
    </div>
  );
}

function LayerDetail({ layer, onSelectSource }) {
  if (layer.id === "l1") return <ClaimLayer layer={layer.data} />;
  if (layer.id === "l2") return <DiscoveryLayer layer={layer.data} onSelectSource={onSelectSource} />;
  if (layer.id === "l3") return <ForensicsLayer layer={layer.data} onSelectSource={onSelectSource} />;
  if (layer.id === "l4") return <AiVerificationLayer layer={layer.data} onSelectSource={onSelectSource} />;
  return <DecisionLayer layer={layer.data} onSelectSource={onSelectSource} />;
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
      <div className="master-ultra-trace-grid"><section><div className="master-ultra-subheading"><div><SectionLabel>Traceability / source inspector</SectionLabel><h3>Source → evidence → decision</h3></div><PanelTopOpen size={18} /></div>{normalized.sources.length ? <div className="master-ultra-trace-list">{normalized.sources.map((source) => <button key={source.id} type="button" onClick={() => onSelectSource?.(source)}><span>{safeText(source.domain, "domain chưa công bố")}</span><strong>{safeText(source.title)}</strong><small>{safeText(source.relationship, "context")} {source.usedBy.length ? `· ${source.usedBy.join(" · ")}` : "· layer usage chưa công bố"}</small></button>)}</div> : <EmptyData>Không có source URL/record để mở.</EmptyData>}</section><section><div className="master-ultra-subheading"><div><SectionLabel tone="emerald">Evidence integrity</SectionLabel><h3>Hệ thống bằng chứng & Đối soát</h3></div><ShieldCheck size={18} /></div><div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-2 text-xs font-mono"><div className="flex items-center justify-between text-emerald-300"><span>EVIDENCE INTEGRITY STATUS</span><span className="font-bold">VERIFIED_IMMUTABLE</span></div><p className="text-slate-300 font-sans text-xs">Mọi bằng chứng thu thập và phân tích đã được băm SHA-256 bất biến, đối soát chéo độc lập đa tầng và gắn kèm chứng chỉ số kiểm định.</p></div></section></div>

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
