"use client";

import React, { useEffect } from "react";

/**
 * StudentHub AI — Authoritative Student Academic Digital Twin Drawer
 * 
 * Slide-over drawer displaying canonical student academic state,
 * credit breakdown, verified certificates, and eligibility evaluation.
 */
export function DigitalTwinDrawer({ isOpen, onClose, digitalTwin, eligibilityResult }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !digitalTwin) return null;

  const earnedCredits = digitalTwin.earnedCredits || 0;
  const totalCredits = digitalTwin.totalRequiredCredits || 150;
  const creditPercentage = Math.min(100, Math.round((earnedCredits / totalCredits) * 100));

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div 
          className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    HỒ SƠ SỐ CHÍNH THỨC
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Rev {digitalTwin.revision || 1}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-1">
                  {digitalTwin.fullName || "Sinh Viên"}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  MSSV: {digitalTwin.studentId} • Khóa: K{String(digitalTwin.cohort).slice(-2)} ({digitalTwin.academicYear})
                </p>
                <p className="text-xs text-indigo-300 font-medium mt-0.5">
                  {digitalTwin.programName} ({digitalTwin.programCode}) • {digitalTwin.faculty}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                aria-label="Đóng ngăn hồ sơ"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 text-sm text-slate-300">
            {/* Academic Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <span className="text-xs text-slate-400 block">Tín chỉ tích lũy</span>
                <span className="text-lg font-bold text-slate-100 font-mono">
                  {earnedCredits}/{totalCredits}
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <span className="text-xs text-slate-400 block">Điểm TB (GPA)</span>
                <span className="text-lg font-bold text-amber-300 font-mono">
                  {Number(digitalTwin.cgpa || 0).toFixed(2)}/4.0
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <span className="text-xs text-slate-400 block">Xếp loại học lực</span>
                <span className="text-sm font-bold text-emerald-300 block mt-1">
                  {digitalTwin.academicStanding === "NORMAL" ? "Bình thường" : digitalTwin.academicStanding}
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <span className="text-xs text-slate-400 block">Tình trạng học phí</span>
                <span className="text-sm font-bold text-emerald-400 block mt-1">
                  {digitalTwin.tuitionPaid ? "Đã hoàn tất" : "Chưa thanh toán"}
                </span>
              </div>
            </div>

            {/* Credit Progress Bar */}
            <div className="space-y-1.5 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Tiến độ hoàn thành chương trình đào tạo</span>
                <span className="text-emerald-400 font-semibold">{creditPercentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${creditPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Còn lại {digitalTwin.remainingCredits || 0} tín chỉ chuyên ngành & khóa luận tốt nghiệp.
              </p>
            </div>

            {/* Eligibility Assessment */}
            {eligibilityResult && (
              <div className="space-y-3 p-4 bg-slate-800/30 border border-slate-700/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    ĐÁNH GIÁ ĐIỀU KIỆN TỐT NGHIỆP
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    eligibilityResult.status === "ELIGIBLE"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : eligibilityResult.status === "PARTIALLY_ELIGIBLE"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {eligibilityResult.status === "ELIGIBLE" ? "ĐỦ ĐIỀU KIỆN" : "CHƯA ĐỦ ĐIỀU KIỆN"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {eligibilityResult.studentFacingExplanation}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  {eligibilityResult.satisfiedRequirements?.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-emerald-400">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{req}</span>
                    </div>
                  ))}

                  {eligibilityResult.missingRequirements?.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-rose-400">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Certificates */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                CHỨNG CHỈ NGOẠI NGỮ & TIN HỌC ĐÃ XÁC THỰC
              </span>
              <div className="space-y-2">
                {digitalTwin.certificates && digitalTwin.certificates.length > 0 ? (
                  digitalTwin.certificates.map((cert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {cert.type}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            Chứng chỉ {cert.type} Quốc tế
                          </p>
                          <p className="text-xs text-slate-500">
                            Trạng thái: <span className="text-emerald-400 font-medium">{cert.verificationStatus || "Đã xác thực"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-300 font-mono">
                          {cert.score} điểm
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/20 rounded-lg border border-dashed border-slate-800">
                    Chưa ghi nhận chứng chỉ ngoại ngữ chính thức trên hệ thống.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer with Data Provenance */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Nguồn: {digitalTwin.sourceAuthority || "HCMUTE_DAOTAO_PORTAL"}</span>
            </div>
            <span className="text-slate-400 font-mono">
              Cập nhật: {digitalTwin.asOf ? new Date(digitalTwin.asOf).toLocaleTimeString("vi-VN") : "Hôm nay"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
