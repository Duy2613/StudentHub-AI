"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Filter, MessageSquareText, Plus, Search, Send, ShieldCheck, Users, X } from "lucide-react";
import StateBoundary from "@/components/ui/StateBoundary";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import { createErrorState, createStateEnvelope, createWorkIdentity } from "@/lib/ui-state/model";
import { getRuntimeProviderBundle, RUNTIME_PROVIDER_MODE } from "@/lib/backend/runtimeProvider";
import { ApiError } from "@/lib/api/errors";

function titleFor(post) {
  return post.title || String(post.topic || "Chia sẻ cộng đồng").replaceAll("_", " ");
}

function statusFor(post) {
  if (post.moderationStatus) return String(post.moderationStatus).replaceAll("_", " ");
  if (post.freshnessStatus) return String(post.freshnessStatus).replaceAll("_", " ");
  return "TÍN HIỆU CỘNG ĐỒNG";
}

export function CommunityIntelligenceView() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("ALL");
  const [observations, setObservations] = useState([]);
  const [providerResult, setProviderResult] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [detailResult, setDetailResult] = useState(null);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [statement, setStatement] = useState("");
  const [caseId, setCaseId] = useState("");
  const [caseRevision, setCaseRevision] = useState("1");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const requestSequence = useRef(0);
  const activeSubmission = useRef(null);
  const activeDetail = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    const identity = createWorkIdentity("community");
    let active = true;
    getRuntimeProviderBundle().community.listObservations({ limit: 50, requestId: identity.requestId }, controller.signal).then((result) => {
      if (!active || sequence !== requestSequence.current) return;
      setProviderResult(result);
      setObservations(Array.isArray(result.data) ? result.data : []);
    }).catch(() => {
      if (!active || sequence !== requestSequence.current) return;
      setProviderResult(createErrorState(new ApiError("Community provider failed unexpectedly.", "SERVER_ERROR").toSafeError(), { phase: "COMMUNITY_UNEXPECTED_FAILURE", requestId: identity.requestId, retryable: true }));
    });
    return () => { active = false; controller.abort("community-view-unmounted"); };
  }, [reloadKey]);

  useEffect(() => () => {
    activeSubmission.current?.abort("community-view-unmounted");
    activeDetail.current?.abort("community-view-unmounted");
  }, []);

  const handleStateAction = (action) => {
    if (action.id === "RETRY") setReloadKey((value) => value + 1);
  };

  const submitObservation = async () => {
    if (!statement.trim() || !caseId.trim() || !/^[A-Za-z0-9._:-]{1,160}$/.test(caseId.trim()) || !/^\d+$/.test(caseRevision) || Number(caseRevision) < 0) {
      setSubmissionResult(createErrorState(new ApiError("Hãy nhập nội dung và một case scope hợp lệ trước khi gửi.", "VALIDATION").toSafeError(), { phase: "COMMUNITY_INPUT_INVALID", retryable: false, nextActions: [] }));
      return;
    }
    activeSubmission.current?.abort("superseded-by-new-submission");
    const controller = new AbortController();
    activeSubmission.current = controller;
    const identity = createWorkIdentity("community-submit");
    setSubmissionResult(createStateEnvelope({ state: "SUBMITTING", phase: "COMMUNITY_OBSERVATION_SUBMITTING", requestId: identity.requestId, runId: identity.runId, retryable: false, nextActions: [] }));
    try {
      const result = await getRuntimeProviderBundle().community.submitObservation({
        scope: { caseId: caseId.trim(), caseRevision: Number(caseRevision) },
        statement: statement.trim(),
        evidenceRefs: evidenceRefs.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 50),
        requestId: identity.requestId,
        idempotencyKey: identity.runId,
      }, controller.signal);
      if (!controller.signal.aborted) {
        setSubmissionResult(result);
        if (result.state === "SUCCESS") {
          setStatement("");
          setEvidenceRefs("");
          setReloadKey((value) => value + 1);
        }
      }
    } catch (caught) {
      if (!controller.signal.aborted) setSubmissionResult(createErrorState(caught instanceof ApiError ? caught.toSafeError() : new ApiError("Community submission failed.", "SERVER_ERROR").toSafeError(), { phase: "COMMUNITY_SUBMISSION_FAILED", requestId: identity.requestId, retryable: true, nextActions: [{ id: "RETRY", label: "Thử gửi lại" }] }));
    }
  };

  const openObservation = async (observation) => {
    setSelectedObservation(observation);
    activeDetail.current?.abort("superseded-by-new-detail");
    if (!observation.caseScope) {
      setDetailResult(createStateEnvelope({ state: "UNKNOWN", phase: "COMMUNITY_DETAIL_SCOPE_MISSING", unknowns: ["Observation không công bố case scope để đọc detail theo revision."], missing: ["community-case-scope"], retryable: false, nextActions: [] }));
      return;
    }
    const controller = new AbortController();
    activeDetail.current = controller;
    const identity = createWorkIdentity("community-detail");
    setDetailResult(createStateEnvelope({ state: "LOADING", phase: "COMMUNITY_DETAIL_LOADING", requestId: identity.requestId, retryable: true, nextActions: [] }));
    try {
      const result = await getRuntimeProviderBundle().community.getObservation(observation.observationId, observation.caseScope, identity.requestId, controller.signal);
      if (!controller.signal.aborted) setDetailResult(result);
    } catch (caught) {
      if (!controller.signal.aborted) setDetailResult(createErrorState(caught instanceof ApiError ? caught.toSafeError() : new ApiError("Community detail failed.", "SERVER_ERROR").toSafeError(), { phase: "COMMUNITY_DETAIL_FAILED", requestId: identity.requestId, retryable: true, nextActions: [{ id: "RETRY", label: "Thử đọc lại" }] }));
    }
  };

  const closeObservation = () => {
    activeDetail.current?.abort("community-detail-closed");
    setSelectedObservation(null);
    setDetailResult(null);
  };

  const handleSubmissionAction = (action) => {
    if (action.id === "RETRY") submitObservation();
  };
  const handleDetailAction = (action) => {
    if (action.id === "RETRY" && selectedObservation) openObservation(selectedObservation);
  };

  const topics = useMemo(() => [...new Set(observations.map((post) => post.topic).filter(Boolean))], [observations]);
  const posts = observations.filter((post) => {
    const text = `${post.title || ""} ${post.statement || ""} ${post.topic || ""} ${post.context || ""}`.toLowerCase();
    return (topic === "ALL" || post.topic === topic) && text.includes(query.toLowerCase());
  });
  const sourceMode = providerResult?.provenance?.sourceMode || (RUNTIME_PROVIDER_MODE === "DEMO" ? "DEMO" : "LIVE");

  return <div className="product-workspace">
    <header className="product-hero"><div><p className="product-kicker">Student collective intelligence</p><h1>Trải nghiệm thật, được đặt trong ngữ cảnh.</h1><p>Cộng đồng không phải bảng tin giải trí. Đây là lớp bằng chứng thực tế giúp phát hiện khoảng cách giữa quy định chính thức và điều sinh viên đang gặp.</p><SourceDisclosure provenance={providerResult?.provenance} sourceMode={sourceMode} /></div><div className="hero-seal"><Users size={20} /><span>COMMUNITY</span><strong>{observations.length} báo cáo hiện có</strong></div></header>

    <section className="collective-toolbar intelligence-panel">
      <label className="product-search"><Search size={17} /><span className="sr-only">Tìm trong cộng đồng</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm vấn đề, quy trình hoặc bằng chứng..." /></label>
      <div className="flex items-center gap-2 overflow-x-auto"><Filter size={15} className="shrink-0 text-app-muted" /><button onClick={() => setTopic("ALL")} className={`filter-chip ${topic === "ALL" ? "is-active" : ""}`}>Tất cả</button>{topics.map((item) => <button key={item} onClick={() => setTopic(item)} className={`filter-chip ${topic === item ? "is-active" : ""}`}>{item.replaceAll("_", " ")}</button>)}</div>
    </section>

    <section className="intelligence-panel community-contribution" aria-labelledby="community-contribution-title">
      <div className="panel-heading"><div><p className="product-kicker">Contribute an observation</p><h2 id="community-contribution-title" className="product-section-title">Thêm trải nghiệm có thể đối soát</h2></div><Plus size={18} /></div>
      <p className="product-copy">Một observation phải gắn với case và revision cụ thể. Gửi thành công chỉ có nghĩa là hệ thống đã nhận sự kiện, không biến trải nghiệm thành sự thật chính thức.</p>
      <div className="community-form-grid"><label><span>Nội dung quan sát</span><textarea value={statement} onChange={(event) => setStatement(event.target.value)} rows={4} maxLength={12000} placeholder="Bạn đã thấy điều gì, ở đâu và khi nào?" /></label><div className="space-y-3"><label><span>Case ID</span><input value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="case_..." maxLength={160} /></label><label><span>Case revision</span><input value={caseRevision} onChange={(event) => setCaseRevision(event.target.value)} inputMode="numeric" pattern="[0-9]+" /></label><label><span>Evidence refs (phân tách bằng dấu phẩy)</span><input value={evidenceRefs} onChange={(event) => setEvidenceRefs(event.target.value)} placeholder="url hoặc evidence id" /></label></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" className="primary-action" disabled={!statement.trim() || !caseId.trim()} onClick={submitObservation}><Send size={15} /> Gửi observation</button>{submissionResult && submissionResult.state !== "SUCCESS" && <StateBoundary envelope={submissionResult} onAction={handleSubmissionAction} />}{submissionResult?.state === "SUCCESS" && <span className="metadata-chip">Đã nhận · chưa phải phán quyết</span>}</div>
    </section>

    <section className="collective-layout">
      <div className="space-y-4"><div className="section-heading"><div><p className="product-kicker">Live evidence stream</p><h2 className="product-section-title">Tín hiệu từ sinh viên</h2></div><span className="signal-badge">{posts.length} kết quả</span></div>
        {providerResult && !["SUCCESS", "EMPTY"].includes(providerResult.state) && <StateBoundary envelope={providerResult} onAction={handleStateAction} />}
        {!providerResult && <StateBoundary state="LOADING" />}
        {posts.length ? posts.map((post) => <article key={post.observationId} className="intelligence-panel community-report"><div className="report-rail"><span>SV</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="signal-badge"><MessageSquareText size={12} /> {statusFor(post)}</span>{post.evidenceRefs?.length ? <span className="metadata-chip">{post.evidenceRefs.length} evidence refs</span> : null}</div><h3>{titleFor(post)}</h3><p>{post.statement}</p>{post.context && <p className="product-copy">{post.context}</p>}<footer><span><Clock3 size={13} /> {post.submittedAt || post.observedAt ? new Date(post.submittedAt || post.observedAt).toLocaleDateString("vi-VN") : "Không có thời gian"}</span><span><ShieldCheck size={13} /> Nguồn: cộng đồng</span><button type="button" className="text-link" onClick={() => openObservation(post)}>Xem detail <ArrowRight size={14} /></button></footer></div></article>) : (providerResult?.state === "SUCCESS" || providerResult?.state === "EMPTY") && <div className="intelligence-panel empty-state">Không có báo cáo phù hợp với bộ lọc hiện tại.</div>}
      </div>
      <aside className="space-y-4"><div className="intelligence-panel sticky-insight"><p className="product-kicker">How to read</p><h2 className="product-section-title">Không đánh đồng số đông với sự thật</h2><ul className="reading-rules"><li><CheckCircle2 /> Trải nghiệm trực tiếp cho biết điều đã xảy ra.</li><li><AlertTriangle /> Cảnh báo cần được đối chiếu thêm nguồn độc lập.</li><li><ShieldCheck /> Quy định chính thức vẫn là nguồn thẩm quyền.</li></ul></div><div className="intelligence-panel network-bridge"><p className="product-kicker">Connected by TrustGraph</p><h3>Đưa tín hiệu vào một case kiểm chứng</h3><p>Trust Engine sẽ phân tách rủi ro, confidence và mức đủ bằng chứng.</p><Link href="/trust" className="text-link">Mở Trust Engine <ArrowRight size={14} /></Link></div></aside>
    </section>
    {selectedObservation && <section className="intelligence-panel community-detail" aria-labelledby="community-detail-title"><div className="panel-heading"><div><p className="product-kicker">Observation detail</p><h2 id="community-detail-title" className="product-section-title">{titleFor(selectedObservation)}</h2></div><button type="button" className="icon-button" onClick={closeObservation} aria-label="Đóng observation detail"><X size={16} /></button></div>{detailResult?.state === "SUCCESS" && detailResult.data ? <><p className="product-copy">{detailResult.data.statement}</p><div className="detail-facts"><span>Case: {detailResult.data.caseScope?.caseId || "Chưa xác minh"}</span><span>Revision: {detailResult.data.caseScope?.caseRevision ?? "—"}</span><span>{detailResult.data.evidenceRefs?.length || 0} evidence refs</span></div></> : detailResult && <StateBoundary envelope={detailResult} onAction={handleDetailAction} />}</section>}
  </div>;
}
