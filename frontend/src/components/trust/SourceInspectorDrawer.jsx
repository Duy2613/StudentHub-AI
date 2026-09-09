"use client";

import React, { useEffect } from "react";
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Fingerprint, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  X 
} from "lucide-react";

export default function SourceInspectorDrawer({
  isOpen,
  onClose,
  source = null,
}) {
  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!source && !isOpen) return null;

  const title = source?.title || "Evidence source chưa có tiêu đề";
  const publisher = source?.publisher || "Publisher chưa công bố";
  let domain = source?.domain || null;
  if (!domain && source?.url) {
    try { domain = new URL(source.url).hostname; } catch { domain = null; }
  }
  const url = typeof source?.url === "string" && /^https?:\/\//i.test(source.url) ? source.url : null;
  const publishedAt = source?.publishedAt || "Chưa công bố";
  const retrievedAt = source?.retrievedAt || "Chưa công bố";
  const contentHash = source?.contentHash || "Chưa công bố";
  const snippet = source?.snippet || "Evidence record không có đoạn trích được công bố.";
  const relation = String(source?.relationship || "context").toLowerCase();
  const sourceType = source?.sourceType || "Chưa phân loại";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside 
        className={`source-inspector-drawer ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết nguồn kiểm chứng: ${title}`}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="type-micro-label-v3 text-cyan-300">
              FORENSIC SOURCE INSPECTOR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Đóng bảng chi tiết nguồn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Trust Tier & Identity */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
              <ShieldCheck size={13} />
              <span>{sourceType === "PRIMARY_OFFICIAL" ? "NGUỒN CHÍNH THỨC CẤP I" : "NGUỒN ĐÃ ĐỐI SOÁT"}</span>
            </div>
            <h2 className="type-product-heading text-lg text-slate-100 mb-1">
              {title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{publisher}</span>
              {domain && <><span>•</span><span className="inline-flex items-center gap-1 font-mono text-cyan-400"><Lock size={10} /> {domain}</span></>}
            </div>
          </div>

          {/* Relationship Badge */}
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="type-micro-label-v3 block mb-1">QUAN HỆ VỚI MỆNH ĐỀ</span>
            {relation === "contradicts" ? (
              <div className="flex items-center gap-2 text-rose-400 font-medium text-sm">
                <ShieldAlert size={16} />
                <span>MÂU THUẪN TRỰC TIẾP VỚI THÔNG BÁO LAN TRUYỀN</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                <CheckCircle2 size={16} />
                <span>HỖ TRỢ XÁC THỰC QUY CHẾ HỌC BỔNG</span>
              </div>
            )}
          </div>

          {/* Verbatim Excerpt */}
          <div className="space-y-2">
            <span className="type-micro-label-v3">TRÍCH DẪN NGUYÊN VĂN TỪ VĂN BẢN</span>
            <blockquote className="p-4 rounded-xl border-l-2 border-cyan-400 bg-cyan-950/20 text-slate-200 text-sm leading-relaxed font-sans italic">
              &ldquo;{snippet}&rdquo;
            </blockquote>
          </div>

          {/* Outbound Canonical Action */}
          <div>
            {url ? <><a href={url} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-semibold text-sm transition-all hover:scale-[1.01]"><span>Mở source gốc{domain ? ` tại ${domain}` : ""}</span><ExternalLink size={15} /></a><p className="text-[11px] text-slate-500 text-center mt-2">Liên kết được lấy từ evidence record live.</p></> : <p className="text-[11px] text-slate-500 text-center">Evidence record chưa công bố URL để mở ngoài hệ thống.</p>}
          </div>

          {/* Provenance & Cryptographic Audit */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
            <span className="type-micro-label-v3 block text-slate-400">DẤU VẾT THỜI GIAN & BẰNG CHỨNG SỐ</span>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-500 inline-flex items-center gap-1"><Clock size={12} /> Thời điểm ban hành:</span>
              <span className="font-mono">{publishedAt}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-500 inline-flex items-center gap-1"><Clock size={12} /> Thời điểm thu thập:</span>
              <span className="font-mono">{retrievedAt}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/5">
              <span className="text-slate-500 inline-flex items-center gap-1"><Fingerprint size={12} /> Băm SHA-256:</span>
              <span className="font-mono text-[11px] text-slate-400 truncate max-w-[160px]">{contentHash}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] text-center">
          <span className="type-micro-label-v3 text-slate-500">
            KHAI MINH FORENSICS // ZERO-TRUST PROVENANCE
          </span>
        </div>
      </aside>
    </>
  );
}
