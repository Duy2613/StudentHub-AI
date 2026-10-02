"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
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
  ScanSearch,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import SourceInspectorDrawer from "./SourceInspectorDrawer";
import TrustVsExpertComparisonMatrix from "./TrustVsExpertComparisonMatrix";
import { TrustAiProvenance, TrustCaseActions } from "./TrustV4Result";
import TrustEvidenceCard, { isSafePublicUrl } from "./TrustEvidenceCard";
import {
  MASTER_ULTRA_STATES,
  normalizeMasterUltraRun,
} from "@/lib/ai-trust/v5/MasterUltraTrustModel.js";
import styles from "./TrustCanonicalLayout.module.css";

const INPUT_MODES = [
  { id: "text", label: "Văn bản", icon: ClipboardPaste },
  { id: "url", label: "Đường dẫn", icon: Globe2 },
  { id: "image", label: "Hình ảnh", icon: ImageIcon },
  { id: "qr", label: "Mã QR", icon: ScanSearch },
];
const EMPTY_SOURCES = Object.freeze([]);

const STATE_LABELS = {
  IDLE: "Sẵn sàng",
  INPUT_READY: "Đầu vào đã sẵn sàng",
  SUBMITTING: "Đang gửi · chờ trạng thái backend",
  L1_READY: "Deterministic Screen · sẵn sàng",
  L1_ENTER: "Deterministic Screen · backend đã bắt đầu",
  L1_RUNNING: "Deterministic Screen · đang chạy",
  L1_COMPLETE: "Deterministic Screen · hoàn tất",
  L2_ENTER: "Threat & Semantic Intelligence · backend đã bắt đầu",
  L2_RUNNING: "Threat & Semantic Intelligence · đang chạy",
  L2_COMPLETE: "Threat & Semantic Intelligence · hoàn tất",
  L3_ENTER: "Evidence Retrieval · backend đã bắt đầu",
  L3_RUNNING: "Evidence Retrieval · đang chạy",
  L3_COMPLETE: "Evidence Retrieval · hoàn tất",
  L4_ENTER: "Synthesis & Reasoning · backend đã bắt đầu",
  L4_RUNNING: "Synthesis & Reasoning · đang chạy",
  L4_COMPLETE: "Synthesis & Reasoning · hoàn tất",
  FINAL_PREDICT_LOCKED: "Final Predict · chưa được backend công bố",
  FINAL_PREDICT_PUBLISHED: "Final Predict · đã được backend công bố",
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

function stageStatusFor(layer, activeIndex, initialReady) {
  if (layer.status === "COMPLETE") return "complete";
  if (layer.status === "FAILED" || layer.status === "PARTIAL") return "attention";
  if (layer.status === "RUNNING" && layer.index === activeIndex) return "active";
  if (layer.locked) return "locked";
  if (initialReady && layer.index === 0) return "ready";
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

function ProgressRail({ normalized, activeIndex, initialReady = false, canInspect, onInspect }) {
  return (
    <nav className="master-ultra-rail" aria-label="Bốn lớp Trust chính" data-primary-layer-count="4">
      {normalized.macroStages.map((layer, index) => {
        const visualStatus = stageStatusFor({ ...layer, index }, activeIndex, initialReady);
        const content = (
          <>
            <span className="master-ultra-rail-symbol" aria-hidden="true">
              {visualStatus === "complete" ? <Check size={14} /> : visualStatus === "active" ? <span className="master-ultra-rail-dot" /> : visualStatus === "locked" ? <LockKeyhole size={13} /> : <span>{layer.code}</span>}
            </span>
            <span className="master-ultra-rail-copy">
              <span className="master-ultra-rail-code">{layer.shortName}</span>
              <strong>{layer.name}</strong>
              <small>{layer.locked ? "Khóa · chờ backend" : initialReady && index === 0 ? "Sẵn sàng" : statusLabel(layer.status)}</small>
            </span>
          </>
        );
        return canInspect && !layer.locked ? (
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
  hideHero,
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
  return (
    <form className={`master-ultra-composer ${hideHero ? "is-compact" : ""} ${styles.entry}`} aria-labelledby="master-ultra-input-title" onSubmit={(event) => { event.preventDefault(); if (!processing) onAnalyze?.(); }}>
      <div className="master-ultra-composer-panel">
        <div className={styles.composerHeading}>
          <p className={styles.eyebrow}>Bắt đầu từ thông tin bạn có</p>
          <h2 id="master-ultra-input-title">Bạn muốn kiểm chứng điều gì?</h2>
        </div>
        <div className="master-ultra-mode-switch" role="tablist" aria-label="Loại đầu vào Trust">
          {INPUT_MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} id={`trust-mode-${id}`} type="button" role="tab" aria-selected={mode === id} aria-controls="trust-input-panel" tabIndex={mode === id ? 0 : -1} disabled={processing} onClick={() => onModeChange?.(id)} onKeyDown={(event) => {
              const index = INPUT_MODES.findIndex((item) => item.id === id);
              const target = event.key === "ArrowRight" ? (index + 1) % INPUT_MODES.length : event.key === "ArrowLeft" ? (index + INPUT_MODES.length - 1) % INPUT_MODES.length : event.key === "Home" ? 0 : event.key === "End" ? INPUT_MODES.length - 1 : null;
              if (target === null) return;
              event.preventDefault();
              onModeChange?.(INPUT_MODES[target].id);
              event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[target]?.focus();
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <div id="trust-input-panel" role="tabpanel" aria-labelledby={`trust-mode-${mode}`}>
        {mode === "image" || mode === "qr" ? (
          <div
            className={`master-ultra-upload ${dragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`}
            tabIndex={0}
            role="group"
            aria-label={mode === "qr" ? "Chọn, thả hoặc dán ảnh mã QR" : "Chọn, thả hoặc dán hình ảnh"}
            onPaste={(event) => { const pastedFile = event.clipboardData.files?.[0]; if (pastedFile) { event.preventDefault(); onFileSelect?.(pastedFile); } }}
            onDragEnter={(event) => { event.preventDefault(); onDragStateChange?.(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { event.preventDefault(); onDragStateChange?.(false); }}
            onDrop={(event) => { event.preventDefault(); onDragStateChange?.(false); onFileSelect?.(event.dataTransfer.files?.[0]); }}
          >
            {preview ? (
              <>
                <div className="master-ultra-upload-preview flex items-center justify-center p-2 bg-black/40 rounded-xl border border-white/10">
                  {/* Local object URLs stay on-device and bypass Next's remote image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Ảnh bạn đã chọn để kiểm chứng"
                    className="w-full h-auto max-h-[320px] object-contain rounded-lg"
                    data-testid="trust-image-preview"
                  />
                  {ocr?.regions?.map((region) => <span key={region.id} className="master-ultra-ocr-region" style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }} aria-label={`${region.label} overlay`} />)}
                </div>
                <button type="button" className="master-ultra-upload-remove" onClick={onClearFile} aria-label="Bỏ ảnh đã chọn"><X size={15} /></button>
                {file?.name ? <span className="master-ultra-upload-filename">{file.name}</span> : null}
              </>
            ) : (
              <button type="button" className="master-ultra-upload-prompt" onClick={() => fileInputRef?.current?.click()}>
                <span className="master-ultra-upload-icon">{mode === "qr" ? <ScanSearch size={25} /> : <Upload size={25} />}</span>
                <strong>{mode === "qr" ? "Thả hoặc chọn ảnh mã QR" : "Thả hoặc chọn ảnh chụp"}</strong>
                <small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small>
              </button>
            )}
            <input id="trust-file" ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label={mode === "qr" ? "Chọn ảnh mã QR cần phân tích" : "Chọn ảnh chụp cần phân tích"} className="sr-only" disabled={processing} onChange={(event) => onFileSelect?.(event.target.files?.[0])} />
          </div>
        ) : (
          <label className="master-ultra-text-field">
            <span>{mode === "url" ? "Đường dẫn cần đối chiếu" : "Nội dung cần kiểm chứng"}</span>
            <textarea aria-label={mode === "url" ? "Đường dẫn cần đối chiếu" : "Nội dung cần kiểm chứng"} value={content} onChange={(event) => onContentChange?.(event.target.value)} rows={6} disabled={processing} placeholder={mode === "url" ? "https://..." : "Dán thông báo, một nhận định hoặc nội dung bạn chưa chắc chắn…"} />
          </label>
        )}
        </div>
        <p className={styles.inputHelper}>{mode === "text" ? "Bạn có thể gửi nội dung chứa nhiều mệnh đề. Hệ thống sẽ hiển thị phần được trích xuất." : mode === "url" ? "Dán đường dẫn nguồn gốc. Nội dung nguồn sẽ được đối chiếu với mệnh đề cần kiểm chứng." : "Chọn ảnh PNG, JPG hoặc WebP, tối đa 8 MB. Nội dung trích xuất từ ảnh chưa tự trở thành bằng chứng."}</p>
        <div className="master-ultra-composer-footer">
          <span className="master-ultra-quiet-note">Nội dung được gửi đến hệ thống xử lý.<br />Hãy loại bỏ thông tin riêng tư không cần thiết.</span>
          <button type="submit" className="master-ultra-submit" disabled={processing || ((mode === "image" || mode === "qr") && !file)}>
            {processing ? <LoaderCircle className="animate-spin" size={16} /> : <ScanSearch size={16} />}
            {hasResult ? "Kiểm chứng nội dung mới" : "Kiểm chứng"} <ArrowRight size={15} />
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
                ? "BLOCKED_BY_LOCAL_POLICY"
                : "NOT_BLOCKED_BY_LOCAL_POLICY"
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
                  : "text-slate-300 font-normal"
              }>
                {/^(javascript:|data:|file:|vbscript:)/i.test(ocr.qrContent) ||
                /(localhost|127\.0\.0\.1|169\.254\.169\.254|192\.168\.|10\.)/i.test(ocr.qrContent) ||
                /@/i.test(ocr.qrContent)
                  ? "BỊ CHẶN BỞI KIỂM TRA ĐẦU VÀO"
                  : "CHƯA BỊ CHẶN BỞI KIỂM TRA ĐẦU VÀO"}
              </strong></span>
              <span>ĐIỀU HƯỚNG TỰ ĐỘNG: <strong className="text-slate-300">KHÔNG</strong></span>
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
        {sourceProvenance || demoEnabled ? <SourceDisclosure provenance={sourceProvenance} sourceMode={sourceProvenance?.sourceMode || "DEMO"} /> : null}
        {(file || content) && <button type="button" className="master-ultra-reset" disabled={processing} onClick={onReset}>Làm mới đầu vào</button>}
      </div>
      <aside className={styles.guide} aria-labelledby="trust-guide-title">
        <p className={styles.eyebrow}>Một kết quả có thể kiểm tra lại</p>
        <h2 id="trust-guide-title">Bằng chứng trước.<br />Kết luận sau.</h2>
        <ol>
          <li><span>01</span><div><strong>Nhận diện mệnh đề</strong><p>Biết chính xác nội dung đang được kiểm chứng.</p></div></li>
          <li><span>02</span><div><strong>Đọc bằng chứng và nguồn</strong><p>Phân biệt điều ủng hộ, phản bác và chưa rõ.</p></div></li>
          <li><span>03</span><div><strong>Hiểu giới hạn kết luận</strong><p>Có cơ sở để chọn bước tiếp theo.</p></div></li>
        </ol>
        <p className={styles.guideFoot}>Không phải mọi thông tin đều có đủ bằng chứng để kết luận.</p>
      </aside>
    </form>
  );
}

function ObservedInputPanel({ mode, content, file, preview, ocr }) {
  const hasText = typeof content === "string" && content.trim().length > 0;
  const excerpt = hasText ? content.trim() : null;
  const fileFacts = file ? [
    file.name ? `Tên tệp: ${file.name}` : null,
    file.type ? `MIME: ${file.type}` : null,
    Number.isFinite(file.size) ? `Kích thước: ${file.size.toLocaleString()} bytes` : null,
  ].filter(Boolean) : [];

  return (
    <section className="master-ultra-observed-input rounded-xl border border-white/10 bg-slate-950/60 p-4" aria-labelledby="trust-observed-input-title" data-testid="trust-observed-input">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel tone="cyan">Observed Input</SectionLabel>
          <h2 id="trust-observed-input-title" className="mt-1 text-base font-semibold text-white">Đầu vào đang được kiểm tra</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-slate-300">{inputTypeLabel(mode)}</span>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
        {excerpt ? <p className="whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3">{excerpt}</p> : null}
        {fileFacts.length ? <ul className="space-y-1">{fileFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul> : null}
        {!excerpt && !preview && !file ? <EmptyData>Chưa có nội dung hoặc tệp được chọn.</EmptyData> : null}
        {ocr?.text || ocr?.qrContent ? (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
            <strong className="block text-[10px] font-mono uppercase tracking-wide text-amber-200">Client OCR hint · chưa phải backend evidence</strong>
            <p className="mt-1 whitespace-pre-wrap break-words">{safeText(ocr.text || ocr.qrContent)}</p>
          </div>
        ) : null}
        <p className="text-[11px] text-slate-500">Chỉ hiển thị nội dung người dùng cung cấp và gợi ý OCR cục bộ. Không suy diễn kết quả xác minh từ bản nháp.</p>
      </div>
    </section>
  );
}

function ClaimLayer({ layer }) {
  const isImage = layer.inputType === "image" || Boolean(layer.imageType);
  const isQr = layer.inputType === "qr" || layer.qrDetected;
  return (
    <div className="master-ultra-layer-content space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-2">
        <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <Image
            src="/media/v3/trust/l1-claim.webp"
            alt="Minh họa cấu trúc bóc tách mệnh đề Layer 1"
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="master-ultra-claim-object flex-1">
          <SectionLabel tone="ice">Deterministic Screen</SectionLabel>
          <blockquote>{safeText(layer.summary, "Chưa có kết quả kiểm tra tất định được backend công bố.")}</blockquote>
          <span className="master-ultra-object-caption">Chỉ hiển thị quan sát kỹ thuật đã được backend trả về; claim extraction nằm ở lớp kế tiếp.</span>
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
          <strong className={`text-sm font-mono ${layer.screenResult === 'BLOCK' ? 'text-rose-400' : layer.screenResult === 'REVIEW' ? 'text-amber-400' : layer.screenResult === 'PASS' ? 'text-emerald-400' : 'text-slate-300'}`}>
            {layer.screenResult || "NOT_ASSESSED"}
          </strong>
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Risk Level</span>
          <strong className={`text-sm font-mono ${layer.risk === 'HIGH' || layer.risk === 'CRITICAL' ? 'text-rose-400' : layer.risk === 'MEDIUM' ? 'text-amber-400' : layer.risk === 'LOW' ? 'text-emerald-400' : 'text-slate-300'}`}>
            {layer.risk || "UNKNOWN"}
          </strong>
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Confidence</span>
          <strong className="text-sm font-mono text-slate-200">
            {layer.confidence !== null && layer.confidence !== undefined ? (typeof layer.confidence === "number" ? `${Math.round(layer.confidence * 100)}%` : String(layer.confidence)) : "Chưa được định lượng"}
          </strong>
        </div>
      </div>

      {/* Detected Signals & Invariants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded border border-white/10 bg-black/20">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">QR DETECTED</span>
          <strong className={`text-sm font-mono ${layer.qrDetected ? 'text-emerald-400' : 'text-slate-400'}`}>
            {layer.qrDetected === true ? "YES" : layer.qrDetected === false ? "NO" : "NOT_ASSESSED"}
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
            {layer.detectedUrls?.length ? layer.detectedUrls.join(", ") : "Chưa công bố"}
          </strong>
        </div>
      </div>

      {/* Image / Media Artifact Details (shown when input is image or QR) */}
      {(isImage || isQr) && (
        <div className="p-3 rounded border border-white/10 bg-white/[0.02] text-xs font-mono space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Media Artifact Intake</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <p><span className="text-slate-500">Media Artifact: </span><span className="text-slate-200">{safeText(layer.mediaArtifact)}</span></p>
            <p><span className="text-slate-500">Image Type: </span><span className="text-slate-200">{safeText(layer.imageType)}</span></p>
            <p><span className="text-slate-500">Dimensions: </span><span className="text-slate-200">{safeText(layer.dimensions)}</span></p>
            <p><span className="text-slate-500">QR Count: </span><span className="text-slate-200">{layer.qrCount ?? "Chưa công bố"}</span></p>
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
            <EmptyData>Chưa có tín hiệu kỹ thuật nào được backend công bố.</EmptyData>
          )}
        </article>
        <article><SectionLabel>Backend stage</SectionLabel><p className="mt-2 text-xs text-slate-400">{layer.status === "WAITING" ? "Chưa có stage result được công bố." : statusLabel(layer.status)}</p></article>
      </div>

      {/* Next Stage Indicator */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Tiếp theo: <strong className="text-slate-200">{layer.nextStage || "Threat & Semantic Intelligence"}</strong></span>
        <span className="text-[11px] font-mono text-emerald-400/80">Lớp 1 / Deterministic Screen</span>
      </div>

      {/* Collapsible Technical Details */}
      <TechnicalDetails data={{
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

function DiscoveryLayer({ layer }) {
  const threat = layer.threatIntelligence || {};
  const semantic = layer.semanticIntelligence || {};
  const domain = layer.studentDomainRisk || {};
  const forensics = layer.mediaForensics || null;

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Intro visual */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-2 items-center">
        <div className="relative md:col-span-4 rounded overflow-hidden border border-white/10 aspect-video bg-black/40">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/media/v3/trust/l2-discovery-poster.webp"
            src="/media/v3/trust/l2-discovery.mp4"
            className="w-full h-full object-cover"
          />
          <Image
            src="/media/v3/trust/l2-discovery-poster.webp"
            alt="Evidence discovery visual loop"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="video-fallback-poster hidden w-full h-full object-cover"
          />
        </div>
        <div className="md:col-span-8 master-ultra-network-intro m-0">
          <div className="master-ultra-claim-node"><span>CLAIMS</span><strong>{layer.claims?.length ? `${layer.claims.length} extracted` : "Awaiting extraction"}</strong></div>
          <Network size={22} />
          <div className="master-ultra-network-copy"><SectionLabel tone="cyan">Threat & Semantic Intelligence</SectionLabel><p>Đối chiếu claim extraction, threat intelligence, ngữ nghĩa và student-domain signals.</p></div>
        </div>
      </div>

      <section className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3.5" aria-label="Claim extraction">
        <div className="flex items-center justify-between gap-3"><SectionLabel tone="cyan">Claim Extraction</SectionLabel><span className="text-xs text-slate-400">{layer.claims?.length ? `${layer.claims.length} claim(s)` : "Chưa công bố"}</span></div>
        {layer.claims?.length ? <ul className="mt-2 space-y-2">{layer.claims.map((claim) => <li key={claim.id} className="rounded bg-black/20 p-2.5 text-xs text-slate-200"><strong className="mr-2 font-mono text-cyan-300">{claim.id}</strong>{claim.text}</li>)}</ul> : <EmptyData>Chưa có claim nào được backend tách từ đầu vào.</EmptyData>}
      </section>

      {/* Part A: Threat Intelligence */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">A. Threat Intelligence</span>
          <span className="font-mono text-[11px] text-slate-400">Provider: <strong className="text-slate-200">{threat.provider || "Chưa ghi nhận"}</strong></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div><span className="text-slate-400 block text-[10px]">Lookup Status: </span><strong className={threat.status === 'THREAT_MATCH' ? 'text-rose-400' : threat.status === 'NO_KNOWN_THREAT' ? 'text-emerald-400' : 'text-slate-300'}>{threat.status || (layer.inputType === "url" ? "NOT_CHECKED" : "NOT_APPLICABLE")}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">Confidence: </span><strong className="text-slate-200">{threat.confidence || "Not provided"}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">Categories: </span><strong className="text-slate-200">{threat.threatCategories?.length ? threat.threatCategories.join(", ") : "Not reported"}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">DNS / Screening: </span><strong className="text-slate-300">{threat.dnsScreening || "NOT_REPORTED"}</strong></div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{threat.reason || (layer.inputType === "url" ? "Chưa có kết quả threat-intelligence được ghi nhận." : "Threat intelligence không áp dụng cho nội dung phi URL.")}</p>
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
          <span className="font-mono text-[11px] text-slate-400">Intent: <strong className="text-slate-200">{semantic.intent || "NOT_CLASSIFIED"}</strong></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div><span className="text-slate-400 block text-[10px]">Urgency: </span><strong className={semantic.urgency === 'HIGH' ? 'text-rose-400' : 'text-slate-200'}>{semantic.urgency || "NOT_ASSESSED"}</strong></div>
          <div><span className="text-slate-400 block text-[10px]">Impersonation: </span><strong className={semantic.impersonation === 'YES' ? 'text-rose-400' : 'text-slate-200'}>{semantic.impersonation || "NOT_ASSESSED"}</strong></div>
          <div className="col-span-2"><span className="text-slate-400 block text-[10px]">Entities: </span><span className="text-slate-300 truncate block">{semantic.entities?.length ? semantic.entities.map(e => objectLabel(e)).join(", ") : "Not reported"}</span></div>
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
          <span className="font-mono text-[11px] text-slate-400">Pattern: <strong className="text-slate-200">{domain.matchedPattern || "NOT_ASSESSED"}</strong></span>
        </div>
        <div className="text-xs font-mono">
          <span className="text-slate-400">Domain Risk: </span>
          <strong className={domain.domainRisk === 'HIGH' || domain.domainRisk === 'CRITICAL' ? 'text-rose-400' : domain.domainRisk === 'MEDIUM' ? 'text-amber-400' : domain.domainRisk === 'LOW' ? 'text-emerald-400' : 'text-slate-300'}>
            {domain.domainRisk || "UNKNOWN"}
          </strong>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{domain.reason || "Chưa có đánh giá rủi ro theo miền được ghi nhận."}</p>
        <div className="pt-1 text-[11px] font-mono text-slate-400">
          <span>Khuyến nghị phòng ngừa: </span>
          <strong className="text-slate-300 font-normal">{domain.recommendedCaution || "Chưa có khuyến nghị được ghi nhận."}</strong>
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
        <span className="text-[11px] font-mono text-cyan-400/80">Layer 2 · Threat & Semantic Intelligence</span>
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
  const sources = Array.isArray(layer.sources) ? layer.sources : EMPTY_SOURCES;
  const evidenceItems = Array.isArray(layer.evidenceItems) ? layer.evidenceItems : EMPTY_SOURCES;
  const sourceById = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);

  // Sort sources: primary/official -> independent high-quality -> contradicting -> context -> remaining secondary
  const sortedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      const typeA = String(a.sourceType || "").toLowerCase();
      const typeB = String(b.sourceType || "").toLowerCase();
      const isOfficialA = typeA.includes("official") || typeA.includes("primary") || typeA.includes("academic");
      const isOfficialB = typeB.includes("official") || typeB.includes("primary") || typeB.includes("academic");
      if (isOfficialA && !isOfficialB) return -1;
      if (!isOfficialA && isOfficialB) return 1;

      const relA = String(evidenceItems.find((item) => item.sourceId === a.id)?.relationship || "context").toLowerCase();
      const relB = String(evidenceItems.find((item) => item.sourceId === b.id)?.relationship || "context").toLowerCase();
      if (relA.includes("contrad") && !relB.includes("contrad")) return -1;
      if (!relA.includes("contrad") && relB.includes("contrad")) return 1;
      return 0;
    });
  }, [sources, evidenceItems]);

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
        <div className="relative w-full sm:w-44 h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <Image
            src="/media/v3/trust/l3-forensics.webp"
            alt="Forensics comparison visual"
            fill
            sizes="(max-width: 640px) 100vw, 176px"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="master-ultra-forensics-map flex-1 m-0" aria-hidden="true"><span>SUPPORTING</span><i /><b>CLAIM</b><i /><span>CONTRADICTING</span></div>
      </div>

      {/* Web Search & Source Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Retrieval Provider</span>
            <strong className="text-emerald-400">{safeText(layer.retrievalProvider, "Chưa ghi nhận")}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Evidence Collected</span>
            <strong className="text-cyan-300">{safeText(layer.sourceCount, "Chưa công bố")}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Evidence Status</span>
          <strong className={layer.evidenceStatus === 'CONFLICTED' ? 'text-amber-400' : 'text-slate-200'}>
            {safeText(layer.evidenceStatus, "Chưa công bố")}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] uppercase">Source Independence</span>
          <strong className="text-slate-200">{safeText(layer.sourceIndependence, "Chưa công bố")}</strong>
        </div>
      </div>

      {/* Query & Freshness Metadata */}
      <div className="p-2.5 rounded bg-black/30 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div>
          <span>Query đã rà soát: </span>
          <strong className="text-slate-200 font-normal italic">“{layer.canonicalClaim || "Chưa ghi nhận truy vấn"}”</strong>
        </div>
        <div>
          <span>Độ tươi (Freshness): </span>
          <strong className="text-cyan-300">{safeText(layer.freshness, "Chưa công bố")}</strong>
        </div>
      </div>

      {layer.openAlexDiscovery ? <section className="rounded-lg border border-indigo-400/20 bg-indigo-400/[0.04] p-3" data-testid="trust-openalex-context">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><SectionLabel tone="violet">OpenAlex · academic metadata</SectionLabel><h3 className="mt-1 text-sm font-semibold text-slate-100">Bối cảnh học thuật để mở rộng tra cứu</h3></div>
          <span className="rounded border border-indigo-300/20 px-2 py-1 font-mono text-[10px] text-indigo-200">{safeText(layer.openAlexDiscovery.status)}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{safeText(layer.openAlexDiscovery.notice)}</p>
        {[['Nghiên cứu', layer.openAlexDiscovery.works], ['Tổ chức', layer.openAlexDiscovery.institutions], ['Chủ đề', layer.openAlexDiscovery.topics]].map(([label, records]) => records?.length ? <div key={label} className="mt-3">
          <strong className="text-[11px] uppercase tracking-wide text-slate-300">{label}</strong>
          <ul className="mt-1 space-y-1.5">{records.map((record, index) => <li key={record.sourceId || `${label}-${index}`} className="rounded border border-white/5 bg-black/20 px-2.5 py-2 text-xs">
            {isSafePublicUrl(record.url) ? <a className="font-medium text-indigo-200 hover:underline" href={record.url} target="_blank" rel="noreferrer">{safeText(record.title)} <ExternalLink size={11} className="inline" /></a> : <strong className="text-slate-200">{safeText(record.title)}</strong>}
            <div className="mt-1 text-[10px] text-slate-500">{[record.publishedAt, record.countryCode, record.field, record.subfield, record.doi, Number.isFinite(record.citedByCount) ? `${record.citedByCount} citations` : null].filter(Boolean).join(" · ")}</div>
          </li>)}</ul>
        </div> : null)}
        {!layer.openAlexDiscovery.works?.length && !layer.openAlexDiscovery.institutions?.length && !layer.openAlexDiscovery.topics?.length ? <p className="mt-2 text-xs text-slate-500">Lần tra cứu này chưa trả metadata học thuật dùng được.</p> : null}
      </section> : null}

      {/* Source Distribution: Supporting / Contradicting / Context */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <span className="block text-[10px] uppercase text-emerald-400/70">Supporting</span>
          <strong className="text-base">{safeText(layer.supportingCount, "Chưa công bố")}</strong>
        </div>
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <span className="block text-[10px] uppercase text-rose-400/70">Contradicting</span>
          <strong className="text-base">{safeText(layer.contradictingCount, "Chưa công bố")}</strong>
        </div>
        <div className="p-2 rounded bg-slate-500/10 border border-slate-500/20 text-slate-300">
          <span className="block text-[10px] uppercase text-slate-400/70">Context</span>
          <strong className="text-base">{safeText(layer.contextCount, "Chưa công bố")}</strong>
        </div>
      </div>

      {/* Real Clickable Sources List (TrustEvidenceCard with Sorting) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Sources ({safeText(layer.sourceCount, "Chưa công bố")})
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Nguồn được lưu riêng với evidence trích xuất
          </span>
        </div>

        {sortedSources.length > 0 ? (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {sortedSources.map((src, index) => (
              <TrustEvidenceCard
                key={`${src.id || src.url || "source"}-${index}`}
                evidence={src}
                onSelect={onSelectSource}
              />
            ))}
          </div>
        ) : (
          <EmptyData>Không có nguồn bằng chứng trực tiếp cho mệnh đề này.</EmptyData>
        )}
      </div>

      <div className="space-y-2" data-testid="trust-evidence-items">
        <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">Evidence items ({safeText(layer.evidenceCount, "Chưa công bố")})</span><span className="text-[11px] text-slate-500">Mỗi item giữ sourceId và relation riêng</span></div>
        {evidenceItems.length ? <ul className="space-y-2">{evidenceItems.map((item) => {
          const source = sourceById.get(item.sourceId);
          return <li key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-cyan-200">{item.id}</strong><span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">{safeText(item.relationship)}</span>{item.type ? <span className="text-slate-500">{item.type}</span> : null}</div>
            <p className="mt-2 whitespace-pre-wrap text-slate-200">{safeText(item.excerpt, "Không có excerpt được công bố.")}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><span>Claims: {item.claimIds.length ? item.claimIds.join(", ") : "Chưa liên kết"} · Source: {safeText(item.sourceId)}</span>{source ? <button type="button" onClick={() => onSelectSource?.(source)} className="text-cyan-300 hover:underline">Mở nguồn {source.title}</button> : null}</div>
          </li>;
        })}</ul> : <EmptyData>Không có evidence item được backend công bố. Nguồn URL riêng lẻ không được tính là evidence.</EmptyData>}
      </div>

      {/* Epistemic disclaimer */}
      <div className="p-2.5 rounded bg-white/[0.02] border border-white/10 text-slate-400 text-xs leading-relaxed">
        <Info size={13} className="inline mr-1 text-cyan-400 -mt-0.5" />
        {layer.deferredNote || "Retrieval records sources and evidence; the result is published separately by Final Predict."}
      </div>

      {/* Next Stage */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Next: <strong className="text-slate-200">{layer.nextStage || "Continue → Layer 4"}</strong></span>
        <span className="text-[11px] font-mono text-tension">Layer 3 · Evidence Retrieval</span>
      </div>

      <TechnicalDetails data={{
        sources: layer.sources,
        evidenceItems: layer.evidenceItems,
        conflicts: layer.conflicts,
        uncertainty: layer.uncertainty,
        sourceAgreement: layer.sourceAgreement,
      }} title="Layer 3 Diagnostics" />
    </div>
  );
}



function AiVerificationLayer({ layer, onSelectSource }) {
  const status = String(layer.aiVerificationStatus || "NOT_REPORTED").toUpperCase();
  const sources = Array.isArray(layer.sources) ? layer.sources : EMPTY_SOURCES;
  const evidenceItems = Array.isArray(layer.evidenceItems) ? layer.evidenceItems : EMPTY_SOURCES;

  const supportingCount = layer.supportingCount;
  const contradictingCount = layer.contradictingCount;
  const contextCount = layer.contextCount;
  const independentGroupsCount = Number.isFinite(layer.independentGroupsCount)
    ? layer.independentGroupsCount
    : "Chưa xác định";

  const confidenceValue = layer.aiConfidence != null
    ? (typeof layer.aiConfidence === "number" ? `${Math.round(layer.aiConfidence * 100)}%` : String(layer.aiConfidence))
    : "Chưa được định lượng";

  const conflicts = layer.conflicts || [];
  const uncertainties = layer.uncertainties || layer.uncertainty || [];

  const reasons = layer.reasons || [];

  // 2-5 sentence AI synthesis
  const synthesis = layer.aiSynthesis || layer.reasoningSummary || "Chưa có phần tổng hợp được backend công bố trong phản hồi này.";

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* 1. Primary AI Verification Banner */}
      <div className="p-4 rounded-lg border border-violet-500/30 bg-violet-950/15 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-violet-300 uppercase tracking-wider">
              SYNTHESIS & REASONING
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wide border border-violet-400/40 text-violet-200 bg-violet-500/20">
              {safeText(layer.advisoryResult)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-1.5 py-0.5 rounded bg-black/40">
              Advisory signal · Final Predict remains separate
            </span>
          </div>
        </div>

        {/* AI Confidence & Core Signals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Advisory signal</span>
            <strong className="text-sm text-violet-300 font-bold">{safeText(layer.advisoryResult)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Confidence</span>
            <strong className="text-sm text-slate-200 font-bold">{confidenceValue}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Evidence Agreement</span>
            <strong className="text-sm text-emerald-300 font-bold">{safeText(layer.agreement, "Chưa tính")}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Source Quality</span>
            <strong className="text-sm text-cyan-300 font-bold">{safeText(layer.sourceQuality, "Chưa tính")}</strong>
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
            <span className="block text-[10px] uppercase text-emerald-400/70">Supporting evidence</span>
            <strong className="text-base">{safeText(supportingCount, "Chưa công bố")}</strong>
          </div>
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <span className="block text-[10px] uppercase text-rose-400/70">Contradicting evidence</span>
            <strong className="text-base">{safeText(contradictingCount, "Chưa công bố")}</strong>
          </div>
          <div className="p-2 rounded bg-slate-500/10 border border-slate-500/20 text-slate-300">
            <span className="block text-[10px] uppercase text-slate-400/70">Context evidence</span>
            <strong className="text-base">{safeText(contextCount, "Chưa công bố")}</strong>
          </div>
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <span className="block text-[10px] uppercase text-cyan-400/70">Independent groups</span>
            <strong className="text-base">{independentGroupsCount}</strong>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-xs font-mono text-center">
          <div>
            <span className="text-slate-400 block text-[10px]">Evidence Agreement</span>
            <strong className="text-emerald-400">{safeText(layer.agreement, "Chưa tính")}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Source Quality</span>
            <strong className="text-cyan-400">{safeText(layer.sourceQuality, "Chưa tính")}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Evidence Sufficiency</span>
            <strong className="text-slate-200">{safeText(layer.evidenceSufficiency, "Chưa đánh giá")}</strong>
          </div>
        </div>
      </div>

      {/* 4. BẰNG CHỨNG AI ĐÃ ĐỐI CHIẾU (Real Evidence Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            SOURCES REFERENCED BY SYNTHESIS ({sources.length})
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Nguồn được tách khỏi evidence item
          </span>
        </div>

        {sources.length > 0 ? (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {sources.map((src, idx) => (
              <TrustEvidenceCard
                key={`${src.id || src.url || "source"}-${idx}`}
                evidence={src}
                onSelect={onSelectSource}
              />
            ))}
          </div>
        ) : (
          <EmptyData>Chưa có source record được ghi nhận trong phản hồi.</EmptyData>
        )}
      </div>

      <div className="space-y-2" data-testid="trust-synthesis-evidence">
        <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">Evidence items referenced ({evidenceItems.length})</span>
        {evidenceItems.length ? <ul className="space-y-2">{evidenceItems.map((item) => <li key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-cyan-200">{item.id}</strong><span className="text-slate-400">{safeText(item.relationship)}</span></div><p className="mt-1 text-slate-200">{safeText(item.excerpt, "Không có excerpt được công bố.")}</p><small className="mt-1 block text-slate-500">Source ID: {safeText(item.sourceId)} · Claims: {item.claimIds.length ? item.claimIds.join(", ") : "Chưa liên kết"}</small></li>)}</ul> : <EmptyData>Chưa có evidence item nào được ghi nhận.</EmptyData>}
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
            Chưa có đánh giá hoặc dữ liệu mâu thuẫn được ghi nhận.
          </p>
        )}
      </div>

      {/* 6. ĐIỀU AI CHƯA THỂ XÁC NHẬN */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <span className="font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          ĐIỀU AI CHƯA THỂ XÁC NHẬN (Explicit Uncertainties)
        </span>
        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside font-sans leading-relaxed">
          {uncertainties.length ? uncertainties.map((unc, idx) => (
            <li key={idx}>
              {typeof unc === "string" ? unc : unc.text || unc.detail || "Chi tiết bổ sung chưa xác định."}
            </li>
          )) : <li>Chưa có uncertainty được ghi nhận trong phản hồi.</li>}
        </ul>
      </div>

      {/* 7. WHY THIS AI ADVISORY? */}
      <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
        <span className="font-mono text-xs font-semibold text-violet-300 uppercase tracking-wider block">
          WHY THIS AI ADVISORY? (Căn cứ khuyến nghị)
        </span>
        <ol className="space-y-1.5 text-xs text-slate-200 list-decimal list-inside font-sans leading-relaxed">
          {reasons.length ? reasons.map((reason, idx) => (
            <li key={idx} className="pl-1">
              {typeof reason === "string" ? reason : reason.text || reason.detail}
            </li>
          )) : <li>Chưa có căn cứ tư vấn được ghi nhận.</li>}
        </ol>
      </div>

      {/* Next Stage */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Next: <strong className="text-slate-200">{layer.nextStage || "Final Predict · Deterministic"}</strong></span>
        <span className="text-[11px] font-mono text-violet-400/80">Layer 4 · {status}</span>
      </div>

    </div>
  );
}

function DecisionLayer({ layer, onSelectSource }) {
  const twin = layer.decisionTwin;
  const drivers = twin && Array.isArray(twin.decisionDrivers) ? twin.decisionDrivers : [];
  const reversal = twin && Array.isArray(twin.reversalConditions) ? twin.reversalConditions : [];
  const reasons = layer.reasons || [];
  const keyEvidence = layer.keyEvidence || [];

  return (
    <div className="master-ultra-layer-content space-y-4">
      {/* Visual Seal & Verdict Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-2">
        <div className="relative w-24 h-24 rounded border border-white/10 overflow-hidden flex-shrink-0 bg-black/40">
          <Image
            src="/media/v3/trust/l5-decision.webp"
            alt="Final Predict deterministic result"
            fill
            sizes="96px"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="master-ultra-decision-hero flex-1 m-0">
          <SectionLabel tone="gold">FINAL PREDICT · DETERMINISTIC</SectionLabel>
          <strong className="block text-2xl font-serif text-white mt-1 tracking-tight">
            {safeText(layer.verdict)}
          </strong>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {safeText(layer.nextAction, "Chưa có khuyến nghị được ghi nhận.")}
          </p>
        </div>
      </div>

      {/* Authority & Deterministic Policy Badge */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
        <ShieldCheck size={14} />
        <span>Authority: <strong>{safeText(layer.authority, "MAIN_TRUST_V5")}</strong></span>
        <span className="text-slate-400">·</span>
        <span>AI owns final result: <strong>NO</strong></span>
        <span className="text-slate-400">·</span>
        <span>Expert overwrites Trust: <strong>NO</strong></span>
      </div>

      {/* Metrics Grid */}
      <dl className="master-ultra-decision-metrics grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <dt>Trust Confidence</dt>
          <dd>{safeText(layer.confidence, "Chưa được định lượng")}</dd>
        </div>
        <div>
          <dt>Evidence Sufficiency</dt>
          <dd>{safeText(layer.evidenceSufficiency, "Chưa đánh giá")}</dd>
        </div>
        <div>
          <dt>Security Risk</dt>
          <dd>{safeText(layer.securityRisk, "Chưa đánh giá")}</dd>
        </div>
        <div>
          <dt>Human Expert Review</dt>
          <dd>{safeText(layer.humanReviewState, "Chưa ghi nhận")}</dd>
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
          <p className="text-xs text-slate-400 italic">Chưa có lý do đánh giá được ghi nhận.</p>
        )}
      </div>

      {/* Key Evidence (Rendered via TrustEvidenceCard) */}
      {keyEvidence.length > 0 && (
        <div className="p-3.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-2">
          <span className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Evidence used by this result ({keyEvidence.length})
          </span>
          <ul className="space-y-2">{keyEvidence.map((item) => {
            const source = (layer.sources || []).find((candidate) => candidate.id === item.sourceId);
            return <li key={item.id} className="rounded border border-white/10 bg-black/20 p-2.5 text-xs"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-cyan-200">{item.id}</strong><span className="text-slate-400">{safeText(item.relationship)}</span></div><p className="mt-1 text-slate-200">{safeText(item.excerpt, "Excerpt chưa công bố.")}</p><small className="text-slate-500">Source ID: {safeText(item.sourceId)} · Claims: {item.claimIds?.length ? item.claimIds.join(", ") : "Chưa liên kết"}</small>{source ? <button type="button" onClick={() => onSelectSource?.(source)} className="ml-2 text-cyan-300 hover:underline">Mở source record</button> : null}</li>;
          })}</ul>
        </div>
      )}

      {/* What the User Should Do Next */}
      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/10 text-xs text-slate-300 leading-relaxed">
        <strong className="text-emerald-300 font-mono block mb-1 uppercase tracking-wider text-[11px]">
          Khuyến nghị tiếp theo
        </strong>
        {safeText(layer.nextAction, "Chưa có khuyến nghị được ghi nhận.")}
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
      }} title="Final Predict Diagnostics" />
    </div>
  );
}

function LayerDetail({ layer, onSelectSource }) {
  if (layer.id === "l1") return <ClaimLayer layer={layer.data} />;
  if (layer.id === "l2") return <DiscoveryLayer layer={layer.data} />;
  if (layer.id === "l3") return <ForensicsLayer layer={layer.data} onSelectSource={onSelectSource} />;
  if (layer.id === "l4") return <AiVerificationLayer layer={layer.data} onSelectSource={onSelectSource} />;
  return null;
}

function FinalPredictPanel({ normalized, onSelectSource }) {
  const result = normalized.finalPredict;
  const published = result.status === "PUBLISHED";
  return (
    <section id="trust-final-predict" tabIndex={-1} className={`master-ultra-final-predict ${styles.final}`} data-testid="trust-final-predict" data-status={published ? "PUBLISHED" : "LOCKED"} aria-labelledby="trust-final-predict-title">
      <div className={styles.finalHeader}>
        <span className={styles.finalIcon}>{published ? <ShieldCheck size={24} /> : <LockKeyhole size={24} />}</span>
        <div><p className={styles.finalEyebrow}>Final Predict · Deterministic</p><h2 id="trust-final-predict-title">{published ? "Kết luận kiểm chứng" : "Final Predict đang khóa"}</h2><p className={styles.finalCaption}>{published ? "Kết luận từ bốn lớp phân tích. Đọc cùng bằng chứng và giới hạn bên dưới." : "Chỉ mở khi backend công bố kết quả cuối cùng."}</p></div>
        <span className={styles.status}>{published ? <Check size={12} /> : <LockKeyhole size={12} />}{published ? "Đã công bố" : "Đang khóa"}</span>
      </div>
      {published ? <div className={styles.finalBody} data-testid="trust-conclusion"><DecisionLayer layer={result} onSelectSource={onSelectSource} /></div> : null}
    </section>
  );
}

const LAYER_ICONS = { l1: ShieldCheck, l2: Brain, l3: Search, l4: Sparkles };

function PipelineLayers({ normalized, selectedLayerId, onSelectLayer, onInspect, onSelectSource, journeyState }) {
  return <section className={styles.layers} aria-label="Chi tiết bốn lớp kiểm chứng">
    {normalized.macroStages.map((layer, index) => {
      const expanded = !layer.locked && selectedLayerId === layer.id;
      const Icon = LAYER_ICONS[layer.id];
      return <article className={styles.layer} key={layer.id} data-status={layer.status} data-locked={layer.locked}>
        <button id={`trust-stage-${layer.id}`} type="button" className={styles.layerButton} data-testid={`rail-layer${index + 1}`} data-status={layer.status} disabled={layer.locked} aria-expanded={expanded} aria-controls={`trust-stage-body-${layer.id}`} onClick={() => onSelectLayer?.(expanded ? null : layer.id)}>
          <span className={styles.layerIcon}><Icon size={20} /></span>
          <span className={styles.layerHeading}><strong>{layer.code} · {layer.name}</strong><small>{layer.locked ? "Đang chờ lớp trước." : safeText(layer.summary, layer.questionVi)}</small></span>
          <span className={styles.status}>{layer.locked ? <LockKeyhole size={12} /> : layer.status === "COMPLETE" ? <Check size={12} /> : layer.status === "RUNNING" ? <LoaderCircle size={12} className="animate-spin" /> : null}{layer.locked ? "Đang khóa" : statusLabel(layer.status)}</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <div id={`trust-stage-body-${layer.id}`} hidden={!expanded} className={styles.layerBody} data-testid={expanded ? "trust-active-layer" : undefined} data-layer-id={layer.id} data-journey-state={journeyState}>{expanded ? <>
          <div className={styles.layerDetailHeading}><h3>{layer.name}</h3>{onInspect ? <button type="button" onClick={() => onInspect(layer.id)}>Mở chi tiết <PanelTopOpen size={14} /></button> : null}</div>
          <LayerDetail layer={layer} onSelectSource={onSelectSource} />
        </> : null}</div>
      </article>;
    })}
  </section>;
}

function Overview({ normalized, onInspect, onEdit, onNewAnalysis, onPrint, onSelectSource, resultModel, authenticated, stale, analysisSummary, selectedLayerId, onSelectLayer }) {
  const finalPredict = normalized.finalPredict;
  const availableIds = normalized.macroStages.filter((layer) => !layer.locked).map((layer) => layer.id);
  if (finalPredict.status === "PUBLISHED") availableIds.push("final_predict");
  const selectedIndex = availableIds.indexOf(selectedLayerId);
  const navigate = (offset) => {
    const target = availableIds[selectedIndex + offset];
    if (!target) return;
    onSelectLayer(target);
    requestAnimationFrame(() => {
      const element = document.getElementById(target === "final_predict" ? "trust-final-predict" : `trust-stage-${target}`);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  };
  return (
    <section className={`master-ultra-overview ${styles.overview}`} aria-labelledby="master-ultra-overview-title">
      <header className={styles.caseSummary}>
        <div><p className={styles.eyebrow}>{analysisSummary?.type || inputTypeLabel(normalized.input?.type)}{resultModel?.caseRevision ? ` · Phiên bản ${resultModel.caseRevision}` : ""}</p><h2 id="master-ultra-overview-title">Thông tin đang kiểm chứng</h2><p>{safeText(analysisSummary?.label || normalized.input?.excerpt, "Nội dung đầu vào chưa được công bố.")}</p></div>
        <button type="button" onClick={onEdit}>Sửa đầu vào</button>
      </header>
      {stale ? <p className="master-ultra-integrity-note" role="status">Bạn đã thay đổi đầu vào. Kết quả bên dưới vẫn gắn với nội dung và phiên bản đã gửi trước đó.</p> : null}
      <PipelineLayers normalized={normalized} selectedLayerId={selectedLayerId} onSelectLayer={onSelectLayer} onInspect={onInspect} onSelectSource={onSelectSource} />
      <FinalPredictPanel normalized={normalized} onSelectSource={onSelectSource} />
      <nav className={styles.resultActions} aria-label="Điều hướng phân tích đã lưu">
        <p>Mở lại từng lớp để đọc kết quả và giới hạn.</p><div><button type="button" disabled={selectedIndex <= 0} onClick={() => navigate(-1)}><ArrowLeft size={14} />Trước</button><button type="button" disabled={selectedIndex < 0 || selectedIndex >= availableIds.length - 1} onClick={() => navigate(1)}>Sau<ArrowRight size={14} /></button><button type="button" onClick={onNewAnalysis}>Phân tích mới</button><button type="button" onClick={onPrint}>In</button></div>
      </nav>
      <div className="master-ultra-trace-grid"><section id="trust-sources"><div className="master-ultra-subheading"><div><SectionLabel>Source records</SectionLabel><h3>Nguồn truy xuất</h3></div><PanelTopOpen size={18} /></div>{normalized.sources.length ? <div className="master-ultra-trace-list">{normalized.sources.map((source) => <button key={source.id} type="button" onClick={() => onSelectSource?.(source)}><span>{safeText(source.domain, "domain chưa công bố")}</span><strong>{safeText(source.title)}</strong><small>{safeText(source.sourceType)} · retrieved {safeText(source.retrievedAt)}</small></button>)}</div> : <EmptyData>Không có source record được công bố.</EmptyData>}</section><section id="trust-evidence"><div className="master-ultra-subheading"><div><SectionLabel tone="cyan">Evidence records</SectionLabel><h3>Evidence gắn với mệnh đề</h3></div><Network size={18} /></div>{normalized.evidence.length ? <ul className="space-y-2">{normalized.evidence.map((item) => <li key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-cyan-200">{item.id}</strong><span className="text-slate-400">{safeText(item.relationship)}</span></div><p className="mt-1 text-slate-200">{safeText(item.excerpt, "Excerpt chưa công bố.")}</p><small className="text-slate-500">Source: {safeText(item.sourceId)} · Claims: {item.claimIds.length ? item.claimIds.join(", ") : "Chưa liên kết"}</small></li>)}</ul> : <EmptyData>Không có evidence item được công bố. Source record không tự trở thành evidence.</EmptyData>}</section></div>
      {resultModel ? <TrustAiProvenance provenance={resultModel.aiProvenance} /> : null}
      {finalPredict.status === "PUBLISHED" ? <TrustVsExpertComparisonMatrix trustResult={finalPredict} expertAssessment={finalPredict.decision?.expertAssessment || null} /> : null}
      {resultModel ? <TrustCaseActions model={resultModel} authenticated={authenticated} /> : null}
      <p className="master-ultra-integrity-note"><ShieldCheck size={15} /> Main Trust V5 giữ quyền kết luận. Final Predict là output riêng sau bốn lớp; inspection không tạo API call mới.</p>
    </section>
  );
}

function Inspection({ normalized, selectedLayerId, onBack, onNavigate, onSelectSource }) {
  const index = Math.max(0, normalized.macroStages.findIndex((layer) => layer.id === selectedLayerId));
  const layer = normalized.macroStages[index] || normalized.macroStages[0];
  const previous = normalized.macroStages[index - 1];
  const next = normalized.macroStages[index + 1];
  return (
    <section className="master-ultra-inspection" aria-labelledby="master-ultra-inspection-title">
      <div className="master-ultra-inspection-heading"><button type="button" className="master-ultra-back-button" onClick={onBack}><ArrowLeft size={15} /> Bốn lớp</button><div><SectionLabel tone={layer.tone}>{layer.code} / saved inspection</SectionLabel><h2 id="master-ultra-inspection-title">{layer.name}</h2><p>{layer.questionVi}</p></div><div className="master-ultra-inspection-nav"><button type="button" disabled={!previous || previous.locked} onClick={() => onNavigate(previous?.id)}><ArrowLeft size={14} /> Trước</button><button type="button" disabled={!next || next.locked} onClick={() => onNavigate(next?.id)}>Sau <ArrowRight size={14} /></button></div></div>
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
  resultModel = null,
  authenticated = false,
  stale = false,
}) {
  const normalized = useMemo(() => normalizeMasterUltraRun({ pipeline, canonicalResult, layers, presentation, input: input || { type: mode, content }, sourceProvenance, providers, processing }), [pipeline, canonicalResult, layers, presentation, input, mode, content, sourceProvenance, providers, processing]);
  const [view, setView] = useState("overview");
  const [selectedLayerId, setSelectedLayerId] = useState("l1");
  const [runSelection, setRunSelection] = useState({ stageId: null, selectedId: null });
  const [inspectedSource, setInspectedSource] = useState(null);
  const visibleView = processing ? "journey" : hasResult ? view : "input";
  const activeIndex = Math.max(0, normalized.macroStages.findIndex((layer) => layer.status === "RUNNING" || layer.status === "PARTIAL" || layer.status === "FAILED"));
  const activeLayer = normalized.macroStages[activeIndex] || normalized.macroStages[0];
  const activeStatus = normalized.macroStages[activeIndex]?.status || "WAITING";
  const selectedRunLayerId = runSelection.stageId === activeLayer.id ? runSelection.selectedId : activeLayer.id;
  const journeyState = processing
    ? activeStatus === "RUNNING" ? `L${activeIndex + 1}_RUNNING` : "SUBMITTING"
    : hasResult
      ? "COMPLETE_OVERVIEW"
      : error
        ? "ERROR_RECOVERABLE"
        : content?.trim() || file
          ? "INPUT_READY"
          : "L1_READY";
  const visibleJourneyState = visibleView === "inspect" ? "INSPECT_LAYER" : journeyState;

  const inspectLayer = useCallback((id) => {
    if (!hasResult || processing || normalized.macroStages.find((layer) => layer.id === id)?.locked) return;
    setSelectedLayerId(id);
    setView("inspect");
    setInspectedSource(null);
  }, [hasResult, processing, normalized.macroStages]);

  const backToOverview = useCallback(() => {
    setView("overview");
    setInspectedSource(null);
  }, []);

  const startNewAnalysis = useCallback(() => {
    setView("overview");
    setSelectedLayerId("l1");
    setInspectedSource(null);
    onNewAnalysis?.();
  }, [onNewAnalysis]);

  const navigateInspection = useCallback((id) => {
    if (!id || normalized.macroStages.find((layer) => layer.id === id)?.locked) return;
    setSelectedLayerId(id);
    setInspectedSource(null);
  }, [normalized.macroStages]);

  useEffect(() => {
    if (visibleView !== "inspect") return undefined;
    const onKeyDown = (event) => {
      const index = normalized.macroStages.findIndex((layer) => layer.id === selectedLayerId);
      if (event.key === "Escape" || event.key === "Home") { event.preventDefault(); backToOverview(); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); const target = normalized.macroStages.slice(0, index).reverse().find((stage) => !stage.locked); navigateInspection(target?.id); }
      if (event.key === "ArrowRight") { event.preventDefault(); const target = normalized.macroStages.slice(index + 1).find((stage) => !stage.locked); navigateInspection(target?.id); }
      if (event.key === "End") { event.preventDefault(); navigateInspection([...normalized.macroStages].reverse().find((stage) => !stage.locked)?.id); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backToOverview, navigateInspection, normalized.macroStages, selectedLayerId, visibleView]);

  const inspectedLayer = normalized.macroStages.find((layer) => layer.id === selectedLayerId) || normalized.macroStages[0];
  const showComposer = !processing && (!hasResult || view === "input");

  return (
    <section className={`master-ultra-trust ${styles.root}`} data-master-ultra-state={visibleJourneyState} data-state-known={MASTER_ULTRA_STATES.includes(visibleJourneyState) ? "true" : "false"} data-main-authority="MAIN_TRUST_V5" data-sequential-authority={normalized.authority.sequential} data-primary-layer-count="4" data-final-predict-status={normalized.finalPredict.status} data-inspection-rerun="0">
      {showComposer ? (
        <div className="master-ultra-workspace-stack space-y-4">
          <div>
            <InputComposer mode={mode} content={content} file={file} preview={preview} dragging={dragging} error={error} ocr={ocr} confirmedEntities={confirmedEntities} processing={processing} hasResult={hasResult} demoEnabled={demoEnabled} hideHero={hideHero} sourceProvenance={hasResult && stale ? null : sourceProvenance} fileInputRef={fileInputRef} onModeChange={onModeChange} onContentChange={onContentChange} onFileSelect={onFileSelect} onDragStateChange={onDragStateChange} onClearFile={onClearFile} onAnalyze={onAnalyze} onReset={onReset} />
          </div>
        </div>
      ) : null}
      {processing || (!hasResult && pipeline) ? <div className={styles.runShell}><ObservedInputPanel mode={input?.type || mode} content={input?.content || content} file={file} preview={preview} ocr={ocr} /><p className={styles.runStatus} role="status">{processing ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldAlert size={15} />}{processing ? (STATE_LABELS[journeyState] || journeyState) : "Phân tích chưa hoàn tất. Dữ liệu đã nhận được giữ bên dưới."}</p><PipelineLayers normalized={normalized} selectedLayerId={processing ? selectedRunLayerId : selectedLayerId} onSelectLayer={processing ? (id) => setRunSelection({ stageId: activeLayer.id, selectedId: id }) : setSelectedLayerId} onSelectSource={setInspectedSource} journeyState={journeyState} /><FinalPredictPanel normalized={normalized} onSelectSource={setInspectedSource} /></div> : null}
      {hasResult && (visibleView === "overview" || visibleView === "input") ? <Overview normalized={normalized} onInspect={inspectLayer} onEdit={() => setView("input")} onNewAnalysis={startNewAnalysis} onPrint={onPrint} onSelectSource={setInspectedSource} resultModel={resultModel} authenticated={authenticated} stale={stale} analysisSummary={analysisSummary} selectedLayerId={selectedLayerId} onSelectLayer={setSelectedLayerId} /> : null}
      {hasResult && visibleView === "inspect" ? <><ProgressRail normalized={normalized} activeIndex={normalized.macroStages.findIndex((layer) => layer.id === selectedLayerId)} canInspect onInspect={inspectLayer} /><Inspection normalized={normalized} selectedLayerId={inspectedLayer.id} onBack={backToOverview} onNavigate={navigateInspection} onSelectSource={setInspectedSource} /></> : null}
      <SourceInspectorDrawer isOpen={Boolean(inspectedSource)} source={inspectedSource} onClose={() => setInspectedSource(null)} />
    </section>
  );
}
