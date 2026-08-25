"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Building,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Link2,
  ExternalLink,
  PhoneCall,
  Info,
  Radio,
  Sparkles,
  Zap,
  Loader2,
  Copy,
  Check,
  ArrowRight,
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

const SAMPLE_SCENARIOS = [
  {
    label: "STK Chính Thức HCMUTE (BIDV)",
    uni: "SPK",
    acc: "31410001140001",
    url: "",
  },
  {
    label: "STK Chính Thức Bách Khoa HN (VCB)",
    uni: "BKA",
    acc: "0011000111222",
    url: "",
  },
  {
    label: "Cổng Nộp Học Phí UIT Thật",
    uni: "",
    acc: "",
    url: "https://student.uit.edu.vn",
  },
  {
    label: "Cảnh Báo: STK Cá Nhân Lừa Đảo",
    uni: "SPK",
    acc: "098877665544",
    url: "",
  },
  {
    label: "Cảnh Báo: Link Giả Mạo (.top)",
    uni: "",
    acc: "",
    url: "https://hcmute-payment-verify.top",
  },
];

export default function TuitionRadarPage() {
  const { session } = useAuth();

  const [inputMode, setInputMode] = useState("bank"); // 'bank' | 'url'
  const [universityQuery, setUniversityQuery] = useState("SPK");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const [allUniversities, setAllUniversities] = useState([]);
  const [copiedText, setCopiedText] = useState(false);

  // Load university list
  useEffect(() => {
    fetch("/api/tuition-radar/verify")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d?.universities)) {
          setAllUniversities(d.universities);
        }
      })
      .catch((e) => console.warn("Failed to load tuition universities:", e));
  }, []);

  // Handle Verify Execution
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    saffronAudio.playClick(700);
    setIsVerifying(true);
    setVerdict(null);

    try {
      const res = await fetch("/api/tuition-radar/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityQuery: inputMode === "bank" ? universityQuery : "",
          accountNumber: inputMode === "bank" ? accountNumber : "",
          paymentUrl: inputMode === "url" ? paymentUrl : "",
        }),
      });

      const data = await res.json();
      if (data?.success) {
        setVerdict(data);
        if (data.isOfficial) {
          saffronAudio.playSuccessChime();
        } else {
          saffronAudio.playAlertBuzz();
        }
      }
    } catch (err) {
      console.warn("Tuition verify error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text) => {
    saffronAudio.playClick(400);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_05_ZETA // TUITION_VERIFICATION_RADAR"
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

      {/* Main Container */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>OFFICIAL TUITION BANKING REGISTRY // 24/7 VERIFIER</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Radar Đối Soát STK Học Phí</span> &amp; Cổng Thu Phí
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Phòng ngừa bẫy mạo danh Phòng Đào tạo / Kế toán trường học yêu cầu chuyển tiền học phí vào tài khoản cá nhân hoặc website lừa đảo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* Reality Pipeline Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-[#150604]/90 border border-[#ffbc09]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono shadow-xl">
          <div className="flex items-start sm:items-center gap-2 text-[#ffd15c] min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping shrink-0 mt-1 sm:mt-0" />
            <div className="min-w-0">
              <span className="font-bold mr-2 text-[#ffbc09]">REALITY PIPELINE:</span>
              <span className="text-white/90 font-medium">New real source → change detection → importance → relevance to student → freshness → confidence → notification</span>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold shrink-0">
            ✓ 7-HEAD SIGNAL DECAY ACTIVE
          </div>
        </div>

        {/* Sample Fast-Verification Test Buttons */}
        <div className="mb-6 space-y-2">
          <span className="text-[10.5px] font-mono text-[#ece7e0]/60 uppercase block">
            MẪU KIỂM TRA NHANH ĐIỂN HÌNH:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SAMPLE_SCENARIOS.map((sc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  if (sc.url) {
                    setInputMode("url");
                    setPaymentUrl(sc.url);
                  } else {
                    setInputMode("bank");
                    setUniversityQuery(sc.uni);
                    setAccountNumber(sc.acc);
                  }
                  setVerdict(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#150604] border border-[#47140b] hover:border-[#ffbc09]/50 text-xs font-mono text-[#ece7e0]/80 hover:text-white whitespace-nowrap transition-all cursor-pointer"
              >
                ⚡ {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Radar Scanner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (Input Console) */}
          <div className="lg:col-span-6 space-y-6">
            <SaffronSwissCrosshairGrid sectionTag="01 // TUITION_VERIFIER_CONSOLE" className="p-6 bg-[#150604] space-y-5">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0a0504] border border-[#47140b]">
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setInputMode("bank");
                    setVerdict(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    inputMode === "bank"
                      ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                      : "text-[#ece7e0]/70 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Theo Số Tài Khoản (STK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setInputMode("url");
                    setVerdict(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    inputMode === "url"
                      ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                      : "text-[#ece7e0]/70 hover:text-white"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Theo Link / Website Cổng Thu</span>
                </button>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                {inputMode === "bank" ? (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                        TRƯỜNG ĐẠI HỌC CẦN ĐỐI SOÁT
                      </label>
                      <select
                        value={universityQuery}
                        onChange={(e) => setUniversityQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
                      >
                        {allUniversities.map((u) => (
                          <option key={u.id} value={u.code}>
                            [{u.code}] {u.name} ({u.shortName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                        SỐ TÀI KHOẢN NGÂN HÀNG (STK NHẬN TIỀN HỌC PHÍ)
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập số tài khoản bạn được yêu cầu chuyển tiền..."
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                      ĐƯỜNG LINK / WEBSITE ĐƯỢC YÊU CẦU NỘP HỌC PHÍ
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: https://online.hcmute.edu.vn hoặc https://hcmute-payment.top..."
                      value={paymentUrl}
                      onChange={(e) => setPaymentUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] font-mono"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs font-mono uppercase tracking-wider shadow-[0_0_25px_rgba(255,188,9,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ĐANG ĐỐI SOÁT DỮ LIỆU...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>ĐỐI SOÁT THÔNG TIN HỌC PHÍ NGAY</span>
                    </>
                  )}
                </button>
              </form>

              {/* Pro-Tips Box */}
              <div className="p-3.5 rounded-2xl bg-[#0a0504] border border-[#47140b] space-y-1.5 text-xs text-[#ece7e0]/70 font-human">
                <div className="flex items-center gap-1.5 text-[#ffbc09] font-mono font-bold text-[11px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>QUY TẮC AN TOÀN KHI NỘP HỌC PHÍ:</span>
                </div>
                <p>
                  100% Trường Đại học chính quy tại Việt Nam <strong>KHÔNG BAO GIỜ</strong> sử dụng tài khoản cá nhân để thu học phí. Tên chủ tài khoản thụ hưởng bắt buộc phải mang tên chính danh của Trường Đại học.
                </p>
              </div>
            </SaffronSwissCrosshairGrid>
          </div>

          {/* Right Column (Verdict Display & Details) */}
          <div className="lg:col-span-6">
            <SaffronSwissCrosshairGrid sectionTag="02 // AUDIT_VERDICT_OUTPUT" className="p-6 bg-[#150604] min-h-[420px] flex flex-col justify-between">
              {verdict ? (
                <div className="space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center gap-3 ${
                      verdict.isOfficial
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-500/15 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    {verdict.isOfficial ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-mono font-bold tracking-wider uppercase block">
                        {verdict.status === "OFFICIAL_VERIFIED"
                          ? "✓ TÀI KHOẢN CHÍNH THỐNG ĐÃ KIỂM CHỨNG"
                          : verdict.status === "IMPERSONATION_FRAUD"
                          ? "⚠️ CẢNH BÁO MẠO DANH / LỪA ĐẢO HỌC PHÍ"
                          : "THÔNG TIN TRƯỜNG ĐẠI HỌC"}
                      </span>
                      <p className="text-xs font-medium mt-0.5">{verdict.verdictMessage}</p>
                    </div>
                  </div>

                  {/* University Profile Card */}
                  {verdict.university && (
                    <div className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#47140b]/60">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#ffbc09]" />
                          <span className="text-xs font-bold text-white">
                            {verdict.university.name}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#ffbc09]/20 text-[#ffbc09] text-[10px] font-mono font-bold">
                          MÃ: {verdict.university.code}
                        </span>
                      </div>

                      {/* Official Matched Account if exists */}
                      {verdict.matchedAccount && (
                        <div className="space-y-2.5 text-xs font-mono p-3 rounded-2xl bg-[#120604] border border-[#47140b]">
                          <div className="flex justify-between items-center text-[#ece7e0]/70">
                            <span>NGÂN HÀNG:</span>
                            <span className="text-white font-bold">{verdict.matchedAccount.bankName}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[#ece7e0]/70">
                            <span>SỐ TÀI KHOẢN:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#ffd15c] font-black text-sm">{verdict.matchedAccount.accountNumber}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  saffronAudio.playClick(400);
                                  navigator.clipboard.writeText(verdict.matchedAccount.accountNumber);
                                  setCopiedText("acc");
                                  setTimeout(() => setCopiedText(null), 2000);
                                }}
                                className="p-1 rounded bg-[#210a07] border border-[#47140b] hover:border-[#ffbc09] text-[#ffd15c] text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Sao chép số tài khoản"
                              >
                                {copiedText === "acc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedText === "acc" ? "Đã chép" : "Chép STK"}</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[#ece7e0]/70">
                            <span>CHỦ TÀI KHOẢN:</span>
                            <span className="text-emerald-400 font-bold">{verdict.matchedAccount.accountHolder}</span>
                          </div>

                          <div className="flex justify-between items-center text-[#ece7e0]/70">
                            <span>CÚ PHÁP CHUẨN:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#38bdf8] font-bold">{verdict.matchedAccount.syntax}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  saffronAudio.playClick(400);
                                  navigator.clipboard.writeText(verdict.matchedAccount.syntax);
                                  setCopiedText("syntax");
                                  setTimeout(() => setCopiedText(null), 2000);
                                }}
                                className="p-1 rounded bg-[#210a07] border border-[#47140b] hover:border-[#38bdf8] text-[#38bdf8] text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Sao chép cú pháp chuyển tiền"
                              >
                                {copiedText === "syntax" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedText === "syntax" ? "Đã chép" : "Chép Cú Pháp"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Official Portal Link */}
                      <div className="pt-2 border-t border-[#47140b]/60 flex items-center justify-between text-xs font-mono">
                        <span className="text-[#ece7e0]/60">CỔNG NỘP CHÍNH THỨC:</span>
                        <a
                          href={verdict.university.officialPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#38bdf8] hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>{verdict.university.officialPortalUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Helpline */}
                      {verdict.university.officialHelpline && (
                        <div className="flex items-center gap-2 text-xs font-mono text-[#ffd15c]">
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Hotline: {verdict.university.officialHelpline}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warnings List (if any) */}
                  {verdict.warnings && verdict.warnings.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1 text-xs text-rose-300">
                      <span className="font-mono font-bold block">CHỈ SỐ RỦI RO:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {verdict.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation Box */}
                  <div className="p-3.5 rounded-2xl bg-[#0a0504] border border-[#47140b] space-y-1 text-xs">
                    <span className="text-[10px] font-mono text-[#ffbc09] uppercase block font-bold">
                      KHUYẾN NGHỊ HÀNH ĐỘNG:
                    </span>
                    <p className="text-[#ece7e0]/80 leading-relaxed font-human">
                      {verdict.recommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#ffbc09]/10 border border-[#ffbc09]/30 flex items-center justify-center text-[#ffbc09]">
                    <Radio className="w-7 h-7 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">
                    SẴN SÀNG ĐỐI SOÁT HỌC PHÍ
                  </h3>
                  <p className="text-xs text-[#ece7e0]/60 max-w-sm">
                    Nhập số tài khoản hoặc link thanh toán bên cạnh và bấm &ldquo;Đối Soát Thông Tin&rdquo; để nhận kết luận tức thì.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#47140b]/60 flex items-center justify-between text-[10.5px] font-mono text-[#ece7e0]/40">
                <span>NGUỒN DỮ LIỆU: BAN TÀI CHÍNH CÁC TRƯỜNG ĐH</span>
                <span>ZERO FAKE DATA ENGINE</span>
              </div>
            </SaffronSwissCrosshairGrid>
          </div>
        </div>

        {/* 3 Common Tuition Scam Scenarios */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#ea3810]" />
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Cảnh Giác 3 Chiêu Trò Mạo Danh Thu Học Phí Sinh Viên
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-[#150604] border border-[#47140b] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-white">
                Cuộc Gọi Dọa Đình Chỉ Học
              </h3>
              <p className="text-xs text-[#ece7e0]/70 leading-relaxed font-human">
                Đối tượng mạo danh cán bộ phòng đào tạo gọi điện thông báo sinh viên nợ học phí, dọa xóa tên khỏi danh sách thi nếu không nộp gấp trong vòng 2 giờ vào STK cá nhân.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#150604] border border-[#47140b] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-white">
                Fanpage Giả Mạo Giảm Giá 30%
              </h3>
              <p className="text-xs text-[#ece7e0]/70 leading-relaxed font-human">
                Lập trang mạng xã hội mang logo trường học, quảng cáo chương trình học bổng &ldquo;Đóng học phí sớm giảm 30%&rdquo; kèm mã QR chuyển tiền ví điện tử không chính danh.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#150604] border border-[#47140b] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-white">
                Link Giả Mạo Nhận Hoàn Tiền
              </h3>
              <p className="text-xs text-[#ece7e0]/70 leading-relaxed font-human">
                Gửi tin nhắn SMS giả brandname trường đại học thông báo &ldquo;Hoàn trả học phí thừa kỳ 1&rdquo; kèm link web lừa đảo yêu cầu đăng nhập tài khoản ngân hàng và OTP.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
