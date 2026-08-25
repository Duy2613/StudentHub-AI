"use client";

import React, { useState } from "react";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
  Home,
  Briefcase,
  Copy,
  Check,
  Loader2,
  FileCheck2,
  ArrowRight,
  Info,
  Layers,
  Download,
  GitCompare,
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

const SAMPLE_HOUSING_CONTRACT = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
HỢP ĐỒNG THUÊ PHÒNG TRỌ SINH VIÊN

Điều 1: Bên A đồng ý cho Bên B thuê phòng số 302 với giá 2.500.000đ/tháng. Đặt cọc 2.500.000đ.
Điều 2: Tiền điện tính theo thỏa thuận là 5.500đ/kWh. Tiền nước tính 100.000đ/người/tháng.
Điều 3: Thời hạn hợp đồng là 12 tháng. Nếu Bên B chuyển đi trước thời hạn hợp đồng vì bất kỳ lý do gì thì sẽ bị tịch thu toàn bộ tiền đặt cọc và không được hoàn trả.
Điều 4: Bên B tự chịu mọi chi phí sửa chữa hao mòn thiết bị và hư hỏng điện nước trong suốt thời gian thuê, Bên A không chịu bất kỳ chi phí bảo hành hay sửa chữa nào.`;

const SAMPLE_JOB_CONTRACT = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
THỎA THUẬN TUYỂN DỤNG CỘNG TÁC VIÊN BÁN HÀNG

Điều 1: Ứng viên được nhận vào vị trí Trợ lý Bán hàng kiêm Chăm sóc khách hàng Online.
Điều 2: Để bảo đảm trách nhiệm và nhận trang phục làm việc, ứng viên phải đặt cọc nhận việc 500.000đ (phí giữ chỗ việc làm) và nộp bản chính CCCD cho bên tuyển dụng giữ trong thời gian thử việc 03 tháng.
Điều 3: Ứng viên phải mua gói sản phẩm mẫu 1.200.000đ ban đầu để trải nghiệm thực tế và hoàn thành chỉ tiêu tuyển thêm 02 người mới để đủ điều kiện hưởng lương hoa hồng đa tầng.`;

const SAMPLE_DOC_V1 = `THÔNG BÁO HỌC VỤ SỐ 142/TB-ĐHSPKT (PHIÊN BẢN GỐC V1)
Hạn chót đóng học phí Học kỳ 2 là ngày 25/02/2026.
Đối tượng áp dụng: Toàn thể sinh viên Khóa 2022 và Khóa 2023.
Sinh viên chưa nộp học phí đúng hạn sẽ bị hủy danh sách lớp học phần.`;

const SAMPLE_DOC_V2 = `THÔNG BÁO HỌC VỤ SỐ 142B/TB-ĐHSPKT (PHIÊN BẢN ĐIỀU CHỈNH V2)
Hạn chót đóng học phí Học kỳ 2 gia hạn đến ngày 15/03/2026.
Đối tượng áp dụng: Toàn thể sinh viên Khóa 2022, Khóa 2023 và Tân sinh viên Khóa 2024.
Sinh viên có hoàn cảnh khó khăn có thể nộp đơn xin gia hạn tại Phòng CTSV trước ngày 10/03/2026.`;

