"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, ArrowLeft, Check, Clock3, ExternalLink, FileCheck2, ImagePlus, LockKeyhole, RefreshCw, ShieldAlert, Users, Video } from "lucide-react";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { createSecureId } from "@/lib/security/secureId";
import styles from "./expert-v5-rooms.module.css";
import ExpertRoomNotificationBell from "./ExpertRoomNotificationBell";

const EMPTY = { myRooms: [], openRooms: [], domains: [], supportedDomains: [], presenceLeaseSeconds: 45 };
const DIMENSIONS = [
  { id: "SOURCE_ALIGNMENT", label: "Bám sát nguồn", weight: "50%" },
  { id: "EVIDENCE_USE", label: "Dùng bằng chứng", weight: "30%" },
  { id: "UNCERTAINTY_CALIBRATION", label: "Định chuẩn bất định", weight: "20%" },
];

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error?.userMessage || payload.error?.message || "Phòng xác minh chưa khả dụng.");
    error.code = payload.error?.code || "ROOM_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không đọc được tệp hình ảnh."));
    reader.onerror = () => reject(new Error("Không đọc được tệp hình ảnh."));
    reader.readAsDataURL(file);
  });
}

function timeLeft(deadlineAt, now) {
  if (!deadlineAt || now === null) return null;
  return Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - now) / 1000));
}

