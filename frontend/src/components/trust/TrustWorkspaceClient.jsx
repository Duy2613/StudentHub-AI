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
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import VerifiedPoster from "@/components/media/VerifiedPoster";
import ReferenceBirdStamp from "@/components/media/ReferenceBirdStamp";
import { markAssurance } from "@/lib/performance/assurance";
import ContractCheckIntakeTab from "./ContractCheckIntakeTab";
import { motion } from "framer-motion";

const MODES = ["image", "qr", "text", "url", "contract"];

export function TrustCriticalHero() {
  return null;
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
        <div className="panel-heading mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              TRUST ENGINE
            </div>
            <h1 id="trust-input-title" className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
              Kiểm tra thông tin
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Đưa ảnh chụp, mã QR, văn bản, URL hoặc hợp đồng vào luồng đối chiếu 5 tầng độc lập.
            </p>
          </div>
        </div>

        <div className="mode-switch" role="tablist" aria-label="Loại đầu vào">
          <button type="button" role="tab" aria-selected={mode === "image"} onClick={() => selectMode("image")}>
            <ImageIcon size={15} /> Ảnh
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
          <button
            type="button"
            className="upload-prompt relative overflow-hidden group border border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-xl transition-all"
            onClick={activate}
          >
            {/* Visual intake watermark using verified input.webp */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/v3/trust/input.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity"
            />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span>{mode === "qr" ? <ScanSearch size={22} /> : <ImageIcon size={22} />}</span>
              <strong>{mode === "qr" ? "Thả hoặc chọn ảnh mã QR" : "Thả hoặc chọn ảnh chụp"}</strong>
              <small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small>
            </div>
          </button>
        ) : (
          <label className="trust-text-field">
            <span>{mode === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo"}</span>
            <textarea
              value={content}
              onFocus={activate}
              onChange={(event) => onContentChange?.(event.target.value)}
              rows={5}
              placeholder={mode === "url" ? "https://..." : "Dán nội dung khả nghi tại đây..."}
            />
          </label>
        )}

        {mode !== "contract" && (
          <button type="button" className="primary-action trust-submit mt-3" onClick={activate}>
            <ScanSearch size={17} /> Phân tích rủi ro <ArrowRight size={16} />
          </button>
        )}
      </div>

      <aside className="intelligence-panel pipeline-panel vnext-trust-pipeline-panel" aria-label="Trust pipeline">
        <div>
          <div className="panel-heading mb-3">
            <div>
              <p className="product-kicker text-xs font-mono text-cyan-400 uppercase tracking-wider">5 LỚP KIỂM ĐỊNH</p>
              <h2 className="text-sm font-semibold text-white">Tiến độ 5 tầng độc lập</h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">WAITING</span>
          </div>
          <ol className="pipeline-list space-y-2">
            {[
              { id: "l1", name: "Claim Intelligence", note: "Bóc tách mệnh đề sơ cấp" },
              { id: "l2", name: "Evidence Discovery", note: "Tìm kiếm nguồn chính thống" },
              { id: "l3", name: "Evidence Forensics", note: "Đối soát và trích xuất bằng chứng" },
              { id: "l4", name: "AI Verification", note: "Gemini đối chiếu đa chiều" },
              { id: "l5", name: "Decision Intelligence", note: "Đưa ra kết luận có căn cứ" },
            ].map((step, index) => (
              <li key={step.id} data-status="waiting" className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
                  {index + 1}
                </span>
                <div>
                  <strong className="text-xs text-slate-200 block">{step.name}</strong>
                  <small className="text-[11px] text-slate-400">{step.note}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </section>
  );
}

export function TrustCriticalShell({ mode = "image", content = "", onActivate, onModeChange, onContentChange }) {
  return (
    <div className="product-workspace vnext-trust-workspace">
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
    <div className="trust-forensic-lab" data-pillar="trust">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="product-workspace"
      >
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
      </motion.div>
    </div>
  );
}
