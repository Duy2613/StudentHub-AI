"use client";

import React, { useState } from "react";
import { AlertTriangle, Search, ShieldCheck, CheckCircle2, Copy, Users, BarChart3, Flame, Info, ArrowUpRight } from "lucide-react";

export function CommunityIntelligenceStudioV2({
  initialTopics = ["TOEIC_SUBMISSION_TIME", "GRADUATION_DOSSIER_REVIEW", "COURSE_REGISTRATION"],
  initialGaps = [],
  initialFriction = [],
  initialHeatmap = null,
  initialPosts = [],
  initialConsensus = null
}) {
  const [selectedTopic, setSelectedTopic] = useState(initialTopics[0] || "TOEIC_SUBMISSION_TIME");
  const [selectedTab, setSelectedTab] = useState("REALITY_GAPS"); // REALITY_GAPS | FRICTION_HEATMAP | PROVENANCE | EXPERIENCE_EXPLORER | QUERY_SANDBOX
  const [queryType, setQueryType] = useState("WHAT_STUDENTS_EXPERIENCING");
  const [queryResult, setQueryResult] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Active Data
  const realityGaps = initialGaps.length > 0 ? initialGaps : [
    {
      topic: "GRADUATION_DOSSIER_REVIEW",
      officialTarget: "3 ngày làm việc",
      officialCitation: "QĐ 3116/QĐ-ĐHSPKT (Điều 14)",
      communityObserved: "6–8 ngày làm việc (trung vị 7 ngày)",
      sampleSize: 27,
      gapStatus: "SIGNIFICANT_OPERATIONAL_GAP",
      explanation: "Quy định nêu mục tiêu 3 ngày, trong khi thực tế 27 sinh viên K24 ghi nhận thời gian thẩm định thực tế từ 6–8 ngày."
    },
    {
      topic: "TOEIC_SUBMISSION_TIME",
      officialTarget: "3–5 ngày làm việc",
      officialCitation: "QĐ 3116/QĐ-ĐHSPKT — Chuẩn Ngoại ngữ",
      communityObserved: "6–8 ngày làm việc (trung vị 7 ngày)",
      sampleSize: 4,
      gapStatus: "MINOR_GAP",
      explanation: "Độ trễ vận hành nhẹ do quy trình xác thực mã QR với IIG Việt Nam trước khi ghi nhận vào hệ thống đào tạo."
    }
  ];

  const frictionSignals = initialFriction.length > 0 ? initialFriction : [
    {
      frictionId: "FRIC_01",
      process: "Xét duyệt Hồ sơ Tốt nghiệp",
      step: "Thẩm định hồ sơ Phòng Đào Tạo",
      frictionType: "VERIFICATION_TURNAROUND_DELAY",
      cohort: "K24",
      independentReportCount: 27,
      trend: "REPEATED",
      severity: "HIGH",
      description: "27 phản ánh độc lập về độ trễ thẩm định hồ sơ tốt nghiệp trong đợt xét tháng 8/2026."
    },
    {
      frictionId: "FRIC_02",
      process: "Đăng ký Môn học Trực tuyến",
      step: "Chọn lớp & Lưu TKB",
      frictionType: "PORTAL_REGISTRATION_TIMEOUT",
      cohort: "K24",
      independentReportCount: 11,
      trend: "NEW_SPIKE",
      severity: "CRITICAL",
      description: "Cổng đăng ký bị nghẽn mạng và timeout trong khung giờ 08:00 - 09:00 sáng."
    },
    {
      frictionId: "FRIC_03",
      process: "Xác thực Chứng chỉ Ngoại ngữ",
      step: "Tải lên bản scan chứng chỉ",
      frictionType: "DOCUMENT_SCAN_QUALITY_REJECTION",
      cohort: "K21",
      independentReportCount: 4,
      trend: "STABLE",
      severity: "MEDIUM",
      description: "Bản scan bị mờ mã QR kiểm tra IIG dẫn đến bị hệ thống từ chối trả về."
    }
  ];

  const heatmap = initialHeatmap || {
    columns: ["K21", "K22", "K23", "K24", "K25", "K26"],
    rows: [
      {
        processName: "Xét duyệt Hồ sơ Tốt nghiệp",
        stepName: "Thẩm định Phòng Đào Tạo",
        totalReports: 27,
        cohorts: {
          K21: { count: 0, severity: "NONE" },
          K22: { count: 0, severity: "NONE" },
          K23: { count: 2, severity: "LOW" },
          K24: { count: 27, severity: "HIGH", trend: "REPEATED" },
          K25: { count: 0, severity: "NONE" },
          K26: { count: 0, severity: "NONE" }
        }
      },
      {
        processName: "Đăng ký Môn học Trực tuyến",
        stepName: "Lưu thời khóa biểu",
        totalReports: 11,
        cohorts: {
          K21: { count: 1, severity: "LOW" },
          K22: { count: 1, severity: "LOW" },
          K23: { count: 2, severity: "MEDIUM" },
          K24: { count: 11, severity: "CRITICAL", trend: "NEW_SPIKE" },
          K25: { count: 3, severity: "MEDIUM" },
          K26: { count: 1, severity: "LOW" }
        }
      },
      {
        processName: "Chuẩn Ngoại ngữ",
        stepName: "Quét mã QR IIG",
        totalReports: 4,
        cohorts: {
          K21: { count: 4, severity: "MEDIUM", trend: "STABLE" },
          K22: { count: 0, severity: "NONE" },
          K23: { count: 0, severity: "NONE" },
          K24: { count: 0, severity: "NONE" },
          K25: { count: 0, severity: "NONE" },
          K26: { count: 0, severity: "NONE" }
        }
      }
    ]
  };

  const handleRunQuery = async () => {
    setIsQuerying(true);
    try {
      const res = await fetch("/api/intelligence/community/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic, queryType })
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data.result);
      }
    } catch {
      // fallback
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Community Reality Graph
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  Phase T3 V2
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Empirical student experience layers, provenance clustering & official vs real-world gap engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>INVARIANT: COMMUNITY SIGNAL ≠ OFFICIAL AUTHORITY</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 overflow-x-auto">
          {[
            { id: "REALITY_GAPS", label: "Official vs Reality Gaps", icon: AlertTriangle, badge: `${realityGaps.length}` },
            { id: "FRICTION_HEATMAP", label: "Operational Friction Graph", icon: Flame, badge: `${frictionSignals.length}` },
            { id: "PROVENANCE", label: "Provenance & Syndication", icon: Copy, badge: "Collapse" },
            { id: "QUERY_SANDBOX", label: "Reality Query Sandbox", icon: Search, badge: "7 Modes" }
          ].map(tab => {
            const Icon = tab.icon;
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  active ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-400"
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OFFICIAL VS REAL-WORLD REALITY GAPS */}
        {selectedTab === "REALITY_GAPS" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 border border-emerald-500/20 text-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-300">Signature Flagship: Official vs Real-World Gap Engine</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  So sánh mục tiêu quy định hành chính chính thức (VD: 3 ngày xử lý) với thời gian thực tế ghi nhận từ cộng đồng (6–8 ngày).
                  Hệ thống bảo vệ nguyên tắc: <strong className="text-white">Không thay đổi quy chế chính thức</strong> nhưng cung cấp dự báo độ trễ thực tế cho sinh viên.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {realityGaps.map((gap, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {gap.topic}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      gap.gapStatus === "SIGNIFICANT_OPERATIONAL_GAP"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                        : "bg-blue-500/15 text-blue-300 border-blue-500/40"
                    }`}>
                      {gap.gapStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        Mục tiêu Quy chế
                      </div>
                      <div className="text-base font-bold text-white">{gap.officialTarget}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{gap.officialCitation}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1">
                      <div className="text-[11px] uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Thực tế Sinh viên
                      </div>
                      <div className="text-base font-bold text-amber-300">{gap.communityObserved}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{gap.sampleSize} báo cáo thực nghiệm</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    {gap.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OPERATIONAL FRICTION HEATMAP */}
        {selectedTab === "FRICTION_HEATMAP" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-950 border border-amber-500/20 text-sm flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Operational Friction Graph & Cohort Heatmap</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Cấu trúc đồ thị: <span className="font-mono text-amber-200">QUY TRÌNH → BƯỚC → LOẠI ĐIỂM NGHẼN → KHÓA/NGÀNH → XU HƯỚNG</span>.
                  Giúp nhận diện chính xác nút thắt vận hành mà không cần lướt hàng trăm bài diễn đàn.
                </p>
              </div>
            </div>

            {/* Heatmap Table */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Ma Trận Điểm Nghẽn Vận Hành Theo Khóa (Friction Heatmap)
                </h3>
                <span className="text-xs text-slate-400 font-mono">Cập nhật: Tháng 8/2026</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="p-3.5 pl-5">Quy trình & Bước thực hiện</th>
                      {heatmap.columns.map(c => (
                        <th key={c} className="p-3.5 text-center font-bold">{c}</th>
                      ))}
                      <th className="p-3.5 text-right pr-5">Tổng báo cáo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {heatmap.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="font-semibold text-white">{row.processName}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{row.stepName}</div>
                        </td>
                        {heatmap.columns.map(c => {
                          const cell = row.cohorts[c] || { count: 0, severity: "NONE" };
                          let bg = "bg-slate-950 text-slate-600";
                          if (cell.severity === "CRITICAL") bg = "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold";
                          else if (cell.severity === "HIGH") bg = "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
                          else if (cell.severity === "MEDIUM") bg = "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30";
                          else if (cell.severity === "LOW") bg = "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";

                          return (
                            <td key={c} className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono ${bg}`}>
                                {cell.count > 0 ? `${cell.count} vụ` : "—"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-3.5 text-right pr-5 font-mono font-bold text-white">
                          {row.totalReports}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROVENANCE CLUSTERING */}
        {selectedTab === "PROVENANCE" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-slate-950 border border-blue-500/20 text-sm flex items-start gap-3">
              <Copy className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-300">Copy-Paste Consensus Defense & Provenance Clustering</span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  100 bài viết copy nguyên văn chỉ được tính là <strong className="text-white">1 cụm nguồn gốc duy nhất</strong>.
                  Đồng thuận cộng đồng chỉ ghi nhận dựa trên số lượng đơn vị quan sát thực nghiệm độc lập.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-white">Mô hình Thu gọn Sao chép (Syndication Collapse)</span>
                <span className="text-xs font-mono text-emerald-400">100 Bài viết → 4 Cụm nguồn → 2 Đồng thuận độc lập</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-slate-400">TỔNG BÀI ĐĂNG FORUM</div>
                  <div className="text-2xl font-bold text-white">100 Posts</div>
                  <div className="text-slate-500 text-[11px]">Bao gồm các bài share lại, trích dẫn, ảnh chụp màn hình</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2">
                  <div className="text-blue-400">CỤM NGUỒN GỐC (PROVENANCE)</div>
                  <div className="text-2xl font-bold text-blue-300">4 Clusters</div>
                  <div className="text-slate-400 text-[11px]">Gom nhóm tự động qua SHA-256 fingerprint & URL lineage</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="text-emerald-400">ĐỒNG THUẬN ĐỘC LẬP THỰC TẾ</div>
                  <div className="text-2xl font-bold text-emerald-300">2 Independent Units</div>
                  <div className="text-slate-400 text-[11px]">Chỉ tính các sinh viên thực hiện quy trình độc lập</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REALITY QUERY SANDBOX */}
        {selectedTab === "QUERY_SANDBOX" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Truy Vấn Trải Nghiệm Thực Tế Sinh Viên (7 Canonical Modes)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-mono block mb-1.5">Chủ đề Quy trình</label>
                  <select
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    {initialTopics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-mono block mb-1.5">Loại Câu Hỏi Chuẩn (Canonical Query)</label>
                  <select
                    value={queryType}
                    onChange={e => setQueryType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="WHAT_STUDENTS_EXPERIENCING">1. Thực tế sinh viên đang trải nghiệm gì?</option>
                    <option value="RECURRING_PROBLEMS">2. Có vấn đề nào lặp lại nhiều lần không?</option>
                    <option value="RECENT_REPORTS">3. Có báo cáo nào mới trong học kỳ này không?</option>
                    <option value="OFFICIAL_VS_REALITY_GAP">4. Có sự chênh lệch giữa quy chế và thực tế không?</option>
                    <option value="EDGE_CASE_REPORTS">5. Có trường hợp hiếm/đặc thù nào bị từ chối không?</option>
                    <option value="ANECDOTE_VS_PATTERN">6. Đây là sự cố cá nhân hay mô thức lặp lại?</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunQuery}
                disabled={isQuerying}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                {isQuerying ? "Đang truy vấn đồ thị..." : "Thực thi Truy vấn Thực tế"}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Query Output */}
            {queryResult && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white font-mono">BÁO CÁO THỰC TẾ SINH VIÊN (COMMUNITY REALITY)</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {queryResult.communityReality?.signal}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-mono uppercase text-[10px]">Tín hiệu Trải nghiệm</div>
                    <div className="text-slate-200 font-medium">{queryResult.communityReality?.signalSummary}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {queryResult.communityReality?.firstHandReportCount} báo cáo trực tiếp | {queryResult.communityReality?.independentProvenanceClustersCount} cụm nguồn độc lập
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-mono uppercase text-[10px]">So Sánh Quy Chế Chính Thức</div>
                    <div className="text-slate-200 font-medium">Mục tiêu: {queryResult.officialComparison?.officialTarget}</div>
                    <div className="text-amber-300 font-medium">Thực tế: {queryResult.officialComparison?.communityObserved}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300 font-mono uppercase text-[10px]">Giới hạn Nhận thức (Epistemic Limitations)</div>
                  {queryResult.limitations?.map((lim, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-1.5">
                      <span className="text-slate-600">•</span>
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
