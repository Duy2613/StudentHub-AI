"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BookOpenCheck, Check, CircleHelp, ExternalLink, LoaderCircle, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/api/runtimeClient";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { markExpertV4Timing } from "@/lib/performance/expertV4Timing";
import { useRealtime } from "@/components/providers/RealtimeContext";
import styles from "./expert-v4.module.css";

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

function dateLabel(value) {
  if (!value) return "Chưa có thời điểm";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Thời điểm chưa rõ" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function QueueState({ state, error, onRetry }) {
  if (state === "LOADING") return <p className={styles.queueState} role="status"><LoaderCircle size={16} /> Đang đọc assignment từ máy chủ…</p>;
  if (state === "EMPTY") return <div className={styles.queueEmpty}><BookOpenCheck size={20} /><strong>Chưa có assignment đang mở.</strong><p>Queue trống theo phản hồi hiện tại của máy chủ.</p></div>;
  if (state === "ERROR") return <div className={styles.queueError} role="alert"><strong>Không thể đọc assignment.</strong><p>{error || "Queue hiện không khả dụng."}</p><button type="button" onClick={onRetry}>Thử lại</button></div>;
  return null;
}

function EvidenceRecord({ item, selected, onToggle, disabled }) {
  const sourceUrl = safeHttpUrl(item.sourceIdentifier);
  return <article className={styles.evidenceRecord}>
    <label className={styles.evidenceToggle}>
      <input type="checkbox" checked={selected} onChange={onToggle} disabled={disabled} aria-label={`Dẫn chiếu evidence ${item.id}`} />
      <span><strong>{item.sourceType || "Evidence"}</strong><small>ID …{String(item.id).slice(-8)}</small></span>
    </label>
    <p>{item.sourceIdentifier || "Không có source identifier trong dossier."}</p>
    <div className={styles.recordMeta}>
      {item.observedAt && <span>{dateLabel(item.observedAt)}</span>}
      {item.confidence !== null && item.confidence !== undefined && <span>Confidence source record: {Number(item.confidence).toFixed(2)}</span>}
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Mở nguồn</a>}
    </div>
  </article>;
}

