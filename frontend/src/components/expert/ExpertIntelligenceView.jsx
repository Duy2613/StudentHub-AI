"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Award, BookOpenCheck, Building2, CheckCircle2, LoaderCircle, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";

function scopeTone(level) {
  return level === "STRONG" ? "is-strong" : level === "MODERATE" ? "is-moderate" : "";
}

export function ExpertIntelligenceView({ initialExperts = [] }) {
  const [selected, setSelected] = useState(initialExperts[0] || null);
  const [claimText, setClaimText] = useState("");
  const [domain, setDomain] = useState(initialExperts[0]?.scopes?.[0]?.domain || "AI_ML");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeAssessment = useRef(null);

  useEffect(() => () => activeAssessment.current?.abort("component-unmounted"), []);

  const inspect = async () => {
    if (!selected || !claimText.trim()) return;
    activeAssessment.current?.abort("superseded-by-new-assessment");
    const controller = new AbortController();
    activeAssessment.current = controller;
    setLoading(true); setError(""); setEvaluation(null);
    try {
      const { evaluateExpertClaim } = await import("@/lib/api/experts");
      if (controller.signal.aborted) return;
      const result = await evaluateExpertClaim({ expertId: selected.expertId, claim: { text: claimText, domain, claimJurisdiction: "TECHNICAL_DOMAIN" } }, controller.signal);
      setEvaluation(result.evaluation || null);
      if (!result.evaluation) setError("API chưa trả về hồ sơ thẩm định.");
    } catch (caught) { if (!(caught instanceof ApiError && caught.code === "ABORTED")) setError(caught instanceof ApiError ? apiErrorMessage(caught) : "Không thể thẩm định lúc này."); }
    finally { setLoading(false); }
  };

  return <div className="product-workspace">
    <header className="product-hero"><div><p className="product-kicker">Expert trust network</p><h1>Đúng người, đúng phạm vi, đúng bằng chứng.</h1><p>StudentHub không xếp hạng chuyên gia bằng một điểm uy tín chung. Mỗi hồ sơ được đọc theo lĩnh vực, bằng cấp, mẫu đóng góp và giới hạn thẩm quyền.</p></div><div className="hero-seal"><UserRoundCheck size={20} /><span>EXPERTS</span><strong>{initialExperts.length} hồ sơ khả dụng</strong></div></header>
    <section className="expert-layout">
      <div><div className="section-heading"><div><p className="product-kicker">Discovery</p><h2 className="product-section-title">Chọn theo lĩnh vực chuyên môn</h2></div><span className="signal-badge">Identity checked</span></div><div className="expert-directory">{initialExperts.map((expert) => <button key={expert.expertId} onClick={() => { setSelected(expert); setDomain(expert.scopes?.[0]?.domain || "AI_ML"); setEvaluation(null); }} className={`expert-card ${selected?.expertId === expert.expertId ? "is-selected" : ""}`}><div className="expert-avatar">{String(expert.name || "CG").split(" ").slice(-2).map((part) => part[0]).join("")}</div><div className="min-w-0"><h3>{expert.name}{expert.isVerified && <ShieldCheck size={15} />}</h3><p>{expert.title} · {expert.department}</p><span><Building2 size={12} /> {expert.institution}</span></div><ArrowRight size={15} /></button>)}</div></div>
      <div>{selected ? <div className="intelligence-panel expert-dossier"><div className="panel-heading"><div><p className="product-kicker">Domain reliability dossier</p><h2 className="product-section-title">{selected.name}</h2></div>{selected.isVerified && <span className="signal-badge"><CheckCircle2 size={12} /> Danh tính đã xác thực</span>}</div><div className="dossier-context"><span><Building2 size={14} /> {selected.institution}</span><span><Award size={14} /> {selected.credentials?.length || 0} chứng chỉ/bằng cấp</span><span><BookOpenCheck size={14} /> {selected.publications?.length || 0} công trình</span></div>
        <div className="scope-list"><p className="data-label">Phạm vi năng lực</p>{selected.scopes?.length ? selected.scopes.map((scope) => <div key={scope.domain} className="scope-row"><div><strong>{scope.domain.replaceAll("_", " ")}</strong><small>{scope.level}</small></div><span className={`scope-meter ${scopeTone(scope.level)}`}><i /></span></div>) : <div className="empty-state">Hồ sơ chưa công bố dữ liệu theo lĩnh vực.</div>}</div>
        <div className="boundary-callout"><AlertTriangle size={17} /><div><strong>Expertise không đồng nghĩa với authority</strong><p>{selected.hasRegistrarAuthority ? "Hồ sơ có cờ thẩm quyền hành chính trong dữ liệu hiện tại." : "Hồ sơ này không được trình bày như nguồn ban hành quy chế."}</p></div></div>
        <div className="claim-review"><p className="product-kicker">Independent assessment</p><h3>Kiểm tra một phát ngôn theo phạm vi</h3><label><span>Nội dung cần thẩm định</span><textarea rows={3} value={claimText} onChange={(event) => setClaimText(event.target.value)} placeholder="Nhập phát ngôn cần kiểm tra..." /></label><label><span>Lĩnh vực</span><select value={domain} onChange={(event) => setDomain(event.target.value)}>{(selected.scopes || []).map((scope) => <option key={scope.domain} value={scope.domain}>{scope.domain.replaceAll("_", " ")}</option>)}{!selected.scopes?.length && <option value="AI_ML">AI ML</option>}</select></label><button className="primary-action" disabled={loading || !claimText.trim()} onClick={inspect}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Thẩm định phạm vi</button>{error && <div className="error-callout" role="alert">{error}</div>}{evaluation && <div className="assessment-result"><span className="signal-badge">{String(evaluation.claimStatus || "RESULT").replaceAll("_", " ")}</span><p>{evaluation.explanation || "API đã trả về kết quả nhưng không có diễn giải."}</p></div>}</div>
      </div> : <div className="intelligence-panel empty-state">Chưa có hồ sơ chuyên gia khả dụng.</div>}</div>
    </section>
    <section className="network-bridge intelligence-panel"><p className="product-kicker">Connected by TrustGraph</p><h3>Đưa thẩm định vào case đang phân tích</h3><p>Ý kiến chuyên gia chỉ là một lớp bằng chứng, luôn được đặt cạnh nguồn và cộng đồng.</p><Link href="/trust" className="text-link">Quay lại Trust Engine <ArrowRight size={14} /></Link></section>
  </div>;
}
