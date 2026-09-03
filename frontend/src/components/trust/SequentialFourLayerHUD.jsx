"use client";

import React from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  Brain,
  Globe2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  SEQUENTIAL_STATE,
  LAYER_STATUS,
  getLayerDisplayStatus,
} from "@/lib/ai-trust/sequential/SequentialTrustStateMachine";

const LAYER_CONFIG = [
  {
    id: 1,
    name: "Layer 1",
    title: "Deterministic Screen",
    description: "Chuẩn hóa & phát hiện dấu hiệu lừa đảo / rủi ro cục bộ (<15ms)",
    icon: ShieldCheck,
  },
  {
    id: 2,
    name: "Layer 2",
    title: "Threat & Semantic Intelligence",
    description: "Đối soát URL với Google Safe Browsing và phân tích ngữ nghĩa",
    icon: Globe2,
  },
  {
    id: 3,
    name: "Layer 3",
    title: "Evidence Retrieval",
    description: "Truy vấn bằng chứng thực tế đa nguồn qua Tavily search",
    icon: FileSearch,
  },
  {
    id: 4,
    name: "Layer 4",
    title: "Synthesis & Reasoning",
    description: "Tổng hợp phán quyết bằng mô hình suy luận độc lập (Gemini/Groq)",
    icon: Brain,
  },
];

function statusBadge(status) {
  switch (status) {
    case LAYER_STATUS.COMPLETED:
      return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Check size={12} className="stroke-[3]" /> Hoàn tất
        </span>
      );
    case LAYER_STATUS.RUNNING:
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
          <LoaderCircle size={12} className="animate-spin" /> Đang chạy...
        </span>
      );
    case LAYER_STATUS.ERROR:
      return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <ShieldAlert size={12} /> Lỗi
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
          <Circle size={10} /> Đang chờ
        </span>
      );
  }
}

