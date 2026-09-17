"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiRequest } from "@/lib/api/runtimeClient";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { DAY_LABELS } from "@/lib/intelligence/academic/academicTimetableModel.js";

const DAY_OPTIONS = Object.entries(DAY_LABELS).map(([value, label]) => ({ value: Number(value), label }));
const EMPTY_ENTRY = Object.freeze({
  courseName: "",
  courseCode: "",
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  periodStart: "",
  periodEnd: "",
  room: "",
  building: "",
  lecturer: "",
  classGroup: "",
  weekRange: "",
  notes: "",
  confidence: { courseName: null, dayOfWeek: null, time: null, room: null },
});

function newEntry() {
  return { ...EMPTY_ENTRY, confidence: { ...EMPTY_ENTRY.confidence } };
}

function displayTime(entry) {
  if (entry.startTime && entry.endTime) return `${entry.startTime} – ${entry.endTime}`;
  if (entry.periodStart || entry.periodEnd) return `Tiết ${entry.periodStart || "?"}–${entry.periodEnd || "?"}`;
  return "Giờ chưa xác định";
}

function entryHasUncertainty(entry) {
  return Object.values(entry?.confidence || {}).some((value) => value !== null && Number(value) < 0.65);
}

function EntryFields({ entry, index, onChange, onRemove, removable = true, review = false }) {
  const update = (field, value) => onChange(index, { ...entry, [field]: value });
  const fieldClass = (field) => {
    const confidence = field === "startTime" || field === "endTime" ? entry.confidence?.time : entry.confidence?.[field];
    return confidence !== null && confidence !== undefined && Number(confidence) < 0.65
      ? "border-amber-400/80 bg-amber-400/10"
      : "border-white/10 bg-black/20";
  };
  return (
    <div className={`rounded-2xl border p-3 ${entryHasUncertainty(entry) ? "border-amber-300/50 bg-amber-300/[0.04]" : "border-white/10 bg-white/[0.025]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px]">{index + 1}</span>
          {review && entryHasUncertainty(entry) ? <span className="text-amber-200">Cần kiểm tra</span> : <span>Học phần</span>}
        </div>
        {removable && <button type="button" className="icon-button !h-7 !w-7" aria-label={`Xóa dòng ${index + 1}`} onClick={() => onRemove(index)}><Trash2 size={14} /></button>}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2 lg:col-span-2"><span className="field-label">Tên học phần *</span><input className={`field-input ${fieldClass("courseName")}`} value={entry.courseName || ""} onChange={(event) => update("courseName", event.target.value)} placeholder="Ví dụ: Lập trình Web" /></label>
        <label><span className="field-label">Mã học phần</span><input className={`field-input ${fieldClass("courseCode")}`} value={entry.courseCode || ""} onChange={(event) => update("courseCode", event.target.value)} placeholder="CS101" /></label>
        <label><span className="field-label">Ngày *</span><select className={`field-input ${fieldClass("dayOfWeek")}`} value={entry.dayOfWeek || 1} onChange={(event) => update("dayOfWeek", Number(event.target.value))}>{DAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
        <label><span className="field-label">Bắt đầu</span><input type="time" className={`field-input ${fieldClass("startTime")}`} value={entry.startTime || ""} onChange={(event) => update("startTime", event.target.value)} /></label>
        <label><span className="field-label">Kết thúc</span><input type="time" className={`field-input ${fieldClass("endTime")}`} value={entry.endTime || ""} onChange={(event) => update("endTime", event.target.value)} /></label>
        <label><span className="field-label">Tiết bắt đầu</span><input type="number" min="1" max="99" className="field-input" value={entry.periodStart || ""} onChange={(event) => update("periodStart", event.target.value)} placeholder="1" /></label>
        <label><span className="field-label">Tiết kết thúc</span><input type="number" min="1" max="99" className="field-input" value={entry.periodEnd || ""} onChange={(event) => update("periodEnd", event.target.value)} placeholder="3" /></label>
        <label><span className="field-label">Phòng</span><input className={`field-input ${fieldClass("room")}`} value={entry.room || ""} onChange={(event) => update("room", event.target.value)} placeholder="A2-301" /></label>
        <label><span className="field-label">Tòa nhà</span><input className="field-input" value={entry.building || ""} onChange={(event) => update("building", event.target.value)} placeholder="A2" /></label>
        <label><span className="field-label">Giảng viên</span><input className="field-input" value={entry.lecturer || ""} onChange={(event) => update("lecturer", event.target.value)} /></label>
        <label><span className="field-label">Nhóm lớp</span><input className="field-input" value={entry.classGroup || ""} onChange={(event) => update("classGroup", event.target.value)} /></label>
        <label><span className="field-label">Tuần học</span><input className="field-input" value={entry.weekRange || ""} onChange={(event) => update("weekRange", event.target.value)} placeholder="1–15" /></label>
        <label className="sm:col-span-2"><span className="field-label">Ghi chú</span><input className="field-input" value={entry.notes || ""} onChange={(event) => update("notes", event.target.value)} /></label>
      </div>
    </div>
  );
}

function ClassCard({ entry, reminder, onToggleReminder, busy = false }) {
  return (
    <article className="rounded-xl border border-white/10 bg-slate-950/50 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-white">{entry.courseName}</p>
          <p className="mt-1 text-xs text-slate-400">{entry.courseCode || "Mã học phần chưa có"}</p>
        </div>
        <span className="rounded-md bg-teal-300/10 px-2 py-1 text-[11px] font-semibold text-teal-200">{displayTime(entry)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        {(entry.room || entry.building) && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {[entry.building, entry.room].filter(Boolean).join(" · ")}</span>}
        {entry.lecturer && <span>{entry.lecturer}</span>}
        {entry.classGroup && <span>{entry.classGroup}</span>}
      </div>
      <button type="button" disabled={busy} onClick={onToggleReminder} className={`mt-3 inline-flex items-center gap-1.5 text-xs ${reminder ? "text-teal-200" : "text-slate-500 hover:text-slate-200"}`}>
        <Bell size={13} /> {reminder ? "Đã nhắc 10 phút trước" : "Nhắc 10 phút trước"}
      </button>
    </article>
  );
}

function EmptyState({ onManual, onImport }) {
  return (
    <section className="surface-card border-dashed p-8 text-center sm:p-12" aria-labelledby="academic-empty-title">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-300/10 text-teal-200"><CalendarDays size={25} /></div>
      <h2 id="academic-empty-title" className="mt-5 text-xl font-black text-white">Bạn chưa có thời khóa biểu.</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">Tạo lịch học thủ công hoặc tải ảnh lên để nhận một bản nháp có thể chỉnh sửa. Hệ thống chỉ dùng dữ liệu sau khi bạn xác nhận.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" className="primary-action justify-center" onClick={onManual}><Plus size={16} /> Nhập thủ công</button>
        <button type="button" className="secondary-action justify-center" onClick={onImport}><ImagePlus size={16} /> Nhập từ ảnh</button>
      </div>
    </section>
  );
}

export default function AcademicWorkspace() {
  const { session, isLoading: authLoading } = useAuth();
  const { subscribe, connectionStatus } = useRealtime();
  const inputRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [view, setView] = useState("today");
  const [selectedDay, setSelectedDay] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSource, setEditorSource] = useState("MANUAL");
  const [editorEntries, setEditorEntries] = useState([]);
  const [editorName, setEditorName] = useState("Thời khóa biểu");
  const [editorTerm, setEditorTerm] = useState("");
  const [draft, setDraft] = useState(null);
  const [importState, setImportState] = useState("");
  const [busy, setBusy] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(null);

  const loadWorkspace = useCallback(async () => {
    if (!session) return;
    try {
      const payload = await apiRequest("/api/academic/timetable");
      setWorkspace(payload);
      setState("ready");
      setError("");
    } catch (requestError) {
      setState("error");
      setError(requestError.message || "Không thể nạp không gian học vụ.");
    }
  }, [session]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!session) return undefined;
    void Promise.resolve().then(loadWorkspace);
    return undefined;
  }, [authLoading, loadWorkspace, session]);

  useEffect(() => subscribe("academic", "academic:timetable.updated", () => { void loadWorkspace(); }), [loadWorkspace, subscribe]);

  const timetable = workspace?.timetable || null;
  const entries = useMemo(() => timetable?.entries || [], [timetable?.entries]);
  const selectedEntries = useMemo(() => workspace?.week?.[selectedDay] || [], [selectedDay, workspace?.week]);
  const reminderFor = useCallback((entryId) => workspace?.reminders?.find((item) => item.entryId === entryId) || null, [workspace?.reminders]);

  const startManualEditor = useCallback(() => {
    setEditorSource("MANUAL");
    setEditorName(timetable?.name || "Thời khóa biểu");
    setEditorTerm(timetable?.academicTerm || "");
    setEditorEntries(entries.length ? entries.map((entry) => ({ ...entry })) : [newEntry()]);
    setDraft(null);
    setEditorOpen(true);
  }, [entries, timetable]);

  const startImport = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportState("Đang đọc thời khóa biểu...");
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const payload = await apiRequest("/api/academic/timetable/import", { method: "POST", body: form, timeoutMs: 60_000 });
      setDraft({ ...payload.draft, _fileDigest: payload.file?.sha256 || null });
      setEditorEntries(payload.draft?.entries?.length ? payload.draft.entries : [newEntry()]);
      setEditorName(payload.draft?.timetableName || "Thời khóa biểu");
      setEditorTerm(payload.draft?.academicTerm || "");
      setEditorSource("IMAGE");
      setEditorOpen(true);
      setImportState(payload.importState === "MANUAL_FALLBACK" ? "Ảnh chưa đọc chắc chắn — hãy nhập hoặc sửa thủ công." : "Bản nháp đã sẵn sàng để kiểm tra.");
    } catch (requestError) {
      setImportState("");
      setError(requestError.message || "Không thể đọc ảnh thời khóa biểu.");
    }
  };

  const updateEditorEntry = (index, next) => setEditorEntries((current) => current.map((entry, entryIndex) => entryIndex === index ? next : entry));
  const removeEditorEntry = (index) => setEditorEntries((current) => current.filter((_entry, entryIndex) => entryIndex !== index));

  const saveEditor = async () => {
    setBusy(true);
    setError("");
    try {
      const body = { name: editorName, academicTerm: editorTerm, entries: editorEntries };
      if (editorSource === "IMAGE") {
        const confirmationKey = `image:${draft?._fileDigest || Date.now()}`;
        await apiRequest("/api/academic/timetable/confirm", { method: "POST", headers: { "Idempotency-Key": confirmationKey }, body: JSON.stringify({ ...draft, entries: editorEntries, timetableName: editorName, academicTerm: editorTerm }) });
      } else if (timetable) {
        await apiRequest(`/api/academic/timetable/${timetable.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiRequest("/api/academic/timetable", { method: "POST", headers: { "Idempotency-Key": `manual:${Date.now()}` }, body: JSON.stringify(body) });
      }
      setEditorOpen(false);
      setDraft(null);
      setImportState("");
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message || "Không thể lưu thời khóa biểu.");
    } finally {
      setBusy(false);
    }
  };

  const toggleReminder = async (entry) => {
    if (!timetable?.id || !entry?.id) return;
    const existing = reminderFor(entry.id);
    setReminderBusy(entry.id);
    try {
      if (existing) {
        await apiRequest(`/api/academic/timetable/reminders/${existing.id}`, { method: "DELETE" });
      } else {
        await apiRequest("/api/academic/timetable/reminders", { method: "POST", body: JSON.stringify({ timetableId: timetable.id, entryId: entry.id, offsetMinutes: 10 }) });
      }
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message || "Không thể cập nhật nhắc nhở.");
    } finally {
      setReminderBusy(null);
    }
  };

  if (authLoading) return <div className="empty-state" role="status">Đang nạp không gian học vụ…</div>;
  if (!session) {
    return <section className="surface-card p-8"><p className="eyebrow">VI · Học vụ</p><h1 className="mt-3 text-2xl font-black text-white">Đăng nhập để quản lý thời khóa biểu</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Lịch học chỉ thuộc về tài khoản của bạn và không được dựng từ dữ liệu mẫu.</p><Link href="/login?next=%2Facademic" className="primary-action mt-6 inline-flex">Đăng nhập <ChevronRight size={16} /></Link></section>;
  }
  if (state === "loading") return <div className="empty-state" role="status">Đang nạp không gian học vụ…</div>;
  if (state === "error") return <section className="surface-card p-7" role="alert"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 text-amber-300" size={20} /><div><p className="eyebrow">Học vụ chưa sẵn sàng</p><h1 className="mt-2 text-xl font-bold text-white">Không thay thế dữ liệu thật bằng fixture</h1><p className="mt-2 text-sm leading-7 text-slate-300">{error}</p><button type="button" className="secondary-action mt-5" onClick={() => { setState("loading"); void loadWorkspace(); }}><RefreshCw size={15} /> Thử lại</button></div></div></section>;

  return (
    <div className="space-y-6" data-academic-workspace="postgres-authoritative">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFile} />
      <section className="surface-card overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="eyebrow">VI · Học vụ / Thời khóa biểu</p><h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Lịch học của bạn</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">Dữ liệu do bạn xác nhận, PostgreSQL là nguồn chuẩn. AI chỉ hỗ trợ tạo bản nháp có thể sửa.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="secondary-action" onClick={startManualEditor}><Edit3 size={15} /> {timetable ? "Sửa lịch" : "Nhập thủ công"}</button><button type="button" className="primary-action" onClick={startImport}><UploadCloud size={15} /> Nhập từ ảnh</button></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${connectionStatus === "CONNECTED" ? "bg-emerald-300" : "bg-slate-500"}`} />Realtime {connectionStatus === "CONNECTED" ? "đang kết nối" : "chờ kết nối"}</span><span>·</span><span>Không lưu ảnh gốc</span>{importState && <span className="text-amber-200">· {importState}</span>}</div>
      </section>

      {!timetable ? <EmptyState onManual={startManualEditor} onImport={startImport} /> : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="surface-card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Hôm nay</p><h2 className="mt-1 text-xl font-black text-white">{workspace.today?.dayLabel || "Lịch hôm nay"}</h2></div><div className="flex rounded-xl border border-white/10 bg-black/20 p-1"><button type="button" className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "today" ? "bg-white/10 text-white" : "text-slate-500"}`} onClick={() => setView("today")}>Hôm nay</button><button type="button" className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "week" ? "bg-white/10 text-white" : "text-slate-500"}`} onClick={() => setView("week")}>Tuần</button></div></div>{view === "today" ? <div className="mt-5 space-y-3">{workspace.today?.classes?.length ? workspace.today.classes.map((entry) => <ClassCard key={entry.id || `${entry.courseName}-${entry.startTime}`} entry={entry} reminder={reminderFor(entry.id)} busy={reminderBusy === entry.id} onToggleReminder={() => toggleReminder(entry)} />) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-400">Hôm nay chưa có tiết học.</p>}</div> : <WeekView workspace={workspace} selectedDay={selectedDay} setSelectedDay={setSelectedDay} reminderFor={reminderFor} onToggleReminder={toggleReminder} reminderBusy={reminderBusy} selectedEntries={selectedEntries} />}</div>
            <aside className="surface-card p-5 sm:p-6"><p className="eyebrow">Tiết tiếp theo</p>{workspace.nextClass ? <><div className="mt-3 flex items-start gap-3"><Clock3 className="mt-0.5 text-teal-200" size={18} /><div><p className="font-bold text-white">{workspace.nextClass.courseName}</p><p className="mt-1 text-sm text-slate-400">{displayTime(workspace.nextClass)}</p><p className="mt-1 text-xs text-slate-500">{[workspace.nextClass.building, workspace.nextClass.room].filter(Boolean).join(" · ") || "Địa điểm chưa có"}</p></div></div></> : <p className="mt-3 text-sm leading-6 text-slate-400">Không có tiết tiếp theo được xác định từ dữ liệu hiện tại.</p>}<div className="mt-6 border-t border-white/10 pt-5"><p className="eyebrow">Học phần</p><p className="mt-2 text-2xl font-black text-white">{workspace.courses?.length || 0}</p><p className="mt-1 text-xs text-slate-500">được suy ra từ các dòng lịch đã xác nhận</p></div></aside>
          </section>
          <AcademicSignals workspace={workspace} />
        </>
      )}

      {editorOpen && <EditorPanel source={editorSource} name={editorName} term={editorTerm} entries={editorEntries} setName={setEditorName} setTerm={setEditorTerm} onChange={updateEditorEntry} onRemove={removeEditorEntry} onAdd={() => setEditorEntries((current) => [...current, newEntry()])} onSave={saveEditor} onClose={() => { setEditorOpen(false); setDraft(null); }} busy={busy} />}
    </div>
  );
}

function WeekView({ workspace, selectedDay, setSelectedDay, reminderFor, onToggleReminder, reminderBusy, selectedEntries }) {
  return <div className="mt-5"><div className="flex gap-1 overflow-x-auto pb-2 md:hidden">{DAY_OPTIONS.map((day) => <button type="button" key={day.value} onClick={() => setSelectedDay(day.value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${selectedDay === day.value ? "bg-teal-300/15 text-teal-100" : "bg-white/5 text-slate-500"}`}>{day.label.replace("Thứ ", "T")}</button>)}</div><div className="mt-3 grid gap-2 md:grid-cols-7">{DAY_OPTIONS.map((day) => <div key={day.value} className={`${selectedDay === day.value ? "block" : "hidden md:block"} min-h-36 rounded-xl border border-white/10 bg-black/15 p-2`}><p className="mb-2 text-[11px] font-bold text-slate-400">{day.label}</p><div className="space-y-2">{(workspace.week?.[day.value] || []).map((entry) => <ClassCard key={entry.id || `${entry.courseName}-${entry.startTime}`} entry={entry} reminder={reminderFor(entry.id)} busy={reminderBusy === entry.id} onToggleReminder={() => onToggleReminder(entry)} />)}{day.value === selectedDay && !selectedEntries.length && <p className="text-xs text-slate-600">Trống</p>}</div></div>)}</div></div>;
}

