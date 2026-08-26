"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SCENARIO_OPERATIONS } from "@/lib/intelligence/academic/academicSimulationModel.js";

// Preset scenarios for fast 1-click exploration
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
  const student = initialData?.studentProfile || {};
  const currentSummary = initialData?.profile360?.academicSummary || {};
  const currentToeic = initialData?.digitalTwin?.certificates?.find(c => c.type === "TOEIC")?.score || 450;
  const currentGpa = currentSummary.cgpa ?? 2.85;
  const currentCredits = currentSummary.earnedCredits ?? 115;
  const currentDebt = initialData?.profile360?.financialClearance?.remainingDebt ?? 0;

  // Sandbox State
  const [simToeic, setSimToeic] = useState(currentToeic);
  const [simGpa, setSimGpa] = useState(currentGpa);
  const [addedCredits, setAddedCredits] = useState(0);
  const [simTuitionCleared, setSimTuitionCleared] = useState(currentDebt === 0);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Run simulation via server API
  const handleRunSimulation = async (customOperations = null) => {
    setIsLoading(true);
    setErrorMsg(null);

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
      setErrorMsg("Vui lòng thay đổi ít nhất một thông số học vụ để chạy mô phỏng.");
      setIsLoading(false);
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
        throw new Error(data.error || "Không thể thực thi kịch bản giả lập.");
      }

      setSimulationResult(data.simulation);
    } catch (err) {
      setErrorMsg(err.message || "Lỗi kết nối máy chủ mô phỏng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    // Sync UI controls with preset
    for (const op of preset.operations) {
      if (op.type === SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE) setSimToeic(op.score);
      if (op.type === SCENARIO_OPERATIONS.SET_GPA) setSimGpa(op.value);
      if (op.type === SCENARIO_OPERATIONS.ADD_CREDITS) setAddedCredits(op.value);
      if (op.type === SCENARIO_OPERATIONS.SET_TUITION_CLEARANCE) setSimTuitionCleared(op.isCleared);
    }
    handleRunSimulation(preset.operations);
  };

  const handleReset = () => {
    setSimToeic(currentToeic);
    setSimGpa(currentGpa);
    setAddedCredits(0);
    setSimTuitionCleared(currentDebt === 0);
    setSelectedCourse("");
    setSimulationResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/academic" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              ← Trung tâm Điều phối
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <Link href="/academic/roadmap" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              🗺️ Lộ trình
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Bộ Giả Lập Hoạch Định Học Vụ
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
              🔬 SANDBOX PROJECTION
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {student.fullName} — MSSV: {student.studentId} — Khóa {student.cohort} ({student.programName})
          </p>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRESET_SCENARIOS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handleApplyPreset(preset)}
            className="p-3.5 rounded-2xl border border-border/60 bg-card/30 hover:border-violet-500/50 hover:bg-violet-500/5 backdrop-blur-xl text-left transition-all duration-300 group cursor-pointer"
          >
            <div className="font-semibold text-xs text-foreground group-hover:text-violet-400 transition-colors">
              {preset.title}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {preset.subtitle}
            </div>
          </button>
        ))}
      </div>

      {/* Main Grid: Builder vs Results */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: What-If Builder */}
        <div className="lg:col-span-5 rounded-3xl border border-border/60 bg-card/30 p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <span>🛠️</span> Thiết lập Giả định (What-If)
            </h2>
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
            >
              Đặt lại
            </button>
          </div>

          {/* 1. TOEIC Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Chứng chỉ TOEIC Quốc tế</span>
              <span className="text-muted-foreground">Hiện tại: <b className="text-foreground">{currentToeic}</b></span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="350"
                max="900"
                step="10"
                value={simToeic}
                onChange={(e) => setSimToeic(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="w-14 text-center font-bold text-sm bg-muted/40 py-1 rounded-lg border border-border/40 tabular-nums">
                {simToeic}
              </span>
            </div>
          </div>

          {/* 2. Additional Credits */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Tín chỉ tích lũy thêm</span>
              <span className="text-muted-foreground">Hiện tại: <b className="text-foreground">{currentCredits} / 150</b></span>
            </div>
            <div className="flex items-center gap-2">
              {[3, 6, 12, 20].map(cred => (
                <button
                  key={cred}
                  type="button"
                  onClick={() => setAddedCredits(addedCredits === cred ? 0 : cred)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    addedCredits === cred 
                      ? "bg-violet-500 text-white border-violet-600 shadow-md" 
                      : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  +{cred} TC
                </button>
              ))}
            </div>
          </div>

          {/* 3. GPA Target */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Điểm trung bình CGPA (hệ 4)</span>
              <span className="text-muted-foreground">Hiện tại: <b className="text-foreground">{Number(currentGpa).toFixed(2)}</b></span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2.0"
                max="4.0"
                step="0.05"
                value={simGpa}
                onChange={(e) => setSimGpa(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="w-14 text-center font-bold text-sm bg-muted/40 py-1 rounded-lg border border-border/40 tabular-nums">
                {Number(simGpa).toFixed(2)}
              </span>
            </div>
          </div>

          {/* 4. Complete Course */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Giả định hoàn thành học phần</span>
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">-- Chọn học phần mô phỏng --</option>
              <option value="SWEN330103">SWEN330103 — Kỹ thuật Phần mềm (3 TC)</option>
              <option value="INTR430103">INTR430103 — Thực tập Tốt nghiệp (3 TC)</option>
              <option value="GRAP440103">GRAP440103 — Khóa luận Tốt nghiệp (10 TC)</option>
            </select>
          </div>

          {/* 5. Tuition Clearance */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40">
            <span className="text-xs font-medium text-foreground">Nghĩa vụ học phí học kỳ</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simTuitionCleared}
                onChange={(e) => setSimTuitionCleared(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-2 text-xs font-semibold text-foreground">
                {simTuitionCleared ? "Đã đóng đủ" : "Còn nợ"}
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={() => handleRunSimulation()}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/20 transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Đang tính toán giả lập..." : "⚡ Chạy Mô Phỏng What-If"}
          </button>
        </div>

        {/* Right Column: Simulation Results / Deltas */}
        <div className="lg:col-span-7 space-y-6">
          {!simulationResult ? (
            <div className="rounded-3xl border border-border/60 bg-card/30 p-8 text-center backdrop-blur-xl space-y-3">
              <span className="text-4xl block">🔮</span>
              <h3 className="font-bold text-base text-foreground">Sẵn sàng chạy mô phỏng</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Chọn một kịch bản mẫu ở trên hoặc tùy chỉnh các thông số giả định bên trái để khám phá sự thay đổi về điều kiện tốt nghiệp và lộ trình học vụ.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Delta Comparison Banner */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Eligibility Transition */}
                <div className="p-4 rounded-2xl border border-border/60 bg-card/30 backdrop-blur-xl space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Xét Tốt Nghiệp</span>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className={simulationResult.baseline.isEligible ? "text-emerald-400" : "text-amber-400"}>
                      {simulationResult.baseline.eligibilityStatus}
                    </span>
                    <span className="text-muted-foreground">➔</span>
                    <span className={simulationResult.projected.isEligible ? "text-emerald-400 font-extrabold" : "text-amber-400"}>
                      {simulationResult.projected.eligibilityStatus}
                    </span>
                  </div>
                </div>

                {/* Progress Percentage */}
                <div className="p-4 rounded-2xl border border-border/60 bg-card/30 backdrop-blur-xl space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Tiến Độ Lộ Trình</span>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-foreground">{simulationResult.baseline.roadmapProgress.percentage}%</span>
                    <span className="text-muted-foreground">➔</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      {simulationResult.projected.roadmapProgress.percentage}%
                    </span>
                  </div>
                </div>

                {/* Blocker Count */}
                <div className="p-4 rounded-2xl border border-border/60 bg-card/30 backdrop-blur-xl space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Yếu Tố Cản Trở</span>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-red-400">{simulationResult.baseline.blockerCount}</span>
                    <span className="text-muted-foreground">➔</span>
                    <span className={simulationResult.projected.blockerCount === 0 ? "text-emerald-400" : "text-amber-400"}>
                      {simulationResult.projected.blockerCount} yếu tố
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Deltas & Explainability */}
              <div className="rounded-3xl border border-border/60 bg-card/30 p-6 backdrop-blur-xl space-y-4">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>✨</span> Các Thay Đổi Học Vụ Được Kích Hoạt
                </h3>

                {simulationResult.deltas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Kịch bản chưa tạo ra thay đổi lớn về trạng thái cột mốc học vụ.</p>
                ) : (
                  <div className="space-y-3">
                    {simulationResult.deltas.map((d, i) => (
                      <div
                        key={d.deltaId || i}
                        className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                            <span>✓</span> {d.summary}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            {d.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {d.whyItChanged}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bridge */}
              <div className="rounded-3xl border border-violet-500/30 bg-violet-500/5 p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="font-bold text-sm text-foreground">Muốn biến kịch bản này thành hiện thực?</h4>
                  <p className="text-xs text-muted-foreground">
                    Truy cập Action Center để xem các bước nộp chứng chỉ và đăng ký học phần chính thức.
                  </p>
                </div>
                <Link
                  href="/academic"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md flex-shrink-0"
                >
                  Đến Trung Tâm Hành Động →
                </Link>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-muted-foreground/70 p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-1">
                <p className="font-semibold text-muted-foreground">⚠️ Tuyên bố miễn trừ trách nhiệm giả lập:</p>
                {simulationResult.limitations.map((lim, idx) => (
                  <p key={idx}>• {lim}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
