"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ExternalLink, CheckCircle2, Clock, Sparkles, Zap, Copy, Check, FileText, X, Loader2, ShieldCheck, Download } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";

import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { motion, AnimatePresence } from "motion/react";

const SAMPLE_COVER_LETTER = `Kính gửi: HỘI ĐỒNG XÉT DUYỆT HỌC BỔNG

Tôi tên là: [HỌ VÀ TÊN SINH VIÊN]
Hiện là sinh viên năm [3/4], Khoa [Công Nghệ Thông Tin / Điện - Điện Tử], Trường [HCMUTE / HUST / UIT].
Mã số sinh viên: [MSSV] | Điểm trung bình tích lũy (GPA): [3.4 / 4.0].

Tôi viết thư này để bày tỏ nguyện vọng được tham gia và ứng tuyển vào Chương trình Học bổng [Tên Học Bổng]. Trong suốt quá trình học tập tại trường, tôi luôn nỗ lực duy trì thành tích học tập tốt và tích cực tham gia các dự án nghiên cứu khoa học cũng như hoạt động cộng đồng.

Nếu có cơ hội nhận được học bổng, tôi cam kết sẽ sử dụng nguồn hỗ trợ tài chính này một cách hiệu quả nhất cho việc hoàn thành đồ án tốt nghiệp, trau dồi các kỹ năng công nghệ chuyên sâu và đóng góp giá trị cho xã hội.

Tôi xin chân thành cảm ơn Quý Hội đồng đã dành thời gian xem xét hồ sơ của tôi.

Trân trọng,
[Chữ ký và Họ tên sinh viên]`;

