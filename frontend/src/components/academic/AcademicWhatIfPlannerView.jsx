"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SCENARIO_OPERATIONS } from "@/lib/intelligence/academic/academicSimulationModel.js";
import { STANDARD_TERMS } from "@/lib/intelligence/academic/academicPlannerModel.js";
import { STUDENT_PREFERENCES, PREFERENCE_LABELS } from "@/lib/intelligence/academic/academicDecisionModel.js";

// Preset scenarios for fast 1-click exploration in What-If Sandbox
const PRESET_SCENARIOS = [
  {
    id: "PRESET_TOEIC_550",
    title: "🎯 Đạt TOEIC 550+",
    subtitle: "Chuẩn đầu ra K24 & K25",
    operations: [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 550, isVerified: true }
    ]
  },
  {
    id: "PRESET_CREDITS_15",
    title: "📚 Hoàn tất 15 Tín chỉ",
    subtitle: "Tăng tốc hoàn thành CTĐT",
    operations: [
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 15 }
    ]
  },
  {
    id: "PRESET_GPA_32",
    title: "⭐ Nâng GPA lên 3.20",
    subtitle: "Đạt xếp loại Tốt nghiệp Giỏi",
    operations: [
      { type: SCENARIO_OPERATIONS.SET_GPA, value: 3.20 }
    ]
  },
  {
    id: "PRESET_FULL_CLEARANCE",
    title: "💳 Hoàn tất Học phí",
    subtitle: "Xóa toàn bộ công nợ",
    operations: [
      { type: SCENARIO_OPERATIONS.SET_TUITION_CLEARANCE, isCleared: true, remainingDebt: 0 }
    ]
  }
];

