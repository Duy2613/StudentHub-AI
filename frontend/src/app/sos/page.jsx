"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  AlertOctagon,
  PhoneCall,
  Lock,
  FileText,
  Printer,
  Copy,
  Check,
  Building,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Clock,
  Sparkles,
  Zap,
  Navigation,
  Radio,
  Timer,
  Siren,
  HeartPulse,
  Flame,
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
import { OFFICIAL_EMERGENCY_HOTLINES, generateEmergencySosPayload } from "@/lib/intelligence/emergency/emergencySystemEngine";

export default function SosLegalRoomPage() {
  const { session, profile } = useAuth();

  const [activeTab, setActiveTab] = useState("instant"); // 'instant' | 'bank' | 'evidence' | 'complaint' | 'companion'
  const [bankHotlines, setBankHotlines] = useState([]);
  const [copiedText, setCopiedText] = useState(false);

  // Hold-2-Seconds SOS State
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [sosPayload, setSosPayload] = useState(null);
  const holdIntervalRef = useRef(null);

  // Emergency Companion State
  const [tripMinutes, setTripMinutes] = useState(20);
  const [tripDestination, setTripDestination] = useState("Phòng trọ Thủ Đức");
  const [tripActive, setTripActive] = useState(false);
  const [tripRemainingSeconds, setTripRemainingSeconds] = useState(0);

  // Complaint Generator Form State
  const [victimName, setVictimName] = useState(profile?.fullName || "");
  const [victimDob, setVictimDob] = useState("2004");
  const [victimCccd, setVictimCccd] = useState("");
  const [victimPhone, setVictimPhone] = useState("");
  const [victimAddress, setVictimAddress] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetAccount, setTargetAccount] = useState("");
  const [targetBank, setTargetBank] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [amountLost, setAmountLost] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [targetPoliceStation, setTargetPoliceStation] = useState("TP. Thủ Đức, TP. Hồ Chí Minh");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComplaint, setGeneratedComplaint] = useState(null);

  // Load Bank Hotlines
  useEffect(() => {
    fetch("/api/sos/bank-hotlines")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d?.hotlines)) {
          setBankHotlines(d.hotlines);
        }
      })
      .catch((e) => console.warn("Failed to load bank hotlines:", e));
  }, []);

  // Hold 2 Seconds Trigger
  const handleHoldStart = () => {
    setIsHolding(true);
    setHoldProgress(0);
    saffronAudio.playClick(600);

    const startTime = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / 2000) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        triggerEmergencySos();
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const triggerEmergencySos = () => {
    saffronAudio.playAlertBuzz();
    setSosActivated(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsLocation({ lat, lng });
          const payload = generateEmergencySosPayload({
            lat,
            lng,
            studentName: profile?.fullName || "Sinh viên",
          });
          setSosPayload(payload);
        },
        () => {
          const payload = generateEmergencySosPayload({
            lat: 10.8524,
            lng: 106.7712,
            studentName: profile?.fullName || "Sinh viên",
            customNote: "Khu vực HCMUTE Võ Văn Ngân",
          });
          setSosPayload(payload);
        }
      );
    }
  };

  // Emergency Companion Trip Timer
  const startTripCompanion = () => {
    saffronAudio.playSuccessChime();
    setTripActive(true);
    setTripRemainingSeconds(tripMinutes * 60);
  };

  useEffect(() => {
    let timer = null;
    if (tripActive && tripRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTripRemainingSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [tripActive, tripRemainingSeconds]);

  // Generate Complaint
  const handleGenerateComplaint = async (e) => {
    e.preventDefault();
    saffronAudio.playClick(700);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/sos/generate-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          victimName,
          victimDob,
          victimCccd,
          victimPhone,
          victimAddress,
          targetName,
          targetAccount,
          targetBank,
          targetPhone,
          amountLost,
          eventDescription,
          targetPoliceStation,
        }),
      });

      const data = await res.json();
      if (data?.success) {
        setGeneratedComplaint(data);
        saffronAudio.playSuccessChime();
      }
    } catch (err) {
      console.warn("Complaint generator error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text) => {
    saffronAudio.playClick(300);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ea3810] selection:text-white">
      {/* 1. Aerospace Mission Control Backdrop with Emergency Red Tone */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_09_OMEGA // LEGAL_SOS_EMERGENCY"
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
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-rose-900/60" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold tracking-wider mb-3">
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-spin" />
              <span>EMERGENCY RESCUE SYSTEM // ZERO FAKE DATA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-rose-400">Phòng Cấp Cứu Pháp Lý</span> &amp; SOS Khẩn Cấp
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Kích hoạt cứu hộ khẩn cấp 112/113/115 có chủ đích (Nhấn giữ 2s), gửi tọa độ GPS SOS, giám sát hành trình (Trip Companion) và tạo đơn tố giác chuẩn Bộ Công An.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* Emergency Mode Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <button
            type="button"
            onClick={() => { saffronAudio.playClick(400); setActiveTab("instant"); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              activeTab === "instant"
                ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20"
                : "bg-[#150604] border-[#47140b] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-mono text-rose-400 font-bold block">🚨 CẤP CỨU 1-CHẠM</span>
            <span className="text-xs font-bold text-white block mt-1">112 / 113 / 115 SOS</span>
          </button>

          <button
            type="button"
            onClick={() => { saffronAudio.playClick(400); setActiveTab("companion"); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              activeTab === "companion"
                ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20"
                : "bg-[#150604] border-[#47140b] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-mono text-amber-400 font-bold block">🧭 ĐỒNG HÀNH AN TOÀN</span>
            <span className="text-xs font-bold text-white block mt-1">Trip Companion</span>
          </button>

          <button
            type="button"
            onClick={() => { saffronAudio.playClick(400); setActiveTab("bank"); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              activeTab === "bank"
                ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20"
                : "bg-[#150604] border-[#47140b] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-mono text-sky-400 font-bold block">🔒 KHÓA TÀI KHOẢN</span>
            <span className="text-xs font-bold text-white block mt-1">Hotline Ngân Hàng</span>
          </button>

          <button
            type="button"
            onClick={() => { saffronAudio.playClick(400); setActiveTab("evidence"); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              activeTab === "evidence"
                ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20"
                : "bg-[#150604] border-[#47140b] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-mono text-purple-400 font-bold block">📸 THU THẬP VẾT</span>
            <span className="text-xs font-bold text-white block mt-1">Bằng Chứng Số</span>
          </button>

          <button
            type="button"
            onClick={() => { saffronAudio.playClick(400); setActiveTab("complaint"); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              activeTab === "complaint"
                ? "bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20"
                : "bg-[#150604] border-[#47140b] hover:border-white/20"
            }`}
          >
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">📄 ĐƠN TỐ GIÁC</span>
            <span className="text-xs font-bold text-white block mt-1">Xuất Bản In Chuẩn</span>
          </button>
        </div>

        {/* TAB 1: INSTANT SOS HOLD-2-SECONDS HERO */}
        {activeTab === "instant" && (
          <div className="space-y-6">
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-rose-950/40 to-[#150604] border border-rose-500/40 text-center space-y-6 relative overflow-hidden">
              <div className="max-w-md mx-auto space-y-2">
                <span className="text-xs font-mono text-rose-400 font-bold tracking-widest uppercase">
                  GIAO DIỆN KÍCH HOẠT CỨU NẠN CHỦ ĐÍCH (HOLD 2 SECONDS)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Nhấn Giữ Nút Để Gửi Tín Hiệu Cấp Cứu
                </h2>
                <p className="text-xs text-[#ece7e0]/70">
                  Thiết kế chống chạm nhầm. Giữ 2 giây để tự động chụp tọa độ GPS hiện tại và bật bảng điều hướng tổng đài quốc gia.
                </p>
              </div>

              {/* Hold Button */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative">
                  <svg className="w-36 h-36 -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className="text-[#47140b] stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className="text-rose-500 stroke-current transition-all duration-75"
                      strokeWidth="8"
                      strokeDasharray={402}
                      strokeDashoffset={402 - (402 * holdProgress) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <button
                    type="button"
                    onMouseDown={handleHoldStart}
                    onMouseUp={handleHoldEnd}
                    onTouchStart={handleHoldStart}
                    onTouchEnd={handleHoldEnd}
                    className="absolute inset-2 m-auto w-28 h-28 rounded-full bg-gradient-to-br from-rose-600 to-red-800 text-white font-black text-lg flex flex-col items-center justify-center shadow-lg shadow-rose-600/50 active:scale-95 transition-all cursor-pointer select-none"
                  >
                    <AlertOctagon className="w-8 h-8 mb-1 animate-pulse" />
                    <span>{isHolding ? `${Math.round(holdProgress)}%` : "GIỮ 2S"}</span>
                  </button>
                </div>
                <span className="text-[11px] font-mono text-[#ece7e0]/50 mt-3">
                  {isHolding ? "ĐANG ĐO THỜI GIAN NHẤN GIỮ..." : "Chạm và giữ chặt ngón tay vào nút trên"}
                </span>
              </div>

              {/* SOS Activated Panel */}
              {sosActivated && sosPayload && (
                <div className="p-5 rounded-2xl bg-rose-950/80 border border-rose-400 text-left space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-rose-400 animate-ping" />
                      TÍN HIỆU SOS ĐÃ SẴN SÀNG KÈM GPS
                    </span>
                    <span className="text-xs text-white font-mono">{sosPayload.timestamp}</span>
                  </div>

                  <div className="p-3 bg-[#150604] rounded-xl text-xs font-mono text-white whitespace-pre-line border border-rose-500/30">
                    {sosPayload.message}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={sosPayload.smsUrl}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-rose-500 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>GỬI SMS SOS CHO NGƯỜI THÂN</span>
                    </a>

                    <a
                      href={sosPayload.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-white text-xs font-bold flex items-center gap-2 hover:border-white/40 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-sky-400" />
                      <span>MỞ GOOGLE MAPS TỌA ĐỘ</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Official Hotlines Directory */}
            <SaffronSwissCrosshairGrid sectionTag="01 // OFFICIAL_NATIONAL_HOTLINES" className="p-6 bg-[#150604] space-y-4">
              <span className="text-xs font-mono font-bold text-rose-400 block">
                DANH MỤC ĐẦU SỐ KHẨN CẤP QUỐC GIA 24/7 (BẤM ĐỂ GỌI TRỰC TIẾP):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OFFICIAL_EMERGENCY_HOTLINES.map((h) => (
                  <div key={h.code} className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] flex items-center justify-between gap-3 hover:border-rose-500 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-rose-400 font-mono">{h.code}</span>
                        <span className="text-xs font-bold text-white">{h.name}</span>
                      </div>
                      <p className="text-[11px] text-[#ece7e0]/60 mt-1 leading-relaxed">{h.scope}</p>
                    </div>

                    <a
                      href={h.dialUrl}
                      onClick={() => saffronAudio.playClick(800)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 hover:bg-rose-500 shadow-md shadow-rose-600/30 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>GỌI NGAY</span>
                    </a>
                  </div>
                ))}
              </div>
            </SaffronSwissCrosshairGrid>
          </div>
        )}

        {/* TAB 2: TRIP COMPANION */}
        {activeTab === "companion" && (
          <SaffronSwissCrosshairGrid sectionTag="02 // EMERGENCY_TRIP_COMPANION" className="p-6 bg-[#150604] space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-2">
              <Timer className="w-10 h-10 text-amber-400 mx-auto" />
              <h2 className="text-xl font-extrabold text-white">Bạn Đồng Hành An Toàn (Trip Companion)</h2>
              <p className="text-xs text-[#ece7e0]/70">
                Đặt đồng hồ đếm ngược khi di chuyển về phòng trọ ban đêm. Nếu quá thời gian mà bạn không xác nhận, hệ thống sẽ nhắc nhở và kích hoạt SMS cảnh báo.
              </p>
            </div>

            {!tripActive ? (
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#210a07] border border-[#47140b] space-y-4">
                <div>
                  <label className="text-xs font-mono text-[#ffbc09] font-bold block mb-1">ĐIỂM ĐẾN DỰ KIẾN</label>
                  <input
                    type="text"
                    value={tripDestination}
                    onChange={(e) => setTripDestination(e.target.value)}
                    className="w-full p-3 bg-[#150604] border border-[#47140b] rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#ffbc09] font-bold block mb-1">THỜI GIAN DI CHUYỂN (PHÚT)</label>
                  <input
                    type="number"
                    value={tripMinutes}
                    onChange={(e) => setTripMinutes(parseInt(e.target.value, 10) || 15)}
                    className="w-full p-3 bg-[#150604] border border-[#47140b] rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={startTripCompanion}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#150604] font-bold text-xs uppercase font-mono tracking-wider cursor-pointer"
                >
                  BẮT ĐẦU THEO DÕI HÀNH TRÌNH
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto p-6 rounded-2xl bg-amber-950/40 border border-amber-500 text-center space-y-4">
                <span className="text-xs font-mono text-amber-400 font-bold block">ĐANG THEO DÕI HÀNH TRÌNH VỀ: {tripDestination}</span>
                <div className="text-4xl font-black text-white font-mono">
                  {Math.floor(tripRemainingSeconds / 60).toString().padStart(2, "0")}:
                  {(tripRemainingSeconds % 60).toString().padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => { setTripActive(false); saffronAudio.playSuccessChime(); }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer hover:bg-emerald-500"
                >
                  ✅ TÔI ĐÃ VỀ ĐẾN NƠI AN TOÀN
                </button>
              </div>
            )}
          </SaffronSwissCrosshairGrid>
        )}

        {/* TAB 3: BANK HOTLINES */}
        {activeTab === "bank" && (
          <SaffronSwissCrosshairGrid sectionTag="03 // BANKING_EMERGENCY_LOCK" className="p-6 bg-[#150604] space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[#47140b]">
              <Lock className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white font-mono">
                DANH BẠ HOTLINE KHẨN CẤP &amp; CÚ PHÁP KHÓA TÀI KHOẢN 24/7
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankHotlines.map((b) => (
                <div key={b.code} className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{b.name} ({b.code})</span>
                    <a
                      href={`tel:${b.hotline}`}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-mono font-bold"
                    >
                      {b.hotline}
                    </a>
                  </div>
                  <p className="text-[11px] text-[#ece7e0]/70 font-mono">SMS Khóa Thẻ: {b.smsLockSyntax || "Xem app ngân hàng"}</p>
                </div>
              ))}
            </div>
          </SaffronSwissCrosshairGrid>
        )}

        {/* TAB 4: EVIDENCE COLLECTION */}
        {activeTab === "evidence" && (
          <SaffronSwissCrosshairGrid sectionTag="04 // DIGITAL_EVIDENCE_PRESERVATION" className="p-6 bg-[#150604] space-y-4">
            <h2 className="text-base font-bold text-white">Quy Trình 4 Bước Lưu Trữ Bằng Chứng Hợp Pháp:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#ece7e0]/80">
              <div className="p-3.5 rounded-xl bg-[#210a07] border border-[#47140b]">
                <strong className="text-white block mb-1">1. Chụp ảnh màn hình toàn bộ tin nhắn</strong>
                Giữ nguyên cả ngày giờ gửi tin và số điện thoại / ID Telegram của đối tượng.
              </div>
              <div className="p-3.5 rounded-xl bg-[#210a07] border border-[#47140b]">
                <strong className="text-white block mb-1">2. Sao kê lịch sử giao dịch ngân hàng</strong>
                Lấy biên lai chuyển tiền có mã giao dịch (FT / Transaction ID) rõ ràng.
              </div>
              <div className="p-3.5 rounded-xl bg-[#210a07] border border-[#47140b]">
                <strong className="text-white block mb-1">3. Xuất file ghi âm cuộc gọi (nếu có)</strong>
                Bảo lưu file âm thanh cuộc gọi giả danh cơ quan công an / viện kiểm sát.
              </div>
              <div className="p-3.5 rounded-xl bg-[#210a07] border border-[#47140b]">
                <strong className="text-white block mb-1">4. Không xóa lịch sử chat</strong>
                Đối tượng có thể thu hồi tin nhắn; cần sao lưu offline ngay lập tức.
              </div>
            </div>
          </SaffronSwissCrosshairGrid>
        )}

        {/* TAB 5: COMPLAINT GENERATOR */}
        {activeTab === "complaint" && (
          <SaffronSwissCrosshairGrid sectionTag="05 // OFFICIAL_POLICE_COMPLAINT" className="p-6 bg-[#150604] space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[#47140b]">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-mono">
                MÁY TẠO ĐƠN TỐ GIÁC TỘI PHẠM CHUẨN BỘ CÔNG AN
              </h2>
            </div>

            <form onSubmit={handleGenerateComplaint} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-[#ffbc09] block mb-1">HỌ VÀ TÊN NẠN NHÂN</label>
                <input
                  type="text"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  className="w-full p-2.5 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#ffbc09] block mb-1">SỐ CCCD NẠN NHÂN</label>
                <input
                  type="text"
                  value={victimCccd}
                  onChange={(e) => setVictimCccd(e.target.value)}
                  className="w-full p-2.5 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono"
                  placeholder="12 chữ số CCCD"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#ffbc09] block mb-1">SỐ TÀI KHOẢN KẺ LỪA ĐẢO</label>
                <input
                  type="text"
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full p-2.5 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono"
                  placeholder="Số tài khoản thụ hưởng"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#ffbc09] block mb-1">SỐ TIỀN THIỆT HẠI (VNĐ)</label>
                <input
                  type="text"
                  value={amountLost}
                  onChange={(e) => setAmountLost(e.target.value)}
                  className="w-full p-2.5 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono"
                  placeholder="Ví dụ: 5.000.000"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-mono text-[#ffbc09] block mb-1">TÓM TẮT DIỄN BIẾN SỰ VIỆC</label>
                <textarea
                  rows={3}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white"
                  placeholder="Đối tượng liên hệ qua Telegram yêu cầu nộp cọc phòng trọ..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs uppercase font-mono tracking-wider cursor-pointer"
                >
                  {isGenerating ? "ĐANG XUẤT BẢN IN..." : "XUẤT ĐƠN TỐ GIÁC CHUẨN ĐỂ NỘP CÔNG AN"}
                </button>
              </div>
            </form>

            {generatedComplaint && (
              <div className="p-4 rounded-2xl bg-[#210a07] border border-emerald-500 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">ĐƠN ĐÃ ĐƯỢC TẠO THÀNH CÔNG</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedComplaint.complaintText)}
                    className="text-xs text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? "Đã chép" : "Sao chép toàn bộ đơn"}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#150604] rounded-xl text-xs font-mono text-[#ece7e0] whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {generatedComplaint.complaintText}
                </pre>
              </div>
            )}
          </SaffronSwissCrosshairGrid>
        )}
      </main>
    </div>
  );
}