export default function ScholarshipsRadarPage() {
  const { session, profile } = useAuth();

  const [scholarships, setScholarships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sponsorTypeFilter, setSponsorTypeFilter] = useState("ALL");

  // AI Matcher State
  const [studentMajor, setStudentMajor] = useState("Công Nghệ Thông Tin");
  const [studentGpa, setStudentGpa] = useState("3.2");
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  // Cover letter modal
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Fetch Scholarships
  const fetchScholarships = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (sponsorTypeFilter !== "ALL") params.set("type", sponsorTypeFilter);

      const res = await fetch(`/api/scholarships/list?${params.toString()}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.scholarships)) {
        setScholarships(data.scholarships);
      }
    } catch (err) {
      console.warn("Fetch scholarships error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sponsorTypeFilter]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  // Handle Match Profile
  const handleMatchProfile = async (e) => {
    e.preventDefault();
    setIsMatching(true);
    saffronAudio.playClick(700);

    try {
      const res = await fetch("/api/scholarships/match-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: studentMajor,
          gpa: Number(studentGpa) || 3.0,
        }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data?.matchedScholarships)) {
        setMatchResults(data.matchedScholarships);
        saffronAudio.playSuccessChime();
      }
    } catch (err) {
      console.warn("Match profile error:", err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleCopyLetter = () => {
    saffronAudio.playClick(300);
    navigator.clipboard.writeText(SAMPLE_COVER_LETTER);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const displayList = matchResults || scholarships;

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_14_ZETA // VERIFIED_SCHOLARSHIP_RADAR"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% OFFICIAL VERIFIED SCHOLARSHIPS // ZERO FEE GUARANTEE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Radar Săn Học Bổng</span> Doanh Nghiệp &amp; Quốc Tế
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Tổng hợp học bổng tài năng chính ngạch từ các tập đoàn lớn (Samsung, Viettel, Vallet, POSCO, Lotte...). Tuyệt đối không thu phí nộp hồ sơ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(500);
                setIsCoverLetterOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-[#210a07] border border-[#ffbc09]/50 hover:border-[#ffbc09] text-[#ffd15c] font-mono font-bold text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" />
              <span>MẪU THƯ XIN HỌC BỔNG</span>
            </button>
          </div>
        </div>

        {/* AI Profile Matcher Box */}
        <div className="p-6 rounded-3xl bg-[#150604] border border-[#47140b] shadow-2xl mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffbc09]" />
            <h2 className="text-sm font-bold text-white font-mono uppercase">
              CÔNG CỤ KHỚP HỒ SƠ HỌC BỔNG TỰ ĐỘNG
            </h2>
          </div>

          <form onSubmit={handleMatchProfile} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-mono text-[#ece7e0]/60 mb-1">
                NGÀNH HỌC HIỆN TẠI:
              </label>
              <select
                value={studentMajor}
                onChange={(e) => setStudentMajor(e.target.value)}
                className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono cursor-pointer"
              >
                <option value="Công Nghệ Thông Tin">Công Nghệ Thông Tin / Phần Mềm</option>
                <option value="Điện - Điện Tử">Kỹ Thuật Điện - Điện Tử / Tự Động Hóa</option>
                <option value="Toán Học">Toán Học / Khoa Học Tự Nhiên</option>
                <option value="Kinh Tế">Kinh Tế / Quản Trị Kinh Doanh</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-mono text-[#ece7e0]/60 mb-1">
                ĐIỂM GPA (THANG 4.0):
              </label>
              <input
                type="number"
                step="0.1"
                min="2.0"
                max="4.0"
                value={studentGpa}
                onChange={(e) => setStudentGpa(e.target.value)}
                className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={isMatching}
                className="w-full py-2.5 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs uppercase hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>KHỚP HỒ SƠ NGAY</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sponsor Type Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {[
            { id: "ALL", label: "Tất Cả Học Bổng" },
            { id: "CORPORATE_TECH", label: "🏢 Doanh Nghiệp Công Nghệ (Samsung, Viettel)" },
            { id: "FOUNDATION_ACADEMIC", label: "🏛️ Quỹ Khoa Học & Học Thuật (Vallet...)" },
            { id: "INTERNATIONAL_FOUNDATION", label: "🌏 Quỹ Quốc Tế (POSCO...)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                saffronAudio.playClick(400);
                setSponsorTypeFilter(tab.id);
              }}
              className={`px-3.5 py-2 rounded-2xl border text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                sponsorTypeFilter === tab.id
                  ? "bg-[#ffbc09] text-[#150604] font-bold border-[#ffbc09] shadow-lg shadow-[#ffbc09]/20"
                  : "bg-[#150604] text-[#ece7e0]/70 border-[#47140b] hover:border-white/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scholarships List Grid */}
        {isLoading ? (
          <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#ffbc09] animate-spin" />
            <span>Đang đối soát danh bạ học bổng chính danh...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayList.map((sch) => (
              <div
                key={sch.id}
                className="p-6 rounded-3xl bg-[#150604] border border-[#47140b] hover:border-[#ffbc09]/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Row: Sponsor & Days Left Countdown */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10.5px] font-mono text-[#38bdf8] uppercase block">
                      {sch.sponsor}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10.5px] font-mono font-bold shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Còn {sch.daysLeft} ngày
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {sch.name}
                  </h3>

                  {/* Grant Amount & Match Score */}
                  <div className="p-3 rounded-2xl bg-[#210a07] border border-[#47140b] flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-mono text-[#ece7e0]/50 uppercase block">
                        TRỊ GIÁ HỌC BỔNG:
                      </span>
                      <span className="text-base font-black text-[#ffd15c] font-mono">
                        {sch.grantAmountFormatted}
                      </span>
                    </div>

                    {sch.matchScore && (
                      <div className="text-right">
                        <span className="text-[9.5px] font-mono text-[#ece7e0]/50 uppercase block">
                          ĐỘ PHÙ HỢP:
                        </span>
                        <span
                          className={`text-sm font-black font-mono ${
                            sch.matchScore >= 80 ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {sch.matchScore}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  <p className="text-xs text-[#ece7e0]/80 leading-relaxed font-human">
                    <strong>Quyền lợi:</strong> {sch.benefits}
                  </p>

                  {/* Target Majors */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-[#ece7e0]/50">NGÀNH ÁP DỤNG:</span>
                    {sch.targetMajors.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-black/40 border border-[#47140b] text-[10px] font-mono text-[#ece7e0]/70"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Required Documents */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-[#ffbc09] uppercase block font-bold">
                      HỒ SƠ CẦN CHUẨN BỊ (GPA &gt;= {sch.minGpa}):
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-xs text-[#ece7e0]/70">
                      {sch.requiredDocuments.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#47140b] flex items-center justify-between">
                  <span className="text-[10.5px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hồ sơ miễn phí 100%
                  </span>

                  <a
                    href={sch.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-all"
                  >
                    <span>CỔNG NỘP CHÍNH THỨC</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* COVER LETTER TEMPLATE MODAL */}
      <AnimatePresence>
        {isCoverLetterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <h3 className="text-base font-bold text-white font-mono">
                  MẪU THƯ XIN HỌC BỔNG (COVER LETTER TEMPLATE)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCoverLetterOpen(false)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#0a0504] border border-[#47140b] text-xs font-mono text-[#ece7e0] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                {SAMPLE_COVER_LETTER}
              </pre>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    const element = document.createElement("a");
                    const file = new Blob([SAMPLE_COVER_LETTER], { type: "text/plain;charset=utf-8" });
                    element.href = URL.createObjectURL(file);
                    element.download = "Don_Xin_Hoc_Bong_Mau_StudentHub.txt";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#210a07] border border-[#ffbc09]/50 text-[#ffd15c] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:border-[#ffbc09]"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải File .txt</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLetter}
                  className="px-4 py-2 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLetter ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLetter ? "Đã sao chép" : "Sao chép mẫu thư"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
