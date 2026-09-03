"use client";

import React, { useState, useEffect } from "react";
import { Award, BookOpen, CheckCircle2, ShieldCheck, ShieldAlert, Search, Building2, Sparkles, AlertTriangle, Fingerprint, Link2, ShieldX, Scale, Compass, Users, HelpCircle, RefreshCw } from "lucide-react";

export function ExpertIntelligenceStudioV2({ initialExperts = [] }) {
  const [experts, setExperts] = useState(initialExperts);
  const [selectedExpert, setSelectedExpert] = useState(initialExperts[0] || null);
  const [searchName, setSearchName] = useState("");
  const [searchOrcid, setSearchOrcid] = useState("");
  const [resolveResult, setResolveResult] = useState(null);
  const [activeTab, setActiveTab] = useState("sandbox"); // "sandbox" | "disagreements" | "track_record"

  // Modal / Drawer states
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showBoundariesModal, setShowBoundariesModal] = useState(false);
  const [whyReport, setWhyReport] = useState(null);
  const [boundariesReport, setBoundariesReport] = useState(null);

  // Disagreements state
  const [disagreements, setDisagreements] = useState([]);
  const [loadingDisagreements, setLoadingDisagreements] = useState(false);

  // Claim Sandbox
  const [claimText, setClaimText] = useState("Mô hình Transformer nén hoạt động tối ưu trên thiết bị nhúng.");
  const [claimDomain, setClaimDomain] = useState("AI_ML");
  const [claimJurisdiction, setClaimJurisdiction] = useState("TECHNICAL_DOMAIN");
  const [claimEvaluation, setClaimEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetchDisagreements();
  }, []);

  const fetchDisagreements = async () => {
    setLoadingDisagreements(true);
    try {
      const res = await fetch("/api/intelligence/experts/disagreements?domain=AI_ML");
      const data = await res.json();
      if (data.success && Array.isArray(data.disagreements)) {
        setDisagreements(data.disagreements);
      }
    } catch (err) {
      console.error("Error fetching disagreements:", err);
    } finally {
      setLoadingDisagreements(false);
    }
  };

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
      const res = await fetch("/api/intelligence/experts/verify-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId: selectedExpert.expertId,
          statement: claimText,
          domain: claimDomain,
          claimJurisdiction: claimJurisdiction
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setClaimEvaluation(data.evaluation);
        setWhyReport(data.whyThisExpert);
        setBoundariesReport(data.scopeBoundaries);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleOpenWhyModal = () => {
    if (!selectedExpert) return;
    // Generate Why This Expert report
    const strongScope = selectedExpert.scopes?.find(s => s.level === "ESTABLISHED") || selectedExpert.scopes?.[0];
    const report = {
      expertId: selectedExpert.expertId,
      name: selectedExpert.name,
      canonicalIdentity: selectedExpert.canonicalIdentity || selectedExpert.name,
      isIdentityVerified: selectedExpert.isVerified,
      identityEvidence: selectedExpert.orcid
        ? `Đã xác thực danh tính qua mã ORCID: ${selectedExpert.orcid} và cổng thông tin ${selectedExpert.institution}.`
        : `Danh tính công vụ đã xác thực tại ${selectedExpert.institution} (${selectedExpert.verifiedEmail || "Email công vụ"}).`,
      currentRole: selectedExpert.roles?.find(r => r.isCurrent)?.roleTitle || selectedExpert.title,
      relevantExpertise: strongScope ? `${strongScope.domain} (${strongScope.level})` : "Chuyên môn tổng quát",
      supportingEvidence: (selectedExpert.publications || []).slice(0, 3).map(p => ({
        title: p.title,
        venue: p.venue,
        year: p.year,
        doi: p.doi
      })),
      authorityScope: selectedExpert.hasRegistrarAuthority
        ? "Có thẩm quyền ban hành/xác nhận quy chế Phòng Đào Tạo trong nhiệm kỳ hiệu lực."
        : "Nghiên cứu khoa học & Phương pháp luận học thuật (KHÔNG có thẩm quyền hành chính Phòng Đào Tạo)."
    };
    setWhyReport(report);
    setShowWhyModal(true);
  };

  const handleOpenBoundariesModal = () => {
    if (!selectedExpert) return;
    const established = [];
    const limited = [];
    (selectedExpert.scopes || []).forEach(s => {
      if (s.level === "ESTABLISHED" || s.level === "SUPPORTED") {
        established.push(`${s.domain} (${s.subdomain || "Chuyên sâu"})`);
      } else {
        limited.push(`${s.domain} (${s.subdomain || "Hạn chế bằng chứng"})`);
      }
    });

    const report = {
      name: selectedExpert.name,
      established,
      limited,
      unestablished: [
        "Quy chế Đào tạo & Điểm rèn luyện HCMUTE (Trừ khi giữ vai trò Phòng Đào Tạo)",
        "Chính sách Học phí & Miễn giảm tài chính",
        "Quy định Pháp lý ngoài lĩnh vực kỹ thuật"
      ],
      whereNotToTrust: [
        "Không tin cậy khi chuyên gia phát biểu về quy chế học vụ nếu không có chức danh Phòng Đào Tạo.",
        "Không dùng uy tín ngành A để khẳng định chân lý trong ngành B.",
        "Cảnh giác với các sản phẩm công nghệ thương mại mà chuyên gia có nhận tài trợ."
      ]
    };
    setBoundariesReport(report);
    setShowBoundariesModal(true);
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>PHASE T2 — EXPERT INTELLIGENCE V2</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Verified Expert Knowledge Graph
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Xác thực danh tính đa tín hiệu (ORCID, email công vụ, cổng khoa), phân định rõ 
              <strong className="text-indigo-300"> Chuyên môn học thuật ≠ Thẩm quyền quy chế</strong> và công khai ranh giới phạm vi chuyên môn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleOpenWhyModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 border border-indigo-400/30"
            >
              <HelpCircle className="w-4 h-4" />
              Tại sao là chuyên gia này?
            </button>
            <button
              onClick={handleOpenBoundariesModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Ranh giới phạm vi
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Signal Search & Identity Resolution Bar */}
      <div className="p-4 md:p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Fingerprint className="w-4 h-4 text-cyan-400" />
          <span>Giải Định Danh Đa Tín Hiệu (Multi-Signal Entity Resolver)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tên chuyên gia (vd: TS. Nguyễn Văn Minh)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Mã ORCID (vd: 0000-0002-1825-0097)"
              value={searchOrcid}
              onChange={(e) => setSearchOrcid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={handleResolveEntity}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            Đối Soát & Giải Định Danh
          </button>
        </div>

        {resolveResult && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
            resolveResult.status === "EXACT_MATCH"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : resolveResult.status === "IDENTITY_AMBIGUOUS"
              ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}>
            {resolveResult.status === "EXACT_MATCH" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="font-semibold tracking-wide uppercase">[{resolveResult.status}]</strong> {resolveResult.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Expert List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Danh Sách Chuyên Gia
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              {experts.length} hồ sơ
            </span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {experts.map((expert) => {
              const isSelected = selectedExpert?.expertId === expert.expertId;
              const strongScope = expert.scopes?.find(s => s.level === "ESTABLISHED") || expert.scopes?.[0];

              return (
                <div
                  key={expert.expertId}
                  onClick={() => setSelectedExpert(expert)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {expert.name}
                        {expert.isVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{expert.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {expert.department} — {expert.institution}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {expert.hasRegistrarAuthority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          THẨM QUYỀN ĐÀO TẠO
                        </span>
                      )}
                    </div>
                  </div>

                  {strongScope && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Chuyên môn:</span>
                      <span className="font-semibold text-indigo-300">
                        {strongScope.domain} ({strongScope.level})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle & Right Column: Details & Interactive Tabs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-6 text-xs font-bold tracking-wider uppercase">
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "sandbox"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Scale className="w-4 h-4" />
              Kiểm Tra Thẩm Quyền Ý Kiến
            </button>
            <button
              onClick={() => setActiveTab("disagreements")}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "disagreements"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Compass className="w-4 h-4" />
              Bản Đồ Bất Đồng Học Thuật ({disagreements.length})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "profile"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              Hồ Sơ & Bằng Chứng Khoa Học
            </button>
          </div>

          {/* TAB 1: CLAIM EVALUATION SANDBOX */}
          {activeTab === "sandbox" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    Thử Nghiệm Nhận Định Chuyên Gia Đối Chiếu Thẩm Quyền
                  </h3>
                  <span className="text-xs text-slate-400">
                    Đối tượng: <strong className="text-slate-200">{selectedExpert?.name}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Nội dung nhận định / phát biểu:</label>
                    <textarea
                      rows={3}
                      value={claimText}
                      onChange={(e) => setClaimText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Lĩnh vực chuyên môn:</label>
                      <select
                        value={claimDomain}
                        onChange={(e) => setClaimDomain(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="AI_ML">AI_ML (Trí Tuệ Nhân Tạo & NLP)</option>
                        <option value="COMPUTER_VISION">COMPUTER_VISION (Thị Giác Máy Tính)</option>
                        <option value="ROBOTICS">ROBOTICS (Cơ Điện Tử & Điều Khiển)</option>
                        <option value="EDTECH">EDTECH (Công Nghệ Giáo Dục)</option>
                        <option value="TUITION_POLICY">TUITION_POLICY (Quy Chế Học Phí — Hành Chính)</option>
                        <option value="ACADEMIC_REGULATION">ACADEMIC_REGULATION (Quy Chế Đào Tạo — PĐT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Thẩm quyền đối chiếu:</label>
                      <select
                        value={claimJurisdiction}
                        onChange={(e) => setClaimJurisdiction(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="TECHNICAL_DOMAIN">TECHNICAL_DOMAIN (Chuyên môn kỹ thuật)</option>
                        <option value="RESEARCH_INTERPRETATION">RESEARCH_INTERPRETATION (Diễn giải nghiên cứu)</option>
                        <option value="INSTITUTIONAL_ADMIN">INSTITUTIONAL_ADMIN (Thẩm quyền hành chính PĐT)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleEvaluateClaim}
                    disabled={evaluating || !selectedExpert}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Kiểm Tra & Phân Loại Thẩm Quyền
                  </button>
                </div>
              </div>

              {/* Evaluation Result */}
              {claimEvaluation && (
                <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kết Quả Đánh Giá Thẩm Quyền</span>
                    {getStatusBadge(claimEvaluation.claimStatus)}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs leading-relaxed text-slate-300">
                    {claimEvaluation.explanation}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Đúng chuyên môn:</span>
                      <strong className={claimEvaluation.isWithinExpertise ? "text-emerald-400" : "text-rose-400"}>
                        {claimEvaluation.isWithinExpertise ? "HỢP LỆ (Trong phạm vi)" : "NGOÀI PHẠM VI"}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Thẩm quyền quy chế:</span>
                      <strong className={claimEvaluation.isWithinJurisdiction ? "text-emerald-400" : "text-amber-400"}>
                        {claimEvaluation.isWithinJurisdiction ? "CÓ THẨM QUYỀN" : "KHÔNG CÓ THẨM QUYỀN"}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Xung đột lợi ích:</span>
                      <strong className={claimEvaluation.hasConflictOfInterest ? "text-rose-400" : "text-emerald-400"}>
                        {claimEvaluation.hasConflictOfInterest ? "PHÁT HIỆN TÀI TRỢ" : "ĐỘC LẬP (Không phát hiện)"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISAGREEMENT MAP */}
          {activeTab === "disagreements" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <strong className="text-white">Nguyên tắc bất biến:</strong> Khi hai chuyên gia có nhận định khác nhau, hệ thống
                <span className="text-indigo-300 font-semibold"> KHÔNG chọn người thắng dựa trên danh tiếng</span> mà công khai dẫn chứng và giải thích nguồn gốc bất đồng (dữ liệu, mẫu khảo sát, phương pháp).
              </div>

              {disagreements.map((dis, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-400" />
                      {dis.topic}
                    </h3>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      NGUYÊN NHÂN: {dis.divergenceReason}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expert A */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-indigo-300">{dis.expertA?.name}</strong>
                        <span className="text-[10px] text-slate-500">{dis.expertA?.institution}</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{dis.claimA?.statement}"</p>
                      {dis.evidenceA?.[0] && (
                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                          Bằng chứng: {dis.evidenceA[0]}
                        </div>
                      )}
                    </div>

                    {/* Expert B */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-emerald-300">{dis.expertB?.name}</strong>
                        <span className="text-[10px] text-slate-500">{dis.expertB?.institution}</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{dis.claimB?.statement}"</p>
                      {dis.evidenceB?.[0] && (
                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                          Bằng chứng: {dis.evidenceB[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                    <strong>Phân tích hệ thống:</strong> {dis.analysis}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FULL PROFILE & EVIDENCE */}
          {activeTab === "profile" && selectedExpert && (
            <div className="space-y-6">
              {/* Credentials & Roles */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Văn Bằng, Chứng Chỉ & Chức Danh Theo Thời Gian (Temporal Graph)
                </h3>

                <div className="space-y-3">
                  {(selectedExpert.credentials || []).map((cred) => (
                    <div key={cred.credentialId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-200 block">{cred.title}</strong>
                        <span className="text-slate-400">{cred.issuingInstitution} — Năm cấp: {cred.issuedYear}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                        {cred.status}
                      </span>
                    </div>
                  ))}

                  {(selectedExpert.roles || []).map((role) => (
                    <div key={role.roleId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-200 block">{role.roleTitle}</strong>
                        <span className="text-slate-400">{role.organization} ({role.validFrom} ➔ {role.validUntil || "Hiện tại"})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        role.isCurrent
                          ? "bg-emerald-950 border border-emerald-500/30 text-emerald-300"
                          : "bg-slate-900 border border-slate-700 text-slate-400"
                      }`}>
                        {role.isCurrent ? "ĐANG ĐẢM NHIỆM" : "ĐÃ HẾT NHIỆM KỲ"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publications & Provenance Clusters */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Công Trình Nghiên Cứu & Cụm Bằng Chứng Độc Lập
                </h3>

                <div className="space-y-3">
                  {(selectedExpert.publications || []).map((pub) => (
                    <div key={pub.pubId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-200">{pub.title}</strong>
                        <span className="text-slate-400">{pub.year}</span>
                      </div>
                      <p className="text-slate-400">{pub.venue}</p>
                      {pub.doi && (
                        <div className="text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                          <Link2 className="w-3 h-3" /> DOI: {pub.doi}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: WHY THIS EXPERT? */}
      {showWhyModal && whyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Tại Sao Là Chuyên Gia Này? (Why This Expert)
              </h3>
              <button onClick={() => setShowWhyModal(false)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-0.5">Xác thực danh tính:</span>
                <p className="text-slate-200">{whyReport.identityEvidence}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-0.5">Chức danh công vụ hiện hành:</span>
                <p className="text-slate-200">{whyReport.currentRole}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-0.5">Chuyên môn được kiểm chứng:</span>
                <p className="text-indigo-300 font-semibold">{whyReport.relevantExpertise}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-0.5">Phạm vi thẩm quyền:</span>
                <p className="text-slate-300">{whyReport.authorityScope}</p>
              </div>
            </div>

            <button
              onClick={() => setShowWhyModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: WHERE NOT TO TRUST? */}
      {showBoundariesModal && boundariesReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                Ranh Giới Phạm Vi & Nơi Không Nên Tin Cậy
              </h3>
              <button onClick={() => setShowBoundariesModal(false)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <strong className="text-emerald-400 block mb-1">✓ Lĩnh vực đã xác lập (ESTABLISHED):</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {boundariesReport.established.map((e, idx) => <li key={idx}>{e}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                <strong className="text-rose-400 block mb-1">✗ Lĩnh vực ngoài thẩm quyền (UNESTABLISHED):</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {boundariesReport.unestablished.map((u, idx) => <li key={idx}>{u}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-amber-300 block mb-1">Lưu ý bảo vệ nhận thức:</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                  {boundariesReport.whereNotToTrust.map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowBoundariesModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all shadow-lg"
            >
              Đóng Ranh Giới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
