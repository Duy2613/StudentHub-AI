"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCode2,
  Info,
  Layers,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { STAGE_IDS } from "@/lib/ai-trust/v5/contracts.js";
import { presentStageForUser, USER_FACING_STAGE_NAMES } from "@/lib/ai-trust/v5/stagePresenter.js";

const CRITICAL_FINDINGS = new Set(["LOCAL_BLOCK", "THREAT_MATCH", "MALICIOUS", "FAKE_SCHOLARSHIP", "TUITION_PAYMENT_SCAM"]);

function currentStageId(pipeline, processing) {
  const stages = pipeline?.stages || {};
  const active = STAGE_IDS.find((id) => ["QUEUED", "RUNNING"].includes(stages[id]?.operationStatus));
  if (active) return active;
  const attention = STAGE_IDS.find((id) => ["PARTIAL", "FAILED", "BLOCKED", "SKIPPED"].includes(stages[id]?.operationStatus));
  if (attention) return attention;
  if (processing) return "l1";
  for (let index = STAGE_IDS.length - 1; index >= 0; index -= 1) {
    if (stages[STAGE_IDS[index]]?.operationStatus === "COMPLETED") return STAGE_IDS[index];
  }
  return "l1";
}

function getSemanticColorClasses(riskScore, status, critical) {
  if (critical || (riskScore !== null && riskScore >= 70)) {
    return {
      border: "border-red-500/40 hover:border-red-500/60",
      bgBadge: "bg-red-500/15 text-red-300 border-red-500/30",
      riskText: "text-red-400",
      pillBg: "bg-red-950/40 text-red-200 border-red-500/30",
      accent: "text-red-400",
      icon: <ShieldAlert size={28} className="text-red-400" aria-hidden="true" />,
    };
  }
  if (riskScore !== null && riskScore >= 40) {
    return {
      border: "border-amber-500/40 hover:border-amber-500/60",
      bgBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      riskText: "text-amber-400",
      pillBg: "bg-amber-950/40 text-amber-200 border-amber-500/30",
      accent: "text-amber-400",
      icon: <AlertTriangle size={28} className="text-amber-400" aria-hidden="true" />,
    };
  }
  if (status === "COMPLETED" || (riskScore !== null && riskScore < 40)) {
    return {
      border: "border-emerald-500/40 hover:border-emerald-500/60",
      bgBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      riskText: "text-emerald-400",
      pillBg: "bg-emerald-950/40 text-emerald-200 border-emerald-500/30",
      accent: "text-emerald-400",
      icon: <ShieldCheck size={28} className="text-emerald-400" aria-hidden="true" />,
    };
  }
  return {
    border: "border-cyan-500/30 hover:border-cyan-500/50",
    bgBadge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    riskText: "text-cyan-400",
    pillBg: "bg-cyan-950/40 text-cyan-200 border-cyan-500/30",
    accent: "text-cyan-400",
    icon: <Info size={28} className="text-cyan-400" aria-hidden="true" />,
  };
}

