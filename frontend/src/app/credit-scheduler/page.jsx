"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  MapPin,
  User,
  Layers,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
  Share2,
  Download,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { motion, AnimatePresence } from "motion/react";

const DAYS = [
  { id: 2, label: "Thứ 2" },
  { id: 3, label: "Thứ 3" },
  { id: 4, label: "Thứ 4" },
  { id: 5, label: "Thứ 5" },
  { id: 6, label: "Thứ 6" },
  { id: 7, label: "Thứ 7" },
  { id: 8, label: "Chủ Nhật" },
];

const PERIOD_BLOCKS = [
  { id: "M1", label: "Tiết 1 - 3", time: "07:00 - 09:30", type: "MORNING" },
  { id: "M2", label: "Tiết 4 - 6", time: "09:45 - 12:15", type: "MORNING" },
  { id: "A1", label: "Tiết 7 - 9", time: "12:30 - 15:00", type: "AFTERNOON" },
  { id: "A2", label: "Tiết 10 - 12", time: "15:15 - 17:45", type: "AFTERNOON" },
];

const COURSE_COLOR_MAP = [
  "from-amber-500/20 to-[#ffbc09]/30 border-[#ffbc09] text-[#ffd15c]",
  "from-emerald-500/20 to-teal-500/30 border-emerald-500 text-emerald-300",
  "from-sky-500/20 to-indigo-500/30 border-sky-500 text-sky-300",
  "from-rose-500/20 to-pink-500/30 border-rose-500 text-rose-300",
  "from-purple-500/20 to-violet-500/30 border-purple-500 text-purple-300",
];

