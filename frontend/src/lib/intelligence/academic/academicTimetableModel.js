/**
 * Canonical timetable domain helpers.
 *
 * This module is deliberately deterministic and has no provider, network, or
 * persistence dependency. It is shared by the Owner service and the browser
 * tests so Today/Week/Next Class never become an AI decision.
 */

export const TIMETABLE_SOURCE_TYPES = Object.freeze({ MANUAL: "MANUAL", IMAGE: "IMAGE" });
export const TIMETABLE_STATUSES = Object.freeze({ ACTIVE: "ACTIVE", ARCHIVED: "ARCHIVED" });

export const DAY_LABELS = Object.freeze({
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
});

export class TimetableValidationError extends Error {
  constructor(message, code = "TIMETABLE_INPUT_INVALID", details = null) {
    super(message);
    this.name = "TimetableValidationError";
    this.code = code;
    this.statusCode = 422;
    this.details = details;
  }
}

function boundedText(value, max, { allowNull = true } = {}) {
  if (value === null || value === undefined) return allowNull ? null : "";
  const normalized = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  return normalized ? normalized.slice(0, max) : null;
}

function integerOrNull(value, min, max) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function normalizeTime(value) {
  if (value === null || value === undefined || value === "") return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeConfidence(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const normalized = number > 1 ? number / 100 : number;
  return Math.max(0, Math.min(1, Number(normalized.toFixed(4))));
}

export function normalizeTimetableEntry(input = {}, { allowIncomplete = false } = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const startTime = normalizeTime(source.startTime ?? source.start_time);
  const endTime = normalizeTime(source.endTime ?? source.end_time);
  const dayOfWeek = integerOrNull(source.dayOfWeek ?? source.day_of_week, 1, 7);
  const periodStart = integerOrNull(source.periodStart ?? source.period_start, 1, 99);
  const periodEnd = integerOrNull(source.periodEnd ?? source.period_end, 1, 99);
  const courseName = boundedText(source.courseName ?? source.course_name, 240);
  const normalized = {
    id: boundedText(source.id, 80),
    courseName,
    courseCode: boundedText(source.courseCode ?? source.course_code, 80),
    dayOfWeek,
    startTime,
    endTime,
    periodStart,
    periodEnd,
    room: boundedText(source.room, 120),
    building: boundedText(source.building, 120),
    lecturer: boundedText(source.lecturer ?? source.teacher ?? source.instructor, 180),
    classGroup: boundedText(source.classGroup ?? source.class_group, 120),
    weekRange: boundedText(source.weekRange ?? source.week_range ?? source.week, 120),
    notes: boundedText(source.notes, 2000),
    confidence: {
      courseName: normalizeConfidence(source.confidence?.courseName),
      dayOfWeek: normalizeConfidence(source.confidence?.dayOfWeek),
      time: normalizeConfidence(source.confidence?.time),
      room: normalizeConfidence(source.confidence?.room),
    },
  };

  if (!allowIncomplete) validatePersistedEntry(normalized);
  return normalized;
}

export function validatePersistedEntry(entry) {
  if (!entry?.courseName) throw new TimetableValidationError("Mỗi dòng cần có tên học phần.", "COURSE_NAME_REQUIRED");
  if (!entry?.dayOfWeek) throw new TimetableValidationError("Mỗi dòng cần có ngày học.", "DAY_OF_WEEK_REQUIRED");
  if (entry.startTime && entry.endTime && entry.startTime >= entry.endTime) {
    throw new TimetableValidationError("Giờ kết thúc phải sau giờ bắt đầu.", "TIME_RANGE_INVALID");
  }
  if (entry.periodStart && entry.periodEnd && entry.periodStart > entry.periodEnd) {
    throw new TimetableValidationError("Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.", "PERIOD_RANGE_INVALID");
  }
  return entry;
}

export function normalizePersistedEntries(entries, { allowEmpty = false } = {}) {
  if (!Array.isArray(entries)) throw new TimetableValidationError("Danh sách tiết học không hợp lệ.", "ENTRIES_INVALID");
  const normalized = entries.map((entry) => normalizeTimetableEntry(entry));
  if (!allowEmpty && normalized.length === 0) {
    throw new TimetableValidationError("Thời khóa biểu cần ít nhất một học phần.", "ENTRIES_REQUIRED");
  }
  if (normalized.length > 300) throw new TimetableValidationError("Thời khóa biểu vượt quá giới hạn 300 dòng.", "ENTRIES_TOO_LARGE");
  return normalized;
}

export function normalizeDraft(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const rawEntries = Array.isArray(source.entries) ? source.entries.slice(0, 300) : [];
  const entries = rawEntries.map((entry) => normalizeTimetableEntry(entry, { allowIncomplete: true }));
  const warnings = Array.isArray(source.warnings)
    ? source.warnings.map((warning) => boundedText(warning, 500, { allowNull: false })).filter(Boolean).slice(0, 50)
    : [];
  return {
    sourceType: source.sourceType === TIMETABLE_SOURCE_TYPES.MANUAL ? TIMETABLE_SOURCE_TYPES.MANUAL : TIMETABLE_SOURCE_TYPES.IMAGE,
    timetableName: boundedText(source.timetableName ?? source.name, 180),
    academicTerm: boundedText(source.academicTerm ?? source.academic_term, 120),
    entries,
    warnings,
  };
}

export function emptyTimetableDraft(warnings = []) {
  return normalizeDraft({ sourceType: TIMETABLE_SOURCE_TYPES.IMAGE, entries: [], warnings });
}

export function validateDraftForConfirmation(draft) {
  const normalized = normalizeDraft(draft);
  if (!normalized.entries.length) throw new TimetableValidationError("Không có dòng thời khóa biểu để lưu.", "ENTRIES_REQUIRED");
  const entries = normalizePersistedEntries(normalized.entries);
  return {
    ...normalized,
    entries: entries.map((entry) => ({ ...entry, confidence: undefined })),
  };
}

export function normalizeCourseIdentity(entry) {
  const code = String(entry?.courseCode || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .trim();
  if (code) return `CODE:${code}`;
  return `NAME:${String(entry?.courseName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()}`;
}

export function deriveCourses(entries = []) {
  const byIdentity = new Map();
  for (const entry of entries) {
    const identity = normalizeCourseIdentity(entry);
    if (identity === "NAME:") continue;
    const current = byIdentity.get(identity) || {
      identity,
      courseName: entry.courseName,
      courseCode: entry.courseCode || null,
      entriesCount: 0,
    };
    current.entriesCount += 1;
    if (!current.courseCode && entry.courseCode) current.courseCode = entry.courseCode;
    byIdentity.set(identity, current);
  }
  return [...byIdentity.values()].sort((a, b) => a.courseName.localeCompare(b.courseName, "vi"));
}

export function timeToMinutes(value) {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

function localParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const weekdayToDay = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    dayOfWeek: weekdayToDay[parts.weekday] || 1,
    minutes: Number(parts.hour || 0) * 60 + Number(parts.minute || 0),
  };
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99") || String(a.courseName).localeCompare(String(b.courseName), "vi"));
}

export function projectToday(entries = [], { now = new Date(), timeZone = "Asia/Ho_Chi_Minh" } = {}) {
  const local = localParts(now instanceof Date ? now : new Date(now), timeZone);
  const todayClasses = sortEntries(entries.filter((entry) => entry.dayOfWeek === local.dayOfWeek));
  const currentClass = todayClasses.find((entry) => {
    const start = timeToMinutes(entry.startTime);
    const end = timeToMinutes(entry.endTime);
    return start !== null && end !== null && start <= local.minutes && local.minutes < end;
  }) || null;
  const nextClass = todayClasses.find((entry) => {
    const start = timeToMinutes(entry.startTime);
    return start !== null && start > local.minutes;
  }) || null;
  return {
    dayOfWeek: local.dayOfWeek,
    dayLabel: DAY_LABELS[local.dayOfWeek],
    currentClass,
    nextClass,
    classes: todayClasses,
  };
}

export function projectNextClass(entries = [], { now = new Date(), timeZone = "Asia/Ho_Chi_Minh" } = {}) {
  const local = localParts(now instanceof Date ? now : new Date(now), timeZone);
  for (let offset = 0; offset < 7; offset += 1) {
    const dayOfWeek = ((local.dayOfWeek - 1 + offset) % 7) + 1;
    const candidates = sortEntries(entries.filter((entry) => {
      if (entry.dayOfWeek !== dayOfWeek || timeToMinutes(entry.startTime) === null) return false;
      return offset > 0 || timeToMinutes(entry.startTime) > local.minutes;
    }));
    if (candidates.length) return candidates[0];
  }
  return null;
}

export function projectWeek(entries = []) {
  return Object.fromEntries(Object.keys(DAY_LABELS).map((day) => [day, sortEntries(entries.filter((entry) => entry.dayOfWeek === Number(day)))]));
}
