"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  LoaderCircle,
  Send,
  Printer,
  Users,
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/runtimeClient";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";

function validScope(caseId, caseRevision) {
  return typeof caseId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseId)
    && Number.isInteger(caseRevision)
    && caseRevision >= 1;
}

function errorMessage(error) {
  if (error instanceof ApiError) return apiErrorMessage(error);
  return "Nguồn live chưa trả về dữ liệu.";
}

function scopeLink({ caseId, caseRevision, claimId }) {
  if (!validScope(caseId, caseRevision)) return "/community";
  const params = new URLSearchParams({ caseId, caseRevision: String(caseRevision) });
  if (claimId) params.set("claimId", claimId);
  return `/community?${params.toString()}`;
}

function ChannelState({ state, message }) {
  if (state === "LOADING") {
    return <div className="qualification-state" role="status"><LoaderCircle size={16} className="animate-spin" /> Đang đọc dữ liệu live…</div>;
  }
  if (state === "EMPTY") {
    return <div className="empty-state">Chưa có bản ghi phù hợp với case revision này.</div>;
  }
  if (state === "UNKNOWN") {
    return <div className="empty-state">{message || "Kết quả chưa có case ID và revision bền vững để nối kênh."}</div>;
  }
  return <div className="error-callout" role="alert">{message || "Không thể đọc kênh live."}</div>;
}

function CommunitySignalList({ signals }) {
  return <div className="space-y-3">
    {signals.map((signal) => <article className="p-4 rounded-xl border border-white/5 bg-black/40" key={signal.contributionId || signal.postId}>
      <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
        <span className="text-xs font-semibold text-slate-200">{signal.contributionType || "COMMUNITY_CONTRIBUTION"}</span>
        <span className="type-micro-label-v3 text-cyan-400">NON-AUTHORITATIVE</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{signal.statement || signal.content || "Không có nội dung công khai."}</p>
      <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-slate-500">
        <span>{signal.evidenceState || "UNKNOWN"}</span>
        <span>· {signal.reviewState || "UNASSIGNED"}</span>
        <span>· {signal.evidenceRefs?.length || 0} evidence refs</span>
        {signal.ranking?.score != null && <span>· relevance {Number(signal.ranking.score).toFixed(2)}</span>}
      </div>
    </article>)}
  </div>;
}

function ExpertAssessmentList({ assessments }) {
  return <div className="space-y-3">
    {assessments.map((assessment) => <article className="p-4 rounded-xl border border-white/5 bg-black/40" key={assessment.id}>
      <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
        <span className="text-xs font-semibold text-slate-200">{assessment.public_title || "Verified domain expert"}</span>
        <span className="type-micro-label-v3 text-purple-300">{assessment.assessment_state || "SUBMITTED"}</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{assessment.reasoning || assessment.assessment?.analysis || "Assessment không công bố phần reasoning."}</p>
      <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-slate-500">
        <span>{assessment.domain_code || "DOMAIN_UNDISCLOSED"}</span>
        <span>· revision {assessment.case_revision ?? "—"}</span>
        <span>· {assessment.evidence_revision_ids?.length || 0} evidence revisions</span>
        {assessment.confidence != null && <span>· confidence {Number(assessment.confidence).toFixed(2)}</span>}
      </div>
    </article>)}
  </div>;
}

const REQUEST_STATUS_COPY = Object.freeze({
  REQUESTED: "Đã tạo yêu cầu. Hệ thống sẽ matching/assignment theo eligibility ở server; bạn chưa chọn và chưa được gán chuyên gia.",
  MATCHING: "Server đang matching theo domain và eligibility. Chưa có chuyên gia được gán.",
  ASSIGNED: "Yêu cầu đã được server gán vào một assignment đủ điều kiện.",
  IN_REVIEW: "Một expert assignment đang xem xét yêu cầu này.",
  COMPLETED: "Yêu cầu đã hoàn tất; assessment bền vững sẽ xuất hiện ở kênh Expert nếu được công bố.",
  CANCELLED: "Yêu cầu đã bị huỷ.",
  EXPIRED: "Yêu cầu đã hết hạn và không còn được xử lý.",
});

