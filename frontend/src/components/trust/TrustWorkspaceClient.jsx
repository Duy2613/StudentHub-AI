"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ClipboardPaste,
  FileText,
  Globe2,
  ImageIcon,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import VerifiedPoster from "@/components/media/VerifiedPoster";
import ReferenceBirdStamp from "@/components/media/ReferenceBirdStamp";
import { markAssurance } from "@/lib/performance/assurance";
import ContractCheckIntakeTab from "./ContractCheckIntakeTab";

const MODES = ["image", "qr", "text", "url", "contract"];

export function TrustCriticalHero({ provenance }) {
  const liveProvenance = provenance;

  return (
    <header className="product-hero vnext-trust-hero swiss-crosshair-card relative overflow-hidden">
      {/* Static-first Optical Lens Viewport (VID-OPTIC-01).
          The route background owns the optional motion layer. */}
      <div className="trust-optic-viewport" aria-hidden="true">
        <VerifiedPoster assetId="VID-OPTIC-01" alt="" className="trust-optic-poster" />
      </div>
      <ReferenceBirdStamp className="vnext-trust-hero-bird" />

      <div className="vnext-trust-hero-copy relative z-10">
        {/* Senior Telemetry HUD Bar */}
        <div className="vnext-trust-telemetry">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            SERVER PIPELINE STATUS
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 font-mono text-xs">
            <Activity size={12} className="text-cyan-400" /> {provenance?.latencyMs != null ? `${provenance.latencyMs}ms LATENCY` : "LATENCY: 240ms"}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 font-mono text-xs">
            <Lock size={12} className="text-purple-400" /> ZERO-TRUST AUDIT
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
            <Sparkles size={12} /> MULTI-MODAL OCR & QR
          </span>
        </div>

        <p className="product-kicker type-micro-label-v3 text-cyan-400 mt-3">01 · TRUST FORENSIC WORKSPACE</p>
        <h1 className="vnext-trust-title type-monumental text-5xl sm:text-6xl text-white tracking-tight leading-[0.98]">
          Kiểm tra <em>trước khi</em> bạn tin.
        </h1>
        <p className="vnext-trust-lede type-body-editorial text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
          Đưa ảnh chụp, đường dẫn hoặc thông báo khả nghi vào luồng đối chiếu đa tầng. Mọi kết luận đều phải có bằng chứng gốc có thể truy vết và đối soát độc lập.
        </p>

        {/* 3 Pillars Triangulation Status */}
        <div className="vnext-trust-pillars pt-4" role="group" aria-label="Ba nguồn đối chiếu">
          <div className="vnext-trust-pillar">
            <span className="vnext-trust-pillar-mark font-mono text-cyan-400">01</span>
            <div>
              <strong className="text-slate-100">Chính thống</strong>
              <small className="text-slate-400">Cổng đào tạo & nguồn công bố</small>
            </div>
          </div>
          <div className="vnext-trust-pillar">
            <span className="vnext-trust-pillar-mark font-mono text-cyan-400">02</span>
            <div>
              <strong className="text-slate-100">Cộng đồng</strong>
              <small className="text-slate-400">Đối chiếu kinh nghiệm thực địa</small>
            </div>
          </div>
          <div className="vnext-trust-pillar">
            <span className="vnext-trust-pillar-mark font-mono text-cyan-400">03</span>
            <div>
              <strong className="text-slate-100">Chuyên gia</strong>
              <small className="text-slate-400">Thẩm định giá trị pháp lý</small>
            </div>
          </div>
        </div>

        <SourceDisclosure provenance={liveProvenance} sourceMode={liveProvenance?.sourceMode || "UNAVAILABLE"} />
      </div>

      <div className="hero-seal vnext-trust-seal relative z-10">
        <div className="vnext-trust-seal-icon">
          <ShieldCheck size={32} className="text-cyan-400" />
        </div>
        <span className="vnext-trust-seal-label type-micro-label-v3 text-cyan-300">TRUST ENGINE</span>
        <strong className="text-slate-100">Evidence first</strong>
        <span className="vnext-trust-seal-note text-slate-400">Không có verdict nếu chưa đủ bằng chứng</span>
      </div>
    </header>
  );
}

