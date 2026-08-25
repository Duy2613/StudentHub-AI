"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Search,
  Plus,
  Compass,
  Radio,
  Building,
  Home,
  CheckCircle2,
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Filter,
  Loader2,
  Navigation,
  Crosshair,
  Flame,
  PhoneCall,
  Route,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AvatarDisplay from "@/components/AvatarDisplay";
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
import { calculateSafetyRoutes } from "@/lib/intelligence/safety/safetyRoutingEngine";

const ZONES = [
  { id: "ALL", label: "Tất Cả Khu Vực", count: "Toàn quốc" },
  { id: "LANG_DAI_HOC_THU_DUC", label: "Làng ĐH Thủ Đức (TP.HCM)", count: "Khu A, Khu B, ĐHQG", lat: 10.8752, lng: 106.7998 },
  { id: "THU_DUC_HCMUTE", label: "Thủ Đức - HCMUTE (TP.HCM)", count: "Võ Văn Ngân, Hoàng Diệu 2", lat: 10.8524, lng: 106.7712 },
  { id: "BACH_KHOA_HAI_BA_TRUNG", label: "Bách Khoa - Xây Dựng (Hà Nội)", count: "Tạ Quang Bửu, Giải Phóng", lat: 21.0042, lng: 105.8458 },
  { id: "CAU_GIAY_XUAN_THUY", label: "Cầu Giấy - Xuân Thủy (Hà Nội)", count: "ĐHQGHN, Sư Phạm, Báo Chí", lat: 21.0378, lng: 105.7725 },
];

const CATEGORIES = [
  { id: "ALL", label: "Tất Cả Loại", color: "text-[#ece7e0]" },
  { id: "SCAM_DEPOSIT", label: "🔴 Bẫy Cọc & Trọ Ảo", color: "text-rose-400" },
  { id: "SECURITY_HAZARD", label: "🟡 Điểm Đen An Ninh", color: "text-amber-400" },
  { id: "VERIFIED_SAFE_ZONE", label: "🟢 Trọ An Toàn", color: "text-emerald-400" },
  { id: "POLICE_STATION", label: "🔵 Công An & Trợ Giúp", color: "text-sky-400" },
];

