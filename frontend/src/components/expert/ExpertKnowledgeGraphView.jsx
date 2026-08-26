"use client";

import React, { useState } from "react";
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Layers, 
  Activity, 
  Search, 
  Building2,
  FileCheck2,
  Sparkles,
  AlertTriangle,
  Fingerprint,
  Clock,
  History,
  Link2,
  ExternalLink,
  ShieldX
} from "lucide-react";

export function ExpertKnowledgeGraphView({ initialExperts = [] }) {
  const [experts, setExperts] = useState(initialExperts);
  const [selectedExpert, setSelectedExpert] = useState(initialExperts[0] || null);
  const [searchName, setSearchName] = useState("");
  const [searchOrcid, setSearchOrcid] = useState("");
  const [resolveResult, setResolveResult] = useState(null);

  // Claim Sandbox
  const [claimText, setClaimText] = useState("Mô hình Transformer nén hoạt động tối ưu trên thiết bị nhúng.");
  const [claimDomain, setClaimDomain] = useState("AI_ML");
  const [claimJurisdiction, setClaimJurisdiction] = useState("TECHNICAL_DOMAIN");
  const [claimEvaluation, setClaimEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const handleResolveEntity = async () => {
    try {
      const res = await fetch("/api/intelligence/experts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: searchName || undefined,
          orcid: searchOrcid || undefined
        })
      });
      const data = await res.json();
      if (data.success && data.resolution) {
        setResolveResult(data.resolution);
        if (data.resolution.expert) {
          setSelectedExpert(data.resolution.expert);
        }
      }
    } catch (err) {
      console.error("Resolve error:", err);
    }
  };

  const handleEvaluateClaim = async () => {
    if (!selectedExpert) return;
    setEvaluating(true);
    try {
      const res = await fetch(`/api/intelligence/experts/${selectedExpert.expertId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: claimText,
          domain: claimDomain,
          claimJurisdiction: claimJurisdiction
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setClaimEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "QUALIFIED_EXPERT_OPINION":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> ĐÚNG CHUYÊN MÔN CHUYÊN SÂU</span>;
      case "INTERPRETATION_ONLY":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"><BookOpen className="w-3.5 h-3.5" /> Ý KIẾN DIỄN GIẢI BỔ TRỢ</span>;
      case "AUTHORITY_MISMATCH":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500/40 text-amber-300"><AlertTriangle className="w-3.5 h-3.5" /> LỆCH THẨM QUYỀN HÀNH CHÍNH</span>;
      case "CONFLICT_OF_INTEREST":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 border border-rose-500/40 text-rose-300"><ShieldAlert className="w-3.5 h-3.5" /> XUNG ĐỘT LỢI ÍCH</span>;
      case "RETRACTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/90 border border-rose-600 text-rose-300"><ShieldX className="w-3.5 h-3.5" /> ĐÃ THU HỒI / RÚT BÀI</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-400">NGOÀI PHẠM VI XÁC LẬP</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/70 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> STUDENTHUB INTELLIGENCE OS • PHASE T2
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Expert Knowledge Graph <span className="text-emerald-400 font-mono text-xl">V1</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Hệ thống định danh đa tín hiệu (ORCID, công trình, email cơ quan), đồ thị phạm vi năng lực (Scope Graph)
              và phân định tuyệt đối giữa năng lực chuyên môn học thuật với thẩm quyền quy chế đào tạo.
            </p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
            <div className="text-xs text-slate-400 font-mono">BẤT BIẾN CỐT LÕI</div>
            <div className="text-sm font-bold text-emerald-400">EXPERTISE ≠ AUTHORITY</div>
          </div>
        </div>
      </div>

      {/* Multi-Signal Entity Search & Disambiguation Bar */}
      <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Fingerprint className="w-4 h-4 text-emerald-400" /> TÌM KIẾM & PHÂN GIẢI THỰC THỂ CHUYÊN GIA (MULTI-SIGNAL RESOLUTION)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Tên chuyên gia (Ví dụ: Nguyễn Văn Minh)..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="ORCID (Ví dụ: 0000-0002-1825-0097)..."
              value={searchOrcid}
              onChange={(e) => setSearchOrcid(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={handleResolveEntity}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Phân Giải
            </button>
          </div>
        </div>

        {resolveResult && (
          <div className={`p-3 rounded-lg border text-xs ${
            resolveResult.status === "EXACT_MATCH"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : resolveResult.status === "IDENTITY_AMBIGUOUS"
              ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
              : "bg-slate-900 border-slate-800 text-slate-400"
          }`}>
            <span className="font-bold font-mono">[{resolveResult.status}]:</span> {resolveResult.explanation}
          </div>
        )}
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Experts Registry */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" /> Danh Sách Chuyên Gia Đã Xác Thực ({experts.length})
          </h2>

          <div className="space-y-3">
            {experts.map((exp) => (
              <div
                key={exp.expertId}
                onClick={() => setSelectedExpert(exp)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  selectedExpert?.expertId === exp.expertId
                    ? "bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/10"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {exp.name}
                      {exp.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" title="Đã xác thực ORCID & Cơ quan" />
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{exp.title} • {exp.department}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                      <Building2 className="w-3 h-3" /> {exp.institution}
                      {exp.orcid && <span className="text-emerald-400 ml-2">ID: {exp.orcid}</span>}
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-mono font-bold text-emerald-400">
                    {exp.reputationScore} PTS
                  </div>
                </div>

                {/* Scope Badges */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {exp.scopes?.map((sc, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        sc.level === "STRONG"
                          ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                          : sc.level === "MODERATE"
                          ? "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}
                    >
                      {sc.domain}: {sc.level}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Expert Detailed Scope, Credentials & Claim Sandbox */}
        <div className="lg:col-span-7 space-y-6">
          {selectedExpert ? (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400">HỒ SƠ NĂNG LỰC & ĐỒ THỊ CHUYÊN GIA</span>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedExpert.name}</h2>
                </div>
                {selectedExpert.hasRegistrarAuthority ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center gap-1.5">
                    🏛️ THẨM QUYỀN PHÒNG ĐÀO TẠO
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                    🎓 CHUYÊN MÔN HỌC THUẬT
                  </span>
                )}
              </div>

              {/* Credentials & Publications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> BẰNG CẤP & HỌC VỊ
                  </div>
                  {selectedExpert.credentials?.map((c, i) => (
                    <div key={i} className="text-xs text-slate-200">
                      <span className="font-semibold text-white">{c.type}:</span> {c.field} ({c.issuer}, {c.issuedYear})
                      <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" /> CÔNG TRÌNH KHOA HỌC
                  </div>
                  {selectedExpert.publications?.map((p, i) => (
                    <div key={i} className="text-xs text-slate-200 truncate">
                      <span className="font-semibold text-white">[{p.year}]</span> {p.title} ({p.venue})
                    </div>
                  ))}
                </div>
              </div>

              {/* Claim Evaluation Sandbox */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" /> Thẩm Định Ý Kiến & Thẩm Quyền Chuyên Gia
                </h3>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">NỘI DUNG Ý KIẾN / PHÁT NGÔN</label>
                  <textarea
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">LĨNH VỰC KHẲNG ĐỊNH</label>
                    <select
                      value={claimDomain}
                      onChange={(e) => setClaimDomain(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="AI_ML">AI_ML (Trí Tuệ Nhân Tạo & Máy Học)</option>
                      <option value="COMPUTER_VISION">COMPUTER_VISION (Thị Giác Máy Tính)</option>
                      <option value="EDTECH">EDTECH (Công Nghệ Giáo Dục)</option>
                      <option value="ACADEMIC_REGULATION">ACADEMIC_REGULATION (Quy Chế Đào Tạo)</option>
                      <option value="TUITION_POLICY">TUITION_POLICY (Quy Chế Học Phí)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">LOẠI THẨM QUYỀN</label>
                    <select
                      value={claimJurisdiction}
                      onChange={(e) => setClaimJurisdiction(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="TECHNICAL_DOMAIN">TECHNICAL_DOMAIN (Chuyên Môn Kỹ Thuật)</option>
                      <option value="PEDAGOGICAL">PEDAGOGICAL (Sư Phạm & Phương Pháp)</option>
                      <option value="INSTITUTIONAL_ADMIN">INSTITUTIONAL_ADMIN (Quy Chế Hành Chính)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleEvaluateClaim}
                  disabled={evaluating}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {evaluating ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Kiểm Tra Thẩm Quyền & Phạm Vi Chuyên Môn
                </button>
              </div>

              {/* Evaluation Result */}
              {claimEvaluation && (
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">KẾT QUẢ THẨM ĐỊNH NĂNG LỰC</span>
                    {getStatusBadge(claimEvaluation.claimStatus)}
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {claimEvaluation.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-12 text-center text-xs text-slate-500">
              Chọn chuyên gia để khám phá đồ thị năng lực.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