export default function CreditSchedulerPage() {
  const { session } = useAuth();

  const [bundles, setBundles] = useState([]);
  const [selectedBundleId, setSelectedBundleId] = useState("CS_YEAR1_HCMUTE_UIT");
  const [strategyMode, setStrategyMode] = useState("MORNING_FOCUS"); // 'MORNING_FOCUS' | 'FREE_FRIDAY' | 'BALANCED'
  const [isCalculating, setIsCalculating] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  // Load bundles
  useEffect(() => {
    fetch("/api/scheduler/optimize")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d?.bundles)) {
          setBundles(d.bundles);
        }
      })
      .catch((e) => console.warn("Failed to load course bundles:", e));
  }, []);

  // Run CSP Optimizer
  const runOptimization = useCallback(async (bundleId, mode) => {
    setIsCalculating(true);
    saffronAudio.playClick(600);

    try {
      // Find bundle
      const res = await fetch("/api/scheduler/optimize");
      const data = await res.json();
      const bundle = data?.bundles?.find((b) => b.id === bundleId) || data?.bundles?.[0];

      if (bundle) {
        const postRes = await fetch("/api/scheduler/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courses: bundle.courses,
            mode: mode,
          }),
        });
        const postData = await postRes.json();
        if (postData?.success) {
          setScheduleData(postData);
          setSelectedPlanIndex(0);
          saffronAudio.playSuccessChime();
        }
      }
    } catch (err) {
      console.warn("Scheduler optimize error:", err);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  useEffect(() => {
    runOptimization(selectedBundleId, strategyMode);
  }, [selectedBundleId, strategyMode, runOptimization]);

  const activePlan = scheduleData?.plans?.[selectedPlanIndex] || null;

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_12_EPSILON // CSP_TIMETABLE_OPTIMIZER"
        gridDensity={52}
        showRadarRings={false}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Navigation */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <Zap className="w-4 h-4 text-[#ffbc09]" />
              <span>CONSTRAINT SATISFACTION (CSP) SOLVER // ZERO CLASH</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">AI Xếp Thời Khóa Biểu</span> &amp; Đăng Ký Tín Chỉ
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Tự động giải bài toán trùng lịch học, tối ưu dồn ca sáng để trống buổi chiều đi làm thêm hoặc nghỉ trọn vẹn Thứ 6 cho sinh viên.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* Bundle Selector & Strategy Filter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Bundle Selector */}
          <div className="lg:col-span-6 p-4 rounded-3xl bg-[#150604] border border-[#47140b] space-y-2">
            <span className="text-xs font-mono font-bold text-[#ffbc09] block">
              CHỌN GÓI HỌC PHẦN CHUẨN THEO NGÀNH:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {bundles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setSelectedBundleId(b.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    selectedBundleId === b.id
                      ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-md"
                      : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:text-white"
                  }`}
                >
                  <span>{b.majorName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Mode Buttons */}
          <div className="lg:col-span-6 p-4 rounded-3xl bg-[#150604] border border-[#47140b] space-y-2">
            <span className="text-xs font-mono font-bold text-[#ffbc09] block">
              CHIẾN THUẬT XẾP LỊCH ƯU TIÊN:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  setStrategyMode("MORNING_FOCUS");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  strategyMode === "MORNING_FOCUS"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500 shadow-sm"
                    : "bg-[#210a07] text-[#ece7e0]/60 border border-[#47140b] hover:text-white"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Ưu Tiên Sáng</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  setStrategyMode("FREE_FRIDAY");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  strategyMode === "FREE_FRIDAY"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500 shadow-sm"
                    : "bg-[#210a07] text-[#ece7e0]/60 border border-[#47140b] hover:text-white"
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Nghỉ Thứ 6</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  setStrategyMode("BALANCED");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  strategyMode === "BALANCED"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500 shadow-sm"
                    : "bg-[#210a07] text-[#ece7e0]/60 border border-[#47140b] hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cân Bằng</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Switcher Pills */}
        {scheduleData?.plans && scheduleData.plans.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#ece7e0]/60 uppercase">PHƯƠNG ÁN TỐI ƯU:</span>
              {scheduleData.plans.map((p, idx) => (
                <button
                  key={p.planId}
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setSelectedPlanIndex(idx);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    selectedPlanIndex === idx
                      ? "bg-[#ffd15c] text-[#150604] border-[#ffd15c] shadow-md scale-105"
                      : "bg-[#150604] text-[#ece7e0]/70 border-[#47140b] hover:border-white/30"
                  }`}
                >
                  Phương Án {idx + 1} (Score: {p.score}đ)
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Không Trùng Giờ Học • Tổng: {activePlan?.totalCredits} Tín Chỉ</span>
            </div>
          </div>
        )}

        {/* Weekly Timetable Cyber Glassmorphism Grid */}
        <SaffronSwissCrosshairGrid sectionTag="01 // INTERACTIVE_WEEKLY_SCHEDULE_GRID" className="p-4 sm:p-6 bg-[#150604] overflow-x-auto">
          {isCalculating ? (
            <div className="p-16 text-center text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-[#ffbc09] animate-spin" />
              <span>Đang tính toán các tổ hợp không xung đột giờ...</span>
            </div>
          ) : !activePlan ? (
            <div className="p-16 text-center text-xs font-mono text-rose-400">
              Không tìm thấy phương án phù hợp. Vui lòng đổi tiêu chí hoặc gói môn học.
            </div>
          ) : (
            <div className="min-w-[700px]">
              {/* Day Header Row */}
              <div className="grid grid-cols-8 gap-2 pb-3 border-b border-[#47140b] text-center text-xs font-mono font-bold">
                <div className="text-[#ece7e0]/40 uppercase py-2">CA HỌC</div>
                {DAYS.map((d) => (
                  <div
                    key={d.id}
                    className={`py-2 rounded-xl ${
                      activePlan.freeDays?.includes(d.id)
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-[#210a07] text-[#ffd15c] border border-[#47140b]"
                    }`}
                  >
                    <span>{d.label}</span>
                    {activePlan.freeDays?.includes(d.id) && (
                      <span className="block text-[9px] text-emerald-300 font-normal">Nghỉ</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Time Blocks Rows */}
              <div className="space-y-2.5 pt-3">
                {PERIOD_BLOCKS.map((block) => (
                  <div key={block.id} className="grid grid-cols-8 gap-2 min-h-[90px]">
                    {/* Time Label Column */}
                    <div className="p-2 rounded-2xl bg-[#0a0504] border border-[#47140b] flex flex-col justify-center text-center font-mono text-xs">
                      <span className="text-white font-bold">{block.label}</span>
                      <span className="text-[10px] text-[#ece7e0]/50">{block.time}</span>
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((d) => {
                      // Find if any course section occupies this day and period range
                      const matchedSection = activePlan.sections.find((s) => {
                        if (s.dayOfWeek !== d.id) return false;
                        if (block.id === "M1" && s.startPeriod <= 3) return true;
                        if (block.id === "M2" && s.startPeriod >= 4 && s.startPeriod <= 6) return true;
                        if (block.id === "A1" && s.startPeriod >= 7 && s.startPeriod <= 9) return true;
                        if (block.id === "A2" && s.startPeriod >= 10) return true;
                        return false;
                      });

                      const colorClass = matchedSection
                        ? COURSE_COLOR_MAP[
                            Math.abs(matchedSection.courseCode.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
                              COURSE_COLOR_MAP.length
                          ]
                        : null;

                      return (
                        <div
                          key={d.id}
                          className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            matchedSection
                              ? `bg-gradient-to-b ${colorClass} shadow-md`
                              : "bg-[#0a0504]/50 border-[#47140b]/30"
                          }`}
                        >
                          {matchedSection ? (
                            <>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono font-bold uppercase block opacity-75">
                                  [{matchedSection.courseCode}]
                                </span>
                                <h4 className="text-xs font-bold leading-tight text-white">
                                  {matchedSection.courseName}
                                </h4>
                              </div>

                              <div className="pt-1.5 text-[10px] font-mono space-y-0.5 opacity-90">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{matchedSection.room}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate">
                                  <User className="w-2.5 h-2.5" />
                                  <span className="truncate">{matchedSection.lecturer}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center text-[10px] font-mono text-[#ece7e0]/10">
                              Trống
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SaffronSwissCrosshairGrid>
      </main>
    </div>
  );
}
