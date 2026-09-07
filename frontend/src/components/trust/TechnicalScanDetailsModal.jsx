"use client";

import React, { useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

/**
 * TechnicalScanDetailsModal
 * Clean, high-contrast modal/drawer displaying the exact technical checks performed.
 * Designed for engineers and auditors who want raw inspection facts without
 * cluttering the main 4-layer view for ordinary users.
 */
export default function TechnicalScanDetailsModal({ isOpen, onClose, checks = [], totalCount = checks.length, summary = "" }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const passedCount = checks.filter((c) => c.passed === true).length;
  const flaggedCount = checks.filter((c) => c.passed === false).length;
  const unreportedCount = checks.filter((c) => c.passed === null || c.passed === undefined).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-details-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 id="tech-details-title" className="text-sm font-bold text-white tracking-tight">
                Technical Details — Layer 1
              </h3>
              <p className="text-xs text-white/50 font-mono">
                {passedCount}/{totalCount} checks passed
                {flaggedCount > 0 && <span className="text-rose-400 ml-2">({flaggedCount} flagged)</span>}
                {unreportedCount > 0 && <span className="text-white/40 ml-2">({unreportedCount} not reported)</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Đóng chi tiết kỹ thuật"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of deterministic checks */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
          {summary && (
            <div className="p-3 mb-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
              {summary}
            </div>
          )}

          <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-black/30 font-mono text-xs">
            {checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {check.passed === true ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : check.passed === false ? (
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  ) : (
                    <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>
                  )}
                  <span className="text-white/80 font-medium">{check.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      check.passed === true
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : check.passed === false
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-white/5 text-white/45 border border-white/10"
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-white/40 font-mono">
          <span>DETERMINISTIC EVALUATION</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
