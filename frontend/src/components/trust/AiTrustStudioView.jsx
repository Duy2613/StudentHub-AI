"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Search, 
  HelpCircle,
  Activity,
  ArrowRight
} from "lucide-react";

export function AiTrustStudioView({ initialEvaluation = null }) {
  const [query, setQuery] = useState("HCMUTE yêu cầu chuẩn đầu ra tiếng Anh TOEIC bao nhiêu điểm đối với khóa K24?");
  const [rawAnswer, setRawAnswer] = useState("Theo quy định của Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE), sinh viên khóa K24 bắt buộc phải đạt chuẩn đầu ra ngoại ngữ tối thiểu TOEIC 550 điểm và hoàn tất trước ngày 05/09/2026.");
  const [evaluation, setEvaluation] = useState(initialEvaluation);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      // Mock official source context if running directly
      const mockSources = [
        {
          sourceId: "SRC_HCMUTE_REG_2024",
          sourceType: "OFFICIAL",
          authorityTier: 100,
          url: "https://daotao.hcmute.edu.vn/quy-che-chuan-dau-ra-k24",
          publisher: "Phòng Đào Tạo HCMUTE",
          domainScope: "ACADEMIC_REGULATION",
          publishedAt: "2024-09-01T00:00:00.000Z",
          version: "2.0"
        }
      ];

      const mockSpans = [
        {
          evidenceId: "EVID_K24_TOEIC",
          sourceId: "SRC_HCMUTE_REG_2024",
          documentId: "DOC_REG_2024_01",
          passage: "Căn cứ Quyết định 123/QĐ-ĐHSPKT, sinh viên đại học chính quy khóa K24 phải nộp chứng chỉ tiếng Anh đạt chuẩn tối thiểu TOEIC 550 điểm để đủ điều kiện xét tốt nghiệp.",
          section: "Điều 4. Chuẩn đầu ra Ngoại ngữ"
        }
      ];

      const res = await fetch("/api/ai/trust/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          rawAnswer,
          sources: mockSources,
          evidenceSpans: mockSpans,
          stakeLevel: "HIGH"
        })
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
        if (data.evaluation.claims?.length > 0) {
          setSelectedClaim(data.evaluation.claims[0]);
        }
      }
    } catch (e) {
      console.error("AI Trust Evaluation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AUTHORITATIVE":
      case "VERIFIED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case "SUPPORTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"><ShieldCheck className="w-3.5 h-3.5" /> SUPPORTED</span>;
      case "PARTIALLY_SUPPORTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500/40 text-amber-300"><AlertTriangle className="w-3.5 h-3.5" /> PARTIALLY SUPPORTED</span>;
      case "CONFLICTED":
      case "CONTRADICTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 border border-rose-500/40 text-rose-300"><ShieldAlert className="w-3.5 h-3.5" /> {status}</span>;
      case "OUTDATED":
      case "RETRACTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-950/80 border border-orange-500/40 text-orange-300"><Clock className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-400"><HelpCircle className="w-3.5 h-3.5" /> UNVERIFIED</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> STUDENTHUB INTELLIGENCE OS • PHASE T1
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              AI Trust Engine <span className="text-indigo-400 font-mono text-xl">V1</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Hệ thống kiểm chứng độ tin cậy độc lập, phân tách luận điểm cấp nguyên tử (Claim-Level Grounding),
              đối soát minh chứng trích dẫn và bảo vệ tính xác thực trước ảo giác AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
              <div className="text-xs text-slate-400 font-mono">BẤT BIẾN CỐT LÕI</div>
              <div className="text-sm font-bold text-amber-400">CONFIDENCE ≠ AUTHORITY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Sandbox */}
      <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" /> Bảng Thử Nghiệm Đối Soát Luận Điểm AI
          </h2>
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            {loading ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Kiểm Chứng Luận Điểm
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">CÂU HỎI SINH VIÊN (QUERY)</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">CÂU TRẢ LỜI CỦA AI CẦN ĐỐI SOÁT (RAW ANSWER)</label>
            <textarea
              value={rawAnswer}
              onChange={(e) => setRawAnswer(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Evaluation Results */}
      {evaluation && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">TRẠNG THÁI</div>
              <div className="mt-1">{getStatusBadge(evaluation.trustStatus)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">ĐỘ PHỦ MINH CHỨNG</div>
              <div className="mt-1 text-lg font-bold text-white">
                {Math.round((evaluation.metrics?.claimCoverage || 0) * 100)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">ĐỘ CHÍNH XÁC TRÍCH DẪN</div>
              <div className="mt-1 text-lg font-bold text-emerald-400">
                {Math.round((evaluation.metrics?.citationAccuracy || 0) * 100)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">CẤP ĐỘ THẨM QUYỀN</div>
              <div className="mt-1 text-lg font-bold text-indigo-400 font-mono">
                {evaluation.metrics?.authorityScore >= 100 ? "TIER 1 (OFFICIAL)" : `TIER ${evaluation.metrics?.authorityScore}`}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">TÍNH ĐỘC LẬP NGUỒN</div>
              <div className="mt-1 text-lg font-bold text-cyan-400">
                {Math.round((evaluation.metrics?.sourceIndependenceScore || 0) * 100)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-xs text-slate-400 font-mono">RỦI RO INJECTION</div>
              <div className="mt-1 text-lg font-bold text-slate-300">
                {evaluation.metrics?.manipulationRisk === 0 ? "0.0% (AN TOÀN)" : `${Math.round(evaluation.metrics?.manipulationRisk * 100)}%`}
              </div>
            </div>
          </div>

          {/* Explanation Alert */}
          {evaluation.explanation && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-sm flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Giải trình kiểm toán AI Trust: </span>
                {evaluation.explanation}
              </div>
            </div>
          )}

          {/* Two-Column Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Atomic Claim List */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Danh Sách Luận Điểm Độc Lập ({evaluation.claims?.length || 0})
              </h3>
              <div className="space-y-3">
                {evaluation.claims?.map((claim, idx) => (
                  <div
                    key={claim.claimId || idx}
                    onClick={() => setSelectedClaim(claim)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedClaim?.claimId === claim.claimId
                        ? "bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono text-slate-400">LUẬN ĐIỂM #{idx + 1} ({claim.claimType})</span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm text-slate-200">{claim.text}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span>Đối tượng: <b className="text-indigo-300">{claim.scope}</b></span>
                      {claim.numericValue !== null && (
                        <span>Số liệu: <b className="text-emerald-400">{claim.numericValue} {claim.numericUnit}</b></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Claim Detail & Evidence Span Highlight */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Bằng Chứng & Minh Chứng Trích Dẫn
              </h3>

              {selectedClaim ? (
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-4">
                  <div>
                    <div className="text-xs font-mono text-slate-400 mb-1">NỘI DUNG ĐANG XEM XÉT</div>
                    <p className="text-sm font-medium text-white bg-slate-900 p-3 rounded-lg border border-slate-800">
                      {selectedClaim.text}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-mono text-slate-400">ĐOẠN TRÍCH DẪN GỐC (EVIDENCE SPANS)</div>
                    {evaluation.evidenceSpans?.length > 0 ? (
                      evaluation.evidenceSpans.map((span, idx) => (
                        <div key={span.evidenceId || idx} className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                          <div className="flex items-center justify-between text-emerald-400 font-mono">
                            <span>{span.section || "Minh chứng quy chế"}</span>
                            <span>Mã: {span.documentId}</span>
                          </div>
                          <p className="text-slate-300 italic">"{span.passage}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-500 text-center">
                        Không có đoạn trích dẫn nào được liên kết.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-8 text-center text-xs text-slate-500">
                  Chọn một luận điểm ở danh sách bên trái để đối soát minh chứng.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