export default function SequentialFourLayerHUD({
  sequentialState,
  onToggleCollapse,
  onRetry,
  className = "",
}) {
  const {
    state,
    activeLayer,
    collapsedLayers = {},
    layerResults = {},
    error,
  } = sequentialState;

  return (
    <div className={`sequential-four-layer-hud space-y-4 ${className}`} aria-label="Sequential 4-Layer Progress">
      {/* 1. Compact Progress Indicator Stepper */}
      <div className="bg-[#0e0705]/90 border border-[#ffbc09]/30 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#ffbc09]">
            [PIPELINE TRÌNH TỰ 4 LỚP]
          </span>
          <span className="text-xs font-mono text-white/50">
            Trạng thái: <strong className="text-white/80">{state}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {LAYER_CONFIG.map((layer) => {
            const status = getLayerDisplayStatus(state, layer.id, layerResults);
            const isCurrent = activeLayer === layer.id;
            const hasResult = Boolean(layerResults[`layer${layer.id}`]);

            return (
              <button
                type="button"
                key={layer.id}
                onClick={() => hasResult && onToggleCollapse?.(layer.id)}
                disabled={!hasResult}
                className={`flex flex-col p-3 rounded-xl text-left border transition-all duration-200 ${
                  isCurrent
                    ? "bg-[#ffbc09]/10 border-[#ffbc09]/60 shadow-[0_0_15px_rgba(255,188,9,0.15)] ring-1 ring-[#ffbc09]/40"
                    : status === LAYER_STATUS.COMPLETED
                    ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer"
                    : status === LAYER_STATUS.ERROR
                    ? "bg-rose-500/10 border-rose-500/50"
                    : "bg-black/20 border-white/10 opacity-60"
                }`}
                aria-label={`${layer.name} status: ${status}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-mono text-xs font-bold text-white/90">
                    {status === LAYER_STATUS.COMPLETED && "✓ "}
                    {status === LAYER_STATUS.RUNNING && "● "}
                    {status === LAYER_STATUS.ERROR && "✕ "}
                    {status === LAYER_STATUS.PENDING && "○ "}
                    {layer.name}
                  </span>
                  {statusBadge(status)}
                </div>
                <p className="text-xs text-white/70 font-medium line-clamp-1">{layer.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Error Isolation Card (if active layer failed) */}
      {error && (
        <div
          className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">
                Sự cố tại Lớp {error.layer || activeLayer}: {error.code}
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">{error.message}</p>
              <p className="text-[11px] text-white/50 mt-1">
                ✓ Dữ liệu từ các tầng trước đó được lưu trữ an toàn trong bộ nhớ.
              </p>
            </div>
          </div>
          {error.retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-md shrink-0"
            >
              <RotateCcw size={14} /> Thử lại Lớp {error.layer || activeLayer}
            </button>
          )}
        </div>
      )}

      {/* 3. Layer Detail Panels with Visual Collapse / Fade */}
      <div className="space-y-3">
        {LAYER_CONFIG.map((layer) => {
          const status = getLayerDisplayStatus(state, layer.id, layerResults);
          const isCollapsed = collapsedLayers[layer.id];
          const result = layerResults[`layer${layer.id}`];
          const isCurrentActive = activeLayer === layer.id;

          // Don't render anything for pending layers that have never run
          if (status === LAYER_STATUS.PENDING && !isCurrentActive) {
            return null;
          }

          const IconComponent = layer.icon;

          return (
            <article
              key={layer.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isCurrentActive
                  ? "bg-[#120604]/90 border-[#ffbc09]/50 shadow-[0_0_25px_rgba(255,188,9,0.1)]"
                  : status === LAYER_STATUS.COMPLETED
                  ? "bg-[#090302]/70 border-white/10"
                  : "bg-black/40 border-white/5"
              }`}
            >
              {/* Layer Header (always visible banner) */}
              <header
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02]"
                onClick={() => onToggleCollapse?.(layer.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      status === LAYER_STATUS.COMPLETED
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : isCurrentActive
                        ? "bg-[#ffbc09]/20 text-[#ffbc09] border border-[#ffbc09]/40"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    <IconComponent size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#ffbc09] uppercase">
                        {layer.name}
                      </span>
                      <span className="text-white/40">·</span>
                      <h3 className="text-sm font-semibold text-white/90">{layer.title}</h3>
                    </div>
                    <p className="text-xs text-white/60 line-clamp-1">{layer.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {statusBadge(status)}
                  <button
                    type="button"
                    className="p-1 text-white/40 hover:text-white/80 transition-colors"
                    aria-label={isCollapsed ? `Mở rộng chi tiết ${layer.name}` : `Thu gọn chi tiết ${layer.name}`}
                  >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>
              </header>

              {/* Layer Body: Displays when running or expanded */}
              {!isCollapsed && (
                <div className="p-4 sm:p-5 pt-0 border-t border-white/5 space-y-4 animate-in fade-in duration-300">
                  {/* Running state indicator */}
                  {status === LAYER_STATUS.RUNNING && (
                    <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
                      <LoaderCircle size={28} className="animate-spin text-[#ffbc09]" />
                      <p className="text-xs font-mono text-white/70">
                        Đang xử lý phân tích {layer.name} qua backend...
                      </p>
                    </div>
                  )}

                  {/* Completed result details for Layer 1 */}
                  {layer.id === 1 && result && (
                    <div className="grid sm:grid-cols-3 gap-3 pt-3">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-[11px] font-mono text-white/50 block">KẾT QUẢ SƠ BỘ</span>
                        <strong className="text-sm font-semibold text-emerald-400">
                          {result.status || "PASS"}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-[11px] font-mono text-white/50 block">MỨC RỦI RO</span>
                        <strong className="text-sm font-semibold text-white/90">
                          {result.riskLevel || "LOW"}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-[11px] font-mono text-white/50 block">ĐỘ TIN CẬY</span>
                        <strong className="text-sm font-semibold text-white/90">
                          {Math.round((result.confidence || 0.95) * 100)}%
                        </strong>
                      </div>
                      {result.details?.decisionRationale && (
                        <div className="sm:col-span-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80">
                          {result.details.decisionRationale}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed result details for Layer 2 */}
                  {layer.id === 2 && result && (
                    <div className="space-y-3 pt-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">TÍN HIỆU REPUTATION</span>
                          <strong className="text-sm font-semibold text-[#ffd15c]">
                            {result.finding || "NO_KNOWN_THREAT"}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">TRẠNG THÁI PROVIDER</span>
                          <strong className="text-sm font-semibold text-white/80">
                            {result.providerStatus || "SUCCESS"}
                          </strong>
                        </div>
                      </div>
                      {result.summary && (
                        <p className="text-xs text-white/80 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                          {result.summary}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Completed result details for Layer 3 */}
                  {layer.id === 3 && result && (
                    <div className="space-y-3 pt-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">PHÁN QUYẾT BẰNG CHỨNG</span>
                          <strong className="text-sm font-semibold text-cyan-400">
                            {result.verdict || result.status || "SUPPORTED"}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">SỐ LƯỢNG NGUỒN</span>
                          <strong className="text-sm font-semibold text-white/90">
                            {result.sources?.length || 0} nguồn kiểm chứng
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">ĐỘ ĐỒNG THUẬN</span>
                          <strong className="text-sm font-semibold text-white/90">
                            {result.sourceAgreement || "ĐỒNG THUẬN CAO"}
                          </strong>
                        </div>
                      </div>
                      {Array.isArray(result.evidence) && result.evidence.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono text-white/50">TRÍCH DẪN BẰNG CHỨNG:</span>
                          {result.evidence.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-white/80 flex items-start justify-between gap-2">
                              <span>"{item.excerpt || item.content || item.title}"</span>
                              {item.sourceUrl && (
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline shrink-0 flex items-center gap-1"
                                >
                                  Nguồn <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed result details for Layer 4 */}
                  {layer.id === 4 && result && (
                    <div className="space-y-3 pt-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">MÔ HÌNH SUY LUẬN</span>
                          <strong className="text-sm font-semibold text-purple-300">
                            {result.geminiModel || result.groqModel || "Deterministic + LLM Synthesis"}
                          </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[11px] font-mono text-white/50 block">ĐỘ CHẮC CHẮN QUYẾT ĐỊNH</span>
                          <strong className="text-sm font-semibold text-white/90">
                            {Math.round((result.assessmentConfidence || result.confidence || 0.9) * 100)}%
                          </strong>
                        </div>
                      </div>
                      {result.reason && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80">
                          <strong>Diễn giải:</strong> {result.reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
