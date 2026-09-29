"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowUpRight, Check, FileCheck2, Globe2, Link2, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { useAuth } from "@/lib/auth/AuthContext";
import styles from "./community-v4.module.css";

const CONTRIBUTION_TYPES = Object.freeze([
  ["DIRECT_EXPERIENCE", "Trải nghiệm trực tiếp"],
  ["FOUND_SOURCE", "Tôi tìm thấy nguồn"],
  ["NEEDS_VERIFICATION", "Tôi chưa chắc · cần đối chiếu"],
  ["SUPPORTING_EVIDENCE", "Bổ sung bằng chứng"],
  ["CONTRADICTING_EVIDENCE", "Bằng chứng khác chiều"],
  ["CONTEXT", "Bổ sung bối cảnh"],
  ["CRITIQUE", "Phản biện"],
]);

const CLAIM_REQUIRED = new Set(["SUPPORTING_EVIDENCE", "CONTRADICTING_EVIDENCE", "CRITIQUE"]);

function dateLabel(value) {
  if (!value) return "Trust case";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Trust case" : parsed.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

function safeGeneralSourceUrl(value) {
  const url = safeSourceUrl(value);
  return url && new URL(url).protocol === "https:" ? url : "";
}

function trapDialogFocus(event, dialog) {
  if (event.key !== "Tab" || !dialog) return;
  const focusable = [...dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")]
    .filter((element) => element.getAttribute("aria-hidden") !== "true");
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export default function CommunityComposer({ onClose, onPublished, initialMode = "GENERAL", initialCaseId = null, initialCaseRevision = null, restoreFocusRef = null }) {
  const { profile, isAuthenticated } = useAuth();
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const idempotencyRef = useRef(createSecureId("community-contribution"));
  const [cases, setCases] = useState([]);
  const [caseLoading, setCaseLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [caseDetailState, setCaseDetailState] = useState({ caseId: "", value: null });
  const [caseError, setCaseError] = useState("");
  const [contributionType, setContributionType] = useState("DIRECT_EXPERIENCE");
  const [claimId, setClaimId] = useState("");
  const [statement, setStatement] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState([]);
  const [preview, setPreview] = useState(null);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("write");
  const [mode, setMode] = useState(["GENERAL", "SOURCE", "VERIFY"].includes(initialMode) ? initialMode : "GENERAL");
  const [generalText, setGeneralText] = useState("");
  const [generalSourceUrl, setGeneralSourceUrl] = useState("");
  const [generalBusy, setGeneralBusy] = useState(false);
  const [generalError, setGeneralError] = useState("");

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    openerRef.current = restoreFocusRef?.current || document.activeElement;
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector("select, textarea, input, button")?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
      trapDialogFocus(event, dialogRef.current);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      window.requestAnimationFrame(() => {
        const opener = openerRef.current;
        if (!opener?.isConnected || document.querySelector('[aria-modal="true"]')) return;
        opener.focus?.();
      });
    };
  }, [restoreFocusRef]);

  useEffect(() => {
    if (mode !== "VERIFY") return undefined;
    const controller = new AbortController();
    apiRequest("/api/v1/trust/cases?limit=50", { signal: controller.signal, requestId: createSecureId("community-trust-cases") })
      .then((payload) => {
        if (controller.signal.aborted) return;
        const rows = Array.isArray(payload?.cases) ? payload.cases : [];
        const eligible = rows.filter((record) => Number.isInteger(Number(record.case_revision)) && Number(record.case_revision) > 0);
        setCases(eligible);
        const requested = initialCaseId ? eligible.find((row) => row.id === initialCaseId && Number(row.case_revision) === initialCaseRevision) : null;
        setSelectedCaseId(initialCaseId ? requested?.id || "" : eligible[0]?.id || "");
        if (initialCaseId && !requested) setCaseError("Hồ sơ hoặc phiên bản được liên kết chưa khả dụng. Hãy chọn rõ hồ sơ hiện tại trước khi tiếp tục.");
        if (!eligible.length) setCaseError("Bạn chưa có Trust case đã lưu. Tạo một case trong Trust trước khi đăng đóng góp có phạm vi rõ.");
      })
      .catch((caught) => {
        if (caught?.code !== "ABORTED") setCaseError(apiErrorMessage(caught));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCaseLoading(false);
      });
    return () => controller.abort("community-case-picker-unmounted");
  }, [mode, initialCaseId, initialCaseRevision]);

  useEffect(() => {
    if (mode !== "VERIFY" || !selectedCaseId) return undefined;
    const controller = new AbortController();
    apiRequest(`/api/v1/trust/cases/${encodeURIComponent(selectedCaseId)}`, { signal: controller.signal, requestId: createSecureId("community-trust-case-detail") })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setCaseDetailState({ caseId: selectedCaseId, value: payload?.case || null });
      })
      .catch((caught) => {
        if (caught?.code !== "ABORTED") {
          setCaseDetailState({ caseId: selectedCaseId, value: null });
          setCaseError(apiErrorMessage(caught));
        }
      });
    return () => controller.abort("community-case-changed");
  }, [mode, selectedCaseId]);

  const selectedCase = useMemo(() => cases.find((record) => record.id === selectedCaseId) || null, [cases, selectedCaseId]);
  const hasCurrentCaseDetail = caseDetailState.caseId === selectedCaseId;
  const detailLoading = Boolean(selectedCaseId) && !hasCurrentCaseDetail;
  const currentCaseDetail = hasCurrentCaseDetail ? caseDetailState.value : null;
  const claims = Array.isArray(currentCaseDetail?.claims) ? currentCaseDetail.claims : [];
  const evidence = Array.isArray(currentCaseDetail?.evidence) ? currentCaseDetail.evidence : [];
  const claimIsRequired = CLAIM_REQUIRED.has(contributionType);
  const sourceIsValid = !sourceUrl.trim() || Boolean(safeSourceUrl(sourceUrl.trim()));
  const canPreview = Boolean(
    !busy && selectedCase?.id && selectedCase.case_revision
      && statement.trim().length >= 20 && statement.trim().length <= 20_000
      && (!claimIsRequired || claimId) && sourceIsValid
  );

  const invalidatePreview = useCallback(() => {
    setPreview(null);
    setPrivacyConfirmed(false);
    setError("");
  }, []);

  const requestBody = useCallback(() => {
    const safeUrl = sourceUrl.trim() ? safeSourceUrl(sourceUrl.trim()) : "";
    const source = safeUrl ? { url: safeUrl, publisher: new URL(safeUrl).hostname } : null;
    return {
      caseId: selectedCase?.id,
      caseRevision: Number(selectedCase?.case_revision),
      claimId: claimId || null,
      contributionType,
      statement: statement.trim(),
      evidenceRevisionIds: selectedEvidence,
      evidenceRefs: source ? [{ id: source.url }] : [],
      source,
    };
  }, [selectedCase, claimId, contributionType, statement, selectedEvidence, sourceUrl]);

  const createPreview = async (event) => {
    event?.preventDefault?.();
    if (!canPreview) return;
    setBusy(true);
    setError("");
    try {
      const payload = await apiRequest("/api/intelligence/community/posts", {
        method: "POST",
        body: JSON.stringify({ ...requestBody(), phase: "PREVIEW" }),
        requestId: createSecureId("community-preview"),
      });
      setPreview(payload?.preview || null);
      setStep("preview");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const publish = async (event) => {
    event?.preventDefault?.();
    if (!privacyConfirmed || preview?.state !== "PREVIEW_READY" || !preview?.previewDigest) return;
    setBusy(true);
    setError("");
    try {
      const payload = await apiRequest("/api/intelligence/community/posts", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyRef.current },
        body: JSON.stringify({
          ...requestBody(),
          phase: "PUBLISH",
          privacyConfirmed: true,
          previewDigest: preview.previewDigest,
          idempotencyKey: idempotencyRef.current,
        }),
        requestId: createSecureId("community-publish"),
      });
      if (payload?.state === "PUBLISHED") onPublished?.(payload.post);
      else setError("Máy chủ chưa xác nhận bài đã đăng. Tải lại bảng tin để kiểm tra trạng thái.");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const toggleEvidence = (id) => {
    setSelectedEvidence((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    invalidatePreview();
  };

  const submitGeneralPost = async (event) => {
    event.preventDefault();
    if (!isAuthenticated || generalBusy || generalText.trim().length < 20) return;
    const sourceUrl = generalSourceUrl.trim() ? safeGeneralSourceUrl(generalSourceUrl.trim()) : "";
    if (mode === "SOURCE" && !sourceUrl) {
      setGeneralError("Thêm một liên kết HTTPS hợp lệ cho bài chia sẻ nguồn.");
      return;
    }
    setGeneralBusy(true);
    setGeneralError("");
    try {
      const payload = await apiRequest("/api/community/social", {
        method: "POST",
        headers: { "Idempotency-Key": createSecureId("community-social-post") },
        body: JSON.stringify({
          content: generalText.trim(),
          topic: mode === "SOURCE" ? "ACADEMIC" : "GENERAL",
          sourceUrl: mode === "SOURCE" ? sourceUrl : "",
        }),
        requestId: createSecureId("community-social-post"),
      });
      if (payload?.success && payload?.post?.postId) onPublished?.(payload.post);
      else setGeneralError("Máy chủ chưa xác nhận bài đã đăng. Hãy tải lại bảng tin để kiểm tra.");
    } catch (caught) {
      setGeneralError(apiErrorMessage(caught));
    } finally {
      setGeneralBusy(false);
    }
  };

  const modeCopy = mode === "VERIFY"
    ? { kicker: "KIỂM CHỨNG CÓ PHẠM VI", title: "Chia sẻ điều bạn đã đối chiếu.", description: "Đóng góp Kiểm chứng gắn với Trust case do bạn sở hữu. Chỉ statement đã xem trước và xác nhận mới được công khai." }
    : mode === "SOURCE"
      ? { kicker: "NGUỒN CỘNG ĐỒNG", title: "Chia sẻ một nguồn hữu ích.", description: "Bài nguồn được lưu thành bài Community thông thường với chủ đề học thuật và liên kết công khai." }
      : { kicker: "CỘNG ĐỒNG", title: "Bạn muốn chia sẻ điều gì?", description: "Đặt câu hỏi hoặc mở một cuộc thảo luận. Bạn không cần chọn Trust case để đăng bài thường." };

  return (
    <div data-community-overlay="composer" className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section ref={dialogRef} className={styles.composerDialog} role="dialog" aria-modal="true" aria-labelledby="community-composer-title" aria-describedby="community-composer-intro">
        <header className={styles.dialogHeader}>
          <div className={styles.dialogBrand}><span className={styles.dialogBrandIcon}><ShieldCheck size={18} /></span><span>STUDENTHUB <b>/ COMMUNITY</b></span></div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Đóng composer"><X size={19} /></button>
        </header>
        <div className={styles.composerScroll}>
          <div className={styles.composerIntro}>
            <span className={styles.eyebrow}>{modeCopy.kicker}</span>
            <h2 id="community-composer-title">{modeCopy.title}</h2>
            <p id="community-composer-intro">{modeCopy.description}</p>
          </div>

          <div className={styles.composerModeRouter} role="group" aria-label="Chọn cách đăng bài">
            <button type="button" aria-pressed={mode === "GENERAL"} className={mode === "GENERAL" ? styles.composerModeActive : ""} onClick={() => { setMode("GENERAL"); setGeneralError(""); }}>Thảo luận / Câu hỏi</button>
            <button type="button" aria-pressed={mode === "SOURCE"} className={mode === "SOURCE" ? styles.composerModeActive : ""} onClick={() => { setMode("SOURCE"); setGeneralError(""); }}>Nguồn</button>
            <button type="button" disabled aria-describedby="community-media-description">Ảnh/Video <small>Sắp có</small></button>
            <button type="button" aria-pressed={mode === "VERIFY"} className={mode === "VERIFY" ? styles.composerModeActive : ""} onClick={() => { setMode("VERIFY"); setGeneralError(""); }}>Kiểm chứng</button>
          </div>
          <span id="community-media-description" className={styles.srOnly}>Tải ảnh và video chưa được hỗ trợ.</span>

          {mode !== "VERIFY" ? (
            <form className={styles.generalComposerForm} onSubmit={submitGeneralPost}>
              <div className={styles.composerScope}>
                <Globe2 size={15} /><span>Đối tượng <strong>Công khai</strong>. Tên và ảnh hồ sơ công khai của bạn sẽ xuất hiện cùng bài đăng; email và thông tin tài khoản riêng không được hiển thị.</span>
              </div>
              <div className={styles.identityDisclosure}>
                {profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- User-supplied avatar hosts are unrestricted, so they bypass the remote image optimizer.
                  <img src={profile.avatarUrl} alt="" />
                ) : <span aria-hidden="true">{String(profile?.fullName || "B").trim().slice(0, 1).toLocaleUpperCase("vi")}</span>}
                <div><strong>{profile?.fullName || "Thành viên StudentHub"}</strong><small>Hồ sơ công khai · chưa có chế độ đăng ẩn danh</small></div>
              </div>
              <label className={styles.formField}>
                <span>{mode === "SOURCE" ? "Ý nghĩa của nguồn" : "Bài viết"} <small>· tối thiểu 20 ký tự</small></span>
                <textarea value={generalText} onChange={(event) => { setGeneralText(event.target.value); setGeneralError(""); }} minLength={20} maxLength={20_000} rows={6} required placeholder={mode === "SOURCE" ? "Nguồn này giúp làm rõ điều gì? Nêu giới hạn nếu có." : "Bạn muốn hỏi hoặc mở cuộc trò chuyện nào?"} />
                <span className={styles.characterCount}>{generalText.length.toLocaleString("vi-VN")} / 20.000</span>
              </label>
              {mode === "SOURCE" && <label className={styles.formField}>
                <span><Link2 size={14} /> Liên kết nguồn <small>· bắt buộc</small></span>
                <input type="url" inputMode="url" value={generalSourceUrl} onChange={(event) => { setGeneralSourceUrl(event.target.value); setGeneralError(""); }} placeholder="https://…" required />
              </label>}
              <div className={styles.mediaBoundary}><AlertCircle size={16} /><span>Ảnh/Video chưa khả dụng vì Community chưa có luồng tải và dẫn xuất media công khai an toàn.</span></div>
              {generalError && <p className={styles.inlineError} role="alert">{generalError}</p>}
              <div className={styles.composerFooter}>
                <span className={styles.privacyFootnote}><LockKeyhole size={13} /> Nội dung công khai; không thêm thông tin nhận diện cá nhân.</span>
                {isAuthenticated
                  ? <button type="submit" className={styles.composeButton} disabled={generalBusy || generalText.trim().length < 20 || (mode === "SOURCE" && !safeGeneralSourceUrl(generalSourceUrl.trim()))}><Check size={16} /> {generalBusy ? "Đang đăng…" : "Đăng bài"}</button>
                  : <Link href={`/login?next=${encodeURIComponent("/community")}`} className={styles.composeButton}>Đăng nhập để đăng <ArrowUpRight size={14} /></Link>}
              </div>
            </form>
          ) : caseLoading ? <div className={styles.caseLoading} role="status">Đang tải Trust case của bạn…</div> : cases.length === 0 ? (
            <div className={styles.noCases}>
              <LockKeyhole size={19} /><div><strong>Cần Trust case trước</strong><p>{caseError || "Chưa có Trust case sẵn sàng để liên kết."}</p><Link href="/trust" className={styles.secondaryButton}>Mở Trust <ArrowUpRight size={14} /></Link></div>
            </div>
          ) : (
            <form onSubmit={step === "write" ? createPreview : publish}>
              <label className={styles.formField}>
                <span>Trust case <small>· riêng tư</small></span>
                <select value={selectedCaseId} onChange={(event) => { setSelectedCaseId(event.target.value); setClaimId(""); setSelectedEvidence([]); invalidatePreview(); }} required>
                  {cases.map((record) => <option key={record.id} value={record.id}>Case · {dateLabel(record.created_at)} · revision {record.case_revision} · {record.state}</option>)}
                </select>
              </label>

              <div className={styles.composerScope}>
                <LockKeyhole size={15} /> <span>Trust case, kết luận, tệp gốc và dữ liệu riêng tư vẫn chỉ bạn xem được.</span>
              </div>

              <label className={styles.formField}>
                <span>Loại đóng góp</span>
                <select value={contributionType} onChange={(event) => { setContributionType(event.target.value); invalidatePreview(); }}>
                  {CONTRIBUTION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              {claimIsRequired && <label className={styles.formField}>
                <span>Mệnh đề liên quan <small>· bắt buộc với loại đóng góp này</small></span>
                <select value={claimId} onChange={(event) => { setClaimId(event.target.value); invalidatePreview(); }} required>
                  <option value="">Chọn claim trong Trust case</option>
                  {claims.map((claim) => <option key={claim.id} value={claim.id}>{String(claim.statement || "Claim").slice(0, 150)}</option>)}
                </select>
                {detailLoading && <small className={styles.fieldHint}>Đang tải claims…</small>}
                {!detailLoading && !claims.length && <small className={styles.fieldHint}>Case này chưa có claim liên kết; chọn loại đóng góp khác hoặc cập nhật Trust case.</small>}
              </label>}

              <label className={styles.formField}>
                <span>Statement công khai <small>· tối đa 20.000 ký tự</small></span>
                <textarea value={statement} onChange={(event) => { setStatement(event.target.value); invalidatePreview(); }} minLength={20} maxLength={20_000} rows={7} required placeholder="Mô tả điều đã quan sát, mốc thời gian và giới hạn bạn biết. Tránh thông tin định danh." />
                <span className={styles.characterCount}>{statement.length.toLocaleString("vi-VN")} / 20.000</span>
              </label>

              {evidence.length > 0 && <fieldset className={styles.evidencePicker}>
                <legend><FileCheck2 size={15} /> Tham chiếu evidence đã lưu trong Trust <small>· tùy chọn</small></legend>
                <div className={styles.evidenceOptions}>
                  {evidence.slice(0, 30).map((item, index) => {
                    const id = item.id;
                    if (!id) return null;
                    return <label key={id} className={styles.evidenceOption}>
                      <input type="checkbox" checked={selectedEvidence.includes(id)} onChange={() => toggleEvidence(id)} />
                      <span><strong>Evidence {index + 1}</strong><small>{item.source_type || item.sourceType || "Nguồn"} · {dateLabel(item.observed_at || item.observedAt)}</small></span>
                    </label>;
                  })}
                </div>
              </fieldset>}

              <label className={styles.formField}>
                <span><Link2 size={14} /> Liên kết nguồn <small>· tùy chọn</small></span>
                <input type="url" inputMode="url" value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); invalidatePreview(); }} placeholder="https://…" aria-invalid={!sourceIsValid} />
                {!sourceIsValid && <small className={styles.inlineError}>Chỉ hỗ trợ liên kết HTTP hoặc HTTPS hợp lệ.</small>}
              </label>

              <div className={styles.mediaBoundary}><AlertCircle size={16} /><span>Luồng tải ảnh/tệp công khai an toàn chưa được bật. Không giả lập đính kèm; chỉ liên kết evidence đã lưu trong Trust hoặc nguồn ngoài.</span></div>

              {step === "preview" && preview && <section className={styles.previewBox} aria-labelledby="privacy-preview-heading">
                <div className={styles.previewHeading}>
                  <div><span className={styles.eyebrow}>SERVER PRIVACY SCAN</span><h3 id="privacy-preview-heading">Xem trước phạm vi công khai</h3></div>
                  {preview.state === "PREVIEW_READY" ? <span className={styles.previewReady}><Check size={14} /> Sẵn sàng xem xét</span> : <span className={styles.previewBlocked}><AlertCircle size={14} /> Chưa thể đăng</span>}
                </div>
                <div className={styles.publicPreview}><span>STATEMENT CÔNG KHAI</span><p>{preview.redactedStatement || "Không có bản xem trước."}</p></div>
                {preview.scan?.findings?.length > 0 && <div className={styles.scanFindings} role="status"><strong>Phát hiện cần xem:</strong> {preview.scan.findings.map((finding) => finding.type).join(", ")}</div>}
                {preview.state === "PREVIEW_READY" && <label className={styles.consentCheck}>
                  <input type="checkbox" checked={privacyConfirmed} onChange={(event) => setPrivacyConfirmed(event.target.checked)} />
                  <span>Tôi đã xem statement phía trên và xác nhận công khai đúng nội dung này. Trust case và dữ liệu riêng tư không được công khai.</span>
                </label>}
              </section>}

              {caseError && <p className={styles.inlineError} role="alert">{caseError}</p>}
              {error && <p className={styles.inlineError} role="alert">{error}</p>}
              <div className={styles.composerFooter}>
                {step === "preview" ? <button type="button" className={styles.backButton} onClick={() => { setStep("write"); invalidatePreview(); }}><ArrowLeft size={15} /> Sửa statement</button> : <span className={styles.privacyFootnote}><LockKeyhole size={13} /> Xem trước bắt buộc trước khi đăng</span>}
                {step === "write" ? <button type="submit" className={styles.composeButton} disabled={!canPreview}><ShieldCheck size={16} /> {busy ? "Đang quét…" : "Tạo bản xem trước"}</button> : <button type="submit" className={styles.composeButton} disabled={busy || preview?.state !== "PREVIEW_READY" || !privacyConfirmed}><Check size={16} /> {busy ? "Đang đăng…" : "Xác nhận và đăng"}</button>}
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
