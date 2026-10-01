"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Clock3, ExternalLink, History, RefreshCw, ShieldAlert } from "lucide-react";
import styles from "./expert-v5-missions.module.css";

const EMPTY_DATA = { missions: [], bankState: "NO_VALIDATED_QUESTIONS", missionDate: null, timezone: "Asia/Ho_Chi_Minh" };

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error?.userMessage || payload.error?.message || "Không thể tải dữ liệu nhiệm vụ từ máy chủ.");
    error.code = payload.error?.code || "REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

function remainingSeconds(deadlineAt, now) {
  if (!deadlineAt || now === null) return null;
  return Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - now) / 1000));
}

function formatTime(seconds) {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ExpertV5Missions() {
  const [data, setData] = useState(EMPTY_DATA);
  const [active, setActive] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(null);
  const [error, setError] = useState(null);

  const loadMissions = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const assigned = await api("/api/expert/missions", { method: "POST" });
      setData(assigned || EMPTY_DATA);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => { void loadMissions(); }, 0);
    return () => window.clearTimeout(request);
  }, [loadMissions]);

  const secondsLeft = useMemo(() => remainingSeconds(active?.attempt?.deadlineAt, now), [active?.attempt?.deadlineAt, now]);
  useEffect(() => {
    if (!active?.attempt?.deadlineAt || active.attempt.state !== "IN_PROGRESS") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active?.attempt?.deadlineAt, active?.attempt?.state]);

  const announcement = secondsLeft === 0
    ? "Hết giờ. Máy chủ sẽ từ chối câu trả lời muộn."
    : [30, 10, 5].includes(secondsLeft) ? `Còn ${secondsLeft} giây.` : "";

  const start = async (missionId) => {
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const opened = await api(`/api/expert/missions/${encodeURIComponent(missionId)}`, {
        method: "POST", body: JSON.stringify({ action: "START" }),
      });
      if (opened?.attempt?.state !== "IN_PROGRESS") {
        setActive(opened);
        if (opened?.state === "UNRESOLVED") setError(Object.assign(new Error("Nguồn đã thay đổi hoặc cần được kiểm tra lại. Nhiệm vụ được dừng an toàn."), { code: "EXPERT_MISSION_SOURCE_REVALIDATION_REQUIRED" }));
        else if (opened?.state === "EXPIRED") setError(Object.assign(new Error("Thời hạn của nhiệm vụ đã kết thúc."), { code: "EXPERT_MISSION_EXPIRED" }));
        else if (opened?.state === "COMPLETED") setError(Object.assign(new Error("Nhiệm vụ này đã hoàn thành trước đó."), { code: "EXPERT_MISSION_ALREADY_COMPLETED" }));
        return;
      }
      setActive(opened);
      const openedQuestion = opened.mission?.question;
      setAnswer(["MULTIPLE_CHOICE", "MULTI_SELECT"].includes(openedQuestion?.questionType)
        ? [] : openedQuestion?.questionType === "SOURCE_RANKING"
          ? openedQuestion.choices.map((choice) => choice.id) : null);
    } catch (caught) { setError(caught); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!active?.mission?.missionId || answer === null) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api(`/api/expert/missions/${encodeURIComponent(active.mission.missionId)}`, {
        method: "POST", body: JSON.stringify({ action: "SUBMIT", answer }),
      });
      setActive((previous) => ({ ...previous, ...result }));
      setData((previous) => ({ ...previous, missions: previous.missions.map((mission) => mission.missionId === active.mission.missionId ? { ...mission, status: result.missionState } : mission) }));
      if (result.missionLevel) setData((previous) => ({ ...previous, missionLevel: result.missionLevel, completedMissionCount: Number(previous.completedMissionCount || 0) + (result.missionState === "COMPLETED" && !result.idempotent ? 1 : 0) }));
      setAnnouncement(result.missionState === "COMPLETED" ? "Đã chấm câu trả lời và lưu tiến độ." : "Câu trả lời cần được xem xét; chưa cộng tiến độ.");
    } catch (caught) { setError(caught); }
    finally { setBusy(false); }
  };

  const loadHistory = async () => {
    setBusy(true);
    setError(null);
    try { setHistory(await api("/api/expert/missions/history?limit=20")); }
    catch (caught) { setError(caught); }
    finally { setBusy(false); }
  };

  const question = active?.mission?.question;
  const result = active?.attempt?.result;
  const multiAnswer = ["MULTIPLE_CHOICE", "MULTI_SELECT"].includes(question?.questionType);
  const orderedAnswer = question?.questionType === "SOURCE_RANKING";
  const moveRankedChoice = (choiceId, offset) => {
    setAnswer((previous) => {
      const ordered = Array.isArray(previous) ? [...previous] : [];
      const from = ordered.indexOf(choiceId);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= ordered.length) return ordered;
      [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
      return ordered;
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link href="/expert" className={styles.back}><ArrowLeft size={16} /> Expert Network</Link>
        <span className={styles.serverTag}><span /> Trạng thái từ máy chủ</span>
      </div>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>EXPERT · PRACTICE & EVIDENCE</p>
          <h1>Nhiệm vụ hôm nay</h1>
          <p className={styles.intro}>Luyện đánh giá dựa trên nguồn đã truy xuất và được biên tập viên duyệt. Tiến độ nhiệm vụ tách biệt với chứng chỉ và uy tín nghề nghiệp.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => void loadHistory()} disabled={busy}><History size={16} /> Lịch sử</button>
          <button type="button" className={styles.secondaryButton} onClick={() => void loadMissions()} disabled={busy}><RefreshCw size={15} className={busy ? styles.spinning : ""} /> Làm mới</button>
        </div>
      </header>

      {error && <div className={styles.error} role="alert"><ShieldAlert size={17} /><div><strong>{error.status === 401 || error.status === 403 ? "Cần tài khoản Expert đủ điều kiện" : "Chưa tải được nhiệm vụ"}</strong><p>{error.message}</p>{error.code === "EXPERT_V5_MIGRATION_REQUIRED" && <small>V5 chưa khả dụng trong môi trường này vì migration chưa được áp dụng.</small>}</div></div>}

      <section className={styles.progress} aria-label="Tiến độ nhiệm vụ">
        <div><span>Ngày máy chủ</span><strong>{data.missionDate || "—"}</strong></div>
        <div><span>Múi giờ</span><strong>{data.timezone || "Asia/Ho_Chi_Minh"}</strong></div>
        <div><span>Cấp độ nhiệm vụ</span><strong>{data.missionLevel ? `${data.missionLevel}★` : "—"}</strong></div>
        <div><span>Đã hoàn thành</span><strong>{data.completedMissionCount ?? "—"}</strong></div>
      </section>

      {active && question && active.attempt?.state === "IN_PROGRESS" && (
        <section className={styles.quiz} aria-labelledby="v5-question-title">
          <div className={styles.quizHead}>
            <span>{active.mission.domainCode?.replaceAll("_", " ")}</span>
            <span>{active.mission.difficulty}</span>
            <span className={styles.timer}><Clock3 size={15} /><span aria-hidden="true">{formatTime(secondsLeft)}</span></span>
          </div>
          <p className={styles.questionKicker}>CÂU HỎI ĐÃ GẮN VỚI NGUỒN</p>
          <h2 id="v5-question-title">{question.prompt}</h2>
          <fieldset className={styles.choices}>
            <legend>{orderedAnswer ? "Sắp xếp theo thứ tự phù hợp nhất" : multiAnswer ? "Chọn tất cả phương án phù hợp" : "Chọn một phương án"}</legend>
            {orderedAnswer ? (
              <ol className={styles.rankingList}>
                {(Array.isArray(answer) ? answer : []).map((choiceId, index) => {
                  const choice = question.choices.find((entry) => entry.id === choiceId);
                  if (!choice) return null;
                  return <li key={choice.id} className={styles.rankingItem}>
                    <span className={styles.rankNumber}>{index + 1}</span><span>{choice.label}</span>
                    <button type="button" className={styles.rankMove} aria-label={`Đưa ${choice.label} lên`} disabled={busy || index === 0} onClick={() => moveRankedChoice(choice.id, -1)}>↑</button>
                    <button type="button" className={styles.rankMove} aria-label={`Đưa ${choice.label} xuống`} disabled={busy || index === answer.length - 1} onClick={() => moveRankedChoice(choice.id, 1)}>↓</button>
                  </li>;
                })}
              </ol>
            ) : question.choices.map((choice) => (
              <label key={choice.id} className={`${styles.choice} ${answer === choice.id ? styles.choiceSelected : ""}`}>
                <input
                  type={multiAnswer ? "checkbox" : "radio"}
                  name="expert-v5-answer"
                  value={choice.id}
                  checked={multiAnswer ? Array.isArray(answer) && answer.includes(choice.id) : answer === choice.id}
                  onChange={(event) => {
                    if (multiAnswer) {
                      setAnswer((previous) => event.target.checked
                        ? [...new Set([...(Array.isArray(previous) ? previous : []), choice.id])]
                        : (Array.isArray(previous) ? previous : []).filter((id) => id !== choice.id));
                    } else setAnswer(choice.id);
                  }}
                />
                <span className={styles.choiceMarker} aria-hidden="true" />
                <span>{choice.label}</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.quizActions}><p>Hạn nộp do máy chủ quyết định. Câu trả lời đã nộp không thể sửa.</p><button type="button" className={styles.primaryButton} disabled={busy || answer === null || Array.isArray(answer) && answer.length === 0 || secondsLeft === 0} onClick={() => void submit()}>{busy ? "Đang lưu…" : "Khóa câu trả lời"}</button></div>
          <span className={styles.srOnly} role="status" aria-live="polite">{announcement}</span>
        </section>
      )}

      {result && (
        <section className={styles.result} aria-live="polite">
          <div className={result.correct ? styles.resultMarkGood : styles.resultMarkNeutral}>{result.correct ? "✓" : "•"}</div>
          <div className={styles.resultBody}>
            <p className={styles.questionKicker}>KẾT QUẢ ĐÃ LƯU</p>
            <h2>{result.correct ? "Đáp án được nguồn hỗ trợ" : "Đáp án chưa được nguồn hỗ trợ"}</h2>
            <p>{result.explanation}</p>
            {Array.isArray(result.evidence) && result.evidence.length > 0 && <div className={styles.resultEvidence}><strong>Đoạn nguồn đã gắn với câu hỏi</strong>{result.evidence.map((item) => <blockquote key={item.evidenceId}>{item.excerpt || "Đoạn trích không có trong kết quả này."}<small>Mã bằng chứng: {item.evidenceId}</small></blockquote>)}</div>}
            <a href={question.source.canonicalUrl} target="_blank" rel="noreferrer" className={styles.sourceLink}>{question.source.title || question.source.publisher || "Mở nguồn gốc"}<ExternalLink size={14} /></a>
            <p className={styles.provenance}>Đã truy xuất {question.source.retrievedAt ? new Date(question.source.retrievedAt).toLocaleString("vi-VN") : "thời điểm chưa có"} · hash {question.source.contentHash?.slice(0, 12)}…</p>
          </div>
        </section>
      )}

      {active && (active.attempt?.state || active.state) && (active.attempt?.state || active.state) !== "IN_PROGRESS" && !result && (
        <section className={styles.result} aria-live="polite"><div className={styles.resultMarkNeutral}>•</div><div className={styles.resultBody}><p className={styles.questionKicker}>NHIỆM VỤ ĐÃ DỪNG</p><h2>{(active.attempt?.state || active.state) === "EXPIRED" ? "Hết thời gian" : (active.attempt?.state || active.state) === "COMPLETED" ? "Nhiệm vụ đã hoàn thành" : "Cần xem xét lại nguồn"}</h2><p>Tiến độ và đáp án chưa được xác nhận từ nguồn sẽ không được cộng thành tích.</p><button type="button" className={styles.secondaryButton} onClick={() => { setActive(null); void loadMissions(); }}>Trở lại danh sách</button></div></section>
      )}

      {!active && (
        <section className={styles.missionSection} aria-labelledby="available-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>SERVER ASSIGNED</p><h2 id="available-title">Nhiệm vụ được giao</h2></div><span>{data.missions?.length || 0} nhiệm vụ</span></div>
          {data.missions?.length ? <div className={styles.missionGrid}>{data.missions.map((mission) => (
            <article key={mission.missionId} className={styles.missionCard}>
              <div className={styles.cardTop}><span className={styles.difficulty}>{mission.difficulty || "—"}</span><span className={styles.status}>{mission.status}</span></div>
              <p className={styles.domain}>{mission.domainCode?.replaceAll("_", " ")} · Cấp {mission.missionLevel}</p>
              <h3>{mission.question?.prompt || "Câu hỏi nguồn đang được kiểm tra"}</h3>
              <div className={styles.sourceMeta}><BookOpenCheck size={15} /><span>{mission.question?.source?.title || mission.question?.source?.publisher || "Nguồn đã được đăng ký"}</span></div>
              {mission.question?.source?.canonicalUrl && <a className={styles.sourceLink} href={mission.question.source.canonicalUrl} target="_blank" rel="noreferrer">Xem nguồn <ExternalLink size={14} /></a>}
              {mission.status === "COMPLETED" ? <p className={styles.completed}>Đã hoàn thành hôm nay</p> : <button type="button" className={styles.primaryButton} onClick={() => void start(mission.missionId)} disabled={busy}>{busy ? "Đang mở…" : "Bắt đầu"}</button>}
            </article>
          ))}</div> : <div className={styles.empty}>
            <BookOpenCheck size={21} />
            <div>
              <h3>{data.bankState === "VERIFIED_SCOPE_REQUIRED" ? "Cần miền chuyên gia đã xác minh" : data.bankState === "NO_VALIDATED_QUESTIONS" ? "Chưa có câu hỏi thực nguồn đã được duyệt" : "Chưa có nhiệm vụ khả dụng"}</h3>
              <p>{data.bankState === "VERIFIED_SCOPE_REQUIRED" ? "Tài khoản cần có ít nhất một miền chuyên gia đang được xác minh trước khi hệ thống giao nhiệm vụ hằng ngày." : "Nhiệm vụ chỉ xuất hiện sau khi nguồn công khai được truy xuất thành công, bằng chứng được gắn vào câu hỏi và người biên tập duyệt. Trang bị chặn đăng nhập, paywall hoặc anti-bot sẽ không tạo câu hỏi."}</p>
            </div>
          </div>}
        </section>
      )}

      {history && <section className={styles.history}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>PERSISTED ATTEMPTS</p><h2>Lịch sử gần đây</h2></div></div>{history.length ? history.map((entry) => <article className={styles.historyRow} key={entry.missionId}><div><strong>{entry.domainCode.replaceAll("_", " ")}</strong><span>{entry.missionDate} · {entry.difficulty}</span></div><span>{entry.attempt?.status || entry.missionStatus}</span><span>{entry.attempt?.score == null ? "Chưa chấm" : `${entry.attempt.score}%`}</span></article>) : <p className={styles.historyEmpty}>Chưa có bài đã lưu.</p>}</section>}

      <footer className={styles.footer}><span>Mission level đo tiến độ luyện tập StudentHub, không phải chứng chỉ chuyên môn.</span><Link href="/expert/profile">Hồ sơ và qualification <ExternalLink size={13} /></Link></footer>
    </main>
  );
}
