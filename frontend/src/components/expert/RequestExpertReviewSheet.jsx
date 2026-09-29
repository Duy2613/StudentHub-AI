"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowUpRight, LoaderCircle, Send, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { apiRequest } from "@/lib/api/runtimeClient";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import styles from "./expert-v4.module.css";

const ACTIVE_REQUEST_STATES = new Set(["REQUESTED", "MATCHING", "ASSIGNED", "IN_REVIEW"]);
const EMPTY_CONTEXT_REFS = Object.freeze([]);
const STATUS_COPY = Object.freeze({
  REQUESTED: "Yêu cầu đã được ghi nhận. Việc matching và phân công do server quyết định.",
  MATCHING: "Server đang tìm người phù hợp theo domain và điều kiện hiện có.",
  ASSIGNED: "Server đã phân công người đánh giá cho yêu cầu này.",
  IN_REVIEW: "Yêu cầu đang được đánh giá.",
  COMPLETED: "Yêu cầu đã hoàn tất.",
  CANCELLED: "Yêu cầu đã đóng.",
  EXPIRED: "Yêu cầu đã hết hạn.",
});

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function caseLabel(record) {
  const shortId = String(record.id || "").slice(0, 8);
  const state = record.state ? ` · ${String(record.state).replaceAll("_", " ")}` : "";
  const hasRevision = record.case_revision !== null && record.case_revision !== undefined && Number.isInteger(Number(record.case_revision)) && Number(record.case_revision) >= 1;
  const revision = hasRevision ? ` · rev ${record.case_revision}` : " · revision chưa có";
  return `Trust ${shortId}${state}${revision}`;
}

