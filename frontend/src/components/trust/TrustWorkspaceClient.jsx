"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  ClipboardPaste,
  Globe2,
  ImageIcon,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import CinematicTaskBackdrop from "@/components/ui/CinematicTaskBackdrop";
import { markAssurance } from "@/lib/performance/assurance";

const MODES = ["image", "qr", "text", "url"];

export function TrustCriticalHero({ provenance }) {
  const liveProvenance = provenance;

  return (
    <header className="product-hero relative overflow-hidden mb-6">
      <div className="relative z-10">
        {/* Senior Telemetry HUD Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            SERVER PIPELINE STATUS
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">
            <Activity size={12} className="text-cyan-400" /> {provenance?.latencyMs != null ? `${provenance.latencyMs}ms LATENCY` : "LATENCY CHƯA CÓ SAMPLE"}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300">
            <Lock size={12} className="text-purple-400" /> ZERO-TRUST AUDIT
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Sparkles size={12} /> MULTI-MODAL OCR & QR
          </span>
        </div>

        <p className="product-kicker">AI × Community × Human expertise</p>
        <h1 className="tracking-tight text-white font-extrabold">Kiểm tra trước khi bạn tin.</h1>
        <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed mt-2 mb-5">
          Đưa ảnh chụp, đường dẫn hoặc nội dung khả nghi vào một luồng phân tích có thể truy vết. AI phát hiện bất thường, đối chiếu nguồn trong phạm vi được công bố, cộng đồng bổ sung và chuyên gia bảo chứng.
        </p>

        {/* 3 Pillars Triangulation Status with Dedicated 3D Cinematic Animation Backdrops */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 max-w-2xl">
          <div className="relative group overflow-hidden flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-sm transition-all hover:border-amber-500/30">
            <CinematicTaskBackdrop filmId="film07_knowledge_time" opacity={0.25} hoverOpacity={0.55} rounded="rounded-xl" />
            <span className="text-xl relative z-10">🏛️</span>
            <div className="relative z-10">
              <strong className="block text-xs text-white font-bold">Chính Thống (Official)</strong>
              <small className="text-[11px] text-slate-400">Cổng Đào Tạo & Bộ GD&ĐT</small>
            </div>
          </div>
          <div className="relative group overflow-hidden flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-sm transition-all hover:border-indigo-500/30">
            <CinematicTaskBackdrop filmId="film03_collective_intelligence" opacity={0.25} hoverOpacity={0.55} rounded="rounded-xl" />
            <span className="text-xl relative z-10">👥</span>
            <div className="relative z-10">
              <strong className="block text-xs text-white font-bold">Cộng Đồng (Community)</strong>
              <small className="text-[11px] text-slate-400">Số liệu chỉ hiển thị khi server công bố</small>
            </div>
          </div>
          <div className="relative group overflow-hidden flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-sm transition-all hover:border-amber-500/30">
            <CinematicTaskBackdrop filmId="film04_expert_network" opacity={0.25} hoverOpacity={0.55} rounded="rounded-xl" />
            <span className="text-xl relative z-10">👨‍🏫</span>
            <div className="relative z-10">
              <strong className="block text-xs text-white font-bold">Chuyên Gia (Expert)</strong>
              <small className="text-[11px] text-slate-400">Hội đồng thẩm định độc lập</small>
            </div>
          </div>
        </div>

        <SourceDisclosure provenance={liveProvenance} sourceMode={liveProvenance?.sourceMode || "UNAVAILABLE"} />
      </div>

      <div className="hero-seal flex flex-col items-center justify-center text-center relative overflow-hidden group">
        <CinematicTaskBackdrop filmId="film02_trust_engine" opacity={0.38} hoverOpacity={0.65} rounded="rounded-2xl" />
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(52,231,196,0.25)] mb-2 transition-transform group-hover:scale-110">
          <ShieldCheck size={32} />
        </div>
        <span className="relative z-10 text-[10px] tracking-widest text-emerald-400 font-mono font-bold">TRUST ENGINE</span>
        <strong className="relative z-10 text-xs text-white font-bold tracking-tight">Evidence First</strong>
        <div className="relative z-10 mt-2 text-[9px] text-emerald-300/90 font-mono flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          FILM 02 3D LASER PARALLAX
        </div>
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
    <section className="trust-input-grid" aria-labelledby="trust-input-title">
      <div className="intelligence-panel">
        <div className="panel-heading">
          <div>
            <p className="product-kicker">Trust workspace</p>
            <h2 id="trust-input-title" className="product-section-title">Bắt đầu một phiên kiểm tra</h2>
          </div>
          <span className="metadata-chip font-mono">READY · 24FPS LOOP</span>
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
        </div>
        {mode === "image" || mode === "qr" ? (
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
        <button type="button" className="primary-action trust-submit" onClick={activate}>
          <ScanSearch size={17} /> Phân tích rủi ro <ArrowRight size={16} />
        </button>
      </div>

      <aside className="intelligence-panel pipeline-panel relative overflow-hidden group" aria-label="Trust pipeline">
        <CinematicTaskBackdrop filmId="film02_trust_engine" opacity={0.18} hoverOpacity={0.35} rounded="rounded-2xl" />
        <div className="relative z-10">
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
    <div className="product-workspace">
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
  const [TrustWorkspace, setTrustWorkspace] = useState(null);
  const [requestedMode, setRequestedMode] = useState("image");
  const [draftContent, setDraftContent] = useState("");
  const [sourceProvenance, setSourceProvenance] = useState(null);

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