function AcademicSignals({ workspace }) {
  const tasks = Array.isArray(workspace.tasks) ? workspace.tasks.slice(0, 4) : [];
  const notifications = Array.isArray(workspace.notifications) ? workspace.notifications.slice(0, 4) : [];
  return <section className="grid gap-4 lg:grid-cols-2"><div className="surface-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Nhiệm vụ cá nhân</p><h2 className="mt-1 text-lg font-black text-white">Việc bạn đã tạo hoặc xác nhận</h2></div><span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{tasks.length}</span></div>{tasks.length ? <div className="mt-4 space-y-2">{tasks.map((task) => <div key={task.taskId} className="rounded-xl border border-white/10 p-3"><p className="text-sm font-semibold text-slate-200">{task.title || task.name || "Nhiệm vụ học vụ"}</p><p className="mt-1 text-xs text-slate-500">{task.status || "Đang theo dõi"}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">Chưa có nhiệm vụ học vụ được lưu.</p>}</div><div className="surface-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Thông báo</p><h2 className="mt-1 text-lg font-black text-white">Thay đổi cần biết</h2></div><span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{workspace.unreadNotificationCount || 0} chưa đọc</span></div>{notifications.length ? <div className="mt-4 space-y-2">{notifications.map((notification) => <div key={notification.notificationId} className="rounded-xl border border-white/10 p-3"><p className="text-sm font-semibold text-slate-200">{notification.title || "Thông báo học vụ"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{notification.body || ""}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">Chưa có thông báo học vụ được lưu.</p>}</div></section>;
}