function focusables(container) {
  return [...(container?.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href], [tabindex]:not([tabindex='-1'])") || [])]
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
}

export default function RequestExpertReviewSheet({
  caseId: initialCaseId = null,
  caseRevision: initialCaseRevision = null,
  claimId = null,
  contextRefs = EMPTY_CONTEXT_REFS,
  communityContributionId = null,
  defaultDomainCode = "",
  restoreFocusRef = null,
  onClose,
  onStateChange,
}) {
  const sheetRef = useRef(null);
  const closeRef = useRef(onClose);
  const idempotencyKeyRef = useRef("");
  const initialScope = useMemo(() => ({
    caseId: initialCaseId,
    caseRevision: initialCaseRevision,
  }), [initialCaseId, initialCaseRevision]);
  const [cases, setCases] = useState([]);
  const [casesState, setCasesState] = useState(initialCaseId ? "READY" : "LOADING");
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId || "");
  const [domainCode, setDomainCode] = useState(defaultDomainCode || "");
  const [question, setQuestion] = useState("");
  const [requests, setRequests] = useState([]);
  const [requestState, setRequestState] = useState("IDLE");
  const [error, setError] = useState("");
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPortalReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!portalReady) return undefined;
    const previousFocus = restoreFocusRef?.current || document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => sheetRef.current?.querySelector("button, select, input, textarea")?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusables(sheetRef.current);
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault();
        controls[0]?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        if (previousFocus?.isConnected && !document.querySelector('[aria-modal="true"]')) {
          previousFocus.focus?.({ preventScroll: true });
        }
      });
    };
  }, [portalReady, restoreFocusRef]);

  useEffect(() => {
    if (initialCaseId) {
      let active = true;
      const timer = window.setTimeout(() => {
        if (!active) return;
        setCases([{ id: initialCaseId, case_revision: initialCaseRevision }]);
        setCasesState("READY");
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    }
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setCasesState("LOADING");
      apiRequest("/api/v1/trust/cases?limit=100", {
        signal: controller.signal,
        requestId: createSecureId("expert-request-cases"),
      }).then((payload) => {
        if (controller.signal.aborted) return;
        const ownedCases = Array.isArray(payload?.cases) ? payload.cases.filter((record) => isUuid(record?.id)) : [];
        setCases(ownedCases);
        setSelectedCaseId((current) => current || ownedCases[0]?.id || "");
        setCasesState(ownedCases.length ? "READY" : "EMPTY");
      }).catch((caught) => {
        if (controller.signal.aborted || (caught instanceof ApiError && caught.code === "ABORTED")) return;
        setError(apiErrorMessage(caught));
        setCasesState("ERROR");
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort("expert-request-case-list-closed");
    };
  }, [initialCaseId, initialCaseRevision]);

  const selectedCase = cases.find((record) => String(record.id) === String(selectedCaseId)) || null;
  const effectiveCaseId = initialScope.caseId || selectedCase?.id || null;
  const effectiveCaseRevision = initialScope.caseRevision ?? selectedCase?.case_revision ?? null;
  const validScope = isUuid(effectiveCaseId) && Number.isInteger(Number(effectiveCaseRevision)) && Number(effectiveCaseRevision) >= 1;
  const scopeKey = `${effectiveCaseId || ""}:${effectiveCaseRevision || ""}:${claimId || ""}:${communityContributionId || ""}`;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      idempotencyKeyRef.current = "";
      setRequests([]);
      setError("");
      if (!validScope) {
        setRequestState("UNKNOWN");
        return;
      }
      setRequestState("LOADING");
      apiRequest(`/api/expert/review-requests?caseId=${encodeURIComponent(effectiveCaseId)}&limit=10`, {
        signal: controller.signal,
        requestId: createSecureId("expert-review-requests-read"),
      }).then((payload) => {
        if (controller.signal.aborted) return;
        let rows = Array.isArray(payload?.data) ? payload.data : [];
        rows = rows.filter((row) => Number(row.caseRevision) === Number(effectiveCaseRevision)
          && (!claimId || String(row.claimId || "") === String(claimId))
          && (!communityContributionId || String(row.communityContributionId || "") === String(communityContributionId)));
        setRequests(rows);
        const activeRequest = rows.find((row) => ACTIVE_REQUEST_STATES.has(String(row.status).toUpperCase()));
        const nextState = activeRequest?.status || rows[0]?.status || "IDLE";
        setRequestState(String(nextState).toUpperCase());
        onStateChange?.(nextState);
      }).catch((caught) => {
        if (controller.signal.aborted || (caught instanceof ApiError && caught.code === "ABORTED")) return;
        setError(apiErrorMessage(caught));
        setRequestState("ERROR");
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort("expert-review-request-scope-changed");
    };
  }, [scopeKey, validScope, effectiveCaseId, effectiveCaseRevision, claimId, communityContributionId, onStateChange]);

  const activeRequest = requests.find((row) => ACTIVE_REQUEST_STATES.has(String(row.status).toUpperCase())) || null;

  const submit = useCallback(async (event) => {
    event.preventDefault();
    const normalizedDomain = domainCode.trim().toUpperCase().replace(/\s+/g, "_");
    const normalizedQuestion = question.trim();
    if (!validScope) {
      setRequestState("UNKNOWN");
      setError("Yêu cầu cần case ID và revision bền vững từ hồ sơ Trust của bạn.");
      return;
    }
    if (!/^[A-Z0-9][A-Z0-9_.:-]{0,79}$/.test(normalizedDomain)) {
      setRequestState("VALIDATION");
      setError("Nhập domain/category bằng chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.");
      return;
    }
    if (normalizedQuestion.length < 20 || normalizedQuestion.length > 4000) {
      setRequestState("VALIDATION");
      setError("Câu hỏi cần có từ 20 đến 4.000 ký tự.");
      return;
    }
    setRequestState("SUBMITTING");
    setError("");
    const stableKey = idempotencyKeyRef.current || createSecureId("expert-review-request");
    idempotencyKeyRef.current = stableKey;
    try {
      const payload = await apiRequest("/api/expert/review-requests", {
        method: "POST",
        headers: { "Idempotency-Key": stableKey },
        requestId: createSecureId("expert-review-request-submit"),
        body: JSON.stringify({
          caseId: effectiveCaseId,
          caseRevision: Number(effectiveCaseRevision),
          claimId: claimId || null,
          domainCode: normalizedDomain,
          question: normalizedQuestion,
          contextRefs: Array.isArray(contextRefs) ? contextRefs : [],
          communityContributionId: communityContributionId || null,
        }),
      });
      const created = payload?.data;
      if (!created?.id || !created?.status) throw new Error("Server response did not contain a review request.");
      setRequests((current) => [created, ...current.filter((row) => row.id !== created.id)]);
      const nextState = String(payload?.matching?.status || created.status).toUpperCase();
      setRequestState(nextState);
      onStateChange?.(nextState);
      setQuestion("");
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setRequestState(caught instanceof ApiError && caught.status === 409 ? "CONFLICT" : "ERROR");
    }
  }, [question, domainCode, validScope, effectiveCaseId, effectiveCaseRevision, claimId, contextRefs, communityContributionId, onStateChange]);

  if (!portalReady || typeof document === "undefined") return null;
  return createPortal((
    <div className={styles.sheetBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section ref={sheetRef} className={styles.requestSheet} role="dialog" aria-modal="true" aria-labelledby="expert-request-title" aria-describedby="expert-request-description">
        <header className={styles.sheetHeader}>
          <div>
            <span className={styles.eyebrow}>TRUST → EXPERT</span>
            <h2 id="expert-request-title">Yêu cầu đánh giá chuyên môn</h2>
            <p id="expert-request-description">Yêu cầu gắn với một Trust revision. Server quyết định điều kiện và phân công; bạn không chọn một cá nhân qua hồ sơ công khai.</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Đóng yêu cầu chuyên gia"><X size={18} /></button>
        </header>

        {!initialCaseId && (
          <label className={styles.field}>
            <span>Hồ sơ Trust của bạn</span>
            {casesState === "LOADING" ? <span className={styles.inlineState} role="status"><LoaderCircle size={15} /> Đang đọc hồ sơ của bạn…</span>
              : casesState === "ERROR" ? <span className={styles.errorState} role="alert">{error || "Không thể đọc hồ sơ Trust."}</span>
                : casesState === "EMPTY" ? <span className={styles.inlineState}>Chưa có hồ sơ Trust bền vững để gắn yêu cầu.</span>
                  : <select value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} aria-label="Chọn hồ sơ Trust">
                    {cases.map((record) => <option key={record.id} value={record.id}>{caseLabel(record)}</option>)}
                  </select>}
          </label>
        )}

        {validScope ? <div className={styles.scopeSummary}>
          <span>Case <strong>…{String(effectiveCaseId).slice(-8)}</strong></span>
          <span>Trust revision <strong>{effectiveCaseRevision}</strong></span>
          {claimId && <span>Claim <strong>…{String(claimId).slice(-8)}</strong></span>}
          {communityContributionId && <span>Community statement <strong>được gắn</strong></span>}
        </div> : initialCaseId ? <p className={styles.errorState} role="status">Không có case revision hợp lệ. Chưa thể gửi yêu cầu.</p> : null}

        {requestState === "LOADING" && <p className={styles.inlineState} role="status"><LoaderCircle size={15} /> Đang đọc trạng thái yêu cầu…</p>}
        {activeRequest && <div className={styles.requestStatus} role="status"><ShieldCheck size={17} /><div><strong>{String(activeRequest.status).replaceAll("_", " ")}</strong><p>{STATUS_COPY[String(activeRequest.status).toUpperCase()] || "Trạng thái do server trả về."}</p></div></div>}

        {!activeRequest && validScope && casesState !== "ERROR" && casesState !== "EMPTY" && (
          <form className={styles.requestForm} onSubmit={submit}>
            <label className={styles.field}>
              <span>Domain hoặc lĩnh vực cần xem xét</span>
              <input value={domainCode} onChange={(event) => setDomainCode(event.target.value)} maxLength={80} autoComplete="off" placeholder="Ví dụ: CYBERSECURITY" required />
            </label>
            <label className={styles.field}>
              <span>Câu hỏi cho người đánh giá <small>Tối thiểu 20 ký tự</small></span>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} minLength={20} maxLength={4000} rows={5} placeholder="Nêu rõ điểm bạn muốn người đánh giá xem xét." required />
              <small className={styles.characterCount}>{question.length}/4000</small>
            </label>
            <p className={styles.privacyNote}><AlertCircle size={15} /> Chỉ gửi câu hỏi và tham chiếu đã chọn. Không thêm thông tin nhận diện cá nhân. Yêu cầu không tự tạo assignment hoặc thay đổi kết luận Trust.</p>
            {error && <p className={styles.errorState} role="alert">{error}</p>}
            <button type="submit" className={styles.submitButton} disabled={requestState === "SUBMITTING" || requestState === "LOADING" || !validScope || question.trim().length < 20 || !domainCode.trim()}>
              {requestState === "SUBMITTING" ? <LoaderCircle size={16} className={styles.spinner} /> : <Send size={16} />}
              {requestState === "SUBMITTING" ? "Đang gửi yêu cầu…" : "Gửi yêu cầu"}
            </button>
          </form>
        )}

        {requests.filter((row) => !ACTIVE_REQUEST_STATES.has(String(row.status).toUpperCase())).length > 0 && (
          <details className={styles.previousRequests}>
            <summary>Yêu cầu trước đó ({requests.length})</summary>
            <ul>{requests.map((row) => <li key={row.id}><span>{String(row.status).replaceAll("_", " ")}</span><span>{row.domainCode || "Domain chưa có"}</span></li>)}</ul>
          </details>
        )}

        {!initialCaseId && casesState === "EMPTY" && <Link className={styles.emptyAction} href="/trust"><ArrowUpRight size={15} /> Tạo hoặc mở hồ sơ Trust</Link>}
      </section>
    </div>
  ), document.body);
}