export function AcademicWhatIfPlannerView({ initialData = null }) {
  const currentSummary = initialData?.profile360?.academicSummary || {};
  const currentToeic = initialData?.digitalTwin?.certificates?.find(c => c.type === "TOEIC")?.score || 450;
  const currentGpa = currentSummary.cgpa ?? 2.85;
  const currentCredits = currentSummary.earnedCredits ?? 115;
  const currentDebt = initialData?.profile360?.financialClearance?.remainingDebt ?? 0;

  // Active View Tab: 'PLANNER' (Semester Study Planner), 'DECISION' (Decision Studio & Trade-offs), or 'WHAT_IF' (Sandbox)
  const [activeTab, setActiveTab] = useState("PLANNER");

  // Shared Target Term
  const [targetTerm, setTargetTerm] = useState("2026-HK1");

  // ─── Semester Planner State ───
  const [plannerData, setPlannerData] = useState(null);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [isPlannerLoading, setIsPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState(null);
  const [adoptedPlanId, setAdoptedPlanId] = useState(null);

  // ─── Decision Studio State ───
  const [studentPreference, setStudentPreference] = useState(STUDENT_PREFERENCES.BALANCED);
  const [decisionData, setDecisionData] = useState(null);
  const [isDecisionLoading, setIsDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState(null);
  const [adoptionFeedback, setAdoptionFeedback] = useState(null);

  // ─── What-If Sandbox State ───
  const [simToeic, setSimToeic] = useState(currentToeic);
  const [simGpa, setSimGpa] = useState(currentGpa);
  const [addedCredits, setAddedCredits] = useState(0);
  const [simTuitionCleared, setSimTuitionCleared] = useState(currentDebt === 0);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isSimLoading, setIsSimLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simErrorMsg, setSimErrorMsg] = useState(null);

  // Fetch candidate semester plans
  const fetchPlannerData = useCallback(async (termId) => {
    setIsPlannerLoading(true);
    setPlannerError(null);
    try {
      const res = await fetch("/api/academic/me/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTerm: termId })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Không thể nạp kế hoạch học kỳ.");
      }
      setPlannerData(data.planning);
      setSelectedPlanIdx(0);
    } catch (err) {
      setPlannerError(err.message);
    } finally {
      setIsPlannerLoading(false);
    }
  }, []);

  // Fetch Decision Studio comparison
  const fetchDecisionData = useCallback(async (termId, pref) => {
    setIsDecisionLoading(true);
    setDecisionError(null);
    try {
      const res = await fetch("/api/academic/me/decision-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTerm: termId, studentPreference: pref })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Không thể nạp bảng so sánh quyết định học vụ.");
      }
      setDecisionData(data.decisionStudio);
      if (data.decisionStudio?.baseline?.activeAdoption) {
        setAdoptedPlanId(data.decisionStudio.baseline.activeAdoption.planId);
      }
    } catch (err) {
      setDecisionError(err.message);
    } finally {
      setIsDecisionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "PLANNER") {
      fetchPlannerData(targetTerm);
    } else if (activeTab === "DECISION") {
      fetchDecisionData(targetTerm, studentPreference);
    }
  }, [activeTab, targetTerm, studentPreference, fetchPlannerData, fetchDecisionData]);

  // Handle Plan Adoption via Server API
  const handleAdoptPlan = async (planId) => {
    setAdoptionFeedback(null);
    try {
      const res = await fetch("/api/academic/me/decision-studio/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, targetTerm })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Không thể chọn kế hoạch.");
      }
      setAdoptedPlanId(planId);
      setAdoptionFeedback({
        type: "SUCCESS",
        message: data.actionBridge?.message || "Đã lưu nháp kế hoạch thành công!"
      });
    } catch (err) {
      setAdoptionFeedback({
        type: "ERROR",
        message: err.message
      });
    }
  };

  // Run What-If simulation via server API
  const handleRunSimulation = async (customOperations = null) => {
    setIsSimLoading(true);
    setSimErrorMsg(null);

    let operations = customOperations;
    if (!operations) {
      operations = [];
      if (simToeic !== currentToeic) {
        operations.push({
          type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE,
          certificateType: "TOEIC",
          score: Number(simToeic),
          isVerified: true
        });
      }
      if (simGpa !== currentGpa) {
        operations.push({
          type: SCENARIO_OPERATIONS.SET_GPA,
          value: Number(simGpa)
        });
      }
      if (addedCredits > 0) {
        operations.push({
          type: SCENARIO_OPERATIONS.ADD_CREDITS,
          value: Number(addedCredits)
        });
      }
      if (simTuitionCleared !== (currentDebt === 0)) {
        operations.push({
          type: SCENARIO_OPERATIONS.SET_TUITION_CLEARANCE,
          isCleared: simTuitionCleared,
          remainingDebt: simTuitionCleared ? 0 : currentDebt
        });
      }
      if (selectedCourse) {
        operations.push({
          type: SCENARIO_OPERATIONS.COMPLETE_COURSE,
          courseCode: selectedCourse,
          credits: 3
        });
      }
    }

    if (operations.length === 0) {
      setSimErrorMsg("Vui lòng thay đổi ít nhất một thông số học vụ để chạy mô phỏng.");
      setIsSimLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/academic/me/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Lỗi xử lý mô phỏng trên máy chủ.");
      }
      setSimulationResult(data.simulation);
    } catch (err) {
      setSimErrorMsg(err.message);
    } finally {
      setIsSimLoading(false);
    }
  };

  const handleResetSimulation = () => {
    setSimToeic(currentToeic);
    setSimGpa(currentGpa);
    setAddedCredits(0);
    setSimTuitionCleared(currentDebt === 0);
    setSelectedCourse("");
    setSimulationResult(null);
    setSimErrorMsg(null);
  };

  const currentPlan = plannerData?.candidatePlans?.[selectedPlanIdx] || null;

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
                Academic Planning Studio
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1 flex items-center gap-3">
              <span>Hoạch Định, So Sánh & Quyết Định Học Vụ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                DECISION STUDIO V1
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Đánh giá toàn diện các phương án học kỳ, phân tích đánh đổi (trade-offs) và lựa chọn định hướng cá nhân hóa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/academic/execution"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all shadow-sm"
            >
              📊 Theo Dõi Thực Thi
            </Link>
            <Link
              href="/academic/roadmap"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all shadow-sm"
            >
              🗺️ Xem Lộ Trình Học Vụ
            </Link>
          </div>
        </div>

        {/* Tab Selector: SEMESTER PLANNER vs DECISION STUDIO vs WHAT-IF SANDBOX */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-xl">
          <button
            onClick={() => setActiveTab("PLANNER")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "PLANNER"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📅 Lập Kế Hoạch</span>
          </button>
          <button
            onClick={() => setActiveTab("DECISION")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "DECISION"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>⚖️ So Sánh & Quyết Định</span>
          </button>
          <button
            onClick={() => setActiveTab("WHAT_IF")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "WHAT_IF"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🔮 Giả Lập What-If</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: SEMESTER STUDY PLANNER                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "PLANNER" && (
          <div className="space-y-8">
            
            {/* Term Picker Header */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Mục Tiêu Học Kỳ Dự Kiến
                </div>
                <div className="text-lg font-bold text-white">
                  Chọn học kỳ để hệ thống tính toán tổ hợp môn học khả dụng và tối ưu nhất
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

            {/* Error Display */}
            {plannerError && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-3">
                <span>⚠️</span>
                <span>{plannerError}</span>
              </div>
            )}

            {/* Loading Skeleton */}
            {isPlannerLoading && (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse text-slate-400 text-sm">
                Đang giải bài toán ràng buộc tiên quyết và xây dựng các phương án học kỳ tối ưu...
              </div>
            )}

            {/* Candidate Plans Grid */}
            {!isPlannerLoading && plannerData?.candidatePlans && (
              <div className="space-y-6">
                
                {/* 3 Candidate Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {plannerData.candidatePlans.map((plan, idx) => {
                    const isSelected = selectedPlanIdx === idx;
                    const isRec = plan.planType === "RECOMMENDED";
                    const isFast = plan.planType === "FAST_TRACK";

                    return (
                      <div
                        key={plan.planId}
                        onClick={() => setSelectedPlanIdx(idx)}
                        className={`cursor-pointer p-6 rounded-2xl border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/90"
                        }`}
                      >
                        {isRec && (
                          <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                            ⭐ Đề xuất tốt nhất
                          </div>
                        )}
                        {isFast && (
                          <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-blue-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                            ⚡ Tăng tốc tối đa
                          </div>
                        )}

                        <div className="space-y-4 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 font-mono">
                              {plan.targetTerm}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              plan.riskLevel === "LOW"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}>
                              Rủi ro: {plan.riskLevel}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-black text-white">{plan.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.subtitle}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                              <span className="text-slate-500 text-[10px] block uppercase">Khối lượng</span>
                              <span className="font-black text-white text-sm">{plan.totalCredits} Tín chỉ</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                              <span className="text-slate-500 text-[10px] block uppercase">Số học phần</span>
                              <span className="font-black text-white text-sm">{plan.selectedCourses.length} môn</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400">
                            {isSelected ? "● Đang xem chi tiết" : "○ Nhấn để xem"}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            Điểm: {plan.score}/100
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Plan In-Depth Analysis */}
                {currentPlan && (
                  <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl space-y-8">
                    
                    {/* Header Details */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            {currentPlan.planType}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            ID: {currentPlan.planId}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white mt-2">
                          {currentPlan.title}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                          {currentPlan.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAdoptPlan(currentPlan.planId)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                            adoptedPlanId === currentPlan.planId
                              ? "bg-emerald-600 text-white cursor-default"
                              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/20"
                          }`}
                        >
                          {adoptedPlanId === currentPlan.planId ? "✓ Đã chọn lưu nháp" : "📌 Chọn kế hoạch này"}
                        </button>
                      </div>
                    </div>

                    {/* Adoption Feedback Toast */}
                    {adoptionFeedback && (
                      <div className={`p-4 rounded-xl text-xs flex items-center justify-between ${
                        adoptionFeedback.type === "SUCCESS"
                          ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                          : "bg-red-950/60 border border-red-800 text-red-300"
                      }`}>
                        <span>{adoptionFeedback.message}</span>
                        <Link href="/academic" className="underline font-bold text-xs">
                          Đi tới Command Center →
                        </Link>
                      </div>
                    )}

                    {/* Course List & Actions Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Left: Recommended Courses (2 cols) */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Danh Sách Học Phần Đề Xuất ({currentPlan.selectedCourses.length} môn — {currentPlan.totalCredits} TC)</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Đạt 100% điều kiện tiên quyết</span>
                        </h3>

                        <div className="space-y-3">
                          {currentPlan.selectedCourses.map((c, i) => (
                            <div
                              key={c.code || i}
                              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-xs text-slate-200">
                                  {i + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-emerald-400">{c.code}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">
                                      {c.credits} Tín chỉ
                                    </span>
                                  </div>
                                  <div className="text-sm font-bold text-white mt-0.5">{c.name}</div>
                                  {c.unlockedDownstreamCount > 0 && (
                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                                      <span>🔓 Mở khóa</span>
                                      <span className="text-emerald-400 font-semibold">{c.unlockedDownstreamCount} học phần tiếp theo</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Khả dụng HK{targetTerm.slice(-1)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Non-Course Actions */}
                        {currentPlan.selectedActions?.length > 0 && (
                          <div className="pt-4 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Hành Động Khác Cần Thực Hiện Trong Học Kỳ
                            </h4>
                            <div className="space-y-2">
                              {currentPlan.selectedActions.map((act, i) => (
                                <div
                                  key={i}
                                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-3"
                                >
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Projected Roadmap & Impact (1 col) */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Hình Chiếu Kết Quả (What-If Projected)
                        </h3>

                        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-6">
                          
                          {/* Credit Transition */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-slate-400">Tích lũy Tín chỉ</span>
                              <span className="font-bold text-white">
                                {currentCredits} ➔ <span className="text-emerald-400">{currentPlan.projectedOutcome?.projectedCredits ?? (currentCredits + currentPlan.totalCredits)} / 150 TC</span>
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.round(((currentPlan.projectedOutcome?.projectedCredits ?? (currentCredits + currentPlan.totalCredits)) / 150) * 100))}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Roadmap Progress Transition */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-slate-400">Tiến độ Lộ trình</span>
                              <span className="font-bold text-white">
                                43% ➔ <span className="text-emerald-400">{currentPlan.projectedOutcome?.projectedRoadmapProgress?.percentage ?? 57}%</span>
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{
                                  width: `${currentPlan.projectedOutcome?.projectedRoadmapProgress?.percentage ?? 57}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* Blocker Reduction Banner */}
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                              <span>✓</span>
                              <span>Giải Tỏa Yếu Tố Cản Trở</span>
                            </div>
                            <p className="text-[11px] text-emerald-300/80">
                              Kế hoạch này giúp hoàn tất thêm {currentPlan.totalCredits} TC và mở đường cho các học phần tốt nghiệp.
                            </p>
                          </div>

                          {/* Action Bridges */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                            <Link
                              href="/academic"
                              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-center text-slate-200 transition-all"
                            >
                              ⚡ Xem Quy Trình Tại Command Center
                            </Link>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DECISION STUDIO & PLAN COMPARISON                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "DECISION" && (
          <div className="space-y-8">
            
            {/* Preference Selector Bar */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Ưu Tiên Học Tập Cá Nhân
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Chọn định hướng trọng tâm của bạn để hệ thống tự động tái xếp hạng và phân tích đánh đổi
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.values(STUDENT_PREFERENCES).map(pref => {
                  const isSelected = studentPreference === pref;
                  const item = PREFERENCE_LABELS[pref];
                  return (
                    <button
                      key={pref}
                      onClick={() => setStudentPreference(pref)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400"
                      }`}
                    >
                      <div className={`font-bold text-sm ${isSelected ? "text-emerald-300" : "text-slate-200"}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recommendation Banner */}
            {decisionData?.recommendation && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                      ⭐ Đề Xuất Phù Hợp Nhất
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Theo ưu tiên [{PREFERENCE_LABELS[studentPreference]?.label}]
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {decisionData.recommendation.title}
                  </h3>
                  <p className="text-xs text-emerald-200/80 max-w-3xl">
                    {decisionData.recommendation.rationale}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdoptPlan(decisionData.recommendation.recommendedPlanId)}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                  >
                    {adoptedPlanId === decisionData.recommendation.recommendedPlanId ? "✓ Đã Chọn Nháp" : "📌 Chọn Phương Án Này"}
                  </button>
                </div>
              </div>
            )}

            {/* Side-by-Side Comparison Matrix Table */}
            {decisionData?.plans && (
              <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl space-y-6 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Bảng So Sánh Đối Ứng Các Phương Án (Decision Matrix)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">So khớp trực tiếp các chỉ số định lượng giữa các phương án</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4 w-1/4">Tiêu Chí Đánh Giá</th>
                        {decisionData.plans.map(p => (
                          <th key={p.planId} className="py-3 px-4 w-1/4">
                            <div className="font-black text-white text-sm">{p.title}</div>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Điểm: {p.decisionScore}/100</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">Khối lượng Tín chỉ</td>
                        {decisionData.plans.map(p => (
                          <td key={p.planId} className="py-3 px-4 font-bold text-white">
                            {p.totalCredits} TC ({p.courseCount} môn)
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">Mức độ Rủi ro Học tập</td>
                        {decisionData.plans.map(p => (
                          <td key={p.planId} className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${
                              p.riskLevel === "LOW"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}>
                              {p.riskLevel}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">Tiến độ Lộ trình Dự kiến</td>
                        {decisionData.plans.map(p => (
                          <td key={p.planId} className="py-3 px-4 font-bold text-emerald-400">
                            {p.projectedRoadmapPercentage}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">Tích lũy Tín chỉ Sau kỳ</td>
                        {decisionData.plans.map(p => (
                          <td key={p.planId} className="py-3 px-4 font-bold text-white">
                            {p.projectedCredits} / 150 TC
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">Định hướng Tiến độ Tốt nghiệp</td>
                        {decisionData.plans.map(p => (
                          <td key={p.planId} className="py-3 px-4 text-slate-300 text-[11px]">
                            {p.goalAlignment}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-400">Thao tác</td>
                        {decisionData.plans.map(p => (
                          <td key={p.planId} className="py-3 px-4">
                            <button
                              onClick={() => handleAdoptPlan(p.planId)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                adoptedPlanId === p.planId
                                  ? "bg-emerald-600 text-white cursor-default"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                              }`}
                            >
                              {adoptedPlanId === p.planId ? "✓ Đã chọn" : "Chọn kế hoạch này"}
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pairwise Trade-Off Analysis Cards */}
            {decisionData?.tradeOffs?.length > 0 && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phân Tích Đánh Đổi Giữa Các Phương Án (Trade-Off Breakdown)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {decisionData.tradeOffs.map((to, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4"
                    >
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span>⚖️</span>
                        <span>{to.comparisonPair}</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                          <span className="font-bold block mb-0.5">✦ Lợi thế:</span>
                          <span>{to.advantageOfPlan2}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300">
                          <span className="font-bold block mb-0.5">⚠️ Đánh đổi / Rủi ro:</span>
                          <span>{to.disadvantageOfPlan2}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                        <span className="font-bold text-slate-400 block mb-0.5">Gợi ý quyết định:</span>
                        <span>{to.tradeOffVerdict}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: WHAT-IF SANDBOX SIMULATION                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "WHAT_IF" && (
          <div className="space-y-8">
            
            {/* Presets Bar */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Thử Nghiệm Nhanh Kịch Bản Giả Định
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PRESET_SCENARIOS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleRunSimulation(preset.operations)}
                    className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 text-left transition-all group"
                  >
                    <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {preset.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {preset.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Sandbox Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white">Bảng Điều Khiển Giả Lập</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Tùy biến các biến số học tập độc lập</p>
                    </div>
                    <button
                      onClick={handleResetSimulation}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Đặt lại
                    </button>
                  </div>

                  {/* Toeic Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Điểm TOEIC Giả Định</span>
                      <span className="font-mono font-bold text-emerald-400">{simToeic} / 990</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="990"
                      step="10"
                      value={simToeic}
                      onChange={(e) => setSimToeic(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Hiện tại: {currentToeic}</span>
                      <span>Chuẩn K24+: 500+</span>
                    </div>
                  </div>

                  {/* GPA Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Điểm GPA Dự Kiến</span>
                      <span className="font-mono font-bold text-emerald-400">{Number(simGpa).toFixed(2)} / 4.00</span>
                    </div>
                    <input
                      type="range"
                      min="1.00"
                      max="4.00"
                      step="0.05"
                      value={simGpa}
                      onChange={(e) => setSimGpa(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Hiện tại: {Number(currentGpa).toFixed(2)}</span>
                      <span>Giỏi: 3.20+</span>
                    </div>
                  </div>

                  {/* Added Credits Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Tín Chỉ Tích Lũy Thêm</span>
                      <span className="font-mono font-bold text-emerald-400">+{addedCredits} TC</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      step="3"
                      value={addedCredits}
                      onChange={(e) => setAddedCredits(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Hiện tại: {currentCredits} TC</span>
                      <span>Mục tiêu: {currentCredits + addedCredits} / 150 TC</span>
                    </div>
                  </div>

                  {/* Tuition Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Hoàn Tất Học Phí</div>
                      <div className="text-[10px] text-slate-400">
                        {currentDebt > 0 ? `Nợ hiện tại: ${currentDebt.toLocaleString()} VNĐ` : "Không nợ học phí"}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={simTuitionCleared}
                      onChange={(e) => setSimTuitionCleared(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Execute Button */}
                  <button
                    onClick={() => handleRunSimulation()}
                    disabled={isSimLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isSimLoading ? "Đang Tính Toán..." : "🔮 Chạy Mô Phỏng What-If"}
                  </button>

                  {simErrorMsg && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                      {simErrorMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Simulation Output & Comparison (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Result Card or Placeholder */}
                {simulationResult ? (
                  <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl space-y-6">
                    
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            SIMULATION ID: {simulationResult.simulationId}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-1">Kết Quả Mô Phỏng Sandbox</h2>
                      </div>
                    </div>

                    {/* Metric Comparison Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Điều Kiện</span>
                        <span className="text-xs font-bold text-slate-400 block line-through">
                          {simulationResult.baseline.eligibilityStatus}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                          {simulationResult.projected.eligibilityStatus}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Tiến Độ Lộ Trình</span>
                        <span className="text-xs font-bold text-slate-400 block">
                          {simulationResult.baseline.roadmapProgress.percentage}%
                        </span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                          ➔ {simulationResult.projected.roadmapProgress.percentage}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Tín Chỉ</span>
                        <span className="text-xs font-bold text-slate-400 block">
                          {simulationResult.baseline.earnedCredits} TC
                        </span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                          ➔ {simulationResult.projected.earnedCredits} TC
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Điểm GPA</span>
                        <span className="text-xs font-bold text-slate-400 block">
                          {simulationResult.baseline.cgpa.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                          ➔ {simulationResult.projected.cgpa.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Deltas & Explanations */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Các Biến Đổi & Giải Tỏa Cản Trở ({simulationResult.deltas.length})
                      </h3>

                      {simulationResult.deltas.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400">
                          Kịch bản hiện tại chưa làm thay đổi trạng thái cột mốc hoặc điều kiện học vụ nào.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {simulationResult.deltas.map((delta, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-start gap-3"
                            >
                              <span className="text-emerald-400 text-sm">✦</span>
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-200">{delta.summary}</div>
                                {delta.reasoning && (
                                  <div className="text-[11px] text-slate-400">{delta.reasoning}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Disclaimer Banner */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>Nguyên Tắc Bất Biến Giả Lập</span>
                      </div>
                      <p className="text-amber-300/80">
                        Kết quả trên chỉ là hình chiếu giả định trên bộ nhớ. Không có bất kỳ thay đổi nào được ghi vào hồ sơ học vụ, cơ sở dữ liệu hay quy trình chính thức của bạn.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-4">
                    <div className="text-4xl">🔮</div>
                    <h3 className="text-base font-bold text-white">Chưa Có Kịch Bản Mô Phỏng</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Chọn một kịch bản nhanh ở trên hoặc kéo các thanh trượt bên trái rồi bấm nút &ldquo;Chạy Mô Phỏng What-If&rdquo; để xem biến đổi lộ trình.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