export default function ContractCheckPage() {
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState("CONTRACT_CHECK"); // 'CONTRACT_CHECK' | 'VERSION_DIFF'
  const [contractType, setContractType] = useState("HOUSING"); // 'HOUSING' | 'EMPLOYMENT'
  const [contractText, setContractText] = useState(SAMPLE_HOUSING_CONTRACT);

  // Version Diff State
  const [docV1Text, setDocV1Text] = useState(SAMPLE_DOC_V1);
  const [docV2Text, setDocV2Text] = useState(SAMPLE_DOC_V2);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Switch contract sample
  const handleTypeChange = (type) => {
    saffronAudio.playClick(400);
    setContractType(type);
    setContractText(type === "HOUSING" ? SAMPLE_HOUSING_CONTRACT : SAMPLE_JOB_CONTRACT);
    setAnalysisResult(null);
  };

  // Run AI Analysis (Contract Check or Version Diff)
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    saffronAudio.playClick(700);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const payload = activeTab === "VERSION_DIFF"
        ? { mode: "VERSION_DIFF", textV1: docV1Text, textV2: docV2Text }
        : { mode: "CONTRACT_CHECK", type: contractType, text: contractText };

      const res = await fetch("/api/contract-check/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success) {
        setAnalysisResult(data);
        if (data.riskScore > 30) saffronAudio.playAlertBuzz();
        else saffronAudio.playSuccessChime();
      }
    } catch (err) {
      console.warn("Analyze contract error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyClause = (text, id) => {
    saffronAudio.playClick(300);
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_08_DELTA // LEGAL_CONTRACT_ANALYZER"
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
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>CONTRACT INTELLIGENCE // ZERO FAKE DATA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">AI Bóc Tách Hợp Đồng</span> &amp; So Sánh Công Văn
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Tự động rà soát bẫy giữ CCCD gốc, cọc tiền trái luật theo BLDS 2015 &amp; BLLĐ 2019, và so sánh đối chiếu phiên bản văn bản (Version Diff v1 vs v2).
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
              <span className="text-white/90 font-medium">PDF → OCR → layout → clause extraction → legal-source retrieval → version check → conflict check → risk analysis → cited explanation</span>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold shrink-0">
            ✓ LEGAL STATUTORY GROUNDING
          </div>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 p-1.5 bg-[#150604] border border-[#47140b] rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => { setActiveTab("CONTRACT_CHECK"); setAnalysisResult(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "CONTRACT_CHECK"
                ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                : "text-[#ece7e0]/70 hover:text-white"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>BÓC TÁCH HỢP ĐỒNG (BLDS &amp; BLLĐ)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("VERSION_DIFF"); setAnalysisResult(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "VERSION_DIFF"
                ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                : "text-[#ece7e0]/70 hover:text-white"
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>SO SÁNH CÔNG VĂN (VERSION DIFF v1 vs v2)</span>
          </button>
        </div>

        {/* Contract Type Selection Tabs (Only for CONTRACT_CHECK) */}
        {activeTab === "CONTRACT_CHECK" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleTypeChange("HOUSING")}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-3.5 text-left ${
                contractType === "HOUSING"
                  ? "bg-[#210a07] border-[#ffbc09] shadow-lg shadow-[#ffbc09]/20"
                  : "bg-[#150604] border-[#47140b] hover:border-white/20"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Hợp Đồng Thuê Nhà Trọ / Căn Hộ
                </span>
                <span className="text-xs text-[#ece7e0]/60">
                  Bóc tách giá điện nước, điều khoản cọc, sửa chữa hư hỏng
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("EMPLOYMENT")}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-3.5 text-left ${
                contractType === "EMPLOYMENT"
                  ? "bg-[#210a07] border-[#ffbc09] shadow-lg shadow-[#ffbc09]/20"
                  : "bg-[#150604] border-[#47140b] hover:border-white/20"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Hợp Đồng Việc Làm Thêm / Thử Việc
                </span>
                <span className="text-xs text-[#ece7e0]/60">
                  Phát hiện bẫy giữ CCCD gốc, cọc tiền đồng phục, đa cấp trá hình
                </span>
              </div>
            </button>
          </div>
        )}

        {/* 2-Column Audit Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Input Box) */}
          <div className="lg:col-span-6 space-y-4">
            <SaffronSwissCrosshairGrid sectionTag={activeTab === "VERSION_DIFF" ? "01 // VERSION_DIFF_INPUTS" : "01 // CONTRACT_TEXT_INPUT"} className="p-5 bg-[#150604] space-y-4">
              {activeTab === "CONTRACT_CHECK" ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[#ffbc09]">
                      DÁN VĂN BẢN HỢP ĐỒNG HOẶC ĐIỀU KHOẢN NGHI VẤN
                    </label>
                    <button
                      type="button"
                      onClick={() => setContractText("")}
                      className="text-[11px] font-mono text-[#ece7e0]/50 hover:text-white cursor-pointer"
                    >
                      [ XÓA TRẮNG ]
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    placeholder="Dán toàn bộ văn bản hợp đồng hoặc các điều khoản bạn cảm thấy băn khoăn vào đây..."
                    className="w-full p-4 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] font-mono leading-relaxed resize-y"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono font-bold text-[#38bdf8] block mb-1.5">
                      1. VĂN BẢN / CÔNG VĂN GỐC (PHIÊN BẢN V1)
                    </label>
                    <textarea
                      rows={5}
                      value={docV1Text}
                      onChange={(e) => setDocV1Text(e.target.value)}
                      className="w-full p-3 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-[#ffbc09] block mb-1.5">
                      2. VĂN BẢN / CÔNG VĂN ĐIỀU CHỈNH (PHIÊN BẢN V2)
                    </label>
                    <textarea
                      rows={5}
                      value={docV2Text}
                      onChange={(e) => setDocV2Text(e.target.value)}
                      className="w-full p-3 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs font-mono uppercase tracking-wider shadow-[0_0_25px_rgba(255,188,9,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG ĐỐI CHIẾU CƠ SỞ PHÁP LÝ &amp; VĂN BẢN...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>{activeTab === "VERSION_DIFF" ? "BẮT ĐẦU ĐỐI SOÁT VERSION DIFF" : "BÓC TÁCH VÀ KIỂM ĐỊNH PHÁP LÝ NGAY"}</span>
                  </>
                )}
              </button>
            </SaffronSwissCrosshairGrid>
          </div>

          {/* Right Column (Analysis Results) */}
          <div className="lg:col-span-6">
            <SaffronSwissCrosshairGrid sectionTag="02 // LEGAL_AUDIT_REPORT" className="p-5 bg-[#150604] min-h-[400px]">
              {isAnalyzing && (
                <div className="h-64 flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ffbc09]" />
                  <span className="text-xs font-mono text-[#ece7e0]/70">
                    ĐANG RÀ SOÁT CÁC ĐIỀU KHOẢN THEO BLDS 2015 &amp; BLLĐ 2019...
                  </span>
                </div>
              )}

              {!isAnalyzing && !analysisResult && (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#47140b] rounded-3xl">
                  <Scale className="w-12 h-12 text-[#ece7e0]/20 mb-3" />
                  <p className="text-sm font-bold text-white mb-1">Chưa có kết quả bóc tách</p>
                  <p className="text-xs text-[#ece7e0]/60 max-w-sm">
                    Dán văn bản hợp đồng hoặc công văn ở cột bên trái và bấm &apos;Bóc Tách&apos; để hệ thống tự động chỉ ra các điểm bất thường.
                  </p>
                </div>
              )}

              {!isAnalyzing && analysisResult && activeTab === "VERSION_DIFF" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#210a07] border border-[#38bdf8]/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-[#38bdf8] font-bold block">KẾT QUẢ ĐỐI SOÁT VERSION DIFF</span>
                      <span className="text-sm font-bold text-white">Phát hiện {analysisResult.diffResult?.totalChanges || 0} điểm thay đổi</span>
                    </div>
                    <GitCompare className="w-6 h-6 text-[#38bdf8]" />
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.diffResult?.diffItems?.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[#120604] border border-[#47140b] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#ffbc09]">{item.field}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            item.changeType === "ADDED" ? "bg-emerald-500/20 text-emerald-400" :
                            item.changeType === "MODIFIED" ? "bg-amber-500/20 text-amber-400" :
                            item.changeType === "REMOVED" ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"
                          }`}>
                            {item.changeType}
                          </span>
                        </div>
                        <p className="text-xs text-white"><strong className="text-[#ece7e0]/60 font-normal">Mới: </strong>{item.newValue}</p>
                        <p className="text-xs text-[#ece7e0]/60"><strong className="font-normal">Cũ: </strong>{item.oldValue}</p>
                        <p className="text-[11px] text-[#38bdf8]">💡 {item.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isAnalyzing && analysisResult && activeTab === "CONTRACT_CHECK" && (
                <div className="space-y-4">
                  {/* Verdict Badge */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    analysisResult.riskScore >= 70
                      ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                      : analysisResult.riskScore >= 40
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                      : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  }`}>
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider block opacity-80">
                        ĐÁNH GIÁ MỨC ĐỘ RỦI RO
                      </span>
                      <span className="text-base font-extrabold block">
                        {analysisResult.riskLevel}
                      </span>
                    </div>
                    <div className="text-right font-mono font-extrabold text-2xl">
                      {analysisResult.riskScore}/100
                    </div>
                  </div>

                  {/* General Advice */}
                  <div className="p-3.5 rounded-2xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0]/90 leading-relaxed">
                    <p>💡 {analysisResult.generalAdvice}</p>
                  </div>

                  {/* Detected Flaws */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-[#ffbc09] block">
                      CHI TIẾT {analysisResult.flawsCount} ĐIỀU KHOẢN CẦN LƯU Ý:
                    </span>

                    {analysisResult.detectedFlaws?.map((flaw) => (
                      <div
                        key={flaw.id}
                        className="p-4 rounded-2xl bg-[#120604] border border-[#47140b] space-y-2 hover:border-[#ffbc09]/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            {flaw.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                            {flaw.severity}
                          </span>
                        </div>

                        <p className="text-xs text-[#ece7e0]/80 leading-relaxed">
                          {flaw.analysis}
                        </p>

                        <div className="p-2.5 rounded-xl bg-[#210a07] border border-[#47140b]/60 text-[11px] text-[#ffd15c] font-mono">
                          <strong>Căn cứ: </strong>{flaw.legalBasis}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-emerald-400">
                            <strong>Khuyến nghị: </strong>{flaw.recommendation}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyClause(flaw.recommendation, flaw.id)}
                            className="text-[10px] font-mono text-[#ece7e0]/60 hover:text-white flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                          >
                            {copiedId === flaw.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === flaw.id ? "Đã chép" : "Chép điều khoản"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legal Disclaimer */}
                  <p className="text-[10px] text-[#ece7e0]/40 italic pt-2">
                    {analysisResult.legalDisclaimer}
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
