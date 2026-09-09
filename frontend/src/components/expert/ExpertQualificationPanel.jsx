"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, LockKeyhole, Send, ShieldCheck, Star, UserRound } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import { apiRequest } from "@/lib/api/runtimeClient";
import { createSecureId } from "@/lib/security/secureId";

const DOMAIN_OPTIONS = [
  ["AI_ML", "AI / ML"],
  ["SOFTWARE_ENGINEERING", "Software engineering"],
  ["DATA_SCIENCE", "Data science"],
  ["CYBERSECURITY", "Cybersecurity"],
  ["EDUCATION", "Education"],
  ["RESEARCH_METHODS", "Research methods"],
];

const STATUS_COPY = {
  IDENTITY_REVIEW: "Đang chờ kiểm tra hồ sơ",
  QUIZ_ELIGIBLE: "Đã đủ điều kiện làm quiz",
  QUIZ_IN_PROGRESS: "Quiz đang mở",
  DOMAIN_REVIEW: "Đang chờ chuyên gia duyệt domain",
  ACTIVE: "Hồ sơ chuyên gia đang hoạt động",
  REJECTED: "Hồ sơ chưa được thông qua",
  APPEALED: "Đang xử lý appeal",
};

function formatRemaining(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function errorText(error) {
  if (error instanceof ApiError) return apiErrorMessage(error);
  return error instanceof Error ? error.message : "Không thể xử lý hồ sơ chuyên gia.";
}

function statusDataFrom(data) {
  return {
    state: data?.state || "NOT_APPLIED",
    application: data?.application || null,
    latestAttempt: data?.latestAttempt || null,
    practiceReviews: Array.isArray(data?.practiceReviews) ? data.practiceReviews : [],
  };
}

export default function ExpertQualificationPanel() {
  const [qualification, setQualification] = useState(null);
  const [trackRecord, setTrackRecord] = useState(null);
  const [trackRecordError, setTrackRecordError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState({ displayName: "", institution: "", bio: "", credentials: "" });
  const [domains, setDomains] = useState(["AI_ML"]);
  const [practiceDomain, setPracticeDomain] = useState("AI_ML");
  const [practiceConclusion, setPracticeConclusion] = useState("");
  const [practiceUncertainty, setPracticeUncertainty] = useState("");
  const [practiceNextAction, setPracticeNextAction] = useState("");
  const [practiceEvidence, setPracticeEvidence] = useState("");
  const [practiceBusy, setPracticeBusy] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const syncQualification = useCallback((data) => {
    const next = statusDataFrom(data);
    setQualification(next);
    if (next.latestAttempt) setAttempt(next.latestAttempt);
    const savedProfile = next.application?.profile;
    if (savedProfile) {
      setProfile((current) => ({
        ...current,
        displayName: savedProfile.displayName || current.displayName,
        institution: savedProfile.institution || current.institution,
        bio: savedProfile.bio || current.bio,
        credentials: Array.isArray(savedProfile.credentials) ? savedProfile.credentials.join(", ") : current.credentials,
      }));
    }
    if (Array.isArray(next.application?.requestedDomains) && next.application.requestedDomains.length) {
      setDomains(next.application.requestedDomains);
      setPracticeDomain((current) => next.application.requestedDomains.includes(current) ? current : next.application.requestedDomains[0]);
    }
  }, []);

  const loadStatus = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const [qualificationResult, trackResult] = await Promise.allSettled([
        apiRequest("/api/expert/qualification", { signal, requestId: createSecureId("qualification-read") }),
        apiRequest("/api/intelligence/community/track-record", { signal, requestId: createSecureId("community-track-record-read") }),
      ]);
      if (qualificationResult.status === "rejected") throw qualificationResult.reason;
      syncQualification(qualificationResult.value?.data);
      if (trackResult.status === "fulfilled") {
        setTrackRecord(trackResult.value?.data || null);
        setTrackRecordError("");
      } else if (!(trackResult.reason instanceof ApiError && trackResult.reason.code === "ABORTED")) {
        setTrackRecord(null);
        setTrackRecordError(errorText(trackResult.reason));
      }
      setAuthRequired(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ABORTED") return;
      if (caught instanceof ApiError && caught.code === "UNAUTHORIZED") setAuthRequired(true);
      else setError(errorText(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [syncQualification]);

  useEffect(() => {
    const controller = new AbortController();
    const scheduleId = window.setTimeout(() => {
      void loadStatus(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(scheduleId);
      controller.abort("qualification-panel-unmounted");
    };
  }, [loadStatus]);

  useEffect(() => {
    if (!attempt?.deadlineAt || attempt.status !== "IN_PROGRESS") return undefined;
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.deadlineAt, attempt?.status]);

  const questions = attempt?.questions || [];
  const currentQuestion = questions[questionIndex] || null;
  const remainingSeconds = attempt?.deadlineAt ? Math.max(0, Math.ceil((Date.parse(attempt.deadlineAt) - now) / 1000)) : 0;
  const answeredCount = Object.keys(attempt?.answers || {}).length;
  const currentAnswer = currentQuestion ? attempt?.answers?.[currentQuestion.questionId] || "" : "";
  const applicationStatus = qualification?.state || "NOT_APPLIED";
  const canStartQuiz = applicationStatus === "QUIZ_ELIGIBLE";
  const isQuizOpen = applicationStatus === "QUIZ_IN_PROGRESS" && attempt?.status === "IN_PROGRESS" && remainingSeconds > 0;
  const practiceReviews = qualification?.practiceReviews || [];
  const submittedPracticeDomains = new Set(practiceReviews.map((practice) => practice.domainCode));
  const practiceEligible = ["DOMAIN_REVIEW", "APPEALED"].includes(applicationStatus);

  const toggleDomain = (domain) => {
    setDomains((current) => current.includes(domain)
      ? current.length === 1 ? current : current.filter((entry) => entry !== domain)
      : [...current, domain]);
  };

  const apply = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest("/api/expert/qualification", {
        method: "POST",
        body: JSON.stringify({
          action: "APPLY",
          profile: {
            displayName: profile.displayName,
            institution: profile.institution,
            bio: profile.bio,
            credentials: profile.credentials.split(",").map((value) => value.trim()).filter(Boolean),
          },
          requestedDomains: domains,
        }),
        requestId: createSecureId("qualification-apply"),
        headers: { "Idempotency-Key": createSecureId("qualification-application") },
      });
      syncQualification(response?.data);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const startQuiz = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest("/api/expert/qualification/quiz", {
        method: "POST",
        requestId: createSecureId("qualification-start"),
        headers: { "Idempotency-Key": createSecureId("qualification-quiz") },
      });
      const data = response?.data;
      setQualification((current) => ({ ...(current || {}), state: data?.state, application: data?.application || current?.application, latestAttempt: data?.attempt || null }));
      setAttempt(data?.attempt || null);
      setResult(null);
      setQuestionIndex(0);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const saveAnswer = async (answer) => {
    if (!currentQuestion || !attempt?.attemptId || savingAnswer || !isQuizOpen) return;
    setSavingAnswer(true);
    setError("");
    try {
      const response = await apiRequest("/api/expert/qualification/quiz/answers", {
        method: "PUT",
        body: JSON.stringify({ attemptId: attempt.attemptId, questionId: currentQuestion.questionId, answer }),
        requestId: createSecureId("qualification-answer"),
        headers: { "Idempotency-Key": createSecureId("qualification-answer-write") },
      });
      if (response?.data?.attempt) setAttempt(response.data.attempt);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSavingAnswer(false);
    }
  };

  const submitQuiz = async () => {
    if (!attempt?.attemptId || answeredCount !== questions.length || !isQuizOpen || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest("/api/expert/qualification/quiz/submit", {
        method: "POST",
        body: JSON.stringify({ attemptId: attempt.attemptId }),
        requestId: createSecureId("qualification-submit"),
        headers: { "Idempotency-Key": createSecureId("qualification-submit-write") },
      });
      const data = response?.data;
      setQualification((current) => ({ ...(current || {}), state: data?.state, latestAttempt: data?.attempt || current?.latestAttempt }));
      setAttempt(data?.attempt || attempt);
      setResult(data?.result || null);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  const submitPractice = async (event) => {
    event.preventDefault();
    const evidenceRevisionIds = practiceEvidence.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 20);
    if (!practiceDomain || !practiceConclusion.trim() || !practiceUncertainty.trim() || !practiceNextAction.trim() || evidenceRevisionIds.length === 0) {
      setError("Practice cần kết luận, điều chưa chắc chắn, bước tiếp theo và ít nhất một evidence revision.");
      return;
    }
    setPracticeBusy(true);
    setError("");
    try {
      const response = await apiRequest("/api/expert/qualification/practice", {
        method: "POST",
        body: JSON.stringify({
          domainCode: practiceDomain,
          response: {
            conclusion: practiceConclusion.trim(),
            uncertainty: practiceUncertainty.trim(),
            nextAction: practiceNextAction.trim(),
          },
          evidenceRevisionIds,
        }),
        requestId: createSecureId("qualification-practice"),
        headers: { "Idempotency-Key": createSecureId("qualification-practice-write") },
      });
      const practice = response?.data?.practice;
      if (practice) setQualification((current) => ({ ...(current || {}), practiceReviews: [...(current?.practiceReviews || []).filter((item) => item.practiceId !== practice.practiceId), practice] }));
      setPracticeConclusion("");
      setPracticeUncertainty("");
      setPracticeNextAction("");
      setPracticeEvidence("");
      void loadStatus();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPracticeBusy(false);
    }
  };

  const statusLabel = STATUS_COPY[applicationStatus] || "Chưa bắt đầu";
  const resultLabel = useMemo(() => {
    if (!result) return "";
    return result.passed ? "Quiz đạt — chuyển sang human domain review" : result.nextState === "REJECTED" ? "Quiz chưa đạt — đã hết số lần thử" : "Quiz chưa đạt — có thể làm lại";
  }, [result]);

  return <section className="qualification-panel intelligence-panel" aria-labelledby="expert-qualification-title">
    <div className="panel-heading">
      <div>
        <p className="product-kicker">Expert qualification</p>
        <h2 id="expert-qualification-title" className="product-section-title">Hồ sơ → quiz → review domain</h2>
      </div>
      <span className="signal-badge"><LockKeyhole size={13} /> Server controlled</span>
    </div>
    <p className="product-copy qualification-lead">Track record cộng đồng chỉ mở cửa ứng viên. Quiz chỉ tạo điều kiện cho bước review; quyền chuyên gia và domain hoạt động chỉ được cấp bởi human reviewer sau khi kiểm tra hồ sơ.</p>

    {!loading && !authRequired && trackRecord && <div className="qualification-status-row" aria-label="Community contribution track record">
      <div className="qualification-status-icon"><Star size={18} /></div>
      <div><span className="data-label">Contribution track record · {trackRecord.policyVersion}</span><strong>{trackRecord.points}/{trackRecord.maxPoints} điểm · {trackRecord.stars}/5 sao</strong><small>{trackRecord.expertCandidate ? "Đủ ngưỡng ứng viên — vẫn bắt buộc identity, quiz, practice và human activation." : "Chưa đủ ngưỡng ứng viên; phản ứng cộng đồng không phải phán quyết Trust."}</small></div>
      <span className="metadata-chip">{trackRecord.qualificationGate}</span>
    </div>}
    {!loading && !authRequired && !trackRecord && trackRecordError && <div className="qualification-state"><AlertTriangle size={17} /><div><strong>Track record live chưa khả dụng.</strong><p>{trackRecordError}</p></div></div>}

    {loading && <div className="qualification-state" role="status"><ClipboardCheck size={17} /> Đang đọc trạng thái qualification từ server…</div>}
    {!loading && authRequired && <div className="qualification-state qualification-auth"><UserRound size={18} /><div><strong>Cần đăng nhập để bắt đầu hồ sơ chuyên gia.</strong><p>Qualification gắn với danh tính bền vững của tài khoản.</p><Link href="/login" className="text-link">Đăng nhập <ChevronRight size={14} /></Link></div></div>}
    {!loading && !authRequired && <>
      <div className="qualification-status-row">
        <div className="qualification-status-icon"><ShieldCheck size={18} /></div>
        <div><span className="data-label">Trạng thái server</span><strong>{statusLabel}</strong></div>
        <span className="metadata-chip">{applicationStatus}</span>
      </div>

      {applicationStatus === "NOT_APPLIED" && <form className="qualification-form" onSubmit={apply}>
        <div className="qualification-form-grid">
          <label><span>Tên hiển thị</span><input value={profile.displayName} onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))} maxLength={120} required placeholder="Tên dùng trong hồ sơ chuyên gia" /></label>
          <label><span>Tổ chức / trường</span><input value={profile.institution} onChange={(event) => setProfile((current) => ({ ...current, institution: event.target.value }))} maxLength={180} placeholder="Thông tin công khai" /></label>
        </div>
        <label><span>Tiểu sử chuyên môn</span><textarea rows={3} value={profile.bio} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} maxLength={1000} placeholder="Phạm vi kinh nghiệm, cách bạn làm việc với bằng chứng…" /></label>
        <label><span>Bằng cấp / chứng chỉ</span><input value={profile.credentials} onChange={(event) => setProfile((current) => ({ ...current, credentials: event.target.value }))} placeholder="Phân tách bằng dấu phẩy" /></label>
        <div><span className="data-label">Domain muốn đăng ký</span><div className="qualification-domain-grid">{DOMAIN_OPTIONS.map(([value, label]) => <label key={value} className="qualification-check"><input type="checkbox" checked={domains.includes(value)} onChange={() => toggleDomain(value)} /><span>{label}</span></label>)}</div></div>
        <button className="primary-action" type="submit" disabled={busy || !profile.displayName.trim()}>{busy ? <ClipboardCheck size={16} className="animate-spin" /> : <Send size={16} />} Gửi hồ sơ để kiểm tra danh tính</button>
      </form>}

      {applicationStatus === "IDENTITY_REVIEW" && <div className="qualification-state"><Clock3 size={18} /><div><strong>Hồ sơ đã được ghi nhận.</strong><p>Reviewer sẽ kiểm tra danh tính và phạm vi trước khi mở quiz. Bạn không thể tự chuyển trạng thái bằng client.</p></div></div>}
      {canStartQuiz && <div className="qualification-quiz-intro"><div><span className="data-label">Next gate</span><h3>Quiz kiến thức về bằng chứng và thẩm quyền</h3><p>Server sẽ bốc câu hỏi theo version, giới hạn 30 phút và lưu từng câu trả lời để resume.</p></div><button className="primary-action" type="button" onClick={startQuiz} disabled={busy}><ClipboardCheck size={16} /> Bắt đầu quiz</button></div>}

      {isQuizOpen && currentQuestion && <div className="qualification-quiz" aria-live="polite">
        <div className="qualification-quiz-heading"><div><span className="data-label">{attempt.quizVersion} · Câu {questionIndex + 1}/{questions.length}</span><h3>{currentQuestion.prompt}</h3></div><span className={`qualification-timer ${remainingSeconds < 120 ? "is-warning" : ""}`}><Clock3 size={15} /> {formatRemaining(remainingSeconds)}</span></div>
        <div className="qualification-progress" aria-hidden="true"><span style={{ width: `${questions.length ? ((answeredCount / questions.length) * 100) : 0}%` }} /></div>
        <div className="qualification-options" role="radiogroup" aria-label="Các lựa chọn trả lời">{currentQuestion.choices.map((choice) => <button key={choice.id} type="button" role="radio" aria-checked={currentAnswer === choice.id} className={`qualification-option ${currentAnswer === choice.id ? "is-selected" : ""}`} onClick={() => saveAnswer(choice.id)} disabled={savingAnswer}><span>{choice.id.toUpperCase()}</span>{choice.label}</button>)}</div>
        <div className="qualification-quiz-actions"><button className="secondary-action" type="button" onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))} disabled={questionIndex === 0}><ChevronLeft size={15} /> Câu trước</button><span>{answeredCount}/{questions.length} đã trả lời</span>{questionIndex < questions.length - 1 ? <button className="secondary-action" type="button" onClick={() => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={!currentAnswer}><ChevronRight size={15} /> Câu tiếp</button> : <button className="primary-action" type="button" onClick={submitQuiz} disabled={busy || savingAnswer || answeredCount !== questions.length}><Send size={15} /> Nộp quiz</button>}</div>
      </div>}
      {applicationStatus === "QUIZ_IN_PROGRESS" && !isQuizOpen && <div className="qualification-state"><Clock3 size={18} /><div><strong>Thời hạn quiz đã hết hoặc phiên chưa còn hiệu lực.</strong><p>Server sẽ đánh dấu attempt hết hạn khi đọc lại trạng thái. Hãy tải lại để xem bước tiếp theo.</p><button className="secondary-action" type="button" onClick={() => loadStatus()} disabled={loading}>Tải lại trạng thái</button></div></div>}

      {applicationStatus === "DOMAIN_REVIEW" && !result && <div className="qualification-state qualification-success"><CheckCircle2 size={18} /><div><strong>Quiz đã đạt.</strong><p>Hồ sơ đang chờ reviewer xác nhận domain. AI không thể tự kích hoạt quyền.</p></div></div>}
      {practiceEligible && <div className="qualification-practice">
        <div className="qualification-quiz-intro"><div><span className="data-label">Supervised practice · private evidence</span><h3>Ca thực hành theo domain</h3><p>Viết kết luận trong phạm vi, nêu rõ điều chưa chắc chắn và bước kiểm tra tiếp theo. Reviewer sẽ xem nguồn trước khi cấp quyền; bài gửi không tự kích hoạt chuyên gia.</p></div><ClipboardCheck size={19} /></div>
        {domains.filter((domainCode) => !submittedPracticeDomains.has(domainCode)).length > 0 && <form className="qualification-form" onSubmit={submitPractice}>
          <label><span>Domain</span><select value={practiceDomain} onChange={(event) => setPracticeDomain(event.target.value)}>{domains.filter((domainCode) => !submittedPracticeDomains.has(domainCode)).map((domainCode) => <option key={domainCode} value={domainCode}>{domainCode.replaceAll("_", " ")}</option>)}</select></label>
          <label><span>Kết luận trong phạm vi</span><textarea rows={3} value={practiceConclusion} onChange={(event) => setPracticeConclusion(event.target.value)} maxLength={3000} placeholder="Điều gì có thể nói dựa trên các evidence revision đã dẫn?" required /></label>
          <label><span>Điều chưa chắc chắn</span><textarea rows={2} value={practiceUncertainty} onChange={(event) => setPracticeUncertainty(event.target.value)} maxLength={2000} placeholder="Nguồn nào còn thiếu hoặc có thể đã cũ?" required /></label>
          <label><span>Bước tiếp theo</span><textarea rows={2} value={practiceNextAction} onChange={(event) => setPracticeNextAction(event.target.value)} maxLength={1200} placeholder="Người dùng nên xác minh hoặc làm gì tiếp?" required /></label>
          <label><span>Evidence revision IDs</span><input value={practiceEvidence} onChange={(event) => setPracticeEvidence(event.target.value)} placeholder="UUID hoặc mã revision, phân tách bằng dấu phẩy" required /></label>
          <button className="primary-action" type="submit" disabled={practiceBusy}>{practiceBusy ? <ClipboardCheck size={16} className="animate-spin" /> : <Send size={16} />} Gửi practice để reviewer chấm</button>
        </form>}
        {practiceReviews.length > 0 && <div className="qualification-state"><ClipboardCheck size={18} /><div><strong>Lịch sử practice theo domain</strong>{practiceReviews.map((practice) => <p key={practice.practiceId}><span className="metadata-chip">{practice.domainCode}</span> {practice.state} · gửi {practice.createdAt ? new Date(practice.createdAt).toLocaleDateString("vi-VN") : "chưa có ngày"}{practice.reviewedAt ? ` · reviewer đã xử lý ${new Date(practice.reviewedAt).toLocaleDateString("vi-VN")}` : " · đang chờ reviewer độc lập"}</p>)}</div></div>}
      </div>}
      {applicationStatus === "ACTIVE" && <div className="qualification-state qualification-success"><CheckCircle2 size={18} /><div><strong>Hồ sơ đã hoạt động theo domain được duyệt.</strong><p>Authority vẫn bị giới hạn bởi các domain đã được reviewer ghi nhận.</p></div></div>}
      {result && <div className={`qualification-result ${result.passed ? "is-passed" : "is-failed"}`}><div><span className="data-label">Kết quả server</span><strong>{resultLabel}</strong><p>Điểm: {Math.round(result.score * 100)}% · {result.points}/{result.maxScore} điểm</p></div><span className="qualification-result-mark">{result.passed ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}</span></div>}
    </>}
    {error && <div className="error-callout" role="alert"><AlertTriangle size={16} /> {error}</div>}
  </section>;
}