function timeLabel(value) {
  if (!value) return "Đang chờ";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Đang chờ" : new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

function scoreRatingsDefaults() {
  return { SOURCE_ALIGNMENT: 50, EVIDENCE_USE: 50, UNCERTAINTY_CALIBRATION: 50 };
}

export default function ExpertVerificationRooms() {
  const { subscribe, connectionStatus } = useRealtime();
  const [index, setIndex] = useState(EMPTY);
  const [active, setActive] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [inputType, setInputType] = useState("TEXT");
  const [domainCode, setDomainCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [ratings, setRatings] = useState(scoreRatingsDefaults());
  const [evidenceIds, setEvidenceIds] = useState([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(null);
  const deepLinkedRoom = useRef("");

  const refreshIndex = useCallback(async () => {
    const next = await api("/api/expert/rooms", { method: "GET" });
    setIndex(next || EMPTY);
    setDomainCode((current) => current || next?.supportedDomains?.[0] || "");
    return next;
  }, []);

  const refreshRoom = useCallback(async (roomId = selectedRoom) => {
    if (!roomId) return null;
    const next = await api(`/api/expert/rooms/${encodeURIComponent(roomId)}`, { method: "GET" });
    setActive(next);
    return next;
  }, [selectedRoom]);

  const refreshAll = useCallback(async () => {
    setError(null);
    try {
      await refreshIndex();
      if (selectedRoom) await refreshRoom(selectedRoom);
    } catch (caught) { setError(caught); }
  }, [refreshIndex, refreshRoom, selectedRoom]);

  useEffect(() => {
    const request = window.setTimeout(() => { void refreshAll(); }, 0);
    return () => window.clearTimeout(request);
  }, [refreshAll]);

  useEffect(() => {
    const resync = () => { void refreshAll(); };
    window.addEventListener("online", resync);
    return () => window.removeEventListener("online", resync);
  }, [refreshAll]);

  useEffect(() => {
    const media = active?.room?.challenge?.metadata;
    if (!selectedRoom || !media?.mediaUrl || !media.mediaUrlExpiresIn) return undefined;
    const timer = window.setTimeout(() => { void refreshRoom(selectedRoom).catch(setError); }, Math.max(30, media.mediaUrlExpiresIn - 30) * 1000);
    return () => window.clearTimeout(timer);
  }, [active?.room?.challenge?.metadata, refreshRoom, selectedRoom]);

  useEffect(() => {
    const onRoomRevision = (record) => {
      const roomId = record?.data?.roomId;
      if (roomId && roomId === selectedRoom) void refreshRoom(roomId).catch(setError);
      void refreshIndex().catch(setError);
    };
    return subscribe("expert", "expert:revision", onRoomRevision);
  }, [refreshIndex, refreshRoom, selectedRoom, subscribe]);

  useEffect(() => {
    if (!active?.round?.deadlineAt || active.round.status !== "QUESTION_ACTIVE") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [active?.round?.deadlineAt, active?.round?.status]);

  const seconds = timeLeft(active?.round?.deadlineAt, now);
  const allRooms = useMemo(() => [
    ...(index.myRooms || []).map((room) => ({ ...room, listType: "MINE" })),
    ...(index.openRooms || []).map((room) => ({ ...room, listType: "OPEN" })),
  ], [index.myRooms, index.openRooms]);
  const room = active?.room;
  const adjudications = active?.adjudications || [];
  const adjudicationByExpert = new Map(adjudications.map((item) => [item.expertId, item]));
  const packageEvidence = active?.evidencePackage?.evidence || [];
  const blockedTrust = active?.evidencePackage?.retrievalState === "BLOCKED" || active?.evidencePackage?.trustAnalysisState === "N/A";

  const mutate = async (action, payload = {}, roomId = room?.roomId) => {
    if (!roomId) return null;
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const result = await api(`/api/expert/rooms/${encodeURIComponent(roomId)}`, {
        method: "POST", body: JSON.stringify({ action, ...payload }),
      });
      if (result?.room?.room?.roomId) setActive(result.room);
      else if (active?.room?.roomId === roomId && result?.room?.roomId) setActive(result);
      else if (result?.room?.roomId && result?.viewerRole) setActive(result);
      if (action === "ACCEPT_SUPERVISOR" && result?.viewerRole === "SUPERVISOR_EXPERT") setSelectedRoom(roomId);
      if (action === "DECLINE_SUPERVISOR") {
        setActive(null);
        setSelectedRoom("");
      }
      if (action !== "DECLINE_SUPERVISOR") await refreshRoom(roomId).catch(() => {});
      await refreshIndex().catch(() => {});
      setNotice(action === "SUBMIT_ANSWER" ? "Câu trả lời đã được lưu trên máy chủ." : "Phòng đã cập nhật từ trạng thái máy chủ.");
      return result;
    } catch (caught) { setError(caught); return null; }
    finally { setBusy(false); }
  };

  const createRoom = async (event) => {
    event.preventDefault();
    setBusy(true); setError(null); setNotice("");
    try {
      let metadata = {};
      let content = challenge;
      if (["IMAGE", "QR"].includes(inputType)) {
        if (!file) throw new Error("Chọn một hình ảnh trước khi tạo phòng.");
        if (file.size > 8 * 1024 * 1024) throw new Error("Hình ảnh vượt quá giới hạn 8 MB.");
        metadata = { bytes: await fileAsDataUrl(file), mimeType: file.type, fileName: file.name, fileSize: file.size, inputKind: inputType.toLowerCase() };
        content = "";
      }
      if (["TEXT", "URL"].includes(inputType) && !content.trim()) throw new Error(inputType === "URL" ? "Nhập URL công khai cần kiểm tra." : "Nhập nội dung cần kiểm tra.");
      const created = await api("/api/expert/rooms", {
        method: "POST",
        headers: { "Idempotency-Key": createSecureId("expert-room") },
        body: JSON.stringify({ domainCode, inputType, content, metadata }),
      });
      setActive(created); setSelectedRoom(created?.room?.roomId || ""); setChallenge(""); setFile(null);
      setNotice("Phòng đã được tạo. Trust chưa chạy cho đến khi câu trả lời được khóa.");
      await refreshIndex();
    } catch (caught) { setError(caught); }
    finally { setBusy(false); }
  };

  const openRoom = async (roomId) => {
    setBusy(true); setError(null); setNotice("");
    try { const next = await api(`/api/expert/rooms/${encodeURIComponent(roomId)}`, { method: "GET" }); setSelectedRoom(roomId); setActive(next); }
    catch (caught) { setError(caught); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    const requestedRoom = new URLSearchParams(window.location.search).get("room");
    if (!requestedRoom || !allRooms.some((item) => item.roomId === requestedRoom) || deepLinkedRoom.current === requestedRoom) return;
    deepLinkedRoom.current = requestedRoom;
    const invitation = allRooms.some((item) => item.roomId === requestedRoom && item.role === "SUPERVISOR_INVITEE");
    if (!invitation) void openRoom(requestedRoom);
    window.requestAnimationFrame(() => document.getElementById(`expert-room-${requestedRoom}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }, [allRooms, openRoom]);

  const joinOpenRoom = async (roomId) => {
    const result = await mutate("JOIN", {}, roomId);
    if (result?.room?.room?.roomId || result?.room?.roomId) {
      setSelectedRoom(roomId);
      await refreshRoom(roomId).catch(setError);
    }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    if (!response.trim() || seconds === 0) return;
    const result = await mutate("SUBMIT_ANSWER", { response });
    if (result) setResponse("");
  };

  const propose = async (expertId) => {
    const result = await mutate("PROPOSE_SCORE", { expertId, ratings, evidenceIds, reason });
    if (result) { setRatings(scoreRatingsDefaults()); setEvidenceIds([]); setReason(""); }
  };

  const setEvidence = (id, checked) => setEvidenceIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));

  return (
    <main className={styles.page}>
      <div className={styles.topline}><Link href="/expert" className={styles.back}><ArrowLeft size={16} /> Expert Network</Link><div className="flex items-center gap-3"><span className={styles.liveTag}><Activity size={13} /> {connectionStatus === "CONNECTED" ? "Kết nối thời gian thực" : "Đang khôi phục kết nối"}</span><ExpertRoomNotificationBell /></div></div>
      <header className={styles.header}><div><p className={styles.eyebrow}>EXPERT · LIVE EVIDENCE REVIEW</p><h1>Phòng xác minh trực tiếp</h1><p>Host gửi nội dung đến Trust sau khi khóa câu trả lời. Supervisor độc lập chấm theo rubric, dẫn chiếu evidence và xác nhận riêng.</p></div><button type="button" className={styles.ghostButton} onClick={() => void refreshAll()} disabled={busy}><RefreshCw size={15} /> Làm mới</button></header>

      {error && <div className={styles.error} role="alert"><ShieldAlert size={17} /><div><strong>{error.status === 403 ? "Tài khoản chưa đủ quyền cho thao tác này" : "Chưa thể cập nhật phòng"}</strong><p>{error.message}</p><small>{error.code}</small></div></div>}
      {notice && <p className={styles.notice} role="status"><Check size={15} />{notice}</p>}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.createCard}>
            <p className={styles.eyebrow}>TẠO PHÒNG MỚI</p>
            <h2>Chọn một nội dung cần xác minh</h2>
            <form onSubmit={(event) => void createRoom(event)}>
              <label className={styles.fieldLabel}>Miền chuyên môn
                <select value={domainCode} onChange={(event) => setDomainCode(event.target.value)} required disabled={busy || !(index.supportedDomains || []).length}>
                  {(index.supportedDomains || []).map((domain) => <option key={domain} value={domain}>{domain.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className={styles.fieldLabel}>Loại đầu vào
                <select value={inputType} onChange={(event) => { setInputType(event.target.value); setFile(null); setChallenge(""); }} disabled={busy}>
                  <option value="TEXT">Văn bản</option><option value="URL">URL công khai</option><option value="IMAGE">Hình ảnh</option><option value="QR">Mã QR</option>
                </select>
              </label>
              {inputType === "TEXT" && <label className={styles.fieldLabel}>Nội dung<textarea value={challenge} onChange={(event) => setChallenge(event.target.value)} maxLength={20000} rows={4} placeholder="Dán phát biểu, thông báo hoặc nội dung cần kiểm tra" /></label>}
              {inputType === "URL" && <label className={styles.fieldLabel}>URL<input type="url" value={challenge} onChange={(event) => setChallenge(event.target.value)} placeholder="https://example.org/page" autoComplete="url" /></label>}
              {["IMAGE", "QR"].includes(inputType) && <label className={styles.upload}><ImagePlus size={18} /><span>{file?.name || `Chọn ${inputType === "QR" ? "ảnh mã QR" : "hình ảnh"}`}</span><small>JPG, PNG hoặc WebP · tối đa 8 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>}
              <p className={styles.formNote}>Trang yêu cầu đăng nhập, paywall hoặc anti-bot có thể trả về <code>BLOCKED</code>; trường hợp đó không tạo kết luận hay bằng chứng thay thế.</p>
              <button className={styles.primaryButton} type="submit" disabled={busy || !(index.supportedDomains || []).length}>{busy ? "Đang tạo…" : "Tạo phòng chờ Supervisor"}</button>
              {!(index.supportedDomains || []).length && <small className={styles.inlineWarning}>Cần miền chuyên môn đã được xác minh để mở phòng.</small>}
            </form>
          </section>

          <section className={styles.roomList}>
            <div className={styles.listHeading}><div><p className={styles.eyebrow}>PHÒNG THEO QUYỀN TRUY CẬP</p><h2>Phòng của bạn</h2></div><span>{allRooms.length}</span></div>
            {allRooms.length ? allRooms.map((item) => <article id={`expert-room-${item.roomId}`} key={`${item.listType}:${item.roomId}`} className={`${styles.roomListItem} ${selectedRoom === item.roomId ? styles.roomListSelected : ""}`}>
              <button type="button" className={styles.roomListOpen} onClick={() => void openRoom(item.roomId)} disabled={busy || item.role === "SUPERVISOR_INVITEE"}>
                <strong>{item.domainCode.replaceAll("_", " ")}</strong><span>{item.inputType} · {item.status.replaceAll("_", " ")}</span><small>{timeLabel(item.createdAt)}{item.role ? ` · ${item.role.replaceAll("_", " ")}` : ""}</small>
              </button>
              {item.role === "SUPERVISOR_INVITEE" && <div className={styles.inviteActions}><button type="button" onClick={() => void mutate("ACCEPT_SUPERVISOR", { conflictFree: true }, item.roomId)} disabled={busy}>Tôi không có xung đột</button><button type="button" onClick={() => void mutate("DECLINE_SUPERVISOR", {}, item.roomId)} disabled={busy}>Từ chối</button></div>}
              {item.listType === "OPEN" && <button type="button" className={styles.joinButton} onClick={() => void joinOpenRoom(item.roomId)} disabled={busy}>Tham gia miền này</button>}
            </article>) : <p className={styles.listEmpty}>Chưa có phòng nào. Phòng mở cùng miền chuyên môn sẽ xuất hiện tại đây.</p>}
          </section>
        </aside>

        <section className={styles.workspace} aria-live="polite">
          {!room ? <div className={styles.workspaceEmpty}><Video size={28} /><p className={styles.eyebrow}>SERVER-OWNED ROOM STATE</p><h2>Chọn phòng hoặc tạo một thử thách mới</h2><p>Người ngoài phòng không thể đọc nội dung challenge, câu trả lời hoặc gói bằng chứng.</p></div> : <>
            <div className={styles.roomHeader}><div><p className={styles.eyebrow}>ROOM · {room.inputType}</p><h2>{room.domainCode.replaceAll("_", " ")}</h2><p><span className={styles.statusDot} />{room.status.replaceAll("_", " ")}</p></div><div className={styles.roomHeaderActions}>{active.viewerRole === "HOST" && room.status === "WAITING_FOR_SUPERVISOR" && <button type="button" className={styles.secondaryButton} onClick={() => void mutate("RETRY_SUPERVISOR")} disabled={busy}>Tìm Supervisor khác</button>}{active.viewerRole === "HOST" && room.status === "LOBBY" && <button type="button" className={styles.primaryButton} onClick={() => void mutate("START_ROUND")} disabled={busy}>Bắt đầu vòng 30 giây</button>}<button type="button" className={styles.closeButton} onClick={() => void mutate("CLOSE")} disabled={busy || room.status === "CLOSED"}>Đóng phòng</button></div></div>

            <div className={styles.challenge}>
              <div className={styles.challengeIcon}><LockKeyhole size={17} /></div>
              <div>
                <p className={styles.eyebrow}>NỘI DUNG ĐƯỢC GỬI ĐẾN TRUST SAU KHI KHÓA</p>
                {room.challenge.type === "url" ? <a href={room.challenge.metadata?.url || room.challenge.content} target="_blank" rel="noreferrer">{room.challenge.metadata?.url || room.challenge.content}<ExternalLink size={13} /></a> : room.challenge.type === "text" ? <p>{room.challenge.content}</p> : <p>{room.challenge.type === "qr" ? "Ảnh QR đã lưu riêng tư trong phòng." : "Hình ảnh đã lưu riêng tư trong phòng."}</p>}
                {room.challenge.metadata?.mediaUrl && <div className={styles.mediaPreview}>
                  <Image src={room.challenge.metadata.mediaUrl} alt={room.challenge.type === "qr" ? "Mã QR của thử thách" : "Hình ảnh của thử thách"} width={room.challenge.metadata.width || 560} height={room.challenge.metadata.height || 320} unoptimized referrerPolicy="no-referrer" loading="lazy" />
                  <small>Ảnh riêng tư · liên kết đọc có hiệu lực 5 phút</small>
                </div>}
              </div>
            </div>

            <div className={styles.participants}><div className={styles.subhead}><Users size={16} /><strong>Người tham gia</strong><span>{active.participants?.length || 0}</span></div><div className={styles.participantList}>{(active.participants || []).map((person) => <span key={person.userId} className={styles.participantChip}>{person.role.replaceAll("_", " ")}{person.role === "SUPERVISOR_EXPERT" && person.conflictDeclaration === "NO_KNOWN_CONFLICT" && <Check size={12} aria-label="Đã khai báo không biết xung đột" />}</span>)}</div></div>

            {active.viewerRole === "SUPERVISOR_INVITEE" && <div className={styles.inviteeNotice}><strong>Lời mời Supervisor độc lập</strong><p>Chỉ chấp nhận nếu bạn không biết có xung đột lợi ích với Host hoặc nội dung đang được xem xét. Lời khai được lưu trong lịch sử phòng.</p><button type="button" className={styles.primaryButton} onClick={() => void mutate("ACCEPT_SUPERVISOR", { conflictFree: true })} disabled={busy}>Xác nhận không có xung đột</button><button type="button" className={styles.secondaryButton} onClick={() => void mutate("DECLINE_SUPERVISOR")} disabled={busy}>Từ chối lời mời</button></div>}

            {room.status === "LOBBY" && active.viewerRole !== "HOST" && active.viewerRole !== "SUPERVISOR_EXPERT" && <div className={styles.lobbyNotice}>Vòng chưa bắt đầu. Câu trả lời chỉ mở sau khi Host khởi chạy đồng hồ máy chủ.</div>}

            {active.round?.status === "QUESTION_ACTIVE" && <section className={styles.round}>
              <div className={styles.roundTimer}><Clock3 size={16} /><span>Hạn máy chủ</span><strong>{seconds === null ? "—" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</strong><small>{timeLabel(active.round.deadlineAt)}</small></div>
              {active.viewerRole === "PARTICIPANT_EXPERT" && <form onSubmit={(event) => void submitAnswer(event)} className={styles.answerForm}><label className={styles.fieldLabel}>Câu trả lời ngắn<textarea value={response} onChange={(event) => setResponse(event.target.value)} maxLength={2000} rows={3} placeholder="Ghi nhận định và căn cứ chính" disabled={active.round.ownSubmitted || seconds === 0} /></label><button className={styles.primaryButton} type="submit" disabled={busy || !response.trim() || active.round.ownSubmitted || seconds === 0}>{active.round.ownSubmitted ? "Đã khóa câu trả lời" : "Gửi câu trả lời"}</button><p>Mỗi chuyên gia gửi một lần. Các câu trả lời khác được giữ kín cho đến khi máy chủ khóa vòng.</p></form>}
              {active.viewerRole === "HOST" && <p className={styles.lobbyNotice}>Đang chờ phản hồi từ {active.round.submittedCount} / {active.round.eligibleExpertIds?.length || 0} chuyên gia. Host không thể xem câu trả lời trước khi khóa.</p>}
            </section>}

            {room.status === "ANSWER_LOCKED" && ["HOST", "SUPERVISOR_EXPERT"].includes(active.viewerRole) && <div className={styles.nextAction}><strong>Câu trả lời đã khóa trên máy chủ.</strong><p>Giờ đây mọi thành viên trong phòng có thể xem phản hồi đã nộp.</p><button type="button" className={styles.primaryButton} onClick={() => void mutate("LOCK_AND_ANALYZE")} disabled={busy}>{busy ? "Đang chạy Trust…" : "Chuyển hồ sơ đến Trust"}</button></div>}

            {active.round?.answers?.length > 0 && <section className={styles.answers}><div className={styles.subhead}><FileCheck2 size={16} /><strong>Câu trả lời đã khóa</strong></div>{active.round.answers.map((answer) => <article key={answer.expertId} className={styles.answerCard}><div><strong>Expert …{answer.expertId.slice(-8)}</strong><small>Hash {answer.answerHash?.slice(0, 12)}… · {timeLabel(answer.submittedAt)}</small></div><p>{answer.response?.text || "Không có nội dung phản hồi."}</p></article>)}</section>}

            {active.evidencePackage && <section className={styles.trustPackage}><div className={styles.subhead}><ShieldAlert size={16} /><strong>Hồ sơ bằng chứng Trust</strong><span>{active.evidencePackage.retrievalState} · {active.evidencePackage.trustAnalysisState}</span></div>{blockedTrust && <div className={styles.blocked}><strong>Trust không có bằng chứng phân tích khả dụng</strong><p>REMOTE_RETRIEVAL = {active.evidencePackage.retrievalState}<br />TRUST_ANALYSIS = {active.evidencePackage.trustAnalysisState}<br />Không tạo câu trả lời đúng/sai hoặc reputation từ trạng thái này.</p></div>}{!blockedTrust && <><p className={styles.trustCaveat}>Trust cung cấp nguồn và bằng chứng để xem xét. Trust không tự quyết định đáp án hoặc điểm của Expert.</p>{active.evidencePackage.trustCaseId && <p className={styles.caseLink}>Trust case {active.evidencePackage.trustCaseId} · revision {active.evidencePackage.trustRevision ?? "—"}</p>}{(active.evidencePackage.sources || []).map((source, index) => <div className={styles.sourceRow} key={`${source.sourceId || source.url}:${index}`}><div><strong>{source.title || source.publisher || "Nguồn truy xuất"}</strong><small>{source.providerStatus || source.retrievalOutcome || "Trạng thái nguồn chưa rõ"}</small></div>{source.url && <a href={source.url} target="_blank" rel="noreferrer" aria-label="Mở nguồn gốc"><ExternalLink size={14} /></a>}</div>)}{packageEvidence.map((item) => <blockquote className={styles.evidenceQuote} key={item.evidenceId}><p>{item.excerpt}</p><small>{item.evidenceId} · {item.relation || "Evidence"} · {item.liveEvidence ? "retrieval trực tiếp" : "trạng thái live chưa xác nhận"}</small></blockquote>)}{active.evidencePackage.limitations?.map((limitation, index) => <p className={styles.limitation} key={index}>{limitation}</p>)}</>}</section>}

            {active.round?.status === "ADJUDICATION" && active.viewerRole === "SUPERVISOR_EXPERT" && <section className={styles.adjudication}><div><p className={styles.eyebrow}>HUMAN REVIEW · RUBRIC v1</p><h3>Đánh giá câu trả lời theo bằng chứng</h3></div>{active.round.answers.map((answer) => {
              const existing = adjudicationByExpert.get(answer.expertId);
              return <article className={styles.reviewCard} key={answer.expertId}><header><strong>Expert …{answer.expertId.slice(-8)}</strong><span>{existing ? existing.state : "Chưa chấm"}</span></header><p>{answer.response?.text}</p>{!existing && <><div className={styles.rubric}>{DIMENSIONS.map((dimension) => <label key={dimension.id}>{dimension.label}<small>{dimension.weight}</small><select value={ratings[dimension.id]} onChange={(event) => setRatings((current) => ({ ...current, [dimension.id]: Number(event.target.value) }))}><option value={0}>0 — Không được hỗ trợ</option><option value={50}>50 — Hỗ trợ một phần</option><option value={100}>100 — Được hỗ trợ</option></select></label>)}</div><fieldset className={styles.evidencePicker}><legend>Dẫn chiếu ít nhất một evidence ID</legend>{packageEvidence.length ? packageEvidence.map((item) => <label key={item.evidenceId}><input type="checkbox" checked={evidenceIds.includes(item.evidenceId)} onChange={(event) => setEvidence(item.evidenceId, event.target.checked)} />{item.evidenceId}</label>) : <p>Trust không cung cấp evidence IDs; chấm điểm đang bị khóa.</p>}</fieldset><label className={styles.fieldLabel}>Lý do có căn cứ<textarea rows={3} minLength={20} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={4000} placeholder="Giải thích cách evidence đã chọn hỗ trợ từng đánh giá" /></label><button className={styles.primaryButton} type="button" onClick={() => void propose(answer.expertId)} disabled={busy || !evidenceIds.length || reason.trim().length < 20}>Đề xuất rubric score</button></>}</article>;
            })}</section>}

            {active.round?.status && ["SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT"].includes(active.round.status) && <section className={styles.confirmations}><div className={styles.subhead}><Check size={16} /><strong>Xác nhận adjudication</strong></div>{adjudications.map((item) => <article key={item.expertId} className={styles.confirmRow}><div><strong>Expert …{item.expertId.slice(-8)}</strong><span>{item.proposedScore}/100 · {item.state}</span><small>{item.reason}</small><code>{item.proposalHash}</code></div>{active.viewerRole === "SUPERVISOR_EXPERT" && item.state === "PROPOSED" && <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => void mutate("CONFIRM_SCORE", { expertId: item.expertId, proposalHash: item.proposalHash })}>Supervisor xác nhận</button>}{active.viewerRole === "HOST" && item.state === "SUPERVISOR_CONFIRMED" && <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => void mutate("ACKNOWLEDGE_SCORE", { expertId: item.expertId, proposalHash: item.proposalHash })}>Host ghi nhận</button>}</article>)}</section>}

            {room.status === "DISPUTED" && <div className={styles.blocked}><strong>Vòng đang tranh chấp</strong><p>Không có reputation được tạo. Cần xem lại proposal hash và hồ sơ audit trước khi thực hiện ngoài hệ thống.</p></div>}
            {room.status === "TRUST_UNAVAILABLE" && <div className={styles.blocked}><strong>Trust không khả dụng</strong><p>REMOTE_RETRIEVAL = {active.evidencePackage?.retrievalState || "UNAVAILABLE"}; TRUST_ANALYSIS = N/A. Không thể adjudicate hoặc cộng reputation.</p></div>}
            {room.status === "ADJUDICATION_BLOCKED" && <div className={styles.blocked}><strong>Thiếu bằng chứng để chấm</strong><p>Phòng giữ hồ sơ và trạng thái không khả dụng. Trust output không được dùng thay cho bằng chứng hoặc kết luận của con người.</p></div>}
            {room.status === "SETTLED" && <div className={styles.settled}><Check size={17} /><div><strong>Vòng đã được hai bên ghi nhận</strong><p>Thay đổi reputation chỉ phát sinh từ adjudication đã xác nhận và được lưu trong ledger có khóa idempotency.</p></div></div>}
            {room.status === "WAITING_FOR_SUPERVISOR" && active.viewerRole === "HOST" && <div className={styles.lobbyNotice}>Đang chờ một Expert đã xác minh, đang online và đồng ý khai báo không có xung đột lợi ích.</div>}
          </>}
        </section>
      </div>
      <footer className={styles.footer}>Câu trả lời không được tiết lộ trước khi khóa. Ảnh chụp màn hình không thay thế provenance; Trust không thay cho adjudication của con người.<Link href="/expert/missions">Luyện nhiệm vụ hằng ngày <ExternalLink size={13} /></Link></footer>
    </main>
  );
}
