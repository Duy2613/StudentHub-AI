"use client";

import React, { useState } from "react";
import { Brain, ShieldCheck, ShieldAlert, AlertTriangle, FileSearch, Layers, Target, Compass, CheckCircle2, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { LAYER_2_STATUS, SEMANTIC_CLASSIFICATION } from "@/lib/ai-trust/layer2/types";

export default function Layer2SemanticHUD({ result, className = "" }) {
  const [showAllClaims, setShowAllClaims] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  if (!result || result.layer !== 2) return null;

  const {
    status = LAYER_2_STATUS.PASS,
    classification = SEMANTIC_CLASSIFICATION.BENIGN,
    confidence = 0.9,
    semanticSummary = "",
    intent = {},
    entities = [],
    claims = [],
    contextSignals = [],
    consistencyFindings = [],
    crossModalFindings = [],
    verificationPackage = {},
    metrics = {},
  } = result;

  const isBlock = status === LAYER_2_STATUS.BLOCK;
  const isSuspicious = status === LAYER_2_STATUS.SUSPICIOUS;
  const isNeedsVerification = status === LAYER_2_STATUS.NEEDS_VERIFICATION;
  const isPass = status === LAYER_2_STATUS.PASS;

  const statusColor = isBlock
    ? "text-[#ff4d4d] border-[#ea3810]/50 bg-[#ea3810]/10"
    : isSuspicious
    ? "text-[#ffd15c] border-[#ffbc09]/50 bg-[#ffbc09]/10"
    : isNeedsVerification
    ? "text-[#00f0ff] border-[#00f0ff]/50 bg-[#00f0ff]/10"
    : "text-[#38f8d4] border-[#00f0ff]/50 bg-[#00f0ff]/10";

  const StatusIcon = isBlock
    ? ShieldAlert
    : isSuspicious
    ? AlertTriangle
    : isNeedsVerification
    ? FileSearch
    : ShieldCheck;

  const tasks = verificationPackage?.verificationTasks || [];
  const candidateSources = verificationPackage?.candidateSources || [];

  return (
    <div
      className={`p-6 sm:p-7 rounded-2xl bg-[#090302]/95 border border-[#ffbc09]/30 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,188,9,0.12)] space-y-6 ${className}`}
    >
      {/* 1. Header Bar: Engine Metadata & Verdict Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d0d08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#ffbc09]/15 border border-[#ffbc09]/40 text-[#ffbc09]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#ece7e0]/70">
                LAYER 02
              </span>
              <h2 className="text-base font-bold text-white font-human tracking-tight">
                Semantic &amp; Contextual Reasoning Engine
              </h2>
            </div>
            <p className="text-xs text-[#ece7e0]/60 font-mono mt-0.5">
              Phân tích mục đích, phát ngôn, mâu thuẫn nội tại &amp; hoạch định đối soát Layer 3
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${statusColor}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{status}</span>
            <span className="opacity-40">|</span>
            <span>{classification}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-right font-mono">
            <div className="text-[9px] text-[#ece7e0]/40 uppercase">Độ Tin Cậy</div>
            <div className="text-xs font-bold text-[#ffbc09]">{(confidence * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* 2. Semantic Summary & Intent Blueprint */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 rounded-xl bg-black/40 border border-[#2d0d08] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#ece7e0]/50 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#ffbc09]" />
            Tổng Kết Ý Nghĩa Ngữ Cảnh (Semantic Summary)
          </div>
          <p className="text-xs text-[#ece7e0] leading-relaxed font-human font-medium">
            {semanticSummary || "Văn bản đã được giải nghĩa hoàn tất."}
          </p>
          <div className="text-[11px] text-[#ece7e0]/60 italic font-mono pt-1">
            &ldquo;{result?.details?.decisionRationale}&rdquo;
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-[#2d0d08] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#ece7e0]/50 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#ffbc09]" />
            Mục Đích Tác Động (Intent)
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#ece7e0]/60">Chính (Primary):</span>
              <span className="font-bold text-[#ffbc09] uppercase">{intent.primary || "INFORM"}</span>
            </div>
            {intent.secondary && (
              <div className="flex items-center justify-between">
                <span className="text-[#ece7e0]/60">Phụ (Secondary):</span>
                <span className="font-bold text-white uppercase">{intent.secondary}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className="text-[#ece7e0]/60">Tính Thao Túng:</span>
              <span className={intent.coercive ? "text-[#ea3810] font-bold" : "text-[#38f8d4]"}>
                {intent.coercive ? "CÓ YẾU TỐ BẪY" : "KHÔNG"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Entities & Context Signals Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identified Entities */}
        <div className="p-4 rounded-xl bg-black/40 border border-[#2d0d08] space-y-3">
          <div className="text-[10px] font-mono uppercase text-[#ece7e0]/50 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#ffbc09]" />
              Thực Thể Nhận Diện ({entities.length})
            </span>
          </div>

          {entities.length === 0 ? (
            <p className="text-xs text-[#ece7e0]/40 font-mono italic">Không có tên tổ chức cụ thể được đề cập.</p>
          ) : (
            <div className="space-y-2">
              {entities.map((ent, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate">{ent.name}</div>
                    <div className="text-[10px] text-[#ffbc09]/80 truncate">
                      {ent.type} • {ent.officialDomains?.join(", ") || "Chưa gán domain"}
                    </div>
                  </div>
                  {ent.isClaimedAuthor && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ffbc09]/20 text-[#ffbc09] font-bold shrink-0">
                      TỰ XƯNG NGUỒN
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consistency & Cross-Modal Findings */}
        <div className="p-4 rounded-xl bg-black/40 border border-[#2d0d08] space-y-3">
          <div className="text-[10px] font-mono uppercase text-[#ece7e0]/50 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#ffbc09]" />
            Bất Nhất &amp; Bất Đồng Liên Phương Thức ({consistencyFindings.length + crossModalFindings.length})
          </div>

          {consistencyFindings.length === 0 && crossModalFindings.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#00f0ff]/5 border border-[#00f0ff]/20 text-xs font-mono text-[#38f8d4] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Nội dung mạch lạc, không phát hiện mâu thuẫn thời gian hay mạo danh domain.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {consistencyFindings.map((f, idx) => (
                <div key={`cons-${idx}`} className="p-2.5 rounded-lg bg-[#ea3810]/10 border border-[#ea3810]/30 text-xs font-mono text-[#ff8c73] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ea3810]" />
                    <span>Mâu Thuẫn Nội Tại: {f.type}</span>
                  </div>
                  <p className="text-[11px] text-[#ece7e0]/80 font-human">{f.details}</p>
                </div>
              ))}

              {crossModalFindings.map((f, idx) => (
                <div key={`cross-${idx}`} className="p-2.5 rounded-lg bg-[#ea3810]/10 border border-[#ea3810]/30 text-xs font-mono text-[#ff8c73] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#ea3810]" />
                    <span>Lệch Phương Thức: {f.type}</span>
                  </div>
                  <p className="text-[11px] text-[#ece7e0]/80 font-human">{f.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Extracted Claims & Verification Tasks for Layer 3 */}
      <div className="p-5 rounded-xl bg-black/60 border border-[#ffbc09]/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[#ffbc09]" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Hoạch Định Nhiệm Vụ Cho Layer 3 (Verification Tasks Package)
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[#ffbc09] font-bold">
            {tasks.length} Nhiệm vụ đối soát
          </span>
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-[#ece7e0]/50 font-mono italic">
            Không có phát ngôn sự kiện hoặc chính sách nào yêu cầu tìm kiếm bằng chứng bên ngoài.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, showAllTasks ? tasks.length : 3).map((task, idx) => (
              <div
                key={task.taskId || idx}
                className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#ffbc09]/20 text-[#ffbc09] font-bold text-[10px]">
                      {task.type}
                    </span>
                    <span className="text-[10px] text-[#ece7e0]/50 uppercase">Ưu Tiên: {task.priority}</span>
                  </div>
                  <p className="text-white font-human text-xs leading-relaxed">{task.instructions}</p>
                </div>
              </div>
            ))}

            {tasks.length > 3 && (
              <button
                onClick={() => {
                  saffronAudio.playClick(600);
                  setShowAllTasks(!showAllTasks);
                }}
                className="text-xs font-mono text-[#ffbc09] hover:underline flex items-center gap-1 pt-1"
              >
                {showAllTasks ? (
                  <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Xem thêm {tasks.length - 3} nhiệm vụ khác <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* Candidate Official Sources */}
        {candidateSources.length > 0 && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Nguồn Chính Thống Đề Xuất Đối Soát:</span>
            {candidateSources.map((src, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#38f8d4] text-[11px] font-mono font-bold"
              >
                🌐 {src.officialDomains[0]} ({src.entity})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5. Latency & Telemetry Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#ece7e0]/40 pt-2 border-t border-[#2d0d08]">
        <span>MODEL: {metrics.modelUsed || "deterministic_semantic_engine"}</span>
        <span>LATENCY: {metrics.executionTimeMs} ms</span>
        <span>NEXT LAYER: {result.nextLayer ? `LAYER 0${result.nextLayer}` : "EARLY EXIT STOP"}</span>
      </div>
    </div>
  );
}