export default function SafetyMapPage() {
  const { session, profile } = useAuth();

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Safety Routing State
  const [activeRouteTab, setActiveRouteTab] = useState("ROUTE_SAFEST");
  const safetyRoutesData = useMemo(() => calculateSafetyRoutes({ timeOfDay: "NIGHT" }), []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("SCAM_DEPOSIT");
  const [newZone, setNewZone] = useState("LANG_DAI_HOC_THU_DUC");
  const [newAddress, setNewAddress] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSeverity, setNewSeverity] = useState("HIGH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedZone && selectedZone !== "ALL") params.set("zone", selectedZone);
      if (selectedCategory && selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/safety-map/reports?${params.toString()}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.reports)) {
        setReports(data.reports);
        if (data.reports.length > 0 && !selectedReportId) {
          setSelectedReportId(data.reports[0].id);
        }
      }
    } catch (err) {
      console.warn("Fetch safety reports error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedZone, selectedCategory, searchQuery, selectedReportId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const activeReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || reports[0] || null;
  }, [reports, selectedReportId]);

  const handleVerify = async (reportId) => {
    saffronAudio.playClick(700);
    try {
      const res = await fetch(`/api/safety-map/reports/${reportId}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (data?.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, verifiedCount: r.verifiedCount + 1 } : r
          )
        );
        saffronAudio.playSuccessChime();
      }
    } catch (err) {
      console.warn("Verify error:", err);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    saffronAudio.playClick(700);
    setIsSubmitting(true);

    try {
      const payload = {
        title: newTitle,
        category: newCategory,
        zone: newZone,
        address: newAddress,
        description: newDescription,
        severity: newSeverity,
      };

      const res = await fetch("/api/safety-map/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success && data?.report) {
        setReports((prev) => [data.report, ...prev]);
        setSelectedReportId(data.report.id);
        setIsModalOpen(false);
        setNewTitle("");
        setNewAddress("");
        setNewDescription("");
      }
    } catch (err) {
      console.warn("Create report error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. High-End Aerospace Aviation Terminal Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_04_ALPHA // CAMPUS_SECURITY_GRID"
        gridDensity={52}
        showRadarRings={true}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools & Studio */}
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ea3810]/15 border border-[#ea3810]/30 text-[#ff715b] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ea3810] animate-ping" />
              <span>LIVE GEOSPATIAL THREAT RADAR // PROVENANCE-BACKED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Bản Đồ An Ninh &amp; GPS</span> Định Tuyến An Toàn
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Hệ thống radar đối soát điểm nóng lừa cọc, danh bạ trọ an toàn, định vị trạm Công an 24/7 và tính toán 3 tuyến đường (Fastest / Safest / Balanced) theo chi phí an toàn.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(600);
                setIsModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ea3810] to-[#ff715b] text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(234,56,16,0.35)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>BÁO CÁO ĐIỂM NÓNG</span>
            </button>
          </div>
        </div>

        {/* GPS Multi-Route Safety Cost Selector & Telemetry */}
        <div className="p-5 rounded-3xl bg-[#150604] border border-[#47140b] mb-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[#ffbc09]" />
              <span className="text-xs font-mono font-bold text-white uppercase">
                GPS SAFETY ROUTING // TÍNH TOÁN TUYẾN ĐƯỜNG AN TOÀN ({safetyRoutesData.timeContext})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                GPS FIX: ±10m (EXCELLENT)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffbc09]/20 text-[#ffbc09] border border-[#ffbc09]/30">
                TRAFFIC_AWARE_OPTIMAL
              </span>
            </div>
          </div>

          {/* Segment-Level Risk Alert Bar */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>CẢNH BÁO PHÂN ĐOẠN: Nguy cơ ngập nước xiết tập trung tại Đoạn dốc Võ Văn Ngân; các đoạn còn lại an toàn.</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold underline cursor-pointer">
              Chi tiết phân đoạn →
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {safetyRoutesData.routes.map((rt) => {
              const isSelected = activeRouteTab === rt.id;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => { saffronAudio.playClick(400); setActiveRouteTab(rt.id); }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#210a07] border-[#ffbc09] shadow-lg shadow-[#ffbc09]/15"
                      : "bg-black/30 border-[#47140b] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{rt.label}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      rt.safetyBadgeColor === "emerald" ? "bg-emerald-500/20 text-emerald-300" :
                      rt.safetyBadgeColor === "amber" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"
                    }`}>
                      {rt.safetyScore}đ AN TOÀN
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#ece7e0]/70 flex items-center gap-2">
                    <span>⏱ {rt.durationMinutes} phút</span>
                    <span>•</span>
                    <span>📍 {rt.distanceKm} km</span>
                  </div>
                  <p className="text-[11px] text-[#ece7e0]/60 mt-1.5 line-clamp-1">{rt.safetyVerdict}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone Selector Pill Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {ZONES.map((z) => {
            const isSelected = selectedZone === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  setSelectedZone(z.id);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-lg shadow-[#ffbc09]/20 scale-105"
                    : "bg-[#150604] text-[#ece7e0]/70 border-[#47140b] hover:border-white/20 hover:text-white"
                }`}
              >
                <span>{z.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Map & Radar Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Radar Console & Threat Feed) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Radar Visualizer */}
            <SaffronSwissCrosshairGrid sectionTag="01 // GEOSPATIAL_RADAR_MAP" className="p-0 overflow-hidden relative">
              {/* Radar Screen Visual */}
              <div className="h-72 sm:h-80 w-full bg-[#0a0504] relative flex items-center justify-center overflow-hidden border-b border-[#47140b]">
                {/* Radar Grid Circles */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                  <div className="w-64 h-64 rounded-full border border-[#ffbc09]/40 animate-pulse" />
                  <div className="w-44 h-44 rounded-full border border-[#38bdf8]/40 absolute" />
                  <div className="w-24 h-24 rounded-full border border-rose-500/40 absolute" />
                  <div className="w-full h-px bg-white/10 absolute" />
                  <div className="h-full w-px bg-white/10 absolute" />
                </div>

                {/* Radar Sweep Needle */}
                <div className="absolute w-72 h-72 rounded-full border-t-2 border-r-2 border-emerald-500/60 animate-spin opacity-40 pointer-events-none" style={{ animationDuration: "6s" }} />

                {/* Center Station Coordinate */}
                <div className="absolute z-10 flex flex-col items-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-[#ffbc09] shadow-[0_0_15px_#ffbc09] animate-ping" />
                  <span className="text-[10px] font-mono text-[#ffbc09] font-bold mt-1 bg-black/80 px-2 py-0.5 rounded border border-[#ffbc09]/30">
                    CAMPUS NODE // {selectedZone}
                  </span>
                </div>

                {/* Interactive Threat Markers on Canvas */}
                <div className="absolute inset-4 z-20">
                  {reports.map((rep, idx) => {
                    const isSelected = rep.id === selectedReportId;
                    const isScam = rep.category === "SCAM_DEPOSIT";
                    const isHazard = rep.category === "SECURITY_HAZARD";
                    const isSafe = rep.category === "VERIFIED_SAFE_ZONE";

                    const topPos = 20 + ((idx * 27) % 60);
                    const leftPos = 15 + ((idx * 33) % 70);

                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => {
                          saffronAudio.playClick(600);
                          setSelectedReportId(rep.id);
                        }}
                        style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border transition-all cursor-pointer group ${
                          isSelected
                            ? "scale-125 z-30 shadow-[0_0_20px_rgba(255,255,255,0.8)] ring-2 ring-white"
                            : "hover:scale-110 z-10"
                        } ${
                          isScam
                            ? "bg-rose-500/20 border-rose-500 text-rose-400"
                            : isHazard
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : isSafe
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "bg-sky-500/20 border-sky-500 text-sky-400"
                        }`}
                        title={rep.title}
                      >
                        {isScam ? (
                          <Flame className="w-4 h-4 animate-bounce" />
                        ) : isHazard ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : isSafe ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <Building className="w-4 h-4" />
                        )}

                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-black/90 text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20">
                          {rep.title.slice(0, 24)}...
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Radar HUD Telemetry Overlay */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 border border-[#47140b] text-[10px] font-mono text-[#ece7e0]/70 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#ffbc09] animate-pulse" />
                  <span>RADAR ACTIVE: {reports.length} ĐIỂM GIÁM SÁT</span>
                </div>
              </div>

              {/* Category Filter Bar */}
              <div className="p-4 bg-[#150604] flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(400);
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-[#210a07] text-[#ffbc09] border-[#ffbc09] shadow-sm"
                        : "bg-black/30 text-[#ece7e0]/60 border-[#47140b] hover:text-white"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </SaffronSwissCrosshairGrid>

            {/* List of Safety Reports in Selected Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#ffbc09] tracking-wider uppercase">
                  DANH SÁCH BÁO CÁO THEO KHU VỰC ({reports.length})
                </span>
                <span className="text-xs font-mono text-[#ece7e0]/50">
                  CẬP NHẬT THEO THỜI GIAN THỰC
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center rounded-2xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#ffbc09] animate-spin" />
                  <span>Đang đồng bộ dữ liệu radar an ninh...</span>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/60">
                  Không tìm thấy cảnh báo nào trong khu vực này.
                </div>
              ) : (
                reports.map((rep) => {
                  const isSelected = rep.id === selectedReportId;
                  const isScam = rep.category === "SCAM_DEPOSIT";
                  const isHazard = rep.category === "SECURITY_HAZARD";
                  const isSafe = rep.category === "VERIFIED_SAFE_ZONE";

                  return (
                    <div
                      key={rep.id}
                      onClick={() => {
                        saffronAudio.playClick(500);
                        setSelectedReportId(rep.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#210a07] border-[#ffbc09] shadow-lg shadow-[#ffbc09]/10"
                          : "bg-[#150604] border-[#47140b] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                isScam
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : isHazard
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : isSafe
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                              }`}
                            >
                              {rep.category === "SCAM_DEPOSIT"
                                ? "Bẫy cọc trọ"
                                : rep.category === "SECURITY_HAZARD"
                                ? "Điểm đen an ninh"
                                : rep.category === "VERIFIED_SAFE_ZONE"
                                ? "Trọ an toàn"
                                : "Công an"}
                            </span>
                            <span className="text-xs font-mono text-[#38bdf8] flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {rep.zoneName}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white leading-snug">
                            {rep.title}
                          </h3>
                          <p className="text-xs text-[#ece7e0]/70 line-clamp-2">
                            {rep.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#ece7e0]/40 shrink-0 mt-2" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column (Detailed Focus Card & Verification Actions) */}
          <div className="lg:col-span-5">
            {activeReport ? (
              <SaffronSwissCrosshairGrid
                sectionTag="02 // THREAT_AUDIT_DOSSIER"
                className="sticky top-28 space-y-5 p-5 bg-[#150604]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-[#ffbc09]" />
                    <span className="text-xs font-mono font-bold text-white">
                      HỒ SƠ ĐỐI SOÁT CHI TIẾT
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#ffbc09] font-bold">
                    MÃ: #{activeReport.id}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${
                        activeReport.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                          : activeReport.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                      }`}
                    >
                      MỨC ĐỘ: {activeReport.severity}
                    </span>
                    <span className="text-xs font-mono text-[#ece7e0]/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(activeReport.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <h2 className="text-lg font-extrabold text-white leading-snug">
                    {activeReport.title}
                  </h2>

                  <div className="p-3 rounded-xl bg-black/40 border border-[#47140b] space-y-1">
                    <span className="text-[10.5px] font-mono text-[#ece7e0]/50 uppercase block">
                      ĐỊA ĐIỂM CHÍNH XÁC:
                    </span>
                    <p className="text-xs font-mono text-[#ffd15c] font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#ffbc09] shrink-0" />
                      <span>{activeReport.address}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10.5px] font-mono text-[#ece7e0]/50 uppercase block">
                      NỘI DUNG PHẢN ÁNH THỰC TẾ:
                    </span>
                    <p className="text-xs sm:text-sm text-[#ece7e0]/80 leading-relaxed font-human whitespace-pre-line">
                      {activeReport.description}
                    </p>
                  </div>

                  {/* 1-Click Google Maps Link */}
                  {activeReport.coordinates && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeReport.coordinates.lat},${activeReport.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-300 font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-sky-600/30 transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-sky-400" />
                      <span>MỞ CHỈ ĐƯỜNG GOOGLE MAPS (GPS)</span>
                    </a>
                  )}
                </div>

                {/* Author Credibility */}
                <div className="p-3.5 rounded-2xl bg-[#210a07] border border-[#47140b] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-[#ffbc09] text-xs font-bold font-mono">
                      SV
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {activeReport.authorName}
                      </span>
                      <span className="text-[10px] font-mono text-[#ffbc09]">
                        Trust Score: {activeReport.authorTrustScore || 80} PTS
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    ✓ ĐÃ XÁC THỰC
                  </span>
                </div>

                {/* Community Verification Actions */}
                <div className="pt-2 border-t border-[#47140b] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-[#ece7e0]/70">
                    <span>XÁC NHẬN CỘNG ĐỒNG:</span>
                    <span className="text-[#38f8d4] font-bold">
                      {activeReport.verifiedCount} Sinh viên xác nhận
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerify(activeReport.id)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Xác nhận đúng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => saffronAudio.playClick(400)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Báo cáo sai</span>
                    </button>
                  </div>
                </div>
              </SaffronSwissCrosshairGrid>
            ) : (
              <div className="p-8 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/50">
                Chọn một điểm cảnh báo trên radar để xem hồ sơ đối soát chi tiết.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE NEW SAFETY REPORT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl p-6 rounded-3xl bg-[#150604] border border-rose-500/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h3 className="text-base font-bold text-white font-mono">
                    BÁO CÁO ĐIỂM NÓNG AN NINH // PEER RADAR
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    TIÊU ĐỀ CẢNH BÁO (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cảnh báo ép cọc trọ tại đường..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                      LOẠI CẢNH BÁO (*)
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
                    >
                      <option value="SCAM_DEPOSIT">🔴 Bẫy cọc &amp; trọ ma</option>
                      <option value="SECURITY_HAZARD">🟡 Điểm đen an ninh</option>
                      <option value="VERIFIED_SAFE_ZONE">🟢 Trọ an toàn đã kiểm chứng</option>
                      <option value="POLICE_STATION">🔵 Điểm hỗ trợ / Công an</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                      KHU VỰC (*)
                    </label>
                    <select
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
                    >
                      {ZONES.filter((z) => z.id !== "ALL").map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    ĐỊA CHỈ CỤ THỂ (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Số nhà, tên ngõ/hẻm, tên đường, phường..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    MÔ TẢ CHI TIẾT SỰ VIỆC (*)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Mô tả thủ đoạn lừa đảo hoặc nguy cơ an ninh..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#47140b]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-[#ece7e0]/60 hover:text-white cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3810] to-[#ff715b] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ea3810]/30 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "ĐANG GỬI..." : "GỬI BÁO CÁO NGAY"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
