"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenCheck, CheckCircle2, Clock3, ExternalLink, FileClock, Fingerprint, GitPullRequest, GraduationCap, Layers3, MessageCircleQuestion, Network, RefreshCw, Send, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useSearchParams } from "next/navigation";

const INTENTS = [
  ["DIRECT_EXPERIENCE", "Trải nghiệm trực tiếp"],
  ["FOUND_SOURCE", "Tìm thấy nguồn"],
  ["NEEDS_VERIFICATION", "Cần xác minh"],
  ["SUPPORTING_EVIDENCE", "Bằng chứng hỗ trợ"],
  ["CONTRADICTING_EVIDENCE", "Bằng chứng mâu thuẫn"],
  ["CONTEXT", "Bổ sung bối cảnh"],
  ["CRITIQUE", "Phản biện"],
];

const INTENT_HELP = {
  DIRECT_EXPERIENCE: "Mô tả điều bạn trực tiếp quan sát; đây là tín hiệu trải nghiệm, không phải kết luận sự thật.",
  FOUND_SOURCE: "Đính kèm URL công khai an toàn và ghi rõ nguồn nói gì; hệ thống không tự xác nhận nguồn.",
  NEEDS_VERIFICATION: "Nêu điều còn chưa chắc chắn để người khác có thể bổ sung kiểm chứng.",
  SUPPORTING_EVIDENCE: "Liên kết tín hiệu hỗ trợ với claim và nguồn cụ thể.",
  CONTRADICTING_EVIDENCE: "Chỉ ra điểm mâu thuẫn, giữ nguyên bất đồng để Trust V5 xử lý ở đường canonical.",
  CONTEXT: "Thêm bối cảnh địa điểm, thời điểm hoặc quy trình mà không suy diễn danh tính.",
  CRITIQUE: "Đánh giá lập luận hoặc quy trình; không gán nhãn người dùng khác.",
};

const FRESHNESS_LABELS = {
  FRESH: "FRESH · vừa được kiểm tra",
  AGING: "AGING · cần theo dõi",
  STALE: "STALE · cần kiểm tra lại",
  SOURCE_RETRACTED: "SOURCE RETRACTED · cần xem lại",
  CONTEXT_CHANGED: "CONTEXT CHANGED · revision đã đổi",
  UNKNOWN: "UNKNOWN · chưa có timestamp kiểm tra",
};
const EMPTY_LIST = Object.freeze([]);

function makeIdempotency(action) {
  const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `community-max:${action.toLowerCase()}:${uuid}`.slice(0, 180);
}

function safeMessage(payload, fallback = "Thao tác Community chưa hoàn tất.") {
  return payload?.error?.userMessage || payload?.error?.message || fallback;
}

function freshnessValue(state) {
  return { FRESH: 1, AGING: 0.65, UNKNOWN: 0.35, STALE: 0.1, SOURCE_RETRACTED: 0, CONTEXT_CHANGED: 0 }[state] ?? 0;
}

function EmptyState({ children }) {
  return <div className="rounded-xl border border-dashed border-white/15 bg-black/10 px-4 py-5 text-sm text-app-muted">{children}</div>;
}

function ResultNotice({ notice }) {
  if (!notice) return null;
  const positive = notice.type === "success";
  const Icon = positive ? CheckCircle2 : AlertTriangle;
  return <div className={`rounded-xl border px-4 py-3 text-sm ${positive ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`} role="status" aria-live="polite">
    <div className="flex items-start gap-2"><Icon size={16} className="mt-0.5 shrink-0" /><span>{notice.message}</span></div>
  </div>;
}

function ScopeBadge({ contributionId, revision, verification }) {
  if (!contributionId || !revision) return <EmptyState>Chưa chọn contribution revision. Mở một contribution có scope hoặc publish từ Wave 1 để bật các projection.</EmptyState>;
  const freshness = verification?.freshnessState || "UNKNOWN";
  return <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
    <span className="metadata-chip"><Fingerprint size={12} /> REVISION {revision}</span>
    <span className="metadata-chip"><ShieldCheck size={12} /> TRUST V5 AUTHORITY</span>
    <span className={`metadata-chip ${freshness === "FRESH" ? "text-emerald-300" : freshness === "SOURCE_RETRACTED" ? "text-rose-300" : "text-amber-300"}`}><Clock3 size={12} /> {FRESHNESS_LABELS[freshness] || freshness}</span>
  </div>;
}

