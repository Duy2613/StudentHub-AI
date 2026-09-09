"use client";

import React, { useState } from "react";
import { Lock, ExternalLink } from "lucide-react";

export default function InlineCitation({
  index = 1,
  source = null,
  onInspect,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const publisher = source?.publisher || "ĐHQG-HCM";
  const title = source?.title || "Công văn số 142/ĐHQG-CTSV";
  const domain = source?.domain || (source?.url ? new URL(source.url).hostname : "vnuhcm.edu.vn");

  const handleClick = (e) => {
    e.preventDefault();
    onInspect?.(source || { index, title, publisher, domain });
  };

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="inline-citation-tag"
        aria-haspopup="dialog"
        aria-label={`Xem nguồn trích dẫn [${index}]: ${publisher} — ${title}`}
      >
        [{index}]
      </button>

      {/* Floating Hover Preview Card */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 rounded-xl bg-slate-950/95 border border-white/20 shadow-2xl backdrop-blur-md z-40 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono mb-1">
            <span className="inline-flex items-center gap-1">
              <Lock size={10} /> {domain}
            </span>
            <span className="text-slate-400">Trích dẫn [{index}]</span>
          </div>
          <p className="text-xs font-semibold text-slate-100 line-clamp-2 mb-1">
            {title}
          </p>
          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
            "{source?.snippet || 'Nhấp để xem toàn văn trích dẫn và liên kết gốc.'}"
          </p>
          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-cyan-300">
            <span>Chạm để mở kiểm tra nguồn</span>
            <ExternalLink size={10} />
          </div>
        </div>
      )}
    </span>
  );
}
