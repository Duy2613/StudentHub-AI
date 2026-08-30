"use client";

import React, { useState } from "react";
import { User, GraduationCap, Award, BookOpen, AlertTriangle, Clock, CheckCircle2, XCircle, Building, CreditCard, MessageSquare } from "lucide-react";

export function Profile360View({ profile, onDiscrepancyReport, className = "" }) {
  const [activeTab, setActiveTab] = useState("requirements"); // 'requirements' | 'courses' | 'certificates' | 'provenance'
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportField, setReportField] = useState("cgpa");
  const [reportValue, setReportValue] = useState("");
  const [reportExplanation, setReportExplanation] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  if (!profile || !profile.identity) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-slate-300 font-medium">Chưa có dữ liệu Hồ sơ Học vụ 360</p>
        <p className="text-slate-500 text-xs mt-1">Vui lòng kiểm tra kết nối với hệ thống Đào tạo nhà trường.</p>
      </div>
    );
  }

  const { identity, academicSummary, courseRecords = [], certifications = [], graduationRequirements = [], financialClearance, provenance, freshness } = profile;

  // Filter courses
  const filteredCourses = courseRecords.filter(c => {
    if (courseFilter === "ALL") return true;
    if (courseFilter === "PASSED") return c.isPassed === true;
    if (courseFilter === "FAILED") return c.isPassed === false;
    if (courseFilter === "IN_PROGRESS") return c.status === "IN_PROGRESS" || c.courseStatus === "IN_PROGRESS";
    return true;
  });

  const handleSendReport = (e) => {
    e.preventDefault();
    if (onDiscrepancyReport) {
      onDiscrepancyReport({
        field: reportField,
        claimedValue: reportValue,
        explanation: reportExplanation
      });
    }
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
      setReportValue("");
      setReportExplanation("");
    }, 1500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 p-6 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/10 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">{identity.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  MSSV: {identity.studentId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {identity.academicStatus || "ACTIVE"}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {identity.programName} ({identity.programCode}) · Khóa K{String(identity.cohort).slice(-2)} · Lớp {identity.classCode || "Chính quy"}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> {identity.faculty}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Bản xác minh: Rev #{profile.profileRevision}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Báo sai lệch dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* 2. Academic Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tín chỉ */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Tín chỉ tích lũy</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">{academicSummary?.earnedCredits || 0}</span>
            <span className="text-xs text-slate-500">/ {academicSummary?.totalRequiredCredits || 150}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((academicSummary?.earnedCredits || 0) / (academicSummary?.totalRequiredCredits || 150)) * 100)}%` }}
            />
          </div>
        </div>

        {/* CGPA */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Điểm trung bình (CGPA)</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              {academicSummary?.cgpa !== null ? academicSummary.cgpa.toFixed(2) : "N/A"}
            </span>
            <span className="text-xs text-slate-500">/ 4.00</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 mt-3">
            Xếp loại: {academicSummary?.academicStanding || "Bình thường"}
          </div>
        </div>

        {/* Chuẩn đầu ra */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Chuẩn tốt nghiệp</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              {graduationRequirements.filter(r => r.isSatisfied).length}
            </span>
            <span className="text-xs text-slate-500">/ {graduationRequirements.length}</span>
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-3">
            {graduationRequirements.filter(r => !r.isSatisfied).length === 0 ? "✓ Đủ điều kiện tốt nghiệp" : `Còn ${graduationRequirements.filter(r => !r.isSatisfied).length} điều kiện chưa đạt`}
          </div>
        </div>

        {/* Học phí & Tài chính */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Học phí học kỳ</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {financialClearance?.isCleared ? "0" : (financialClearance?.remainingDebt || 0).toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-slate-500">đ</span>
          </div>
          <div className={`text-[11px] font-semibold mt-3 ${financialClearance?.isCleared ? "text-emerald-400" : "text-amber-400"}`}>
            {financialClearance?.isCleared ? "✓ Đã hoàn tất công nợ" : "Chưa hoàn tất học phí"}
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("requirements")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "requirements"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          Chuẩn Tốt Nghiệp ({graduationRequirements.length})
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "courses"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          Bảng Điểm Học Phần ({courseRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "certificates"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          Chứng Chỉ Ngoại Ngữ ({certifications.length})
        </button>
        <button
          onClick={() => setActiveTab("provenance")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "provenance"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          Nguồn Xác Thực & Độ Tươi
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* Tab: Chuẩn tốt nghiệp */}
      {activeTab === "requirements" && (
        <div className="space-y-3">
          {graduationRequirements.map((req) => (
            <div
              key={req.requirementId}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                req.isSatisfied
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                  : "bg-slate-900/60 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {req.isSatisfied ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white">{req.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{req.studentFacingExplanation}</p>
                </div>
              </div>

              <div className="shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    req.isSatisfied
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {req.isSatisfied ? "ĐẠT" : "CHƯA ĐẠT"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Bảng điểm học phần */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {["ALL", "PASSED", "FAILED", "IN_PROGRESS"].map((f) => (
              <button
                key={f}
                onClick={() => setCourseFilter(f)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  courseFilter === f
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                }`}
              >
                {f === "ALL" && "Tất cả"}
                {f === "PASSED" && "Đã đạt"}
                {f === "FAILED" && "Chưa đạt / Học lại"}
                {f === "IN_PROGRESS" && "Đang học"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã môn</th>
                  <th className="py-3 px-4">Tên học phần</th>
                  <th className="py-3 px-4 text-center">Tín chỉ</th>
                  <th className="py-3 px-4 text-center">Điểm hệ 10</th>
                  <th className="py-3 px-4 text-center">Điểm chữ</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      Không tìm thấy học phần phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c) => (
                    <tr key={c.courseCode} className="hover:bg-slate-800/30 transition-all">
                      <td className="py-3 px-4 font-mono font-medium text-blue-400">{c.courseCode}</td>
                      <td className="py-3 px-4 font-medium text-white">{c.courseName}</td>
                      <td className="py-3 px-4 text-center">{c.credits}</td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {c.grade10 !== undefined ? c.grade10.toFixed(1) : (c.grade !== undefined ? c.grade.toFixed(1) : "—")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.isPassed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {c.letterGrade || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          c.isPassed
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {c.isPassed ? "Đạt" : "Chưa đạt"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Chứng chỉ ngoại ngữ */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              Chưa có chứng chỉ ngoại ngữ nào được cập nhật.
            </div>
          ) : (
            certifications.map((cert) => (
              <div
                key={cert.type}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-base font-bold text-white">{cert.type} Quốc Tế</h4>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">{cert.score}</span>
                    <span className="text-xs text-slate-500">/ {cert.type === "TOEIC" ? "990" : "9.0"}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                    <p>Cơ quan cấp: {cert.verificationAuthority || "IIG Vietnam"}</p>
                    <p>Ngày cấp: {cert.issuedDate || cert.issuedAt || "2025-06-15"}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cert.verificationStatus === "VERIFIED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {cert.verificationStatus === "VERIFIED" ? "✓ ĐÃ XÁC THỰC" : "CHỜ XÁC MINH"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Nguồn xác thực & Độ tươi */}
      {activeTab === "provenance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(provenance || {}).map(([key, prov]) => (
              <div key={key} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{key}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {prov.authority}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Nguồn: {prov.source}</p>
                <p className="text-[11px] text-slate-500">Thời điểm xác thực: {new Date(prov.verifiedAt).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Report Discrepancy Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" /> Báo cáo sai lệch dữ liệu học vụ
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {reportSuccess ? (
              <div className="p-4 text-center text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                ✓ Đã gửi yêu cầu đối soát thành công đến Phòng Đào tạo.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Mục dữ liệu cần điều chỉnh</label>
                  <select
                    value={reportField}
                    onChange={(e) => setReportField(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="cgpa">Điểm trung bình (CGPA)</option>
                    <option value="earnedCredits">Số tín chỉ tích lũy</option>
                    <option value="certifications">Chứng chỉ ngoại ngữ (TOEIC/IELTS)</option>
                    <option value="tuition">Tình trạng học phí</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Giá trị đúng theo xác nhận</label>
                  <input
                    type="text"
                    required
                    value={reportValue}
                    onChange={(e) => setReportValue(e.target.value)}
                    placeholder="Ví dụ: TOEIC 650 điểm"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Giải trình / Ghi chú</label>
                  <textarea
                    rows={3}
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    placeholder="Mô tả chi tiết hoặc mã biên nhận..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30"
                  >
                    Gửi yêu cầu đối soát
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