export default function CommunityMaxWorkspace() {
  const searchParams = useSearchParams();
  const [wave, setWave] = useState(1);
  const [intent, setIntent] = useState("DIRECT_EXPERIENCE");
  const [statement, setStatement] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [caseId, setCaseId] = useState(() => searchParams.get("caseId") || "");
  const [caseRevision, setCaseRevision] = useState(() => searchParams.get("caseRevision") || "1");
  const [claimId, setClaimId] = useState(() => searchParams.get("claimId") || "");
  const [contributionId, setContributionId] = useState(() => searchParams.get("contributionId") || "");
  const [contributionRevision, setContributionRevision] = useState(() => searchParams.get("contributionRevision") || "1");
  const [preview, setPreview] = useState(null);
  const [overview, setOverview] = useState(null);
  const [passportCaseId, setPassportCaseId] = useState(() => searchParams.get("caseId") || "");
  const [passport, setPassport] = useState(null);
  const [expertDomain, setExpertDomain] = useState("");
  const [expertReason, setExpertReason] = useState("");
  const [campus, setCampus] = useState({ universityLabel: "", faculty: "", major: "", topic: "", visibility: "PRIVATE", consent: false });
  const [risk, setRisk] = useState({ riskType: "SOURCE_RETRACTION", signalType: "REVIEW_REQUIRED", topic: "" });
  const [correction, setCorrection] = useState({ type: "SELF_CORRECTION", statement: "", previewDigest: null });
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState(null);

  const selectedScope = Boolean(contributionId && contributionRevision);
  const activeOverview = selectedScope ? overview : null;
  const discussions = activeOverview?.discussions || EMPTY_LIST;
  const sources = activeOverview?.sources?.sources || EMPTY_LIST;
  const independence = activeOverview?.sources?.independence || null;
  const verification = activeOverview?.verification || null;
  const summary = activeOverview?.summary || null;
  const sourceHistory = activeOverview?.sources?.history || EMPTY_LIST;
  const supportSignals = useMemo(() => discussions.filter((item) => item.action === "SUPPORT").map((item) => ({ id: item.id })), [discussions]);
  const challengeSignals = useMemo(() => discussions.filter((item) => item.action === "CHALLENGE").map((item) => ({ id: item.id })), [discussions]);

  const callApi = useCallback(async (action, payload = {}, { method = "POST", query = null } = {}) => {
    const controller = new AbortController();
    const key = makeIdempotency(action);
    setPending(action);
    setNotice(null);
    try {
      const url = query ? `/api/community/max?${query.toString()}` : "/api/community/max";
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: method === "GET" ? {} : { "content-type": "application/json", "Idempotency-Key": key },
        body: method === "GET" ? undefined : JSON.stringify({ action, ...payload }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(safeMessage(data));
      return data;
    } finally {
      setPending("");
    }
  }, []);

  const loadOverview = useCallback(async () => {
    if (!selectedScope) {
      return;
    }
    try {
      const data = await callApi("READ_OVERVIEW", {}, { method: "GET", query: new URLSearchParams({ view: "overview", contributionId, contributionRevision }) });
      setOverview(data.overview || null);
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Không đọc được Community projection." });
    }
  }, [callApi, contributionId, contributionRevision, selectedScope]);

  useEffect(() => {
    if (!selectedScope) return undefined;
    const timer = setTimeout(() => { void loadOverview(); }, 0);
    return () => clearTimeout(timer);
  }, [loadOverview, selectedScope]);

  const composerPayload = () => ({
    intent,
    statement,
    caseId: caseId.trim() || null,
    caseRevision: caseRevision.trim() || null,
    claimId: claimId.trim() || null,
    sourceRefs: sourceUrl.trim() ? [sourceUrl.trim()] : [],
  });

  const previewComposer = async () => {
    try {
      const data = await callApi("PREVIEW_COMPOSER", composerPayload());
      setPreview(data);
      if (data.success) setNotice({ type: "success", message: data.previewDigest ? "Preview an toàn đã sẵn sàng. Bạn có thể publish đúng digest này." : "Preview an toàn đã sẵn sàng; cần case/revision để publish durable." });
      else setNotice({ type: "error", message: "Preview chưa đạt boundary; kiểm tra intent, nội dung, claim và nguồn." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const publishComposer = async () => {
    if (!preview?.previewDigest) {
      setNotice({ type: "error", message: "Hãy tạo preview mới trước khi publish." });
      return;
    }
    try {
      const data = await callApi("PUBLISH_CONTRIBUTION", { ...composerPayload(), privacyConfirmed: true, previewDigest: preview.previewDigest });
      const saved = data.contribution;
      if (saved?.contributionId) {
        setContributionId(saved.contributionId);
        setContributionRevision(String(saved.revision || 1));
        if (sourceUrl.trim()) {
          await callApi("ATTACH_SOURCES", { contributionId: saved.contributionId, contributionRevision: saved.revision || 1, sources: [{ url: sourceUrl.trim() }] });
        }
      }
      setStatement("");
      setPreview(null);
      setNotice({ type: "success", message: "Contribution đã lưu theo canonical Community contract; đây vẫn chỉ là tín hiệu, không phải Trust verdict." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const attachSource = async () => {
    if (!selectedScope || !sourceUrl.trim()) return;
    try {
      await callApi("ATTACH_SOURCES", { contributionId, contributionRevision, sources: [{ url: sourceUrl.trim() }] });
      setNotice({ type: "success", message: "Source reference đã được canonicalize và đưa vào source-family projection." });
      setSourceUrl("");
      await loadOverview();
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const requestDiscussion = async (discussionAction) => {
    if (!selectedScope || !claimId.trim()) {
      setNotice({ type: "error", message: "Claim-level discussion cần contribution revision và claim scope." });
      return;
    }
    try {
      await callApi("DISCUSS", { contributionId, contributionRevision, claimId: claimId.trim(), discussionAction, body: statement.trim() || "Tín hiệu này cần được bổ sung bằng chứng và bối cảnh để tiếp tục đối soát." });
      setNotice({ type: "success", message: "Discussion đã ghi nhận theo claim/revision; không thay đổi Trust authority." });
      await loadOverview();
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const requestVerification = async () => {
    if (!selectedScope) return;
    try {
      await callApi("REQUEST_VERIFICATION", { contributionId, contributionRevision, sourceReferenceIds: sources.map((source) => source.id) });
      setNotice({ type: "success", message: "Đã tạo projection PENDING. Bước xác minh tiếp theo phải đi qua canonical Trust V5." });
      await loadOverview();
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const requestReview = async () => {
    if (!selectedScope) return;
    try {
      const data = await callApi("REQUEST_REVIEW", { contributionId, contributionRevision, claimId: claimId || null, supportSignals, challengeSignals, sourceStates: sources.map((source) => source.sourceState), evidenceStates: [verification?.verificationState || "UNKNOWN"], discussionCount: discussions.length });
      setNotice({ type: "success", message: data.eligible === false ? "Chưa có đủ tín hiệu cho review candidate; hệ thống không dựng disagreement giả." : "High-value disagreement đã vào queue review; chưa chọn bên đúng/sai." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const requestExpert = async () => {
    if (!selectedScope || !expertDomain.trim() || expertReason.trim().length < 10) return;
    try {
      await callApi("REQUEST_EXPERT", { contributionId, contributionRevision, claimId: claimId || null, domainCode: expertDomain, reason: expertReason });
      setExpertReason("");
      setNotice({ type: "success", message: "Expert request đang QUEUED. Không có assignment, SLA hoặc authority được suy diễn." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const requestSummary = async () => {
    if (!selectedScope) return;
    try {
      await callApi("SUMMARY", { contributionId, contributionRevision });
      setNotice({ type: "success", message: "Đã tạo AI Discussion Summary dạng rule-grounded, có citation IDs và không phải verdict." });
      await loadOverview();
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const rankCurrent = async () => {
    if (!selectedScope) return;
    try {
      const data = await callApi("RANK", { candidates: [{ id: contributionId, relevance: 1, evidenceQuality: Math.min(1, sources.length / 3), verificationFreshness: freshnessValue(verification?.freshnessState), sourceIndependence: independence?.totalSources ? Math.min(1, independence.independentSourceFamilies / independence.totalSources) : 0, independentHelpfulness: 0 }] });
      setNotice({ type: "success", message: `Ranking minh bạch đã tính theo policy ${data.rankings?.[0]?.policyVersion || "community-max-ranking-v1"}; ranking không phải truth.` });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const readPassport = async () => {
    if (!passportCaseId.trim()) return;
    try {
      const data = await callApi("READ_PASSPORT", {}, { method: "GET", query: new URLSearchParams({ view: "passport", caseId: passportCaseId.trim() }) });
      setPassport(data.passport || null);
      setNotice({ type: "success", message: data.passport ? "Đã đọc Passport canonical ở owner scope; Community không ghi Passport." : "Chưa có Passport canonical cho case này ở owner scope." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const saveCampus = async () => {
    if (!selectedScope) return;
    try {
      await callApi("CAMPUS_CONTEXT", { contributionId, contributionRevision, ...campus });
      setNotice({ type: "success", message: "Campus context đã lưu theo consent/visibility; hệ thống không suy diễn từ profile." });
      await loadOverview();
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const saveRisk = async () => {
    if (!selectedScope) return;
    try {
      await callApi("RISK_SIGNAL", { contributionId, contributionRevision, ...risk });
      setNotice({ type: "success", message: "Risk signal đã được hash vào private cluster projection; raw content không được lưu." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const previewCorrection = async () => {
    if (!selectedScope || correction.statement.trim().length < 20) return;
    try {
      const data = await callApi("PREVIEW_COMPOSER", { intent: "DIRECT_EXPERIENCE", statement: correction.statement, caseId, caseRevision, claimId });
      setCorrection((current) => ({ ...current, previewDigest: data.previewDigest || null }));
      setNotice({ type: data.previewDigest ? "success" : "error", message: data.previewDigest ? "Correction preview đã sẵn sàng." : "Correction cần case scope hợp lệ và preview an toàn." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const saveCorrection = async () => {
    if (!selectedScope || !correction.previewDigest) return;
    try {
      const data = await callApi("CORRECTION", { contributionId, expectedRevision: contributionRevision, correctionType: correction.type, statement: correction.statement, caseId, caseRevision, claimId, privacyConfirmed: true, previewDigest: correction.previewDigest });
      if (data.newRevision) setContributionRevision(String(data.newRevision));
      setCorrection({ type: "SELF_CORRECTION", statement: "", previewDigest: null });
      setNotice({ type: "success", message: "Correction lineage đã tạo revision mới; quality signal chỉ ghi nhận integrity, không cộng authority." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const createDataCandidate = async () => {
    if (!selectedScope) return;
    try {
      await callApi("DATA_CANDIDATE", { contributionId, contributionRevision, candidateType: "CORRECTION_EXAMPLE" });
      setNotice({ type: "success", message: "Candidate đã ghi nhận ở private store với consent/license review pending và trainingEligible=false." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const loading = Boolean(pending);

  return <section className="intelligence-panel mt-8 community-max-shell" aria-labelledby="community-max-title">
    <div className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="product-kicker font-mono text-xs text-cyan-300">COMMUNITY MAX // EVIDENCE BEFORE CONSENSUS</p>
        <h2 id="community-max-title" className="product-section-title mt-2">Cộng đồng có ngữ cảnh, có revision, có quyền sửa.</h2>
        <p className="product-copy mt-2">Ba wave dùng cùng Community Promax canonical entities. Trust V5 vẫn là authority duy nhất cho phán quyết; Expert request chỉ là hàng đợi chờ workflow Expert.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] font-mono">
        <span className="metadata-chip"><ShieldCheck size={12} /> TRUST V5 FROZEN</span>
        <span className="metadata-chip"><FileClock size={12} /> EMAIL GATE PENDING</span>
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Community Max waves">
      {[1, 2, 3].map((item) => <button key={item} type="button" role="tab" aria-selected={wave === item} onClick={() => setWave(item)} className={`rounded-full border px-3 py-2 text-xs font-mono transition-colors ${wave === item ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-white/10 text-app-muted hover:border-white/25"}`}>
        WAVE {item} · {item === 1 ? "EVIDENCE" : item === 2 ? "DISAGREEMENT" : "CORRECTION"}
      </button>)}
    </div>

    <div className="mt-4"><ResultNotice notice={notice} /></div>

    {wave === 1 && <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-cyan-300/15 bg-black/15 p-5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><p className="product-kicker">W1 · EVIDENCE-FIRST COMPOSER</p><h3 className="mt-1 text-lg font-semibold text-app-foreground">Chọn ý định trước khi viết</h3></div><Layers3 size={20} className="text-cyan-300" /></div>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm"><span className="text-app-foreground">Epistemic intent</span><select value={intent} onChange={(event) => { setIntent(event.target.value); setPreview(null); }} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-app-foreground"><option value="">Chọn intent</option>{INTENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small className="text-xs text-app-muted">{INTENT_HELP[intent]}</small></label>
          <label className="grid gap-1.5 text-sm"><span className="text-app-foreground">Statement / claim context</span><textarea value={statement} onChange={(event) => { setStatement(event.target.value); setPreview(null); }} rows={5} maxLength={20000} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-app-foreground" placeholder="Viết điều bạn biết, điều bạn chưa chắc chắn, hoặc điểm cần đối soát…" /><small className="text-xs text-app-muted">Preview sẽ trả bản đã khử nhận diện; email, mã sinh viên, QR và địa chỉ nhạy cảm không được publish.</small></label>
          <div className="grid gap-3 md:grid-cols-2"><label className="grid gap-1.5 text-sm"><span className="text-app-foreground">Case ID</span><input value={caseId} onChange={(event) => setCaseId(event.target.value)} maxLength={160} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs text-app-foreground" placeholder="UUID Trust case" /></label><label className="grid gap-1.5 text-sm"><span className="text-app-foreground">Case revision</span><input value={caseRevision} onChange={(event) => setCaseRevision(event.target.value)} inputMode="numeric" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs text-app-foreground" /></label></div>
          <label className="grid gap-1.5 text-sm"><span className="text-app-foreground">Claim ID <span className="text-app-muted">(bắt buộc với claim material)</span></span><input value={claimId} onChange={(event) => setClaimId(event.target.value)} maxLength={160} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs text-app-foreground" placeholder="UUID claim" /></label>
          <label className="grid gap-1.5 text-sm"><span className="text-app-foreground">Public source URL (tuỳ intent)</span><div className="flex gap-2"><input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setPreview(null); }} maxLength={4000} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs text-app-foreground" placeholder="https://…" />{selectedScope && <button type="button" onClick={attachSource} disabled={loading || !sourceUrl.trim()} className="rounded-xl border border-cyan-300/30 px-3 text-xs text-cyan-100 disabled:opacity-50" title="Attach to selected revision"><ExternalLink size={15} /></button>}</div><small className="text-xs text-app-muted">Chỉ HTTP(S) public; URL có credential, loopback, private IP và tracking identifier bị từ chối.</small></label>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={previewComposer} disabled={loading || statement.trim().length < 20} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-50"><ShieldCheck size={15} /> {pending === "PREVIEW_COMPOSER" ? "Đang quét…" : "Preview an toàn"}</button><button type="button" onClick={publishComposer} disabled={loading || !preview?.previewDigest} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 px-4 py-2.5 text-xs font-semibold text-emerald-100 disabled:opacity-50"><Send size={15} /> Publish digest</button></div>
          {preview && <div className={`rounded-xl border p-3 text-xs ${preview.success ? "border-emerald-300/25 bg-emerald-300/5" : "border-amber-300/25 bg-amber-300/5"}`}><div className="flex items-center gap-2 font-mono text-[11px] text-app-foreground"><span className="signal-badge">{preview.state}</span>{preview.previewDigest ? "DIGEST READY" : "CASE SCOPE REQUIRED FOR DURABLE PUBLISH"}</div><p className="mt-2 leading-relaxed text-app-muted">{preview.preview?.core?.redactedStatement || preview.preview?.normalized?.statement || "Không có preview text để hiển thị."}</p></div>}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="product-kicker">W1 · REVISION + FRESHNESS</p><h3 className="mt-1 text-lg font-semibold text-app-foreground">Selected Community scope</h3></div><GitPullRequest size={20} className="text-amber-300" /></div><div className="grid gap-3"><label className="grid gap-1.5 text-sm"><span>Contribution ID</span><input value={contributionId} onChange={(event) => setContributionId(event.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs text-app-foreground" placeholder="UUID contribution" /></label><label className="grid gap-1.5 text-sm"><span>Contribution revision</span><input value={contributionRevision} onChange={(event) => setContributionRevision(event.target.value)} inputMode="numeric" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs text-app-foreground" /></label><ScopeBadge contributionId={contributionId} revision={contributionRevision} verification={verification} />{selectedScope && <button type="button" onClick={requestVerification} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 px-3 py-2.5 text-xs text-amber-100 disabled:opacity-50"><RefreshCw size={14} /> Request canonical verification</button>}{verification && <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-app-muted"><div>Verification: <span className="font-mono text-app-foreground">{verification.verificationState}</span></div><div className="mt-1">Freshness: <span className="font-mono text-amber-200">{FRESHNESS_LABELS[verification.freshnessState] || verification.freshnessState}</span></div><div className="mt-1">Case authority: <span className="font-mono">{verification.authorityOwner}</span></div></div>}</div></div>
    </div>}

    {wave === 2 && <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W2 · HIGH-VALUE DISAGREEMENT</p><h3 className="mt-1 text-lg font-semibold">Bất đồng có tín hiệu, không có winner tự động</h3></div><MessageCircleQuestion size={20} className="text-amber-300" /></div><ScopeBadge contributionId={contributionId} revision={contributionRevision} verification={verification}/><div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs font-mono"><div className="rounded-xl border border-white/10 p-3"><div className="text-2xl text-emerald-200">{supportSignals.length}</div><div className="text-app-muted">SUPPORT</div></div><div className="rounded-xl border border-white/10 p-3"><div className="text-2xl text-rose-200">{challengeSignals.length}</div><div className="text-app-muted">CHALLENGE</div></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => requestDiscussion("SUPPORT")} disabled={loading || !selectedScope || !claimId.trim()} className="rounded-xl border border-emerald-300/25 px-3 py-2 text-xs text-emerald-100 disabled:opacity-50">Add SUPPORT</button><button type="button" onClick={() => requestDiscussion("CHALLENGE")} disabled={loading || !selectedScope || !claimId.trim()} className="rounded-xl border border-rose-300/25 px-3 py-2 text-xs text-rose-100 disabled:opacity-50">Add CHALLENGE</button></div><button type="button" onClick={requestReview} disabled={loading || !selectedScope} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/30 px-3 py-2.5 text-xs text-amber-100 disabled:opacity-50"><GitPullRequest size={14}/> Queue high-value review candidate</button></div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W2 · EXPERT REQUEST</p><h3 className="mt-1 text-lg font-semibold">Xin góc nhìn chuyên môn</h3></div><UsersRound size={20} className="text-amber-300" /></div><div className="mt-4 grid gap-3"><input value={expertDomain} onChange={(event) => setExpertDomain(event.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Domain, ví dụ: ACADEMIC_POLICY"/><textarea value={expertReason} onChange={(event) => setExpertReason(event.target.value)} rows={3} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Vì sao cần Expert xem revision này?"/><button type="button" onClick={requestExpert} disabled={loading || !selectedScope || expertReason.trim().length < 10} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 px-3 py-2.5 text-xs text-amber-100 disabled:opacity-50"><GraduationCap size={14}/> Queue request</button><small className="text-xs text-app-muted">QUEUE chỉ là request. Assignment, COI, qualification và assessment thuộc Expert contract.</small></div></div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W2 · AI DISCUSSION SUMMARY</p><h3 className="mt-1 text-lg font-semibold">Tóm tắt có nguồn dẫn</h3></div><Sparkles size={20} className="text-cyan-300" /></div>{summary ? <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm leading-relaxed">{summary.summaryText}<div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono"><span className="metadata-chip">{summary.providerStatus}</span><span className="metadata-chip">NOT A VERDICT</span><span className="metadata-chip">{summary.discussionIds?.length || 0} cited discussions</span></div></div> : <EmptyState>Chưa có summary durable cho revision này.</EmptyState>}<button type="button" onClick={requestSummary} disabled={loading || !selectedScope} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 px-3 py-2.5 text-xs text-cyan-100 disabled:opacity-50"><Sparkles size={14}/> Generate grounded summary</button></div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W2 · EVIDENCE PASSPORT + RANKING</p><h3 className="mt-1 text-lg font-semibold">Đọc authority, giải thích thứ hạng</h3></div><BookOpenCheck size={20} className="text-emerald-300" /></div><div className="mt-4 flex gap-2"><input value={passportCaseId} onChange={(event) => setPassportCaseId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs" placeholder="Trust case UUID"/><button type="button" onClick={readPassport} disabled={loading || !passportCaseId.trim()} className="rounded-xl border border-emerald-300/30 px-3 text-xs text-emerald-100 disabled:opacity-50"><BookOpenCheck size={14}/></button></div>{passport ? <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3 text-xs"><div className="font-mono">{passport.currentStatus} · REV {passport.revision}</div><div className="mt-2 space-y-1 text-app-muted">{passport.events?.map((event) => <div key={event.id}>#{event.revision} {event.eventType} · {event.summary}</div>)}</div></div> : <p className="mt-3 text-xs text-app-muted">Passport chỉ đọc trong owner scope và do TRUST V5 sở hữu.</p>}<button type="button" onClick={rankCurrent} disabled={loading || !selectedScope} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 px-3 py-2.5 text-xs text-emerald-100 disabled:opacity-50"><Network size={14}/> Calculate transparent ranking</button></div>
    </div>}

    {wave === 3 && <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-rose-300/15 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W3 · SOURCE RETRACTION</p><h3 className="mt-1 text-lg font-semibold">Theo dõi source status</h3></div><AlertTriangle size={20} className="text-rose-300" /></div><ScopeBadge contributionId={contributionId} revision={contributionRevision} verification={verification}/>{sources.length ? <div className="mt-4 space-y-2">{sources.map((source) => <div key={source.id} className="rounded-xl border border-white/10 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><span className="signal-badge">{source.sourceState}</span><span className="truncate text-app-foreground">{source.canonicalUrl}</span></div><div className="mt-1 text-app-muted">Independent family: {source.independenceKey ? "server-clustered" : "uncertain"}</div></div>)}{sourceHistory.length > 0 && <div className="border-t border-white/10 pt-3 text-xs text-app-muted">{sourceHistory.map((event) => <div key={event.id}>Source state {event.previousState || "—"} → {event.nextState} · {event.reason}</div>)}</div>}</div> : <EmptyState>Chưa có source reference ở revision này. Khi source bị retract/unavailable, history và freshness sẽ giữ lại lineage.</EmptyState>}</div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W3 · CAMPUS INTELLIGENCE</p><h3 className="mt-1 text-lg font-semibold">Context theo consent</h3></div><GraduationCap size={20} className="text-cyan-300" /></div><div className="mt-4 grid gap-3"><input value={campus.universityLabel} onChange={(event) => setCampus((current) => ({ ...current, universityLabel: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Tên trường (tự nguyện)"/><div className="grid gap-3 md:grid-cols-2"><input value={campus.faculty} onChange={(event) => setCampus((current) => ({ ...current, faculty: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Khoa (tuỳ chọn)"/><input value={campus.major} onChange={(event) => setCampus((current) => ({ ...current, major: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Ngành (tuỳ chọn)"/></div><input value={campus.topic} onChange={(event) => setCampus((current) => ({ ...current, topic: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Topic context"/><div className="flex flex-wrap gap-3 text-xs"><select aria-label="Mức hiển thị context theo consent" value={campus.visibility} onChange={(event) => setCampus((current) => ({ ...current, visibility: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs"><option value="PRIVATE">PRIVATE</option><option value="PUBLIC">PUBLIC</option></select><label className="inline-flex items-center gap-2"><input type="checkbox" checked={campus.consent} onChange={(event) => setCampus((current) => ({ ...current, consent: event.target.checked }))}/> Tôi đồng ý lưu context này</label></div><button type="button" onClick={saveCampus} disabled={loading || !selectedScope || !campus.consent} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 px-3 py-2.5 text-xs text-cyan-100 disabled:opacity-50"><GraduationCap size={14}/> Save consented context</button><small className="text-xs text-app-muted">Không suy diễn trường/khoa/ngành từ email, profile, vị trí hoặc nội dung.</small></div></div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W3 · RISK PATTERN CLUSTERING</p><h3 className="mt-1 text-lg font-semibold">Safety signal private projection</h3></div><Fingerprint size={20} className="text-rose-300" /></div><div className="mt-4 grid gap-3"><input value={risk.riskType} onChange={(event) => setRisk((current) => ({ ...current, riskType: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs" placeholder="Risk type"/><input value={risk.signalType} onChange={(event) => setRisk((current) => ({ ...current, signalType: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-xs" placeholder="Signal type"/><input value={risk.topic} onChange={(event) => setRisk((current) => ({ ...current, topic: event.target.value }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Topic, không nhập raw private report"/><button type="button" onClick={saveRisk} disabled={loading || !selectedScope} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/30 px-3 py-2.5 text-xs text-rose-100 disabled:opacity-50"><Fingerprint size={14}/> Hash safety signal</button><small className="text-xs text-app-muted">Chỉ aggregate private cluster được lưu; raw content, PII và exact report không vào DTO.</small></div></div>
      <div className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-start justify-between gap-3"><div><p className="product-kicker">W3 · CORRECTION CULTURE + DATA FLYWHEEL</p><h3 className="mt-1 text-lg font-semibold">Sửa có lineage, dữ liệu không tự train</h3></div><RefreshCw size={20} className="text-emerald-300" /></div><div className="mt-4 grid gap-3"><select aria-label="Loại correction" value={correction.type} onChange={(event) => setCorrection((current) => ({ ...current, type: event.target.value, previewDigest: null }))} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs"><option value="SELF_CORRECTION">SELF_CORRECTION</option><option value="ADD_SOURCE">ADD_SOURCE</option><option value="WITHDRAW_CLAIM">WITHDRAW_CLAIM</option><option value="CONTEXT_UPDATE">CONTEXT_UPDATE</option></select><textarea value={correction.statement} onChange={(event) => setCorrection((current) => ({ ...current, statement: event.target.value, previewDigest: null }))} rows={3} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm" placeholder="Nêu correction mới, tối thiểu 20 ký tự"/><div className="flex flex-wrap gap-2"><button type="button" onClick={previewCorrection} disabled={loading || !selectedScope || correction.statement.trim().length < 20} className="rounded-xl border border-white/15 px-3 py-2 text-xs text-app-foreground disabled:opacity-50">Preview correction</button><button type="button" onClick={saveCorrection} disabled={loading || !correction.previewDigest} className="rounded-xl border border-emerald-300/30 px-3 py-2 text-xs text-emerald-100 disabled:opacity-50">Create revision</button><button type="button" onClick={createDataCandidate} disabled={loading || !selectedScope} className="rounded-xl border border-amber-300/30 px-3 py-2 text-xs text-amber-100 disabled:opacity-50">Create private candidate</button></div><small className="text-xs text-app-muted">Correction point delta = 0. Candidate bắt buộc consent/license/annotation/adjudication và hard-false trainingEligible.</small></div></div>
    </div>}

    {selectedScope && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-[11px] font-mono text-app-muted"><span><Network size={13} className="mr-1 inline"/> {independence?.totalSources || 0} sources · {independence?.independentSourceFamilies || 0} source families</span><span>·</span><span><MessageCircleQuestion size={13} className="mr-1 inline"/> {discussions.length} claim discussions</span><span>·</span><span>Community signal only · Trust remains canonical</span></div>}
  </section>;
}
