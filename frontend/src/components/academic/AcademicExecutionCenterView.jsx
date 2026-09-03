"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { STANDARD_TERMS } from "@/lib/intelligence/academic/academicPlannerModel.js";

export function AcademicExecutionCenterView({ initialData = null }) {
  const [targetTerm, setTargetTerm] = useState("2026-HK1");
  const [executionData, setExecutionData] = useState(initialData?.execution || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isReconciling, setIsReconciling] = useState(false);

  const fetchExecution = useCallback(async (termId) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/academic/me/execution?targetTerm=${encodeURIComponent(termId)}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Không thể nạp dữ liệu theo dõi thực thi học vụ.");
      }
      setExecutionData(data.execution);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReconcile = async () => {
    setIsReconciling(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/academic/me/execution/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTerm })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Không thể đồng bộ đối soát tiến độ.");
      }
      setExecutionData(data.execution);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsReconciling(false);
    }
  };

  useEffect(() => {
    fetchExecution(targetTerm);
  }, [targetTerm, fetchExecution]);

  const hasAdoptedPlan = executionData && executionData.adoptedPlanId !== "NONE";
  const drift = executionData?.drift || {};
  const progress = executionData?.progress || {};
  const hasDrift = drift.driftState && drift.driftState !== "NONE";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navigation & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/academic"
                className="text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                ← Academic Command Center
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Academic Execution Center
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1 flex items-center gap-3">
              <span>Theo Dõi Thực Thi & Đối Soát Kế Hoạch Học Vụ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                EXECUTION CENTER V1
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Đối chiếu kế hoạch đã chọn (Plan) với bảng điểm và dữ liệu thực tế (Actual), phát hiện độ lệch (Drift) và điều chỉnh kịp thời.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReconcile}
              disabled={isReconciling || isLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all shadow-sm flex items-center gap-2"
            >
              <span>{isReconciling ? "🔄 Đang đối soát..." : "🔄 Đồng Bộ Đối Soát"}</span>
            </button>
            <Link
              href="/academic/planner"
              className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-all shadow-sm"
            >
              ⚖️ Studio So Sánh & Quyết Định
            </Link>
          </div>
        </div>

        {/* Term Picker Header */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Học Kỳ Theo Dõi
            </div>
            <div className="text-lg font-bold text-white">
              Chọn học kỳ để xem tiến độ thực tế so với kế hoạch đã chọn
            </div>
          </div>

          <div className="flex items-center gap-3">
            {STANDARD_TERMS.map(t => (
              <button
                key={t.termId}
                onClick={() => setTargetTerm(t.termId)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  targetTerm === t.termId
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/10"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-3">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse text-slate-400 text-sm">
            Đang đối soát dữ liệu thực tế từ hồ sơ học vụ, bản sao số và quy trình thực hiện...
          </div>
        )}

        {/* View when No Plan Adopted */}
        {!isLoading && !hasAdoptedPlan && (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center space-y-5 max-w-2xl mx-auto">
            <div className="text-5xl">📋</div>
            <h2 className="text-xl font-bold text-white">Chưa Chọn Kế Hoạch Học Tập</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn chưa lưu nháp kế hoạch học tập nào cho học kỳ {targetTerm}. Hãy truy cập Studio So Sánh & Quyết Định để hệ thống tính toán và gợi ý phương án tối ưu nhất.
            </p>
            <div className="pt-2">
              <Link
                href="/academic/planner"
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 inline-block"
              >
                ⚖️ Khám Phá & Chọn Kế Hoạch Ngay
              </Link>
            </div>
          </div>
        )}

        {/* Main Execution Dashboard */}
        {!isLoading && hasAdoptedPlan && executionData && (
          <div className="space-y-8">
            
            {/* Header: Active Plan Summary & Execution Status */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    KẾ HOẠCH ĐANG THEO DÕI
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {executionData.adoptedPlanId}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {executionData.planTitle}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Học kỳ: <strong className="text-white font-mono">{executionData.targetTerm}</strong></span>
                  <span>•</span>
                  <span>Loại kế hoạch: <strong className="text-emerald-400">{executionData.planType}</strong></span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Trạng Thái Thực Thi</div>
                <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  executionData.status === "COMPLETED"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : executionData.status === "ACTIVE"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : executionData.status === "BLOCKED"
                    ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                    : executionData.status === "AT_RISK"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}>
                  ● {executionData.status}
                </span>
              </div>
            </div>

            {/* Plan Drift Alert Banner (If Drift Detected) */}
            {hasDrift && (
              <div className={`p-6 rounded-3xl border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl ${
                drift.driftState === "CRITICAL"
                  ? "bg-red-950/40 border-red-800/60 text-red-200"
                  : drift.driftState === "HIGH"
                  ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
                  : "bg-yellow-950/30 border-yellow-800/50 text-yellow-200"
              }`}>
                <div className="space-y-2 max-w-4xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-red-500 text-white font-mono">
                      ⚠️ PHÁT HIỆN ĐỘ LỆCH KẾ HOẠCH ({drift.driftState})
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      Khuyến nghị: {drift.recommendedResponse}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {drift.driftReasons.map((reason, idx) => (
                      <p key={idx} className="font-semibold text-slate-100 flex items-start gap-2">
                        <span className="text-amber-400">✦</span>
                        <span>{reason}</span>
                      </p>
                    ))}
                  </div>

                  {drift.replanRationale && (
                    <p className="text-[11px] text-slate-300/80 pt-1 border-t border-slate-800/60">
                      <strong>Phân tích hệ thống:</strong> {drift.replanRationale}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href="/academic/planner"
                    className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
                  >
                    ⚖️ Tái Đánh Giá Tại Studio
                  </Link>
                </div>
              </div>
            )}

            {/* Execution Progress Bar & Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase">Tiến Độ Tín Chỉ</span>
                  <span className="font-black text-white text-sm">
                    {progress.actualCompletedCredits} / {progress.plannedTotalCredits} TC
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress.plannedTotalCredits > 0 ? Math.min(100, Math.round((progress.actualCompletedCredits / progress.plannedTotalCredits) * 100)) : 0}%`
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Hoàn tất: {progress.actualCompletedCredits} TC</span>
                  <span>Còn lại: {Math.max(0, progress.plannedTotalCredits - progress.actualCompletedCredits)} TC</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase">Mục Tiêu Đã Hoàn Thành</span>
                  <span className="font-black text-white text-sm">
                    {progress.completedItemCount} / {progress.totalItemCount} mục
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Tỷ lệ hoàn thành: {progress.progressPercentage}%</span>
                  <span>Tổng hạng mục: {progress.totalItemCount}</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-slate-400 font-semibold uppercase text-xs">Độ Khớp Kế Hoạch</div>
                  <div className="text-xl font-black text-white mt-1">
                    {drift.driftState === "NONE" ? "100% Khớp Kế Hoạch" : `${100 - drift.driftScore}% Khớp`}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  {hasDrift ? "Cần theo dõi hoặc điều chỉnh" : "Toàn bộ học phần diễn ra đúng lộ trình"}
                </div>
              </div>

            </div>

            {/* Plan vs Actual Comparative Matrix Table */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Bảng Đối Soát Chi Tiết (Plan vs Actual Matrix)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đối chiếu trạng thái kỳ vọng của từng môn học với bảng điểm học vụ chính thức
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Mã & Tên Học Phần</th>
                      <th className="py-3 px-4">Tín Chỉ</th>
                      <th className="py-3 px-4">Kỳ Vọng (Plan)</th>
                      <th className="py-3 px-4">Thực Tế (Actual)</th>
                      <th className="py-3 px-4">Trạng Thái Thực Thi</th>
                      <th className="py-3 px-4">Đánh Giá Độ Lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {executionData.plannedItems?.map((item, idx) => {
                      const isCompleted = item.status === "COMPLETED";
                      const isFailed = item.status === "FAILED";
                      const isInProgress = item.status === "IN_PROGRESS";

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-emerald-400">{item.itemCode}</div>
                            <div className="text-white font-semibold text-xs mt-0.5">{item.itemName}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-300">
                            {item.credits > 0 ? `${item.credits} TC` : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {item.plannedState}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold ${
                              isCompleted
                                ? "text-emerald-400"
                                : isFailed
                                ? "text-red-400"
                                : isInProgress
                                ? "text-blue-400"
                                : "text-slate-400"
                            }`}>
                              {item.actualState}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isCompleted
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : isFailed
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : isInProgress
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {item.driftDetails ? (
                              <span className="text-amber-400 font-medium">
                                ⚠️ {item.driftDetails.explanation}
                              </span>
                            ) : isCompleted ? (
                              <span className="text-emerald-400/80">✓ Khớp lộ trình</span>
                            ) : (
                              <span>Đang tiến hành</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Next Recommended Actions Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hành Động Khuyến Nghị Tiếp Theo
                </div>
                <div className="text-sm font-bold text-white">
                  {executionData.nextActions?.[0] || "Tiếp tục hoàn tất các học phần đang diễn ra"}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/academic"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                >
                  ⚡ Academic Command Center
                </Link>
                <Link
                  href="/academic/roadmap"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                >
                  🗺️ Lộ Trình Học Vụ
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