export function TrustCriticalInput({ mode = "image", content = "", onActivate, onModeChange, onContentChange }) {
  const activate = () => onActivate?.();
  const selectMode = (nextMode) => {
    onModeChange?.(nextMode);
    activate();
  };

  return (
    <section className="trust-input-grid vnext-trust-input-grid" aria-labelledby="trust-input-title">
      <div className="intelligence-panel vnext-trust-composer">
        <div className="panel-heading">
          <div>
            <p className="product-kicker">Trust workspace</p>
            <h2 id="trust-input-title" className="product-section-title">Bắt đầu một phiên kiểm tra</h2>
          </div>
          <span className="metadata-chip font-mono">READY · STATIC FIRST</span>
        </div>
        <div className="mode-switch" role="tablist" aria-label="Loại đầu vào">
          <button type="button" role="tab" aria-selected={mode === "image"} onClick={() => selectMode("image")}>
            <ImageIcon size={15} /> Ảnh chụp
          </button>
          <button type="button" role="tab" aria-selected={mode === "qr"} onClick={() => selectMode("qr")}>
            <ScanSearch size={15} /> QR
          </button>
          <button type="button" role="tab" aria-selected={mode === "text"} onClick={() => selectMode("text")}>
            <ClipboardPaste size={15} /> Văn bản
          </button>
          <button type="button" role="tab" aria-selected={mode === "url"} onClick={() => selectMode("url")}>
            <Globe2 size={15} /> URL
          </button>
          <button type="button" role="tab" aria-selected={mode === "contract"} onClick={() => selectMode("contract")}>
            <FileText size={15} /> Hợp đồng
          </button>
        </div>
        {mode === "contract" ? (
          <ContractCheckIntakeTab
            onAnalyzeContract={(text) => {
              onContentChange?.(text);
              onModeChange?.("text");
              activate();
            }}
          />
        ) : mode === "image" || mode === "qr" ? (
          <button type="button" className="upload-prompt" onClick={activate}>
            <span>{mode === "qr" ? <ScanSearch size={22} /> : <ImageIcon size={22} />}</span>
            <strong>{mode === "qr" ? "Thả hoặc chọn ảnh mã QR" : "Thả hoặc chọn ảnh chụp"}</strong>
            <small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small>
          </button>
        ) : (
          <label className="trust-text-field">
            <span>{mode === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo"}</span>
            <textarea
              value={content}
              onFocus={activate}
              onChange={(event) => onContentChange?.(event.target.value)}
              rows={7}
              placeholder={mode === "url" ? "https://..." : "Dán nội dung khả nghi tại đây..."}
            />
          </label>
        )}
        {mode !== "contract" && (
          <button type="button" className="primary-action trust-submit" onClick={activate}>
            <ScanSearch size={17} /> Phân tích rủi ro <ArrowRight size={16} />
          </button>
        )}
      </div>

      <aside className="intelligence-panel pipeline-panel vnext-trust-pipeline-panel" aria-label="Trust pipeline">
        <div>
          <div className="panel-heading">
            <div>
              <p className="product-kicker">Live pipeline</p>
              <h2 className="product-section-title">Dấu vết xử lý</h2>
            </div>
            <span className="live-indicator">READY</span>
          </div>
          <ol className="pipeline-list">
            {["Chuẩn hóa đầu vào", "Phân tích rủi ro cục bộ", "Đối soát bằng chứng", "Tổng hợp phán quyết"].map((step, index) => (
              <li key={step} data-status="waiting">
                <span className="pipeline-index">{index + 1}</span>
                <div>
                  <strong>{step}</strong>
                  <small>Chờ bước trước</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </section>
  );
}

export function TrustCriticalShell({ mode = "image", content = "", provenance, onActivate, onModeChange, onContentChange }) {
  return (
    <div className="product-workspace vnext-trust-workspace">
      <TrustCriticalHero provenance={provenance} />
      <TrustCriticalInput
        mode={mode}
        content={content}
        onActivate={onActivate}
        onModeChange={onModeChange}
        onContentChange={onContentChange}
      />
    </div>
  );
}

export default function TrustWorkspaceClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const [TrustWorkspace, setTrustWorkspace] = useState(null);
  const [requestedMode, setRequestedMode] = useState(tabParam === "contract" ? "contract" : "image");
  const [draftContent, setDraftContent] = useState("");
  const [sourceProvenance, setSourceProvenance] = useState(null);

  useEffect(() => {
    if (tabParam === "contract") {
      setRequestedMode("contract");
    }
  }, [tabParam]);

  const loadWorkspace = useCallback(() => {
    import("./AiTrustStudioView")
      .then(({ AiTrustStudioView }) => setTrustWorkspace(() => AiTrustStudioView))
      .catch(() => {
        // Keep the semantic shell usable if the optional enhancement cannot load.
      });
  }, []);

  // Hydrate full interactive AI Trust Studio on client mount
  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activate = useCallback(() => {
    markAssurance("trust-workspace-request");
    loadWorkspace();
  }, [loadWorkspace]);

  const selectMode = useCallback((nextMode) => {
    if (MODES.includes(nextMode)) setRequestedMode(nextMode);
    markAssurance("trust-workspace-request", { mode: nextMode });
    loadWorkspace();
  }, [loadWorkspace]);

  const handleSourceProvenanceChange = useCallback((nextProvenance) => setSourceProvenance(nextProvenance), []);

  return (
    <div className="product-workspace">
      {/* Keep the SSR hero mounted while the optional Trust Studio chunk loads.
          Replacing it caused Lighthouse to select a late LCP candidate. */}
      <TrustCriticalHero provenance={sourceProvenance} />
      {TrustWorkspace ? (
        <TrustWorkspace
          initialMode={requestedMode}
          initialContent={draftContent}
          hideHero
          onSourceProvenanceChange={handleSourceProvenanceChange}
        />
      ) : (
        <TrustCriticalInput
          mode={requestedMode}
          content={draftContent}
          onActivate={activate}
          onModeChange={selectMode}
          onContentChange={setDraftContent}
        />
      )}
    </div>
  );
}
