"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Shield,
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  ChevronRight,
  Flame,
  HelpCircle,
  Sparkles,
  Trophy,
  Target,
  ArrowRight,
  Loader2,
  Gift,
} from "lucide-react";
import Link from "next/link";
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

export default function CampusKnightsQuestsPage() {
  const { session, profile, updateProfile } = useAuth();

  const [quests, setQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Micro Scenario Drill State
  const [scenarioAnswer, setScenarioAnswer] = useState(null);
  const [scenarioScore, setScenarioScore] = useState(null);

  // Fetch Quests
  useEffect(() => {
    fetch("/api/quests/daily")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d?.quests)) {
          setQuests(d.quests);
        }
      })
      .catch((e) => console.warn("Failed to load quests:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const isExpert = profile?.role === "expert";
  const trustScore = profile?.trustScore ?? (isExpert ? 98 : 80);

  // Determine Knight Rank
  const getKnightTitle = (score) => {
    if (score >= 95) return "Đại Hiệp Sĩ Bảo Vệ Giảng Đường";
    if (score >= 80) return "⭐ Hiệp Sĩ Uy Tín (Chuyên Gia)";
    if (score >= 60) return "Vệ Binh Thông Thái";
    return "Tân Binh Giảng Đường";
  };

  // Claim Quest Reward
  const handleClaim = async (questId, points) => {
    saffronAudio.playClick(600);
    try {
      const res = await fetch("/api/quests/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();
      if (data?.success) {
        saffronAudio.playSuccessChime();
        setQuests((prev) =>
          prev.map((q) => (q.id === questId ? { ...q, isCompleted: true } : q))
        );
        setClaimSuccess(`+${points} Điểm Tín Nhiệm đã được cộng vào hồ sơ!`);
        setTimeout(() => setClaimSuccess(null), 3000);
      }
    } catch (err) {
      console.warn("Claim reward error:", err);
    }
  };

  // Handle Micro Scenario Quiz
  const handleAnswerScenario = (optionIndex) => {
    setScenarioAnswer(optionIndex);
    if (optionIndex === 1) {
      saffronAudio.playSuccessChime();
      setScenarioScore("CORRECT");
    } else {
      saffronAudio.playAlertBuzz();
      setScenarioScore("INCORRECT");
    }
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_11_SIGMA // CAMPUS_KNIGHT_ARENA"
        gridDensity={52}
        showRadarRings={true}
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
              <Trophy className="w-4 h-4 text-[#ffbc09]" />
              <span>CAMPUS GUARDIAN ARENA // REPUTATION UPGRADE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Đấu Trường Hiệp Sĩ</span> Giảng Đường
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Rèn luyện kỹ năng nhận diện lừa đảo, hoàn thành nhiệm vụ kiểm định cộng đồng và nâng cấp Danh hiệu Hiệp Sĩ bảo vệ giảng đường.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* Knight Progression Card Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#210a07] via-[#150604] to-[#210a07] border border-[#ffbc09]/40 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#ffbc09]/20 border-2 border-[#ffbc09] flex items-center justify-center text-[#ffbc09] shadow-[0_0_20px_rgba(255,188,9,0.3)] shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono text-[#ffbc09] font-bold uppercase tracking-wider block">
                CẤP BẬC HIỆP SĨ HIỆN TẠI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {getKnightTitle(trustScore)}
              </h2>
              <span className="text-xs text-[#ece7e0]/70 font-mono">
                {profile?.fullName || "Sinh viên"} • Điểm tín nhiệm: <strong className="text-[#ffd15c]">{trustScore} / 100 PTS</strong>
              </span>
            </div>
          </div>

          {/* Mini Badges Shelf */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-[#ffbc09]/40 text-xs font-mono text-[#ffd15c] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lá Chắn Giảng Đường</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-emerald-500/40 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mắt Thần Soi Bẫy</span>
            </div>
          </div>
        </div>

        {/* Claim Success Notification Banner */}
        <AnimatePresence>
          {claimSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 mb-6"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{claimSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-Column Quest & Simulation Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Daily Quests) */}
          <div className="lg:col-span-7 space-y-4">
            <SaffronSwissCrosshairGrid sectionTag="01 // DAILY_KNIGHT_MISSIONS" className="p-6 bg-[#150604] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#ffbc09]" />
                  NHIỆM VỤ THỬ THÁCH HÀNG NGÀY ({quests.length})
                </h2>
                <span className="text-xs font-mono text-[#ffbc09]">TỰ ĐỘNG LÀM MỚI 24H</span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#ffbc09] animate-spin" />
                  <span>Đang tải danh sách nhiệm vụ...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {quests.map((q) => (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        q.isCompleted
                          ? "bg-[#0a0504] border-emerald-500/40 opacity-80"
                          : "bg-[#210a07] border-[#47140b] hover:border-[#ffbc09]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#ffbc09]/20 text-[#ffbc09] text-[10px] font-mono font-bold">
                              +{q.rewardPoints} PTS
                            </span>
                            <span className="text-xs font-mono text-[#38bdf8] font-bold">
                              {q.type}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white leading-snug">
                            {q.title}
                          </h3>

                          <p className="text-xs text-[#ece7e0]/70 font-human leading-relaxed">
                            {q.description}
                          </p>
                        </div>

                        <div className="shrink-0 pt-1">
                          {q.isCompleted ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Xong
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <Link
                                href={q.actionUrl}
                                className="px-3 py-1.5 rounded-xl bg-[#ffbc09] text-[#150604] text-xs font-mono font-bold text-center hover:scale-105 transition-all"
                              >
                                Làm Ngay
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleClaim(q.id, q.rewardPoints)}
                                className="px-3 py-1 rounded-xl bg-transparent border border-[#47140b] hover:border-white/40 text-[10px] font-mono text-[#ece7e0]/70 cursor-pointer"
                              >
                                Nhận Thưởng
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SaffronSwissCrosshairGrid>
          </div>

          {/* Right Column (Micro Scenario Simulator) */}
          <div className="lg:col-span-5">
            <SaffronSwissCrosshairGrid sectionTag="02 // SCENARIO_DRILL_SIMULATOR" className="p-6 bg-[#150604] space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#47140b]">
                <Flame className="w-4 h-4 text-rose-500" />
                <h2 className="text-xs font-mono font-bold text-white uppercase">
                  TÌNH HUỐNG THỰC CHIẾN TUẦN NÀY
                </h2>
              </div>

              <div className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] space-y-2 text-xs">
                <span className="text-[10px] font-mono text-[#ffbc09] uppercase block font-bold">
                  BỐI CẢNH THỰC TẾ:
                </span>
                <p className="text-[#ece7e0]/90 leading-relaxed font-human">
                  Bạn nhận được một tin nhắn SMS gửi từ tên &ldquo;HCMUTE_ALERT&rdquo; với nội dung: <em>&ldquo;Hồ sơ sinh viên bị nghi ngờ sai phạm học phí, tài khoản SV sẽ bị khóa sau 2 giờ nếu không xác thực tại link hcmute-edu.top/verify&rdquo;</em>. Bạn sẽ xử lý thế nào?
                </p>
              </div>

              {/* 3 Interactive Choices */}
              <div className="space-y-2.5">
                {[
                  "A. Bấm ngay vào đường link trong tin nhắn và nhập mật khẩu / OTP để kiểm tra.",
                  "B. Không bấm vào link lạ; mở cổng chính thức online.hcmute.edu.vn hoặc dùng Radar Học Phí để đối soát.",
                  "C. Chụp màn hình gửi cho bạn bè nhờ bấm thử vào link để xem có phải thật không.",
                ].map((optionText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnswerScenario(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs font-human transition-all cursor-pointer ${
                      scenarioAnswer === idx
                        ? idx === 1
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-rose-500/20 border-rose-500 text-rose-300 font-bold"
                        : "bg-[#0a0504] border-[#47140b] text-[#ece7e0]/80 hover:border-white/30"
                    }`}
                  >
                    {optionText}
                  </button>
                ))}
              </div>

              {/* Verdict Explanation */}
              {scenarioScore && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-human space-y-1.5 ${
                    scenarioScore === "CORRECT"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-500/15 border-rose-500/40 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    {scenarioScore === "CORRECT" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>CHÍNH XÁC! (+10 PTS KỸ NĂNG AN NINH)</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-4 h-4 text-rose-400" />
                        <span>CHƯA ĐÚNG // BẪY PHISHING COMBOSQUATTING</span>
                      </>
                    )}
                  </div>
                  <p className="leading-relaxed">
                    Tên miền <code>hcmute-edu.top</code> là tên miền lừa đảo giả mạo (Combosquatting). Trường ĐH Sư Phạm Kỹ Thuật TP.HCM chỉ sử dụng tên miền chính thức có đuôi <code>.edu.vn</code>.
                  </p>
                </div>
              )}
            </SaffronSwissCrosshairGrid>
          </div>
        </div>
      </main>
    </div>
  );
}