export default function TrustPipelineTimeline({ pipeline, processing = false, requestedStageId = null }) {
  const [selectedStageId, setSelectedStageId] = useState(() => currentStageId(pipeline, processing));
  const [followingCurrent, setFollowingCurrent] = useState(true);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);
  const stageButtonRefs = useRef(new Map());

  // Auto-follow current stage if option active
  useEffect(() => {
    if (followingCurrent) {
      setSelectedStageId(currentStageId(pipeline, processing));
    }
  }, [pipeline, processing, followingCurrent]);

  // Handle explicit jump requested from outside without re-requesting AI
  useEffect(() => {
    if (STAGE_IDS.includes(requestedStageId)) {
      setSelectedStageId(requestedStageId);
      setFollowingCurrent(false);
    }
  }, [requestedStageId]);

  const currentIndex = STAGE_IDS.indexOf(selectedStageId);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < STAGE_IDS.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      setSelectedStageId(STAGE_IDS[currentIndex - 1]);
      setFollowingCurrent(false);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setSelectedStageId(STAGE_IDS[currentIndex + 1]);
      setFollowingCurrent(false);
    }
  };

  const handleFollowToggle = () => {
    const nextFollow = !followingCurrent;
    setFollowingCurrent(nextFollow);
    if (nextFollow) {
      setSelectedStageId(currentStageId(pipeline, processing));
    }
  };

  const handleSelectStage = (id) => {
    setSelectedStageId(id);
    setFollowingCurrent(false);
  };

  const handleStageKeyDown = (event, id) => {
    const index = STAGE_IDS.indexOf(id);
    if (index < 0) return;
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % STAGE_IDS.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + STAGE_IDS.length) % STAGE_IDS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = STAGE_IDS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextId = STAGE_IDS[nextIndex];
    handleSelectStage(nextId);
    window.requestAnimationFrame(() => stageButtonRefs.current.get(nextId)?.focus());
  };

  const rawStage = pipeline?.stages?.[selectedStageId];
  const presented = useMemo(() => presentStageForUser(selectedStageId, rawStage), [selectedStageId, rawStage]);
  const isCritical = CRITICAL_FINDINGS.has(rawStage?.finding);
  const colors = getSemanticColorClasses(presented.riskScore, presented.status, isCritical);

  return (
    <section
      className="trust-v5-timeline w-full my-8 space-y-4"
      aria-label="Khung thẩm định theo giai đoạn"
      data-v5-pipeline-status={pipeline?.pipelineStatus || (processing ? "RUNNING" : "IDLE")}
    >
      {/* Stage Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold flex items-center gap-1.5">
            <Compass size={14} /> TIẾN TRÌNH BẢO CHỨNG · MỘT GIAI ĐOẠN MỖI LẦN ĐỌC
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            {presented.headline}
          </h2>
        </div>

        {/* Previous / Next / Follow Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            title="Xem giai đoạn trước (không chạy lại AI)"
          >
            <ArrowLeft size={14} /> Trước
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            title="Xem giai đoạn kế tiếp (không chạy lại AI)"
          >
            Kế tiếp <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={handleFollowToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              followingCurrent
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-sm"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${followingCurrent ? "bg-purple-400 animate-pulse" : "bg-slate-500"}`} />
            {followingCurrent ? "Đang theo dõi" : "Theo dõi hiện tại"}
          </button>
          <span className="sr-only">Chuyển stage không tự cuộn trang</span>
        </div>
      </div>

      {/* Horizontal Compact Stage Stepper */}
      <div className="grid grid-cols-7 gap-1.5 p-1.5 bg-black/40 border border-white/[0.06] rounded-xl backdrop-blur-md" role="tablist" aria-label="Các giai đoạn thẩm định">
        {STAGE_IDS.map((id) => {
          const isSelected = id === selectedStageId;
          const stageItem = pipeline?.stages?.[id];
          const itemStatus = stageItem?.operationStatus || "NOT_STARTED";
          const isDone = itemStatus === "COMPLETED";
          const isRunning = itemStatus === "RUNNING";
          const isWarn = ["FAILED", "BLOCKED", "PARTIAL"].includes(itemStatus) || CRITICAL_FINDINGS.has(stageItem?.finding);

          return (
            <button
              key={id}
              type="button"
              id={`trust-v5-tab-${id}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`trust-v5-panel-${id}`}
              tabIndex={isSelected ? 0 : -1}
              ref={(node) => {
                if (node) stageButtonRefs.current.set(id, node);
                else stageButtonRefs.current.delete(id);
              }}
              onClick={() => handleSelectStage(id)}
              onKeyDown={(event) => handleStageKeyDown(event, id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
                isSelected
                  ? "bg-white/[0.12] border border-white/20 shadow-sm text-white"
                  : "hover:bg-white/[0.04] text-slate-400"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="trust-v5-stage-tab-code font-mono text-xs font-bold uppercase">{id}</span>
                {isRunning ? (
                  <LoaderCircle size={10} className="animate-spin text-cyan-400" />
                ) : isDone ? (
                  <CheckCircle2 size={10} className="text-emerald-400" />
                ) : isWarn ? (
                  <AlertTriangle size={10} className="text-amber-400" />
                ) : null}
              </div>
              <span className="text-[11px] truncate max-w-full font-sans mt-0.5 opacity-90 hidden sm:inline-block">
                {USER_FACING_STAGE_NAMES[id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Single-Panel Stage Card (Ordinary User Focus: 9 Clean Points) */}
      <div
        id={`trust-v5-panel-${presented.stageId}`}
        role="tabpanel"
        aria-labelledby={`trust-v5-tab-${presented.stageId}`}
        data-stage-id={presented.stageId}
        className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border ${colors.border} p-6 sm:p-8 backdrop-blur-xl transition-all shadow-xl`}
      >
        {/* Top Header: 1. Stage Name, 2. Result Label, 3. Risk Score / Calibrated Prob, 4. Confidence */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 shrink-0">
              {colors.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-purple-300">
                  {presented.stageId.toUpperCase()}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors.bgBadge}`}>
                  {presented.resultLabel}
                </span>
                {presented.status === "RUNNING" && (
                  <span className="text-xs text-cyan-300 font-mono animate-pulse flex items-center gap-1">
                    <LoaderCircle size={12} className="animate-spin" /> Đang kiểm tra
                  </span>
                )}
              </div>
              <h3 id={`stage-heading-${presented.stageId}`} className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                {presented.headline}
              </h3>
            </div>
          </div>

          {/* Risk and Confidence Display */}
          <div className="flex items-center gap-6 self-start lg:self-auto">
            {/* Risk Number with Strict Calibration Compliance */}
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">
                {presented.calibrated ? "Xác suất rủi ro" : "Mức độ rủi ro"}
              </span>
              <div className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-sans ${colors.riskText}`}>
                {presented.riskScore !== null ? presented.riskScore : "—"}
                <span className="text-lg font-normal text-slate-400 ml-1">
                  {presented.calibrated ? "%" : "/100"}
                </span>
              </div>
              <span className="text-xs text-slate-400 block mt-0.5">
                {presented.riskDisplayLabel}
              </span>
            </div>

            {/* Confidence Label */}
            <div className="border-l border-white/10 pl-6 text-left">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">Độ tin cậy</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {presented.confidenceLabel}
              </div>
              <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                {presented.confidence !== null ? `${Math.round(presented.confidence * 100)}% bằng chứng` : "Chưa công bố"}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: 5. Top Findings (2-4 items) & 6. Main Conclusion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          {/* Main Conclusion (Headline Summary) */}
          <div className="lg:col-span-6 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-semibold flex items-center gap-1.5">
              <Sparkles size={14} /> 6. KẾT LUẬN CỦA GIAI ĐOẠN
            </span>
            <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
              {presented.summary}
            </p>

            {/* 9. User action if immediately necessary */}
            {presented.recommendedAction && (
              <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
                <strong className="block text-xs uppercase tracking-wider font-mono text-purple-300 mb-1">
                  9. Khuyến nghị hành động ngay
                </strong>
                <p className="text-sm font-medium text-slate-200">
                  {presented.recommendedAction}
                </p>
              </div>
            )}
          </div>

          {/* 5. Top Findings (2-4 items) */}
          <div className="lg:col-span-6 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
              <Layers size={14} /> 5. PHÁT HIỆN TRỌNG TÂM ({presented.topFindings.length})
            </span>
            <ul className="space-y-2.5">
              {presented.topFindings.map((finding, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-slate-200 leading-normal"
                >
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-cyan-300 shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Explicit epistemic boundary: every stage states its scope, finding,
            meaning, evidence, limits, and next hand-off in the reading path. */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 my-6" role="group" aria-label="Ranh giới bằng chứng của stage">
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4 md:col-span-2 xl:col-span-2">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-semibold block mb-1">Đang kiểm tra</span>
            <p className="text-sm text-slate-200 leading-relaxed">{presented.checking}</p>
          </div>
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold block mb-1">Finding của stage</span>
            <p className="text-sm text-slate-200 leading-relaxed">{presented.finding}</p>
          </div>
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold block mb-1">Finding này nghĩa là</span>
            <p className="text-sm text-slate-200 leading-relaxed">{presented.meaning}</p>
          </div>
          <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-4 md:col-span-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold block mb-1">Finding này KHÔNG chứng minh</span>
            <p className="text-sm text-slate-200 leading-relaxed">{presented.notProve}</p>
          </div>
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold block mb-1">Tín hiệu / evidence</span>
            <ul className="space-y-1 text-sm text-slate-200 leading-relaxed">
              {presented.signalSummaries.map((signal, index) => <li key={`${presented.stageId}-signal-${index}`}>· {signal}</li>)}
              <li className="text-xs text-slate-400">{presented.evidenceRefs.length} evidence ref{presented.evidenceRefs.length === 1 ? "" : "s"} được công bố</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.07] p-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block mb-1">Giới hạn</span>
            <ul className="space-y-1 text-sm text-slate-300 leading-relaxed">
              {presented.limitations.slice(0, 3).map((limit, index) => <li key={`${presented.stageId}-limit-${index}`}>· {limit}</li>)}
            </ul>
          </div>
        </div>

        {/* Bottom Section: 7. Next Stage & 8. Why Next Stage is Required */}
        <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-purple-300 font-mono text-xs">
              →
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-mono uppercase tracking-wider">
                <span className="sr-only">Stage kế tiếp</span>
                7. Giai đoạn kế tiếp: {presented.nextStageId ? USER_FACING_STAGE_NAMES[presented.nextStageId] || presented.nextStageId.toUpperCase() : "Hoàn tất"}
              </span>
              <p className="text-sm text-slate-300 mt-0.5">
                {presented.nextReason}
              </p>
            </div>
          </div>

          {presented.nextStageId && (
            <button
              type="button"
              onClick={() => handleSelectStage(presented.nextStageId)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-sm font-semibold text-white transition-all hover:scale-102 shrink-0 self-start sm:self-auto"
            >
              Xem {USER_FACING_STAGE_NAMES[presented.nextStageId]} <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Optional Technical Details Drawer Toggle */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowTechnicalDrawer(!showTechnicalDrawer)}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <FileCode2 size={13} />
            {showTechnicalDrawer ? "Thu gọn chi tiết kỹ thuật" : "Xem chi tiết kỹ thuật (dành cho chuyên gia & kiểm toán)"}
            {showTechnicalDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Technical Details Content Drawer */}
          {showTechnicalDrawer && (
            <div className="mt-4 p-5 rounded-xl bg-black/50 border border-white/10 space-y-4 text-xs font-mono text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong className="text-slate-400 uppercase block mb-1">Nguyên lý kiến trúc:</strong>
                  <p className="font-sans text-slate-300">{presented.technicalDetails.architecturalPrinciples || "Không có ghi chú thêm."}</p>
                </div>
                <div>
                  <strong className="text-slate-400 uppercase block mb-1">Provider & Thời gian phản hồi:</strong>
                  <p className="text-slate-300">
                    {presented.technicalDetails.providerImplementationNotes || "Thực thi cục bộ"}
                    {presented.technicalDetails.latencyMs != null ? ` · ${presented.technicalDetails.latencyMs}ms` : ""}
                  </p>
                </div>
              </div>

              {presented.technicalDetails.whatThisDoesNotProve && (
                <div>
                  <strong className="text-amber-400 uppercase block mb-1">Điều stage này KHÔNG chứng minh:</strong>
                  <p className="font-sans text-slate-300">{presented.technicalDetails.whatThisDoesNotProve}</p>
                </div>
              )}

              {presented.technicalDetails.technicalLimitations?.length > 0 && (
                <div>
                  <strong className="text-slate-400 uppercase block mb-1">Giới hạn kỹ thuật:</strong>
                  <ul className="list-disc pl-4 space-y-1 font-sans text-slate-300">
                    {presented.technicalDetails.technicalLimitations.map((limit, idx) => (
                      <li key={idx}>{limit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {presented.technicalDetails.rawEvidenceRefs?.length > 0 && (
                <div>
                  <strong className="text-slate-400 uppercase block mb-1">Mã tham chiếu bằng chứng (Evidence Refs):</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {presented.technicalDetails.rawEvidenceRefs.map((ref, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-purple-300">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