function EditorPanel({ source, name, term, entries, setName, setTerm, onChange, onRemove, onAdd, onSave, onClose, busy }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"><div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#111827] p-4 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{source === "IMAGE" ? "Bản nháp từ ảnh" : "Trình chỉnh sửa"}</p><h2 className="mt-1 text-xl font-black text-white">Kiểm tra trước khi lưu</h2><p className="mt-2 text-sm leading-6 text-slate-400">{source === "IMAGE" ? "Các trường được đánh dấu vàng cần bạn xác nhận. Chưa có dữ liệu nào được ghi vào lịch chuẩn." : "Mọi dòng cần có tên học phần và ngày học."}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Đóng trình chỉnh sửa"><X size={18} /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label><span className="field-label">Tên thời khóa biểu</span><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} /></label><label><span className="field-label">Học kỳ</span><input className="field-input" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="HK1 2026–2027" /></label></div>{source === "IMAGE" && <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-6 text-amber-100">AI chỉ đề xuất bản nháp. Hãy kiểm tra tên môn, ngày, giờ và phòng trước khi xác nhận.</div>}<div className="mt-5 space-y-3">{entries.map((entry, index) => <EntryFields key={entry.id || `draft-${index}`} entry={entry} index={index} onChange={onChange} onRemove={onRemove} review={source === "IMAGE"} />)}</div><div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row"><button type="button" className="secondary-action justify-center" onClick={onAdd}><Plus size={15} /> Thêm dòng</button><div className="flex flex-col gap-2 sm:flex-row"><button type="button" className="secondary-action justify-center" onClick={onClose}>Hủy</button><button type="button" className="primary-action justify-center" disabled={busy || !entries.length} onClick={onSave}>{busy ? <LoaderCircle className="animate-spin" size={15} /> : source === "IMAGE" ? <Check size={15} /> : <Save size={15} />} {source === "IMAGE" ? "Xác nhận và lưu" : "Lưu thời khóa biểu"}</button></div></div></div></div>;
}
