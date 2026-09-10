"use client";

import KhaiMinhMedia from "@/components/visual/KhaiMinhMedia";
import EditorialMediaFrame from "@/components/visual/EditorialMediaFrame";
import KnowledgeGlass from "@/components/visual/KnowledgeGlass";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Award, BookOpenCheck, Building2, CheckCircle2, LoaderCircle, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import StateBoundary from "@/components/ui/StateBoundary";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import ReferenceBirdStamp from "@/components/media/ReferenceBirdStamp";
import ExpertQualificationPanel from "@/components/expert/ExpertQualificationPanel";
import { createErrorState, createWorkIdentity } from "@/lib/ui-state/clientModel";
import { getExpertRuntimeProvider, SCOPED_PROVIDER_MODE } from "@/lib/backend/scopedRuntimeProvider";

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
    getExpertRuntimeProvider().listExperts({ limit: 50, requestId: identity.requestId }, controller.signal).then((result) => {
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
    activeAssessment.current?.abort("superseded-by-new-scope-check");
    const controller = new AbortController();
    activeAssessment.current = controller;
    setLoading(true); setError(""); setEvaluation(null); setAssessmentResult(null);
    try {
      if (controller.signal.aborted) return;
      const identity = createWorkIdentity("expert-scope-check");
      const result = await getExpertRuntimeProvider().requestAssessment({ expertId: selected.expertId, claim: { text: claimText, domain, claimJurisdiction: "TECHNICAL_DOMAIN" }, requestId: identity.requestId, idempotencyKey: identity.runId }, controller.signal);
      if (controller.signal.aborted) return;
      setAssessmentResult(result);
      if (result.state === "SUCCESS" && result.data) setEvaluation({ claimStatus: result.data.claimStatus, explanation: result.data.explanation, expertConsensus: { disagreementLevel: result.data.disagreementStatus || "UNKNOWN" } });
      else if (result.state !== "CANCELLED") setError(result.error?.userMessage || "API chưa trả về hồ sơ thẩm định.");
    } catch (caught) { if (!(caught instanceof ApiError && caught.code === "ABORTED")) setError(caught instanceof ApiError ? apiErrorMessage(caught) : "Không thể thẩm định lúc này."); }
    finally { setLoading(false); }
  };

  const sourceMode = listResult?.provenance?.sourceMode || SCOPED_PROVIDER_MODE;
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

  return <div className="product-workspace vnext-secondary-workspace vnext-expert-workspace">
    <header className="product-hero swiss-crosshair-card hover-perspective-sheen relative overflow-hidden">
      <ReferenceBirdStamp className="vnext-secondary-hero-bird" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        <div className="lg:col-span-7">
          <p className="product-kicker text-cyan-400 font-mono text-xs mb-2">03 · EXPERT TRUST NETWORK</p>
          <h1 className="type-monumental text-4xl sm:text-5xl text-white tracking-tight leading-[1.05] mb-4">
            Đúng người, <em className="text-cyan-200">đúng phạm vi</em>, đúng bằng chứng.
          </h1>
          <p className="type-body-editorial text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed mb-6">
            StudentHub không xếp hạng chuyên gia bằng một điểm số uy tín chung. Đóng góp không đồng nghĩa với thẩm quyền; 5★ không đồng nghĩa với chuyên gia thẩm định chính thức.
          </p>
          <SourceDisclosure provenance={listResult?.provenance} sourceMode={sourceMode} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <UserRoundCheck size={13} /> {experts.length} hồ sơ thẩm định khả dụng
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Hồ sơ chuyên gia đang được thẩm định theo tiêu chuẩn đối soát độc lập
            </span>
          </div>
        </div>
        <div className="lg:col-span-5">
          {/* Canonical KM-EXPERT-001 Primary Visual */}
          <EditorialMediaFrame
            assetId="KM-EXPERT-001"
            label="HỘI ĐỒNG THẨM ĐỊNH // KHAI MINH"
            badge="EXPERT VERIFICATION"
            className="w-full"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
              <KhaiMinhMedia
                assetId="KM-EXPERT-001"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded bg-slate-950/80 text-[10px] text-slate-300 font-mono">
                HỘI ĐỒNG KHẢO CHỨNG ĐỘC LẬP // QUY CHUẨN THẨM ĐỊNH
              </div>
            </div>
          </EditorialMediaFrame>
        </div>
      </div>
    </header>

    {/* FX11 Explanatory Boundary: AI Analysis -> Evidence Review -> Human Judgment */}
    <section className="my-6 p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
            FX11 // RANH GIỚI THẨM ĐỊNH PHÁP LÝ
          </span>
          <strong className="text-sm text-slate-100 font-serif">
            Quy trình 3 nấc khảo chứng độc lập
          </strong>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            01 AI BÓC TÁCH
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 border border-cyan-900">
            02 ĐỐI SOÁT NGUỒN GỐC
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-200 border border-purple-800/50">
            03 PHÁN QUYẾT CON NGƯỜI
          </span>
        </div>
      </div>
    </section>
    <section className="expert-layout">
      <div><div className="section-heading"><div><p className="product-kicker">Discovery</p><h2 className="product-section-title">Chọn theo lĩnh vực chuyên môn</h2></div><span className="signal-badge">{filteredExperts.length} hồ sơ</span></div><label className="product-search mb-4"><Search size={17} /><span className="sr-only">Tìm chuyên gia</span><input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Tìm theo tên, tổ chức hoặc lĩnh vực..." /></label>{listResult && !["SUCCESS", "EMPTY"].includes(listResult.state) && <StateBoundary envelope={listResult} onAction={handleDirectoryAction} />}{!listResult && <StateBoundary state="LOADING" />}<div className="expert-directory">{filteredExperts.map((expert) => <button key={expert.expertId} onClick={() => { setSelected(expert); setDomain(expert.scopes?.[0]?.domain || "AI_ML"); setEvaluation(null); setAssessmentResult(null); }} className={`expert-card ${selected?.expertId === expert.expertId ? "is-selected" : ""}`}><div className="expert-avatar">{String(expert.name || "CG").split(" ").slice(-2).map((part) => part[0]).join("")}</div><div className="min-w-0"><h3>{expert.name}{expert.isVerified && <ShieldCheck size={15} />}</h3><p>{expert.title} · {expert.department}</p><span><Building2 size={12} /> {expert.institution}</span></div><ArrowRight size={15} /></button>)}</div>{listResult && ["SUCCESS", "EMPTY"].includes(listResult.state) && filteredExperts.length === 0 && <div className="empty-state mt-4">Chưa có chuyên gia đã được xác minh phù hợp với tìm kiếm hiện tại.</div>}</div>
      <div>{selected ? <div className="intelligence-panel expert-dossier"><div className="panel-heading"><div><p className="product-kicker">Domain reliability dossier</p><h2 className="product-section-title">{selected.name}</h2></div>{selected.isVerified && <span className="signal-badge"><CheckCircle2 size={12} /> Danh tính đã xác thực</span>}</div><div className="dossier-context"><span><Building2 size={14} /> {selected.institution}</span><span><Award size={14} /> {selected.credentials?.length || 0} chứng chỉ/bằng cấp</span><span><BookOpenCheck size={14} /> {selected.publications?.length || 0} công trình</span></div>
        <div className="scope-list"><p className="data-label">Phạm vi năng lực</p>{selected.scopes?.length ? selected.scopes.map((scope) => <div key={scope.domain} className="scope-row"><div><strong>{scope.domain.replaceAll("_", " ")}</strong><small>{scope.level}</small></div><span className={`scope-meter ${scopeTone(scope.level)}`}><i /></span></div>) : <div className="empty-state">Hồ sơ chưa công bố dữ liệu theo lĩnh vực.</div>}</div>
        <div className="boundary-callout"><AlertTriangle size={17} /><div><strong>Expertise không đồng nghĩa với authority</strong><p>{selected.hasRegistrarAuthority ? "Hồ sơ có cờ thẩm quyền hành chính trong dữ liệu hiện tại." : "Hồ sơ này không được trình bày như nguồn ban hành quy chế."}</p></div></div>
        <div className="claim-review"><p className="product-kicker">Scope check · không lưu</p><h3>Kiểm tra phát ngôn có nằm trong phạm vi không</h3><p className="text-app-muted">Đây chỉ là phân tích phạm vi live, không tạo expert assessment, không ghi evidence và không thay đổi Trust.</p><label><span>Nội dung cần kiểm tra</span><textarea rows={3} value={claimText} onChange={(event) => setClaimText(event.target.value)} placeholder="Nhập phát ngôn cần kiểm tra..." /></label><label><span>Lĩnh vực</span><select value={domain} onChange={(event) => setDomain(event.target.value)}>{(selected.scopes || []).map((scope) => <option key={scope.domain} value={scope.domain}>{scope.domain.replaceAll("_", " ")}</option>)}{!selected.scopes?.length && <option value="AI_ML">AI ML</option>}</select></label><button className="primary-action" disabled={loading || !claimText.trim()} onClick={inspect}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Kiểm tra phạm vi</button>{error && <div className="error-callout" role="alert">{error}</div>}{assessmentResult && assessmentResult.state !== "SUCCESS" && <StateBoundary envelope={assessmentResult} onAction={handleAssessmentAction} />}{evaluation && <div className="assessment-result"><span className="signal-badge">{String(evaluation.claimStatus || "RESULT").replaceAll("_", " ")}</span><p>{evaluation.explanation || "API đã trả về kết quả scope; chưa có assessment bền vững."}</p><small className="text-app-muted">Không có assessmentId vì bước này không ghi dữ liệu.</small></div>}</div>
      </div> : <div className="intelligence-panel empty-state">Chưa có chuyên gia đã được xác minh trong lĩnh vực này.</div>}</div>
    </section>
    <ExpertQualificationPanel />
    <section className="network-bridge intelligence-panel"><p className="product-kicker">Connected by TrustGraph</p><h3>Đưa thẩm định vào case đang phân tích</h3><p>Ý kiến chuyên gia chỉ là một lớp bằng chứng, luôn được đặt cạnh nguồn và cộng đồng.</p><Link href="/trust" className="text-link">Quay lại Trust Engine <ArrowRight size={14} /></Link></section>
  </div>;
}
