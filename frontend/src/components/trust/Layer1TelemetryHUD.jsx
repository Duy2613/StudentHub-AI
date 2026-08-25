"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Cpu,
  Clock,
  Layers,
  ArrowRight,
  StopCircle,
  FileSearch,
  CheckCircle2,
  Lock,
  Flame,
} from "lucide-react";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";

/**
 * High-precision Telemetry HUD for Layer 1 Fast & Deterministic Screening
 * Adheres to Saffron Swiss Grid + Igloo Dual Typography (Inter & JetBrains Mono)
 */
export default function Layer1TelemetryHUD({ result, isScanning = false, className = "" }) {
  if (isScanning) {
    return (
      <div className={`p-6 rounded-2xl bg-[#120604]/80 border border-[#ffbc09]/30 backdrop-blur-xl animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ffbc09] animate-ping" />
            <span className="font-mono text-xs font-bold text-[#ffbc09] tracking-wider uppercase">
              [L1 ENGINE] Quét Deterministic Đang Chạy...
            </span>
          </div>
          <span className="font-mono text-xs text-[#ece7e0]/60">Target Latency: &lt;15ms</span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#ffbc09] to-[#ea3810] animate-pulse w-3/4 rounded-full" />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { status, confidence = 0, reasons = [], signals = [], details = {}, metrics = {} } = result;

  const isBlock = status === LAYER_1_STATUS.BLOCK;
  const isSuspicious = status === LAYER_1_STATUS.SUSPICIOUS;
  const isPass = status === LAYER_1_STATUS.PASS;

  // Status Styling Config
  const statusConfig = {
    [LAYER_1_STATUS.BLOCK]: {
      badgeBg: "bg-[#ea3810]/20 border-[#ea3810]/60 text-[#ff6b4a]",
      glowColor: "shadow-[0_0_30px_rgba(234,56,16,0.25)]",
      icon: <StopCircle className="w-5 h-5 text-[#ea3810] animate-bounce" />,
      label: "BLOCK // DỪNG TIẾN TRÌNH (EARLY EXIT)",
      subtext: "Phát hiện dấu hiệu gian lận / mã độc nghiêm trọng. Chặn ngay tại tầng 1.",
      confidenceBarColor: "from-[#ea3810] to-[#ff4520]",
      pillBg: "bg-[#ea3810]/15 border-[#ea3810]/40 text-[#ff8066]",
    },
    [LAYER_1_STATUS.SUSPICIOUS]: {
      badgeBg: "bg-[#ffbc09]/20 border-[#ffbc09]/60 text-[#ffd15c]",
      glowColor: "shadow-[0_0_30px_rgba(255,188,9,0.2)]",
      icon: <AlertTriangle className="w-5 h-5 text-[#ffbc09] animate-pulse" />,
      label: "SUSPICIOUS // CHUYỂN TIẾP LAYER 2",
      subtext: "Có dấu hiệu bất thường cần đối chiếu sâu với Aggregator Blacklist & AI Vector RAG.",
      confidenceBarColor: "from-[#ff9f1c] to-[#ffbc09]",
      pillBg: "bg-[#ffbc09]/15 border-[#ffbc09]/40 text-[#ffd15c]",
    },
    [LAYER_1_STATUS.PASS]: {
      badgeBg: "bg-[#00f0ff]/15 border-[#00f0ff]/50 text-[#38f8d4]",
      glowColor: "shadow-[0_0_30px_rgba(0,240,255,0.15)]",
      icon: <ShieldCheck className="w-5 h-5 text-[#38f8d4]" />,
      label: "PASS // AN TOÀN SƠ BỘ (CHUYỂN LAYER 2)",
      subtext: "Không phát hiện rủi ro rõ ràng ở tầng 1. Tiếp tục chuyển tiếp Layer 2 để thẩm định.",
      confidenceBarColor: "from-[#00f0ff] to-[#38f8d4]",
      pillBg: "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#38f8d4]",
    },
  }[status] || {
    badgeBg: "bg-gray-800 border-gray-600 text-gray-300",
    glowColor: "",
    icon: <Activity className="w-5 h-5 text-gray-400" />,
    label: status,
    subtext: "",
    confidenceBarColor: "from-gray-500 to-gray-400",
    pillBg: "bg-gray-800 text-gray-400 border-gray-700",
  };

  return (
    <div
      className={`rounded-2xl bg-[#0f0504]/90 border border-[#47140b] p-5 sm:p-6 backdrop-blur-2xl transition-all duration-300 ${statusConfig.glowColor} ${className}`}
    >
      {/* HUD Header with Telemetry Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2d0d08]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-black/50 border border-[#47140b]">
            <Cpu className="w-4 h-4 text-[#ffbc09]" />
          </div>
          <div>
            <span className="font-mono text-[11px] font-bold text-[#ffbc09] tracking-wider uppercase block">
              LAYER 1 SCREENING REPORT
            </span>
            <span className="font-mono text-[10px] text-[#ece7e0]/60">
              Deterministic Hard Rules + Confidence Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-md bg-black/60 border border-[#2d0d08] text-[#ece7e0]/80 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#ffbc09]" />
            <span>{metrics.executionTimeMs || 4.2}ms</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-black/60 border border-[#2d0d08] text-[#ece7e0]/80">
            {metrics.inputType ? `TYPE: ${metrics.inputType.toUpperCase()}` : "DETERMINISTIC"}
          </span>
        </div>
      </div>

      {/* Main Status Verdict Banner */}
      <div className="mt-5 p-4 rounded-xl bg-black/40 border border-[#2d0d08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border ${statusConfig.badgeBg}`}>
            {statusConfig.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm font-black tracking-wide ${statusConfig.badgeBg.split(" ")[2]}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-[#ece7e0]/70 mt-1 font-human leading-relaxed">
              {details.decisionRationale || statusConfig.subtext}
            </p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="sm:text-right flex-shrink-0 min-w-[140px]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#ece7e0]/50 block">
            Confidence Score
          </span>
          <div className="flex items-baseline sm:justify-end gap-1 mt-0.5">
            <span className="font-mono text-2xl font-black text-white">
              {(confidence * 100).toFixed(1)}%
            </span>
            <span className="font-mono text-xs text-[#ece7e0]/60">
              ({confidence.toFixed(2)})
            </span>
          </div>
          {/* Visual Mini Progress */}
          <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden mt-1.5 border border-[#2d0d08]">
            <div
              className={`h-full bg-gradient-to-r ${statusConfig.confidenceBarColor} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(100, Math.max(5, confidence * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Triggered Reasons Tag Matrix */}
      {reasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#2d0d08]">
          <span className="font-mono text-[10px] text-[#ece7e0]/50 uppercase tracking-wider block mb-2">
            Identified Reason Tags ({reasons.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border ${statusConfig.pillBg}`}
              >
                #{reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected Signals Accordion / List */}
      {signals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#2d0d08]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[#ece7e0]/50 uppercase tracking-wider">
              Diagnostic Signal Matrix ({signals.length})
            </span>
            <span className="font-mono text-[10px] text-[#ffbc09]">
              Hard Triggers: {details.hardTriggersCount || 0}
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {signals.map((sig, idx) => {
              const isSigDanger = sig.type === "danger";
              const isSigWarning = sig.type === "warning";
              const isSigSafe = sig.type === "safe";

              const cardStyle = isSigDanger
                ? "bg-[#ea3810]/10 border-[#ea3810]/30 text-[#ff8066]"
                : isSigWarning
                ? "bg-[#ffbc09]/10 border-[#ffbc09]/30 text-[#ffd15c]"
                : isSigSafe
                ? "bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#38f8d4]"
                : "bg-white/5 border-white/10 text-gray-300";

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${cardStyle}`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-bold shrink-0 mt-0.5">
                      {sig.category?.toUpperCase() || "L1"}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-white text-[12px] truncate">
                        {sig.title}
                      </div>
                      {sig.snippet && (
                        <div className="font-mono text-[11px] text-[#ece7e0]/60 mt-0.5 break-all">
                          Khớp: &ldquo;{sig.snippet}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-[10px] font-bold shrink-0 text-right">
                    <span className="block text-white/90">W: {sig.weight?.toFixed(2) || "0.50"}</span>
                    <span className="text-[#ece7e0]/50 uppercase">{sig.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Step / Action Footer */}
      <div className="mt-4 pt-3 border-t border-[#2d0d08] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[#ece7e0]/60">
          <Layers className="w-3.5 h-3.5 text-[#ffbc09]" />
          <span>Pipeline Status:</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          {isBlock ? (
            <span className="text-[#ea3810] flex items-center gap-1">
              <StopCircle className="w-3.5 h-3.5" /> DỪNG TIẾN TRÌNH // KHÔNG GỬI SANG L2
            </span>
          ) : (
            <span className="text-[#38f8d4] flex items-center gap-1">
              TIẾP TỤC ĐẾN LAYER 2 (AGGREGATOR &amp; AI) <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