function AskExpertPanel({ caseId, caseRevision, claimId, defaultDomainCode = "" }) {
  const [question, setQuestion] = useState("");
  const [domainCode, setDomainCode] = useState(defaultDomainCode || "");
  const [contextRefs, setContextRefs] = useState("");
  const [requests, setRequests] = useState([]);
  const [state, setState] = useState("IDLE");
  const [error, setError] = useState("");
  const controller = useRef(null);
  const idempotencyKey = useRef("");
  const scopeReady = validScope(caseId, caseRevision);
  const scopeKey = `${caseId || ""}:${caseRevision || ""}:${claimId || ""}`;

  useEffect(() => {
    setDomainCode(defaultDomainCode || "");
  }, [defaultDomainCode]);

  useEffect(() => {
    controller.current?.abort("review-request-scope-changed");
    idempotencyKey.current = "";
    setRequests([]);
    setError("");
    setState(scopeReady ? "LOADING" : "UNKNOWN");
    if (!scopeReady) return undefined;
    const nextController = new AbortController();
    controller.current = nextController;
    const requestId = createSecureId("trust-expert-requests-read");
    apiRequest(`/api/expert/review-requests?caseId=${encodeURIComponent(caseId)}&limit=10`, { signal: nextController.signal, requestId })
      .then((payload) => {
        if (nextController.signal.aborted) return;
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setRequests(data);
        setState(data.length ? String(data[0].status || "REQUESTED") : "IDLE");
      })
      .catch((caught) => {
        if (nextController.signal.aborted || (caught instanceof ApiError && caught.code === "ABORTED")) return;
        setError(errorMessage(caught));
        setState("ERROR");
      });
    return () => nextController.abort("review-request-panel-unmounted");
  }, [caseId, caseRevision, scopeKey, scopeReady]);

  const submit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedDomain = domainCode.trim();
    if (!scopeReady) {
      setState("UNKNOWN");
      setError("Kết quả Trust chưa có case ID/revision bền vững để tạo yêu cầu.");
      return;
    }
    if (trimmedQuestion.length < 20 || trimmedQuestion.length > 4000) {
      setState("VALIDATION");
      setError("Câu hỏi cần từ 20 đến 4000 ký tự.");
      return;
    }
    if (!trimmedDomain) {
      setState("VALIDATION");
      setError("Hãy nhập domain/category cần expert xem xét.");
      return;
    }
    const parsedContextRefs = contextRefs.split(",").map((value) => value.trim()).filter(Boolean);
    setState("SUBMITTING");
    setError("");
    const stableKey = idempotencyKey.current || createSecureId("expert-review-request");
    idempotencyKey.current = stableKey;
    try {
      const payload = await apiRequest("/api/expert/review-requests", {
        method: "POST",
        requestId: createSecureId("trust-expert-request-submit"),
        headers: { "Idempotency-Key": stableKey },
        body: JSON.stringify({
          caseId,
          caseRevision,
          claimId: claimId || null,
          domainCode: trimmedDomain,
          question: trimmedQuestion,
          contextRefs: parsedContextRefs,
        }),
      });
      const created = payload?.data;
      if (created) setRequests((current) => [created, ...current.filter((item) => item.id !== created.id)].slice(0, 10));
      setState(String(created?.status || "REQUESTED"));
      setQuestion("");
    } catch (caught) {
      setError(errorMessage(caught));
      setState(caught instanceof ApiError && caught.code === "CONFLICT" ? "CONFLICT" : "ERROR");
    }
  };

  return <section id="trust-ask-expert" className="p-6 rounded-2xl border border-purple-400/20 bg-purple-500/[0.04] backdrop-blur-md" aria-labelledby="trust-ask-expert-title">
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
      <div className="flex items-start gap-3">
        <span className="p-2 rounded-lg bg-purple-500/10 text-purple-300"><Send size={18} /></span>
        <div>
          <p className="product-kicker">Trust → Expert handoff</p>
          <h3 id="trust-ask-expert-title" className="type-product-heading text-base text-slate-100">Yêu cầu chuyên gia xem xét</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">Bạn tạo một yêu cầu có scope. Server mới quyết định matching và assignment; bạn không chọn chuyên gia và không tạo được quyền DOMAIN_VERIFIED.</p>
        </div>
      </div>
      {claimId && <span className="metadata-chip">Claim đã chọn: {String(claimId).slice(0, 8)}…</span>}
    </div>
    {!scopeReady && <ChannelState state="UNKNOWN" message="Kết quả Trust chưa có case ID và revision bền vững để nối yêu cầu chuyên gia." />}
    {scopeReady && <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="trust-expert-question" className="text-xs font-semibold text-slate-200">Câu hỏi / mối quan tâm</label>
        <textarea id="trust-expert-question" value={question} onChange={(event) => setQuestion(event.target.value)} minLength={20} maxLength={4000} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-slate-100 outline-none focus:border-purple-400/60" placeholder="Tôi muốn expert kiểm tra điểm nào trong kết quả Trust này?" />
        <p className="text-[11px] text-slate-500 mt-1">{question.length}/4000 · tối thiểu 20 ký tự</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="trust-expert-domain" className="text-xs font-semibold text-slate-200">Domain / category</label>
          <input id="trust-expert-domain" value={domainCode} onChange={(event) => setDomainCode(event.target.value)} maxLength={80} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-purple-400/60" placeholder="Ví dụ: CYBERSECURITY" />
        </div>
        <div>
          <label htmlFor="trust-expert-context" className="text-xs font-semibold text-slate-200">Evidence/context refs (tuỳ chọn)</label>
          <input id="trust-expert-context" value={contextRefs} onChange={(event) => setContextRefs(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-purple-400/60" placeholder="UUID, UUID" />
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={state === "SUBMITTING"} className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 px-4 py-2.5 text-sm font-semibold text-purple-100 border border-purple-300/20 disabled:opacity-50">
          {state === "SUBMITTING" ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          Tạo yêu cầu
        </button>
        {state === "LOADING" && <ChannelState state="LOADING" />}
        {state === "ERROR" && <span className="text-xs text-rose-300" role="alert">{error}</span>}
        {state === "VALIDATION" && <span className="text-xs text-amber-300" role="alert">{error}</span>}
        {state === "CONFLICT" && <span className="text-xs text-amber-300" role="alert">{error || "Đã có một yêu cầu đang hoạt động cho scope này."}</span>}
      </div>
    </form>}
    {state !== "IDLE" && REQUEST_STATUS_COPY[state] && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-300" role="status">{REQUEST_STATUS_COPY[state]}</div>}
    {requests.length > 0 && <div className="mt-5 space-y-2" aria-label="Các yêu cầu chuyên gia của case này">
      {requests.slice(0, 3).map((request) => <div key={request.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-xs"><span className="text-slate-300">{request.question}</span><span className="shrink-0 text-purple-200">{request.status}</span></div>)}
    </div>}
  </section>;
}

export default function PostResultGateways({ onPrint, caseId = null, caseRevision = null, claimId = null, domainCode = "" }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [channelData, setChannelData] = useState({ community: null, expert: null });
  const [channelState, setChannelState] = useState({ community: "IDLE", expert: "IDLE" });
  const [channelError, setChannelError] = useState({ community: "", expert: "" });
  const controllers = useRef({});
  const scopeReady = validScope(caseId, caseRevision);
  const scopeKey = useMemo(() => `${caseId || ""}:${caseRevision || ""}:${claimId || ""}`, [caseId, caseRevision, claimId]);
  const communityLink = useMemo(() => scopeLink({ caseId, caseRevision, claimId }), [caseId, caseRevision, claimId]);
  const expertLink = useMemo(() => {
    if (!scopeReady) return "/expert";
    const params = new URLSearchParams({ caseId, caseRevision: String(caseRevision) });
    if (claimId) params.set("claimId", claimId);
    return `/expert?${params.toString()}`;
  }, [caseId, caseRevision, claimId, scopeReady]);

  useEffect(() => () => {
    Object.values(controllers.current).forEach((controller) => controller?.abort("gateways-unmounted"));
  }, []);

  useEffect(() => {
    Object.values(controllers.current).forEach((controller) => controller?.abort("trust-scope-changed"));
    setChannelData({ community: null, expert: null });
    setChannelState({ community: "IDLE", expert: "IDLE" });
    setChannelError({ community: "", expert: "" });
  }, [scopeKey]);

  const loadChannel = async (channel) => {
    setActiveChannel(channel);
    if (!scopeReady) {
      setChannelState((current) => ({ ...current, [channel]: "UNKNOWN" }));
      setChannelError((current) => ({ ...current, [channel]: "Kết quả Trust chưa có case ID/revision bền vững." }));
      return;
    }
    if (channelData[channel]?.scopeKey === scopeKey) return;
    controllers.current[channel]?.abort("superseded-channel-read");
    const controller = new AbortController();
    controllers.current[channel] = controller;
    setChannelState((current) => ({ ...current, [channel]: "LOADING" }));
    setChannelError((current) => ({ ...current, [channel]: "" }));
    try {
      const requestId = createSecureId(`trust-${channel}`);
      if (channel === "community") {
        const params = new URLSearchParams({ caseRevision: String(caseRevision), limit: "100" });
        if (claimId) params.set("claimId", claimId);
        const payload = await apiRequest(`/api/v1/trust/cases/${encodeURIComponent(caseId)}/community-signals?${params}`, { signal: controller.signal, requestId });
        const signals = Array.isArray(payload?.signals) ? payload.signals : [];
        setChannelData((current) => ({ ...current, community: { scopeKey, signals } }));
        setChannelState((current) => ({ ...current, community: signals.length ? "SUCCESS" : "EMPTY" }));
      } else {
        const payload = await apiRequest(`/api/expert/assessments?caseId=${encodeURIComponent(caseId)}`, { signal: controller.signal, requestId });
        const assessments = (Array.isArray(payload?.data) ? payload.data : []).filter((assessment) => Number(assessment.case_revision) === Number(caseRevision) && (!claimId || String(assessment.claim_id || "") === String(claimId)));
        setChannelData((current) => ({ ...current, expert: { scopeKey, assessments } }));
        setChannelState((current) => ({ ...current, expert: assessments.length ? "SUCCESS" : "EMPTY" }));
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "ABORTED") return;
      setChannelError((current) => ({ ...current, [channel]: errorMessage(error) }));
      setChannelState((current) => ({ ...current, [channel]: "ERROR" }));
    }
  };

  const toggleChannel = (channel) => {
    setActiveChannel((current) => current === channel ? null : channel);
    if (activeChannel !== channel && channel !== "request") void loadChannel(channel);
  };
  const communitySignals = channelData.community?.scopeKey === scopeKey ? channelData.community.signals : [];
  const expertAssessments = channelData.expert?.scopeKey === scopeKey ? channelData.expert.assessments : [];

  return <div className="space-y-6 mt-8">
    <div className="post-result-gateways">
      <button type="button" onClick={() => toggleChannel("community")} className={`post-result-pill ${activeChannel === "community" ? "is-active" : ""}`} aria-expanded={activeChannel === "community"} aria-controls="trust-community-gateway">
        <Users size={16} className="text-cyan-400" />
        <span>{channelState.community === "SUCCESS" ? `Xem tín hiệu cộng đồng liên quan (${communitySignals.length})` : "Xem tín hiệu cộng đồng liên quan"}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${activeChannel === "community" ? "rotate-180" : ""}`} />
      </button>
      <button type="button" onClick={() => toggleChannel("expert")} className={`post-result-pill ${activeChannel === "expert" ? "is-active" : ""}`} aria-expanded={activeChannel === "expert"} aria-controls="trust-expert-gateway">
        <GraduationCap size={16} className="text-purple-400" />
        <span>{channelState.expert === "SUCCESS" ? `Xem expert assessment liên quan (${expertAssessments.length})` : "Xem expert assessment liên quan"}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${activeChannel === "expert" ? "rotate-180" : ""}`} />
      </button>
      <button type="button" onClick={() => toggleChannel("request")} className={`post-result-pill ${activeChannel === "request" ? "is-active" : ""}`} aria-expanded={activeChannel === "request"} aria-controls="trust-ask-expert">
        <Send size={16} className="text-purple-300" />
        <span>Yêu cầu chuyên gia xem xét</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${activeChannel === "request" ? "rotate-180" : ""}`} />
      </button>
      <button type="button" onClick={onPrint || (() => window.print())} className="post-result-pill" aria-label="In báo cáo Trust dạng PDF">
        <Printer size={15} />
        <span>In báo cáo Trust PDF</span>
      </button>
    </div>

    {activeChannel === "request" && <AskExpertPanel caseId={caseId} caseRevision={caseRevision} claimId={claimId} defaultDomainCode={domainCode} />}

    {activeChannel === "community" && <div id="trust-community-gateway" className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap"><div className="flex items-center gap-2"><span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400"><Users size={18} /></span><div><h3 className="type-product-heading text-sm text-slate-100">Cộng đồng · tín hiệu gắn với case</h3><p className="text-xs text-slate-400">Đọc từ contribution đã publish đúng case revision. Tín hiệu này không tự thay đổi Trust verdict.</p></div></div><Link href={communityLink} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">Mở Community <ArrowRight size={13} /></Link></div>
      {channelState.community === "LOADING" && <ChannelState state="LOADING" />}
      {channelState.community === "UNKNOWN" && <ChannelState state="UNKNOWN" message={channelError.community} />}
      {channelState.community === "EMPTY" && <ChannelState state="EMPTY" />}
      {channelState.community === "ERROR" && <ChannelState state="ERROR" message={channelError.community} />}
      {channelState.community === "SUCCESS" && <CommunitySignalList signals={communitySignals} />}
    </div>}

    {activeChannel === "expert" && <div id="trust-expert-gateway" className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap"><div className="flex items-center gap-2"><span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><GraduationCap size={18} /></span><div><h3 className="type-product-heading text-sm text-slate-100">Expert · assessment có revision</h3><p className="text-xs text-slate-400">Chỉ hiển thị assessment đã được lưu với assignment, COI và evidence revision. Không có bản ghi thì không dựng nội dung thay thế.</p></div></div><Link href={expertLink} className="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">Mở Expert Network <ArrowRight size={13} /></Link></div>
      {channelState.expert === "LOADING" && <ChannelState state="LOADING" />}
      {channelState.expert === "UNKNOWN" && <ChannelState state="UNKNOWN" message={channelError.expert} />}
      {channelState.expert === "EMPTY" && <ChannelState state="EMPTY" />}
      {channelState.expert === "ERROR" && <ChannelState state="ERROR" message={channelError.expert} />}
      {channelState.expert === "SUCCESS" && <ExpertAssessmentList assessments={expertAssessments} />}
    </div>}
  </div>;
}
