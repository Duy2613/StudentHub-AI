"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Award, BookOpenCheck, Building2, CheckCircle2, LoaderCircle, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";
import StateBoundary from "@/components/ui/StateBoundary";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import { createErrorState, createWorkIdentity } from "@/lib/ui-state/model";
import { getRuntimeProviderBundle, RUNTIME_PROVIDER_MODE } from "@/lib/backend/runtimeProvider";

function scopeTone(level) {
  return level === "STRONG" ? "is-strong" : level === "MODERATE" ? "is-moderate" : "";
}

export function ExpertIntelligenceView() {
  const [experts, setExperts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [claimText, setClaimText] = useState("");
  const [domain, setDomain] = useState("AI_ML");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listResult, setListResult] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [directoryReloadKey, setDirectoryReloadKey] = useState(0);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const requestSequence = useRef(0);
  const activeAssessment = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    const identity = createWorkIdentity("experts");
    getRuntimeProviderBundle().expert.listExperts({ limit: 50, requestId: identity.requestId }, controller.signal).then((result) => {
      if (sequence !== requestSequence.current) return;
      setListResult(result);
      const nextExperts = Array.isArray(result.data) ? [...result.data] : [];
      setExperts(nextExperts);
      if (nextExperts.length) {
        setSelected((current) => current || nextExperts[0]);
        setDomain((current) => nextExperts[0].scopes?.some((scope) => scope.domain === current) ? current : nextExperts[0].scopes?.[0]?.domain || "AI_ML");
      }
    }).catch(() => { if (sequence === requestSequence.current) setListResult(createErrorState(new ApiError("Expert directory failed unexpectedly.", "SERVER_ERROR").toSafeError(), { phase: "EXPERT_DIRECTORY_UNEXPECTED_FAILURE", requestId: identity.requestId, retryable: true })); });
    return () => { controller.abort("expert-directory-unmounted"); };
  }, [directoryReloadKey]);

  useEffect(() => () => activeAssessment.current?.abort("component-unmounted"), []);

  const inspect = async () => {
    if (!selected || !claimText.trim()) return;
    activeAssessment.current?.abort("superseded-by-new-assessment");
    const controller = new AbortController();
    activeAssessment.current = controller;
    setLoading(true); setError(""); setEvaluation(null); setAssessmentResult(null);
    try {
      const { getRuntimeProviderBundle } = await import("@/lib/backend/runtimeProvider");
      if (controller.signal.aborted) return;
      const identity = createWorkIdentity("expert-assessment");
      const result = await getRuntimeProviderBundle().expert.requestAssessment({ scope: { caseId: "expert-review", caseRevision: 1 }, expertId: selected.expertId, claim: { text: claimText, domain, claimJurisdiction: "TECHNICAL_DOMAIN" }, requestId: identity.requestId, idempotencyKey: identity.runId }, controller.signal);
      if (controller.signal.aborted) return;
      setAssessmentResult(result);
      if (result.state === "SUCCESS" && result.data) setEvaluation({ claimStatus: result.data.claimStatus, explanation: result.data.explanation, expertConsensus: { disagreementLevel: result.data.disagreementStatus || "UNKNOWN" } });
      else if (result.state !== "CANCELLED") setError(result.error?.userMessage || "API chưa trả về hồ sơ thẩm định.");
    } catch (caught) { if (!(caught instanceof ApiError && caught.code === "ABORTED")) setError(caught instanceof ApiError ? apiErrorMessage(caught) : "Không thể thẩm định lúc này."); }
    finally { setLoading(false); }
  };

  const sourceMode = listResult?.provenance?.sourceMode || (RUNTIME_PROVIDER_MODE === "DEMO" ? "DEMO" : "LIVE");
  const filteredExperts = useMemo(() => {
    const normalized = directoryQuery.trim().toLowerCase();
    if (!normalized) return experts;
    return experts.filter((expert) => `${expert.name} ${expert.title || ""} ${expert.institution || ""} ${expert.department || ""} ${(expert.scopes || []).map((scope) => scope.domain).join(" ")}`.toLowerCase().includes(normalized));
  }, [directoryQuery, experts]);
  const handleDirectoryAction = (action) => {
    if (action.id === "RETRY") setDirectoryReloadKey((value) => value + 1);
  };
  const handleAssessmentAction = (action) => {
    if (action.id === "RETRY") inspect();
  };

  return <div className="product-workspace">
    <header className="product-hero"><div><p className="product-kicker">Expert trust network</p><h1>Đúng người, đúng phạm vi, đúng bằng chứng.</h1><p>StudentHub không xếp hạng chuyên gia bằng một điểm uy tín chung. Mỗi hồ sơ được đọc theo lĩnh vực, bằng cấp, mẫu đóng góp và giới hạn thẩm quyền.</p><SourceDisclosure provenance={listResult?.provenance} sourceMode={sourceMode} /></div><div className="hero-seal"><UserRoundCheck size={20} /><span>EXPERTS</span><strong>{experts.length} hồ sơ khả dụng</strong></div></header>
    <section className="expert-layout">
      <div><div className="section-heading"><div><p className="product-kicker">Discovery</p><h2 className="product-section-title">Chọn theo lĩnh vực chuyên môn</h2></div><span className="signal-badge">{filteredExperts.length} hồ sơ</span></div><label className="product-search mb-4"><Search size={17} /><span className="sr-only">Tìm chuyên gia</span><input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Tìm theo tên, tổ chức hoặc lĩnh vực..." /></label>{listResult && !["SUCCESS", "EMPTY"].includes(listResult.state) && <StateBoundary envelope={listResult} onAction={handleDirectoryAction} />}{!listResult && <StateBoundary state="LOADING" />}<div className="expert-directory">{filteredExperts.map((expert) => <button key={expert.expertId} onClick={() => { setSelected(expert); setDomain(expert.scopes?.[0]?.domain || "AI_ML"); setEvaluation(null); setAssessmentResult(null); }} className={`expert-card ${selected?.expertId === expert.expertId ? "is-selected" : ""}`}><div className="expert-avatar">{String(expert.name || "CG").split(" ").slice(-2).map((part) => part[0]).join("")}</div><div className="min-w-0"><h3>{expert.name}{expert.isVerified && <ShieldCheck size={15} />}</h3><p>{expert.title} · {expert.department}</p><span><Building2 size={12} /> {expert.institution}</span></div><ArrowRight size={15} /></button>)}</div>{listResult && ["SUCCESS", "EMPTY"].includes(listResult.state) && filteredExperts.length === 0 && <div className="empty-state mt-4">Không có hồ sơ phù hợp với tìm kiếm hiện tại.</div>}</div>
      <div>{selected ? <div className="intelligence-panel expert-dossier"><div className="panel-heading"><div><p className="product-kicker">Domain reliability dossier</p><h2 className="product-section-title">{selected.name}</h2></div>{selected.isVerified && <span className="signal-badge"><CheckCircle2 size={12} /> Danh tính đã xác thực</span>}</div><div className="dossier-context"><span><Building2 size={14} /> {selected.institution}</span><span><Award size={14} /> {selected.credentials?.length || 0} chứng chỉ/bằng cấp</span><span><BookOpenCheck size={14} /> {selected.publications?.length || 0} công trình</span></div>
        <div className="scope-list"><p className="data-label">Phạm vi năng lực</p>{selected.scopes?.length ? selected.scopes.map((scope) => <div key={scope.domain} className="scope-row"><div><strong>{scope.domain.replaceAll("_", " ")}</strong><small>{scope.level}</small></div><span className={`scope-meter ${scopeTone(scope.level)}`}><i /></span></div>) : <div className="empty-state">Hồ sơ chưa công bố dữ liệu theo lĩnh vực.</div>}</div>
        <div className="boundary-callout"><AlertTriangle size={17} /><div><strong>Expertise không đồng nghĩa với authority</strong><p>{selected.hasRegistrarAuthority ? "Hồ sơ có cờ thẩm quyền hành chính trong dữ liệu hiện tại." : "Hồ sơ này không được trình bày như nguồn ban hành quy chế."}</p></div></div>
        <div className="claim-review"><p className="product-kicker">Independent assessment</p><h3>Kiểm tra một phát ngôn theo phạm vi</h3><label><span>Nội dung cần thẩm định</span><textarea rows={3} value={claimText} onChange={(event) => setClaimText(event.target.value)} placeholder="Nhập phát ngôn cần kiểm tra..." /></label><label><span>Lĩnh vực</span><select value={domain} onChange={(event) => setDomain(event.target.value)}>{(selected.scopes || []).map((scope) => <option key={scope.domain} value={scope.domain}>{scope.domain.replaceAll("_", " ")}</option>)}{!selected.scopes?.length && <option value="AI_ML">AI ML</option>}</select></label><button className="primary-action" disabled={loading || !claimText.trim()} onClick={inspect}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Thẩm định phạm vi</button>{error && <div className="error-callout" role="alert">{error}</div>}{assessmentResult && assessmentResult.state !== "SUCCESS" && <StateBoundary envelope={assessmentResult} onAction={handleAssessmentAction} />}{evaluation && <div className="assessment-result"><span className="signal-badge">{String(evaluation.claimStatus || "RESULT").replaceAll("_", " ")}</span><p>{evaluation.explanation || "API đã trả về kết quả nhưng không có diễn giải."}</p></div>}</div>
      </div> : <div className="intelligence-panel empty-state">Chưa có hồ sơ chuyên gia khả dụng.</div>}</div>
    </section>
    <section className="network-bridge intelligence-panel"><p className="product-kicker">Connected by TrustGraph</p><h3>Đưa thẩm định vào case đang phân tích</h3><p>Ý kiến chuyên gia chỉ là một lớp bằng chứng, luôn được đặt cạnh nguồn và cộng đồng.</p><Link href="/trust" className="text-link">Quay lại Trust Engine <ArrowRight size={14} /></Link></section>
  </div>;
}
