"use client";

import React, { useState } from "react";
import { Layers, ShieldCheck, AlertTriangle, Search, HelpCircle, GitCompare, Users, Award, Sparkles, Flame } from "lucide-react";

export function KnowledgeObjectStudio({ initialKnowledgeObjects = [] }) {
  const [objects] = useState(initialKnowledgeObjects);
  const [selectedId, setSelectedId] = useState(initialKnowledgeObjects[0]?.knowledgeObjectId || "KNO_GRADUATION_DEADLINE_2026");
  const [activeTab, setActiveTab] = useState("FOUR_LAYERS"); // FOUR_LAYERS | WHY_CONCLUSION | WHAT_DISAGREES | WHAT_CHANGED | WHAT_UNKNOWN | AUTHORITY_MATRIX

  const activeObject = objects.find(o => o.knowledgeObjectId === selectedId) || objects[0] || {
    knowledgeObjectId: "KNO_GRADUATION_DEADLINE_2026",
    subject: "DEADLINE",
    topic: "GRADUATION_DOSSIER_REVIEW",
    version: 2,
    authoritativeState: "AUTHORITATIVE",
    evidenceHealth: "HEALTHY",
    policyVersion: "QĐ 3116/QĐ-ĐHSPKT (2025)",
    officialTruth: {
      statement: "Hạn chót nộp hồ sơ xét tốt nghiệp chính thức gia hạn đến 05/09/2026 theo Thông báo số 185/TB-ĐHSPKT.",
      citation: "Thông báo 185/TB-ĐHSPKT (Điều 14)",
      value: "05/09/2026"
    },
    expertInterpretation: [
      {
        expertId: "EXP_MINH_NV",
        name: "TS. Nguyễn Văn Minh",
        interpretation: "Quy định gia hạn này áp dụng cho toàn thể sinh viên K24 chưa kịp hoàn thành chứng chỉ ngoại ngữ."
      }
    ],
    communityReality: {
      observedValue: "6_TO_8_DAYS",
      firstHandReportCount: 27,
      signalSummary: "27 sinh viên ghi nhận thời gian thẩm định thực tế từ 6–8 ngày làm việc."
    },
    realityGaps: [
      {
        gapStatus: "SIGNIFICANT_OPERATIONAL_GAP",
        officialTarget: "3 ngày làm việc",
        communityObserved: "6–8 ngày làm việc",
        explanation: "Quy chế công bố mục tiêu 3 ngày, trong khi thực tế ghi nhận 6-8 ngày."
      }
    ],
    contradictions: [],
    unknowns: [
      "Chưa có thông báo về địa điểm nộp bổ sung trực tiếp ngoài giờ hành chính."
    ],
    limitations: [
      "Quy chế học vụ chính thức luôn có thẩm quyền cao nhất đối với tiến độ đào tạo của sinh viên.",
      "Kinh nghiệm cộng đồng phản ánh thời gian xử lý thực tế và không thay thế văn bản quy phạm."
    ],
    confidenceTelemetry: {
      totalSourcesCount: 3,
      independentProvenanceClustersCount: 2,
      adjudicationPath: "OFFICIAL_AUTHORITATIVE_CHAIN"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Evidence Fusion & Knowledge Object
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                  Phase T4 V1
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Authority-Aware Epistemic Synthesis: Official Truth + AI Reasoning + Expert Interpretation + Community Reality
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>INVARIANT: EVIDENCE IS NOT DEMOCRACY</span>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Knowledge Object Selector & Top Summary Bar */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">Chọn Đối Tượng Tri Thức (Knowledge Object)</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-medium"
              >
                {objects.map(o => (
                  <option key={o.knowledgeObjectId} value={o.knowledgeObjectId}>
                    [{o.knowledgeObjectId}] {o.subject} — {o.topic} (v{o.version})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {activeObject.authoritativeState}
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                HEALTH: {activeObject.evidenceHealth}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                {activeObject.policyVersion}
              </span>
            </div>
          </div>
        </div>

        {/* Flagship Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 overflow-x-auto">
          {[
            { id: "FOUR_LAYERS", label: "4 Tầng Tri Thức (Knowledge Layers)", icon: Layers },
            { id: "WHY_CONCLUSION", label: "Vì sao có kết luận này? (Why?)", icon: Search },
            { id: "WHAT_DISAGREES", label: "Có điểm nào mâu thuẫn? (Disagrees)", icon: AlertTriangle, badge: `${activeObject.contradictions?.length || 0}` },
            { id: "WHAT_CHANGED", label: "Có gì thay đổi? (Diff)", icon: GitCompare },
            { id: "WHAT_UNKNOWN", label: "Điểm chưa biết? (Unknowns)", icon: HelpCircle, badge: `${activeObject.unknowns?.length || 0}` },
            { id: "AUTHORITY_MATRIX", label: "Ma Trận Thẩm Quyền (Matrix)", icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    active ? "bg-indigo-500/20 text-indigo-200" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FOUR KNOWLEDGE LAYERS */}
        {activeTab === "FOUR_LAYERS" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Layer A: Official Truth */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-400 flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Layer A: Official Academic Truth
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  INSTITUTIONAL
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {activeObject.officialTruth?.statement || "Không có quy chế chính thức trực tiếp."}
              </p>
              <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                Căn cứ pháp lý: {activeObject.officialTruth?.citation || "QĐ 3116/QĐ-ĐHSPKT"}
              </div>
            </div>

            {/* Layer B: AI Verified Reasoning */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-indigo-400 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4" />
                  Layer B: AI Verified Reasoning
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  VERIFIED ENTAILMENT
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                Thời hạn chính thức hiện tại là 05/09/2026. Bằng chứng thực nghiệm từ cộng đồng ghi nhận thời gian xử lý thực tế 6–8 ngày làm việc.
              </p>
              <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                Dẫn xuất: OFFICIAL (TB 185) ➔ EXPERT (K24 Scope) ➔ AI_SYNTHESIS
              </div>
            </div>

            {/* Layer C: Expert Interpretation */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-blue-400 flex items-center gap-1.5 font-bold">
                  <Award className="w-4 h-4" />
                  Layer C: Expert Interpretation
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  QUALIFIED SCOPE
                </span>
              </div>
              {activeObject.expertInterpretation?.map((exp, eIdx) => (
                <div key={eIdx} className="space-y-1">
                  <div className="text-xs font-bold text-white">{exp.name}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{exp.interpretation}</p>
                </div>
              ))}
            </div>

            {/* Layer D: Community Reality */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5 font-bold">
                  <Users className="w-4 h-4" />
                  Layer D: Community Reality
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  EMPIRICAL FRICTION
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {activeObject.communityReality?.signalSummary || "Chưa có báo cáo cộng đồng."}
              </p>
              {activeObject.realityGaps?.map((gap, gIdx) => (
                <div key={gIdx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                  <div className="font-bold text-amber-300">{gap.gapStatus}</div>
                  <div className="text-slate-300">{gap.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: WHY THIS CONCLUSION? */}
        {activeTab === "WHY_CONCLUSION" && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Sơ Đồ Dẫn Xuất Căn Cứ (Evidence Lineage DAG)
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  1. CĂN CỨ THẨM QUYỀN CAO NHẤT (AUTHORITATIVE TRUTH)
                </div>
                <div className="text-slate-200">Thông báo 185/TB-ĐHSPKT (20/08/2026) ➔ Điều 14 ➔ Hạn chót 05/09/2026.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2">
                <div className="text-blue-400 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  2. DIỄN GIẢI CHUYÊN MÔN HỖ TRỢ (EXPERT INTERPRETATION)
                </div>
                <div className="text-slate-200">TS. Nguyễn Văn Minh (Khoa CNTT) xác nhận phạm vi áp dụng cho sinh viên K24.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  3. BỐI CẢNH THỰC TẾ CỘNG ĐỒNG (COMMUNITY OPERATIONAL REALITY)
                </div>
                <div className="text-slate-200">27 sinh viên ghi nhận thời gian thẩm định thực tế 6–8 ngày (Độ trễ vận hành).</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WHAT DISAGREES? */}
        {activeTab === "WHAT_DISAGREES" && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Bản Đồ Bất Đồng & Chênh Lệch Thực Tế (Conflict & Disagreement Map)
            </h3>

            {activeObject.contradictions?.length === 0 && activeObject.realityGaps?.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono">Không phát hiện mâu thuẫn hay bất đồng ý kiến.</p>
            ) : (
              <div className="space-y-3">
                {activeObject.realityGaps?.map((gap, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      Chênh Lệch Vận Hành Thực Tế (Operational Reality Gap)
                    </div>
                    <div className="text-slate-300">
                      Mục tiêu quy chế: <strong className="text-white">{gap.officialTarget}</strong> vs Thực tế sinh viên: <strong className="text-amber-300">{gap.communityObserved}</strong>.
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{gap.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WHAT CHANGED? */}
        {activeTab === "WHAT_CHANGED" && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              Lịch Sử Biến Thiên Tri Thức (Knowledge Diff V1 ➔ V2)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 opacity-70">
                <div className="text-slate-400">PHIÊN BẢN CŨ (v1)</div>
                <div className="text-white font-bold">Hạn chót: 30/08/2026</div>
                <div className="text-slate-500 text-[11px]">Thông báo số 120/TB-ĐHSPKT (Đã hết hiệu lực)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2">
                <div className="text-indigo-400 font-bold">PHIÊN BẢN HIỆN HÀNH (v2)</div>
                <div className="text-white font-bold">Hạn chót: 05/09/2026 (Gia hạn)</div>
                <div className="text-emerald-400 text-[11px]">Thông báo số 185/TB-ĐHSPKT (Hiệu lực chính thức)</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
              <strong>Lý do thay đổi:</strong> Nhà trường chính thức ban hành Thông báo số 185/TB-ĐHSPKT gia hạn thời gian xét tốt nghiệp từ 30/08/2026 sang 05/09/2026. Hệ thống thực hiện thay thế quy chế (Supersession) và tái tính toán tác động hạ nguồn.
            </p>
          </div>
        )}

        {/* TAB 5: WHAT IS STILL UNKNOWN? */}
        {activeTab === "WHAT_UNKNOWN" && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Điểm Chưa Biết & Giới Hạn Nhận Thức (Epistemic Blindspots)
            </h3>

            <div className="space-y-2 text-xs">
              {activeObject.unknowns?.map((u, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/20 text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{u}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs text-slate-400">
              <div className="font-bold text-slate-300 font-mono uppercase text-[10px]">Giới hạn tuyên bố (Epistemic Limitations)</div>
              {activeObject.limitations?.map((lim, lIdx) => (
                <div key={lIdx} className="flex items-center gap-1.5">
                  <span className="text-slate-600">•</span>
                  <span>{lim}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AUTHORITY MATRIX */}
        {activeTab === "AUTHORITY_MATRIX" && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Ma Trận Phân Định Thẩm Quyền (Authority Matrix)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-3 pl-4">Lĩnh Vực Đánh Giá</th>
                    <th className="p-3 text-center text-emerald-400">Layer A: Official</th>
                    <th className="p-3 text-center text-blue-400">Layer C: Expert</th>
                    <th className="p-3 text-center text-amber-400">Layer D: Community</th>
                    <th className="p-3 text-center text-indigo-400">Layer B: AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-3 pl-4 font-bold text-white">Quy chế & Chân lý học vụ</td>
                    <td className="p-3 text-center font-bold text-emerald-300 bg-emerald-950/20">THẨM QUYỀN TỐI HẬU (✓)</td>
                    <td className="p-3 text-center text-slate-500">Tham vấn ngữ cảnh</td>
                    <td className="p-3 text-center text-slate-500">Quan sát thực tế</td>
                    <td className="p-3 text-center text-slate-500">Suy diễn được kiểm chứng</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 font-bold text-white">Diễn giải phạm vi áp dụng</td>
                    <td className="p-3 text-center text-slate-500">Văn bản ban hành</td>
                    <td className="p-3 text-center font-bold text-blue-300 bg-blue-950/20">CHUYÊN GIA TRỰC TIẾP (✓)</td>
                    <td className="p-3 text-center text-slate-500">Kinh nghiệm truyền miệng</td>
                    <td className="p-3 text-center text-slate-500">Tổng hợp luận điểm</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 font-bold text-white">Thời gian xử lý & Điểm nghẽn</td>
                    <td className="p-3 text-center text-slate-500">Mục tiêu danh nghĩa</td>
                    <td className="p-3 text-center text-slate-500">Quan sát học thuật</td>
                    <td className="p-3 text-center font-bold text-amber-300 bg-amber-950/20">THỰC TẾ SINH VIÊN (✓)</td>
                    <td className="p-3 text-center text-slate-500">Khai phá dữ kiện</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