export default function ExpertAdjudicationWorkspace({ verifiedDomains = [] }) {
  const { subscribe } = useRealtime();
  const [reviews, setReviews] = useState([]);
  const [queueState, setQueueState] = useState("LOADING");
  const [queueError, setQueueError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [dossier, setDossier] = useState(null);
  const [dossierAssignmentId, setDossierAssignmentId] = useState("");
  const [dossierState, setDossierState] = useState("IDLE");
  const [dossierError, setDossierError] = useState("");
  const [position, setPosition] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [uncertainty, setUncertainty] = useState("");
  const [missingEvidence, setMissingEvidence] = useState("");
  const [confidence, setConfidence] = useState("0.6");
  const [coiDeclared, setCoiDeclared] = useState(false);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [mobileCaseOpen, setMobileCaseOpen] = useState(false);
  const idempotencyKeyRef = useRef("");
  const queueAbortRef = useRef(null);
  const dossierAbortRef = useRef(null);
  const queueItemRefs = useRef(new Map());
  const mobileBackRef = useRef(null);
  const previousMobileCaseOpenRef = useRef(false);
  const preservedAssessmentIdRef = useRef("");
  const isDirty = Boolean(position || reasoning || uncertainty || missingEvidence || selectedEvidenceIds.length || coiDeclared);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    markExpertV4Timing("queue.hydration-complete");
  }, []);

  useEffect(() => {
    if (queueState !== "LOADING") markExpertV4Timing("queue.usable");
  }, [queueState]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const loadQueue = useCallback(async () => {
    queueAbortRef.current?.abort("expert-queue-refresh");
    const controller = new AbortController();
    queueAbortRef.current = controller;
    setQueueState("LOADING");
    setQueueError("");
    try {
      const payload = await apiRequest("/api/expert/blind-reviews", {
        signal: controller.signal,
        requestId: createSecureId("expert-assignment-queue"),
      });
      if (controller.signal.aborted) return;
      const nextReviews = Array.isArray(payload?.reviews) ? payload.reviews : [];
      setReviews(nextReviews);
      setQueueState(nextReviews.length ? "READY" : "EMPTY");
      setSelectedId((current) => {
        if (nextReviews.some((review) => review.assignmentId === current)) return current;
        if (current && current === preservedAssessmentIdRef.current) return current;
        if (current && isDirtyRef.current) return current;
        return nextReviews[0]?.assignmentId || "";
      });
    } catch (caught) {
      if (controller.signal.aborted || (caught instanceof ApiError && caught.code === "ABORTED")) return;
      setQueueError(apiErrorMessage(caught));
      setQueueState("ERROR");
    }
  }, []);

  const loadDossier = useCallback(async (assignmentId, { preserveNotice = false } = {}) => {
    if (!assignmentId) return;
    dossierAbortRef.current?.abort("expert-dossier-refresh");
    const controller = new AbortController();
    dossierAbortRef.current = controller;
    setDossierAssignmentId(assignmentId);
    setDossier(null);
    setDossierState("LOADING");
    setDossierError("");
    setSubmitError("");
    if (!preserveNotice) setNotice("");
    setPosition("");
    setReasoning("");
    setUncertainty("");
    setMissingEvidence("");
    setConfidence("0.6");
    setCoiDeclared(false);
    setSelectedEvidenceIds([]);
    idempotencyKeyRef.current = "";
    try {
      const payload = await apiRequest(`/api/expert/blind-reviews/${encodeURIComponent(assignmentId)}`, {
        signal: controller.signal,
        requestId: createSecureId("expert-blind-dossier"),
      });
      if (controller.signal.aborted) return;
      if (!payload?.success || !payload?.dossier) throw new Error("Assigned review dossier is unavailable.");
      setDossier(payload.dossier);
      setDossierState("READY");
      setNeedsRefresh(false);
      if (payload.dossier.isLocked) setNotice("Assessment đã được nộp và khóa theo phản hồi máy chủ.");
    } catch (caught) {
      if (controller.signal.aborted || (caught instanceof ApiError && caught.code === "ABORTED")) return;
      setDossierError(apiErrorMessage(caught));
      setDossierState("ERROR");
      setNeedsRefresh(true);
    }
  }, []);

  const refreshForRelevantEvent = useCallback((record, { alwaysRefresh = false } = {}) => {
    const eventCaseId = record?.data?.caseId;
    if (!dossier?.caseId || dossier.assignmentId !== selectedId || !eventCaseId || String(eventCaseId) !== String(dossier.caseId)) return;
    const eventRevision = Number(record?.data?.caseRevision);
    const currentRevision = Number(dossier.caseRevision);
    const revisionChanged = !Number.isInteger(eventRevision) || eventRevision !== currentRevision;
    if (!revisionChanged && !alwaysRefresh) return;
    if (isDirtyRef.current) {
      setNeedsRefresh(true);
      setNotice("Có cập nhật mới liên quan đến hồ sơ này. Bản nháp đang được giữ trong tab; tải lại dossier trước khi nộp.");
      return;
    }
    setNeedsRefresh(true);
    void loadDossier(dossier.assignmentId, { preserveNotice: true });
  }, [dossier, loadDossier, selectedId]);

  useEffect(() => {
    const onAssignment = (record) => {
      void loadQueue();
      if (record?.data?.assignmentId === selectedId) refreshForRelevantEvent(record, { alwaysRefresh: true });
    };
    const onTrustRevision = (record) => {
      void loadQueue();
      refreshForRelevantEvent(record);
    };
    const onReviewUpdate = (record) => {
      void loadQueue();
      refreshForRelevantEvent(record);
    };
    const unsubscribers = [
      subscribe("expert", "expert:assignment", onAssignment),
      subscribe("expert", "expert:revision", onReviewUpdate),
      subscribe("trust", "trust:revision", onTrustRevision),
      subscribe("trust", "trust:expert_review", () => { void loadQueue(); }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [loadQueue, refreshForRelevantEvent, selectedId, subscribe]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { if (active) void loadQueue(); }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      queueAbortRef.current?.abort("expert-queue-unmounted");
      dossierAbortRef.current?.abort("expert-dossier-unmounted");
    };
  }, [loadQueue]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    const timer = window.setTimeout(() => { if (active) void loadDossier(selectedId); }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      dossierAbortRef.current?.abort("expert-assignment-selection-changed");
    };
  }, [selectedId, loadDossier]);

  useEffect(() => {
    if (mobileCaseOpen && !previousMobileCaseOpenRef.current) mobileBackRef.current?.focus();
    if (!mobileCaseOpen && previousMobileCaseOpenRef.current) queueItemRefs.current.get(selectedId)?.focus();
    previousMobileCaseOpenRef.current = mobileCaseOpen;
  }, [mobileCaseOpen, selectedId]);

  useEffect(() => {
    if (!isDirty || submitting || dossier?.isLocked) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, submitting, dossier?.isLocked]);

  const selectedReview = useMemo(() => reviews.find((review) => review.assignmentId === selectedId) || null, [reviews, selectedId]);
  const currentDossier = dossier?.assignmentId === selectedId ? dossier : null;
  const visibleDossierState = !selectedId ? "IDLE" : dossierAssignmentId === selectedId ? dossierState : "LOADING";

  useEffect(() => {
    if (currentDossier && visibleDossierState === "READY") markExpertV4Timing("case.usable");
  }, [currentDossier, visibleDossierState]);
  const evidence = Array.isArray(currentDossier?.evidence) ? currentDossier.evidence : [];
  const evidenceIds = Array.isArray(currentDossier?.evidenceRevisionIds) ? currentDossier.evidenceRevisionIds : [];
  const missingEvidenceIds = Array.isArray(currentDossier?.missingEvidenceIds) ? currentDossier.missingEvidenceIds : [];
  const activeDomain = String(currentDossier?.domain || selectedReview?.domain || "").toUpperCase();
  const normalizedVerifiedDomains = verifiedDomains.map((item) => String(item).trim().toUpperCase()).filter(Boolean);
  const domainAuthorized = Boolean(activeDomain && normalizedVerifiedDomains.includes(activeDomain));
  const caseIsPublic = String(currentDossier?.caseVisibility || "").toUpperCase() === "PUBLIC";
  const assignmentConflicted = currentDossier?.conflictOfInterest === true;
  const conflictStateUnknown = currentDossier?.conflictOfInterest !== false;
  const revision = Number(currentDossier?.caseRevision);
  const hasBinding = Boolean(currentDossier?.assignmentId && currentDossier?.caseId && Number.isInteger(revision) && revision >= 1 && activeDomain && domainAuthorized);
  const assignmentInQueue = queueState === "READY" && reviews.some((review) => review.assignmentId === currentDossier?.assignmentId);
  const canSubmit = hasBinding && assignmentInQueue && caseIsPublic && !conflictStateUnknown && !missingEvidenceIds.length && !needsRefresh && !currentDossier?.isLocked && coiDeclared && position.trim().length >= 3 && reasoning.trim().length >= 20 && !submitting;

  const changeReview = (review) => {
    if (!review) return;
    if (review.assignmentId === selectedId) {
      setMobileCaseOpen(true);
      return;
    }
    if (isDirty && !dossier?.isLocked && !window.confirm("Đánh giá chưa được nộp. Đổi hồ sơ sẽ bỏ bản nháp chưa lưu khỏi bộ nhớ phiên này. Tiếp tục?")) return;
    setSelectedId(review.assignmentId);
    setNeedsRefresh(false);
    setMobileCaseOpen(true);
  };

  const toggleEvidence = (evidenceId) => {
    setSelectedEvidenceIds((current) => current.includes(evidenceId) ? current.filter((id) => id !== evidenceId) : [...current, evidenceId]);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError("");
    setNotice("");
    const stableKey = idempotencyKeyRef.current || createSecureId("expert-assessment");
    idempotencyKeyRef.current = stableKey;
    const missingItems = missingEvidence.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 50);
    try {
      const payload = await apiRequest("/api/expert/assessments", {
        method: "POST",
        headers: { "Idempotency-Key": stableKey },
        requestId: createSecureId("expert-assessment-submit"),
        body: JSON.stringify({
          caseId: dossier.caseId,
          caseRevision: Number(dossier.caseRevision),
          claimId: dossier.claimId || null,
          assignmentId: dossier.assignmentId,
          domainCode: activeDomain,
          evidenceRevisionIds: selectedEvidenceIds,
          assessment: { conclusion: position.trim(), reasoning: reasoning.trim(), evidenceReferencedIds: selectedEvidenceIds, uncertainty: uncertainty.trim(), missingEvidence: missingItems },
          confidence: Number(confidence),
          conclusionWithinScope: position.trim(),
          reasoning: reasoning.trim(),
          uncertainty: uncertainty.trim(),
          missingEvidence: missingItems,
          coiDeclared: true,
        }),
      });
      if (!payload?.success || !payload?.data) throw new Error("Server did not confirm assessment submission.");
      preservedAssessmentIdRef.current = dossier.assignmentId;
      setNotice("Assessment đã được ghi nhận. Đang đọc lại trạng thái do máy chủ trả về.");
      await loadDossier(dossier.assignmentId);
      await loadQueue();
    } catch (caught) {
      setSubmitError(apiErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 409) {
        setNeedsRefresh(true);
        setNotice("Máy chủ báo case hoặc assignment đã thay đổi. Tải lại dossier trước khi tiếp tục.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeMobileCase = () => {
    setMobileCaseOpen(false);
    if (isDirty && !dossier?.isLocked) setNotice("Bản nháp vẫn được giữ trong tab. Chuyển assignment hoặc tải lại dossier sẽ bỏ bản nháp này.");
  };

  return (
    <section className={styles.adjudication} aria-labelledby="expert-adjudication-title">
      <header className={styles.adjudicationHeader}>
        <div><span className={styles.eyebrow}>EXPERT · BLIND ADJUDICATION</span><h2 id="expert-adjudication-title">Hàng đợi đánh giá</h2><p>Chỉ assignment do máy chủ gán. Trước khi nộp, Trust/AI verdict và đánh giá của chuyên gia khác không được đưa vào dossier này.</p></div>
        <button type="button" className={styles.refreshButton} onClick={() => void loadQueue()}><LoaderCircle size={15} /> Làm mới queue</button>
      </header>

      <div className={styles.adjudicationGrid}>
        <aside className={`${styles.queuePane} ${mobileCaseOpen ? styles.queuePaneHiddenMobile : ""}`} aria-label="Assignments được giao">
          <div className={styles.queuePaneTitle}><h3>Assignments</h3><span>{queueState === "READY" ? reviews.length : "—"}</span></div>
          <QueueState state={queueState} error={queueError} onRetry={() => void loadQueue()} />
          {queueState === "READY" && <ul className={styles.queueList}>
            {reviews.map((review) => <li key={review.assignmentId}>
              <button ref={(node) => { if (node) queueItemRefs.current.set(review.assignmentId, node); else queueItemRefs.current.delete(review.assignmentId); }} type="button" className={review.assignmentId === selectedId ? styles.queueItemActive : styles.queueItem} onClick={() => changeReview(review)} aria-current={review.assignmentId === selectedId ? "true" : undefined}>
                <span className={styles.queueDomain}>{String(review.domain || "Domain chưa có").replaceAll("_", " ")}</span>
                <strong>{review.claim || "Claim chưa được công bố"}</strong>
                {review.reviewQuestion && <span className={styles.queueMeta}>Câu hỏi: {review.reviewQuestion}</span>}
                <span className={styles.queueMeta}>rev {review.caseRevision} · {String(review.status || "UNKNOWN").replaceAll("_", " ")}</span>
                {review.deadline && <span className={styles.queueMeta}>Hạn {dateLabel(review.deadline)}</span>}
              </button>
            </li>)}
          </ul>}
        </aside>

        <div className={`${styles.casePane} ${mobileCaseOpen ? styles.casePaneVisibleMobile : ""}`}>
          {mobileCaseOpen && <button ref={mobileBackRef} type="button" className={styles.mobileBack} onClick={closeMobileCase}><ArrowLeft size={15} /> Quay lại queue</button>}
          {visibleDossierState === "IDLE" && <div className={styles.casePlaceholder}><CircleHelp size={20} /><strong>Chọn một assignment.</strong><p>Case context chỉ xuất hiện sau khi dossier được tải và xác minh theo assignment.</p></div>}
          {visibleDossierState === "LOADING" && <p className={styles.queueState} role="status"><LoaderCircle size={16} /> Đang tải dossier được giao…</p>}
          {visibleDossierState === "ERROR" && <div className={styles.queueError} role="alert"><strong>Không thể tải dossier.</strong><p>{dossierError}</p><button type="button" onClick={() => void loadDossier(selectedId)}>Thử lại</button></div>}
          {visibleDossierState === "READY" && currentDossier && <>
            {!caseIsPublic ? <div className={styles.blockingNotice} role="alert"><ShieldAlert size={17} /><span>Hồ sơ này không có trạng thái công khai cần thiết cho Expert review. Nội dung case bị ẩn và assessment bị khóa.</span></div> : <>
            <div className={styles.caseHeading}>
              <div><span className={styles.eyebrow}>ASSIGNMENT …{String(dossier.assignmentId).slice(-8)}</span><h3>Đánh giá trong phạm vi được giao</h3><p>{activeDomain.replaceAll("_", " ")} · Trust revision {dossier.caseRevision}</p></div>
              <span className={`${styles.assignmentState} ${dossier.isLocked ? styles.assignmentStateLocked : ""}`}>{dossier.isLocked ? "LOCKED" : String(dossier.status || "UNKNOWN").replaceAll("_", " ")}</span>
            </div>

            {assignmentConflicted && <div className={styles.blockingNotice} role="alert"><ShieldAlert size={17} /><span>Assignment có conflict được ghi nhận. Không thể nộp assessment từ giao diện này; đường recusal/coordinator chưa được cung cấp trong contract hiện tại.</span></div>}
            {conflictStateUnknown && !assignmentConflicted && <div className={styles.blockingNotice} role="alert"><ShieldAlert size={17} /><span>Trạng thái conflict của assignment chưa được xác nhận. Chưa thể nộp assessment.</span></div>}
            {!domainAuthorized && <div className={styles.blockingNotice} role="alert"><ShieldAlert size={17} /><span>{normalizedVerifiedDomains.length ? "Domain assignment không khớp danh sách domain đã xác minh của tài khoản hiện tại." : "Danh sách domain đã xác minh của tài khoản chưa có hoặc đang trống. Chưa thể xác nhận quyền đánh giá domain; gửi assessment bị khóa."}</span></div>}
            {(!currentDossier.isLocked && !assignmentInQueue && queueState !== "LOADING" || needsRefresh) && <div className={styles.blockingNotice} role="alert"><ShieldAlert size={17} /><span>{notice || (!assignmentInQueue ? "Assignment này không còn trong queue hiện tại hoặc queue chưa đọc được." : "Dossier có thể đã cũ; hãy tải lại trước khi nộp.")} <button type="button" className={styles.inlineRefreshButton} onClick={() => {
              if (isDirty && !window.confirm("Tải lại dossier sẽ bỏ bản nháp chưa lưu khỏi bộ nhớ tab này. Tiếp tục?")) return;
              setNeedsRefresh(false);
              void loadDossier(dossier.assignmentId);
            }}>Tải lại dossier</button></span></div>}

            <section className={styles.dossierSection} aria-labelledby="expert-case-context-title"><span className={styles.eyebrow}>CASE CONTEXT</span><h4 id="expert-case-context-title">Hồ sơ và câu hỏi</h4><dl className={styles.caseFacts}><div><dt>Case</dt><dd>…{String(dossier.caseId).slice(-8)}</dd></div><div><dt>Revision</dt><dd>{dossier.caseRevision}</dd></div><div><dt>Claim</dt><dd>{dossier.claimId ? `…${String(dossier.claimId).slice(-8)}` : "Không gắn claim riêng"}</dd></div><div><dt>Visibility</dt><dd>{String(dossier.caseVisibility || "UNKNOWN").replaceAll("_", " ")}</dd></div></dl>
              {dossier.claim ? <blockquote className={styles.claimBlock}>{dossier.claim}</blockquote> : <p className={styles.unknownCopy}>Claim text chưa được dossier cung cấp.</p>}
              {dossier.reviewQuestion && <div className={styles.questionBlock}><strong>Câu hỏi gửi kèm</strong><p>{dossier.reviewQuestion}</p></div>}
              {dossier.boundedContext?.snippet && <div className={styles.questionBlock}><strong>Community statement công khai</strong><p>{dossier.boundedContext.snippet}</p></div>}
            </section>

            <section className={styles.dossierSection} aria-labelledby="expert-trust-assessment-title"><span className={styles.eyebrow}>TRUST ASSESSMENT</span><h4 id="expert-trust-assessment-title">Kết quả Trust hiện tại</h4><p className={styles.unknownCopy}>Không có trong blind dossier trước khi Expert nộp. Không suy diễn kết quả Trust từ trạng thái case.</p></section>

            <section className={styles.dossierSection} aria-labelledby="expert-evidence-title"><span className={styles.eyebrow}>EVIDENCE / SOURCES</span><h4 id="expert-evidence-title">Evidence được gắn với yêu cầu</h4>
              {evidenceIds.length === 0 && <p className={styles.unknownCopy}>Dossier không có evidence reference. Có thể ghi rõ thiếu evidence trong assessment.</p>}
              {evidence.length > 0 && <div className={styles.evidenceList}>{evidence.map((item) => <EvidenceRecord key={item.id} item={item} selected={selectedEvidenceIds.includes(item.id)} onToggle={() => toggleEvidence(item.id)} disabled={Boolean(dossier.isLocked)} />)}</div>}
              {missingEvidenceIds.length > 0 && <div className={styles.blockingNotice} role="alert"><AlertCircle size={17} /><span>{missingEvidenceIds.length} evidence ID được yêu cầu nhưng không đọc được cho case này. Assessment bị khóa để tránh ghi sai lineage.</span></div>}
            </section>

            <section className={styles.dossierSection} aria-labelledby="expert-boundaries-title"><span className={styles.eyebrow}>SCOPE / CONFLICT / AGREEMENT</span><h4 id="expert-boundaries-title">Giới hạn hồ sơ</h4><ul className={styles.boundaryList}><li>Assignment domain: {activeDomain.replaceAll("_", " ") || "UNKNOWN"}</li><li>{normalizedVerifiedDomains.length ? `Domain đã xác minh: ${normalizedVerifiedDomains.map((item) => item.replaceAll("_", " ")).join(" · ")}` : "Domain xác minh của tài khoản chưa có trong client profile."}</li><li>Ý kiến của reviewer khác không có trong blind dossier.</li><li>Không có cơ sở để tổng hợp đồng thuận hoặc ghi verdict Trust.</li></ul></section>

            {dossier.isLocked && dossier.ownAssessment && <section className={styles.submittedNotice} role="status"><Check size={17} /><div><strong>Assessment đã nộp</strong><p>{dossier.ownAssessment.reasoning || "Nội dung assessment đã được ghi nhận theo hồ sơ máy chủ."}</p>{dossier.revealGate === "WAITING_FOR_L5" && <small>{dossier.revealMessage}</small>}{dossier.trustResult?.completed && <small>Trust state sau reveal gate: {String(dossier.trustResult.verdict).replaceAll("_", " ")}</small>}</div></section>}

            {!dossier.isLocked && <form className={styles.assessmentForm} onSubmit={submit}>
              <div><span className={styles.eyebrow}>EXPERT ASSESSMENT</span><h4>Nhận định độc lập</h4><p>Draft chỉ nằm trong bộ nhớ tab này. Không lưu vào localStorage; khi rời hồ sơ, nội dung chưa nộp sẽ mất.</p></div>
              <label className={styles.formField}><span>Kết luận trong phạm vi được giao</span><textarea value={position} onChange={(event) => setPosition(event.target.value)} maxLength={4000} rows={3} required placeholder="Nêu kết luận chuyên môn gắn với claim và domain được giao." /></label>
              <label className={styles.formField}><span>Lập luận</span><textarea value={reasoning} onChange={(event) => setReasoning(event.target.value)} minLength={20} maxLength={20000} rows={6} required placeholder="Giải thích căn cứ và bước suy luận. Không đưa thông tin nhận diện cá nhân." /></label>
              <label className={styles.formField}><span>Giới hạn hoặc độ bất định</span><textarea value={uncertainty} onChange={(event) => setUncertainty(event.target.value)} maxLength={4000} rows={3} placeholder="Nêu điều chưa thể kết luận và lý do." /></label>
              <label className={styles.formField}><span>Evidence còn thiếu <small>Mỗi mục một dòng</small></span><textarea value={missingEvidence} onChange={(event) => setMissingEvidence(event.target.value)} maxLength={8000} rows={3} placeholder="Nguồn hoặc kiểm tra cần có tiếp theo." /></label>
              <label className={styles.formField}><span>Mức tự đánh giá độ tin cậy: {Number(confidence).toFixed(2)}</span><input type="range" min="0" max="1" step="0.01" value={confidence} onChange={(event) => setConfidence(event.target.value)} /><small>Đây là độ tin cậy do reviewer tự khai, không phải xác suất đúng hoặc Trust verdict.</small></label>
              <label className={styles.coiDeclaration}><input type="checkbox" checked={coiDeclared} onChange={(event) => setCoiDeclared(event.target.checked)} /><span>Tôi đã rà soát assignment và khai báo không có xung đột lợi ích.</span></label>
              {!coiDeclared && <p className={styles.unknownCopy}>Cần khai báo không có xung đột trước khi gửi. Nếu có xung đột, không tiếp tục nộp assessment.</p>}
              {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
              {notice && !needsRefresh && <p className={styles.submitNotice} role="status">{notice}</p>}
              <button type="submit" className={styles.submitButton} disabled={!canSubmit}>{submitting ? <LoaderCircle size={16} /> : <Check size={16} />}{submitting ? "Đang nộp…" : "Nộp assessment khóa"}<ArrowRight size={15} /></button>
            </form>}
            {dossier.isLocked && notice && <p className={styles.submitNotice} role="status">{notice}</p>}
            </>}
          </>}
        </div>
      </div>
    </section>
  );
}
