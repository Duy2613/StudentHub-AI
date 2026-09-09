"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  LoaderCircle,
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

export default function PostResultGateways({ onPrint, caseId = null, caseRevision = null, claimId = null }) {
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
    if (activeChannel !== channel) void loadChannel(channel);
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
      <button type="button" onClick={onPrint || (() => window.print())} className="post-result-pill" aria-label="In báo cáo Trust dạng PDF">
        <Printer size={15} />
        <span>In báo cáo Trust PDF</span>
      </button>
    </div>

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
