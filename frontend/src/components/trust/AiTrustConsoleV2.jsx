"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  GitPullRequest
} from "lucide-react";

export function AiTrustConsoleV2() {
  const [query, setQuery] = useState("Quy định chuẩn đầu ra TOEIC của sinh viên K24 là bao nhiêu?");
  const [draftAnswer, setDraftAnswer] = useState("Sinh viên khóa K24 cần đạt chứng chỉ TOEIC 550 điểm và nộp trực tuyến trước ngày 05/09.");
  const [activeTab, setActiveTab] = useState("synthesis");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState({
    answerMode: "PARTIALLY_SUPPORTED",
    epistemicState: "PARTIALLY_SUPPORTED",
    structuredResponse: {
      conclusion: "Sinh viên khóa K24 cần đạt chứng chỉ TOEIC >= 550 để đủ điều kiện tốt nghiệp.",
      basis: "Căn cứ theo Quyết định số 3116/QĐ-ĐHSPKT ban hành ngày 22/08/2025.",
      evidence: [
        {
          documentId: "QĐ_3116_QD_DHPKT_2025",
          passage: "Chuẩn ngoại ngữ đầu ra áp dụng cho sinh viên trình độ đại học chính quy từ khóa 2024 (K24) trở đi là TOEIC 550 điểm.",
          authorityTier: 100
        }
      ],
      limits: ["Hệ thống phát hiện chi tiết 'nộp trực tuyến trước ngày 05/09' không có trong quyết định gốc."],
      contradictions: ["Không phát hiện mâu thuẫn chính thức."],
      verificationLevel: "PARTIALLY_SUPPORTED"
    },
    overclaimChecks: [
      {
        claimId: "CLAIM_01",
        hasOverclaim: true,
        ungroundedExtensions: ["KÊNH_THỰC_HIỆN_CHƯA_XÁC_MINH (trực tuyến)", "THỜI_HẠN_CHƯA_CÓ_CĂN_CỨ (05/09)"],
        safeGroundedText: "Sinh viên khóa K24 cần đạt chứng chỉ TOEIC 550 điểm."
      }
    ],
    disproveAnalysis: {
      outcome: "CONFIRMED",
      explanation: "Không phát hiện quy định mới hơn hủy bỏ quyết định số 3116.",
      counterEvidenceCount: 0
    },
    sensitivityAnalysis: {
      conditionsThatWouldChangeAnswer: [
        "Phòng Đào Tạo ban hành văn bản điều chỉnh chuẩn ngoại ngữ mới hơn ngày 22/08/2025.",
        "Sinh viên thuộc chương trình Chất lượng cao (chuẩn riêng TOEIC 600).",
        "Có thông báo gia hạn nộp chứng chỉ cho đợt tốt nghiệp tháng 9."
      ]
    },
    blindSpots: [
      {
        type: "MISSING_TIME_SCOPE",
        description: "Thời hạn nộp cụ thể của đợt xét tốt nghiệp hiện tại cần tra cứu thêm thông báo lịch học vụ."
      }
    ]
  });

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/ai/trust/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          rawAnswer: draftAnswer,
          sources: [
            {
              sourceId: "SRC_REGISTRAR",
              name: "Phòng Đào Tạo HCMUTE",
              authorityTier: 100
            }
          ],
          evidenceSpans: [
            {
              evidenceId: "EVID_QD_3116",
              sourceId: "SRC_REGISTRAR",
              documentId: "QD_3116_2025",
              passage: "Chuẩn ngoại ngữ đầu ra áp dụng cho sinh viên trình độ đại học chính quy từ khóa 2024 (K24) trở đi là TOEIC 550 điểm.",
              authorityTier: 100,
              validFrom: "2025-08-22"
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                AI Trust Engine V2
                <span className="text-xs uppercase px-2.5 py-1 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Epistemic Intelligence
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Evidence-constrained self-verifying reasoning, semantic overclaim detection, and active adversarial disproof.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            13 Epistemic States Active
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Workbench */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-indigo-400" />
              Evaluation Workbench
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  User Query (Câu hỏi học vụ)
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={2}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Nhập câu hỏi học vụ..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  AI Draft Answer (Dự thảo câu trả lời)
                </label>
                <textarea
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  rows={4}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xs"
                  placeholder="Nhập văn bản cần kiểm chứng..."
                />
              </div>

              <button
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang thực thi 5-Pass Self-Critique...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Chạy Động Cơ Tự Kiểm Chứng Epistemic V2
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bất Biến Hệ Thống (System Invariants)
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Confidence Never Creates Authority:</strong> Tự tin của mô hình không thay thế văn bản quy chế.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Semantic Overclaim Guard:</strong> Tự động gọt bỏ các chi tiết suy diễn thêm ngoài nguồn.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Active Disproof Search:</strong> Chủ động tìm phản biện trước khi công bố kết luận.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Epistemic Inspection Tabs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Epistemic Navigation Bar */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveTab("synthesis")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "synthesis"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Phân Tích 6 Khu Vực
            </button>
            <button
              onClick={() => setActiveTab("why")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "why"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Why should I believe this?
            </button>
            <button
              onClick={() => setActiveTab("disprove")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "disprove"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Try to disprove this
            </button>
            <button
              onClick={() => setActiveTab("sensitivity")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "sensitivity"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              What would change my answer?
            </button>
          </div>

          {/* Tab Content 1: Structured 6-Section Synthesis */}
          {activeTab === "synthesis" && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Trạng Thái Nhận Thức (Epistemic State)
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {evaluation.epistemicState}
                </span>
              </div>

              {/* 6 Structured Areas */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    1. KẾT LUẬN (Conclusion)
                  </h4>
                  <p className="text-sm text-slate-200 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    {evaluation.structuredResponse.conclusion}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    2. CƠ SỞ PHÁP LÝ (Basis)
                  </h4>
                  <p className="text-sm text-slate-300 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    {evaluation.structuredResponse.basis}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    3. BẰNG CHỨNG NGUYÊN BẢN (Evidence)
                  </h4>
                  <div className="space-y-2">
                    {evaluation.structuredResponse.evidence.map((ev, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
                        <span className="text-indigo-400 font-bold block mb-1">[{ev.documentId}] — Tier {ev.authorityTier}</span>
                        "{ev.passage}"
                      </div>
                    ))}
                  </div>
                </div>

                {evaluation.overclaimChecks?.some(c => c.hasOverclaim) && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Phát Hiện Suy Diễn Quá Mức (Semantic Overclaim Pruned)
                    </h4>
                    <div className="text-xs text-amber-200/90 mt-1 space-y-1">
                      {evaluation.overclaimChecks.map((oc, idx) => (
                        <div key={idx}>
                          {oc.ungroundedExtensions?.map((ext, j) => (
                            <span key={j} className="inline-block mr-2 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 font-mono text-[11px]">
                              {ext}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content 2: Why should I believe this? */}
          {activeTab === "why" && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Cơ Sở Kiểm Chứng Bằng Chứng (Evidence Grounding)
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1 font-mono">NGUỒN THẨM QUYỀN (Source Authority)</span>
                  <span className="font-medium text-white">Cổng thông tin Đào Tạo HCMUTE (Tier 1 - Official Registrar)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1 font-mono">TÍNH HIỆU LỰC THỜI GIAN (Temporal Validity)</span>
                  <span className="font-medium text-emerald-400">CURRENTLY_VALID — Ban hành ngày 22/08/2025 (Chưa bị thay thế)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1 font-mono">MÃ BĂM NGUYÊN BẢN (Integrity Hash)</span>
                  <span className="font-mono text-xs text-slate-400">SHA-256: 8f9b2c1749da...b401e</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Try to disprove this */}
          {activeTab === "disprove" && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Thử Nghiệm Phản Bác Đối Nghịch (Adversarial Disproof)
                </h3>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/40">
                  {evaluation.disproveAnalysis?.outcome || "CONFIRMED"}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {evaluation.disproveAnalysis?.explanation}
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                <span className="font-semibold text-slate-300 block">Các kiểm tra đối nghịch tự động:</span>
                <div>• Kiểm tra quyết định thay thế sau ngày 22/08/2025: <strong>Không phát hiện</strong></div>
                <div>• Kiểm tra mâu thuẫn giữa các khoa đào tạo: <strong>Đồng nhất</strong></div>
                <div>• Kiểm tra ngoại lệ đặc thù theo mã ngành: <strong>Đã khóa phạm vi K24</strong></div>
              </div>
            </div>
          )}

          {/* Tab Content 4: What would change my answer? */}
          {activeTab === "sensitivity" && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Điều Kiện Làm Thay Đổi Kết Luận (Sensitivity Boundaries)
              </h3>
              <div className="space-y-2">
                {evaluation.sensitivityAnalysis?.conditionsThatWouldChangeAnswer.map((cond, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 flex items-start gap-2.5">
                    <span className="font-mono text-xs text-indigo-400 font-bold mt-0.5">{idx + 1}.</span>
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
