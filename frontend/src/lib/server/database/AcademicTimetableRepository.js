import { getPostgresPool } from "./PostgresPool.js";

import {
  normalizePersistedEntries,
  normalizeTimetableEntry,
  TimetableValidationError,
} from "../../intelligence/academic/academicTimetableModel.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ownerId(value) {
  const normalized = String(value || "").replace(/^student:/i, "").trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    const error = new Error("A canonical authenticated timetable owner is required.");
    error.code = "DURABLE_IDENTITY_REQUIRED";
    error.statusCode = 422;
    throw error;
  }
  return normalized;
}

function uuid(value, label) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    const error = new Error(`${label} is invalid.`);
    error.code = `${label.toUpperCase()}_INVALID`;
    error.statusCode = 422;
    throw error;
  }
  return normalized;
}

function text(value, fallback = null, max = 180) {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return normalized ? normalized.slice(0, max) : fallback;
}

function iso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function entryDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    courseName: row.course_name,
    courseCode: row.course_code || null,
    dayOfWeek: Number(row.day_of_week),
    startTime: row.start_time ? String(row.start_time).slice(0, 5) : null,
    endTime: row.end_time ? String(row.end_time).slice(0, 5) : null,
    periodStart: row.period_start == null ? null : Number(row.period_start),
    periodEnd: row.period_end == null ? null : Number(row.period_end),
    room: row.room || null,
    building: row.building || null,
    lecturer: row.lecturer || null,
    classGroup: row.class_group || null,
    weekRange: row.week_range || null,
    notes: row.notes || null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function timetableDto(row, entries = []) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    academicTerm: row.academic_term || null,
    sourceType: row.source_type,
    status: row.status,
    isActive: row.is_active === true,
    sourceArtifactId: row.source_artifact_id || null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    entries,
  };
}

function rowColumns(alias = "") {
  const prefix = alias ? `${alias}.` : "";
  return `${prefix}id, ${prefix}user_id, ${prefix}name, ${prefix}academic_term,
          ${prefix}source_type, ${prefix}status, ${prefix}is_active,
          ${prefix}source_artifact_id, ${prefix}idempotency_key,
          ${prefix}request_digest, ${prefix}created_at, ${prefix}updated_at`;
}

export class AcademicTimetableRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async #entries(queryable, timetableId, userId) {
    const result = await queryable.query(
      `select id, timetable_id, user_id, course_name, course_code, day_of_week,
              start_time, end_time, period_start, period_end, room, building,
              lecturer, class_group, week_range, notes, created_at, updated_at
         from public.timetable_entries
        where timetable_id = $1 and user_id = $2
        order by day_of_week asc, start_time asc nulls last, created_at asc`,
      [timetableId, userId],
    );
    return result.rows.map(entryDto);
  }

  async #withTimetable(queryable, row, userId) {
    if (!row) return null;
    return timetableDto(row, await this.#entries(queryable, row.id, userId));
  }

  async getActiveTimetable(userId) {
    const owner = ownerId(userId);
    const result = await this.pool.query(
      `select ${rowColumns()}
         from public.user_timetables
        where user_id = $1 and is_active = true
        order by updated_at desc
        limit 1`,
      [owner],
    );
    return this.#withTimetable(this.pool, result.rows[0], owner);
  }

  async listTimetables(userId) {
    const owner = ownerId(userId);
    const result = await this.pool.query(
      `select ${rowColumns()}
         from public.user_timetables
        where user_id = $1
        order by is_active desc, updated_at desc`,
      [owner],
    );
    return Promise.all(result.rows.map((row) => this.#withTimetable(this.pool, row, owner)));
  }

  async getTimetable(userId, timetableId) {
    const owner = ownerId(userId);
    const timetable = uuid(timetableId, "timetable_id");
    const result = await this.pool.query(
      `select ${rowColumns()}
         from public.user_timetables
        where id = $1 and user_id = $2
        limit 1`,
      [timetable, owner],
    );
    return this.#withTimetable(this.pool, result.rows[0], owner);
  }

  async #insertEntries(queryable, timetableId, userId, entries) {
    const normalizedEntries = normalizePersistedEntries(entries);
    const inserted = [];
    for (const entry of normalizedEntries) {
      const result = await queryable.query(
        `insert into public.timetable_entries
          (timetable_id, user_id, course_name, course_code, day_of_week,
           start_time, end_time, period_start, period_end, room, building,
           lecturer, class_group, week_range, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         returning id, timetable_id, user_id, course_name, course_code, day_of_week,
                   start_time, end_time, period_start, period_end, room, building,
                   lecturer, class_group, week_range, notes, created_at, updated_at`,
        [
          timetableId,
          userId,
          entry.courseName,
          entry.courseCode,
          entry.dayOfWeek,
          entry.startTime,
          entry.endTime,
          entry.periodStart,
          entry.periodEnd,
          entry.room,
          entry.building,
          entry.lecturer,
          entry.classGroup,
          entry.weekRange,
          entry.notes,
        ],
      );
      inserted.push(entryDto(result.rows[0]));
    }
    return inserted;
  }

  async createTimetable({
    userId,
    name = null,
    academicTerm = null,
    sourceType = "MANUAL",
    entries,
    idempotencyKey = null,
    requestDigest = null,
  } = {}) {
    const owner = ownerId(userId);
    const normalizedEntries = normalizePersistedEntries(entries);
    const safeName = text(name, "Thời khóa biểu", 180);
    const safeTerm = text(academicTerm, null, 120);
    const safeSourceType = sourceType === "IMAGE" ? "IMAGE" : "MANUAL";
    const key = text(idempotencyKey, null, 180);
    const digest = text(requestDigest, null, 64);
    const client = await this.pool.connect();
    let committed = false;

    try {
      await client.query("begin");
      if (key) {
        const existing = await client.query(
          `select ${rowColumns()}
             from public.user_timetables
            where user_id = $1 and idempotency_key = $2
            limit 1
            for update`,
          [owner, key],
        );
        if (existing.rows[0]) {
          if (digest && existing.rows[0].request_digest && digest !== existing.rows[0].request_digest) {
            const error = new Error("The idempotency key is already bound to a different timetable.");
            error.code = "IDEMPOTENCY_CONFLICT";
            error.statusCode = 409;
            throw error;
          }
          await client.query("commit");
          committed = true;
          return { timetable: await this.getTimetable(owner, existing.rows[0].id), idempotent: true };
        }
      }

      // Serialize the one-active-timetable policy for this owner before the
      // partial unique index is evaluated.
      await client.query(
        "select id from public.user_timetables where user_id = $1 for update",
        [owner],
      );
      await client.query(
        `update public.user_timetables
            set is_active = false, status = 'ARCHIVED', updated_at = now()
          where user_id = $1 and is_active = true`,
        [owner],
      );
      const created = await client.query(
        `insert into public.user_timetables
          (user_id, name, academic_term, source_type, status, is_active,
           idempotency_key, request_digest)
         values ($1,$2,$3,$4,'ACTIVE',true,$5,$6)
         returning ${rowColumns()}`,
        [owner, safeName, safeTerm, safeSourceType, key, digest],
      );
      const row = created.rows[0];
      await this.#insertEntries(client, row.id, owner, normalizedEntries);
      await client.query("commit");
      committed = true;
      return { timetable: await this.getTimetable(owner, row.id), idempotent: false };
    } finally {
      if (!committed) await client.query("rollback").catch(() => {});
      client.release();
    }
  }

  async replaceTimetableEntries(userId, timetableId, entries, metadata = null) {
    const owner = ownerId(userId);
    const timetable = uuid(timetableId, "timetable_id");
    const normalizedEntries = normalizePersistedEntries(entries);
    const client = await this.pool.connect();
    let committed = false;
    try {
      await client.query("begin");
      const owned = await client.query(
        "select id from public.user_timetables where id = $1 and user_id = $2 for update",
        [timetable, owner],
      );
      if (!owned.rows[0]) {
        const error = new Error("The timetable is not owned by this user.");
        error.code = "TIMETABLE_NOT_FOUND";
        error.statusCode = 404;
        throw error;
      }
      await client.query("delete from public.timetable_entries where timetable_id = $1 and user_id = $2", [timetable, owner]);
      await this.#insertEntries(client, timetable, owner, normalizedEntries);
      if (metadata && typeof metadata === "object") {
        await client.query(
          `update public.user_timetables
              set name = $3,
                  academic_term = $4,
                  updated_at = now()
            where id = $1 and user_id = $2`,
          [timetable, owner, text(metadata.name, null, 180) || "Thời khóa biểu", text(metadata.academicTerm, null, 120)],
        );
      } else {
        await client.query("update public.user_timetables set updated_at = now() where id = $1 and user_id = $2", [timetable, owner]);
      }
      await client.query("commit");
      committed = true;
      return this.getTimetable(owner, timetable);
    } finally {
      if (!committed) await client.query("rollback").catch(() => {});
      client.release();
    }
  }

  async updateTimetable(userId, timetableId, patch = {}) {
    const owner = ownerId(userId);
    const timetable = uuid(timetableId, "timetable_id");
    const client = await this.pool.connect();
    let committed = false;
    try {
      await client.query("begin");
      const existing = await client.query(
        `select ${rowColumns()}
           from public.user_timetables
          where id = $1 and user_id = $2
          for update`,
        [timetable, owner],
      );
      if (!existing.rows[0]) {
        const error = new Error("The timetable is not owned by this user.");
        error.code = "TIMETABLE_NOT_FOUND";
        error.statusCode = 404;
        throw error;
      }
      const row = existing.rows[0];
      const nextActive = patch.isActive === undefined ? row.is_active === true : patch.isActive === true;
      if (nextActive) {
        await client.query("update public.user_timetables set is_active = false, status = 'ARCHIVED', updated_at = now() where user_id = $1 and id <> $2", [owner, timetable]);
      }
      const updated = await client.query(
        `update public.user_timetables
            set name = $3,
                academic_term = $4,
                status = $5,
                is_active = $6,
                updated_at = now()
          where id = $1 and user_id = $2
          returning ${rowColumns()}`,
        [
          timetable,
          owner,
          text(patch.name, row.name, 180),
          text(patch.academicTerm, row.academic_term, 120),
          nextActive ? "ACTIVE" : "ARCHIVED",
          nextActive,
        ],
      );
      await client.query("commit");
      committed = true;
      return this.getTimetable(owner, updated.rows[0].id);
    } finally {
      if (!committed) await client.query("rollback").catch(() => {});
      client.release();
    }
  }

  async setActiveTimetable(userId, timetableId) {
    return this.updateTimetable(userId, timetableId, { isActive: true });
  }

  async deleteTimetable(userId, timetableId) {
    const owner = ownerId(userId);
    const timetable = uuid(timetableId, "timetable_id");
    const result = await this.pool.query(
      "delete from public.user_timetables where id = $1 and user_id = $2 returning id",
      [timetable, owner],
    );
    if (!result.rows[0]) {
      const error = new Error("The timetable is not owned by this user.");
      error.code = "TIMETABLE_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    return { id: timetable, deleted: true };
  }

  async updateEntry(userId, entryId, input = {}) {
    const owner = ownerId(userId);
    const entry = uuid(entryId, "entry_id");
    const current = await this.pool.query(
      `select id, timetable_id, user_id, course_name, course_code, day_of_week,
              start_time, end_time, period_start, period_end, room, building,
              lecturer, class_group, week_range, notes
         from public.timetable_entries
        where id = $1 and user_id = $2
        limit 1`,
      [entry, owner],
    );
    if (!current.rows[0]) {
      const error = new Error("The timetable entry is not owned by this user.");
      error.code = "ENTRY_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    const normalized = normalizeTimetableEntry({ ...current.rows[0], ...input }, { allowIncomplete: false });
    const result = await this.pool.query(
      `update public.timetable_entries
          set course_name = $3, course_code = $4, day_of_week = $5,
              start_time = $6, end_time = $7, period_start = $8,
              period_end = $9, room = $10, building = $11, lecturer = $12,
              class_group = $13, week_range = $14, notes = $15, updated_at = now()
        where id = $1 and user_id = $2
        returning id, timetable_id, user_id, course_name, course_code, day_of_week,
                  start_time, end_time, period_start, period_end, room, building,
                  lecturer, class_group, week_range, notes, created_at, updated_at`,
      [entry, owner, normalized.courseName, normalized.courseCode, normalized.dayOfWeek, normalized.startTime, normalized.endTime, normalized.periodStart, normalized.periodEnd, normalized.room, normalized.building, normalized.lecturer, normalized.classGroup, normalized.weekRange, normalized.notes],
    );
    await this.pool.query("update public.user_timetables set updated_at = now() where id = $1 and user_id = $2", [current.rows[0].timetable_id, owner]);
    return entryDto(result.rows[0]);
  }

  async deleteEntry(userId, entryId) {
    const owner = ownerId(userId);
    const entry = uuid(entryId, "entry_id");
    const result = await this.pool.query(
      "delete from public.timetable_entries where id = $1 and user_id = $2 returning id, timetable_id",
      [entry, owner],
    );
    if (!result.rows[0]) {
      const error = new Error("The timetable entry is not owned by this user.");
      error.code = "ENTRY_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    await this.pool.query("update public.user_timetables set updated_at = now() where id = $1 and user_id = $2", [result.rows[0].timetable_id, owner]);
    return { id: entry, timetableId: result.rows[0].timetable_id, deleted: true };
  }

  async listReminders(userId, timetableId = null) {
    const owner = ownerId(userId);
    const values = [owner];
    const where = ["user_id = $1"];
    if (timetableId) {
      values.push(uuid(timetableId, "timetable_id"));
      where.push(`timetable_id = $${values.length}`);
    }
    const result = await this.pool.query(
      `select id, user_id, timetable_id, entry_id, task_id, offset_minutes,
              is_active, created_at, updated_at
         from public.timetable_reminders
        where ${where.join(" and ")}
        order by created_at desc`,
      values,
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      timetableId: row.timetable_id,
      entryId: row.entry_id || null,
      taskId: row.task_id || null,
      offsetMinutes: Number(row.offset_minutes),
      isActive: row.is_active === true,
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    }));
  }

  async createReminder(userId, input = {}) {
    const owner = ownerId(userId);
    const timetable = uuid(input.timetableId, "timetable_id");
    const entryId = input.entryId ? uuid(input.entryId, "entry_id") : null;
    const taskId = text(input.taskId, null, 180);
    const offsetMinutes = Number(input.offsetMinutes);
    if (!Number.isInteger(offsetMinutes) || offsetMinutes < 0 || offsetMinutes > 10080 || (!entryId && !taskId)) {
      throw new TimetableValidationError("Reminder không hợp lệ.", "REMINDER_INVALID");
    }
    const owned = await this.pool.query(
      `select 1 from public.user_timetables timetable
        where timetable.id = $1 and timetable.user_id = $2
          and ($3::uuid is null or exists (
            select 1 from public.timetable_entries entry
             where entry.id = $3 and entry.timetable_id = timetable.id and entry.user_id = $2
          ))`,
      [timetable, owner, entryId],
    );
    if (!owned.rows[0]) {
      const error = new Error("The reminder target is not owned by this user.");
      error.code = "REMINDER_TARGET_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    const result = await this.pool.query(
      `insert into public.timetable_reminders
        (user_id, timetable_id, entry_id, task_id, offset_minutes)
       values ($1,$2,$3,$4,$5)
       on conflict do nothing
       returning id, user_id, timetable_id, entry_id, task_id, offset_minutes,
                 is_active, created_at, updated_at`,
      [owner, timetable, entryId, taskId, offsetMinutes],
    );
    if (!result.rows[0]) return (await this.listReminders(owner, timetable)).find((item) => item.entryId === entryId && item.taskId === taskId && item.offsetMinutes === offsetMinutes) || null;
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      timetableId: row.timetable_id,
      entryId: row.entry_id || null,
      taskId: row.task_id || null,
      offsetMinutes: Number(row.offset_minutes),
      isActive: row.is_active === true,
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    };
  }

  async deleteReminder(userId, reminderId) {
    const owner = ownerId(userId);
    const reminder = uuid(reminderId, "reminder_id");
    const result = await this.pool.query("delete from public.timetable_reminders where id = $1 and user_id = $2 returning id", [reminder, owner]);
    if (!result.rows[0]) {
      const error = new Error("The reminder is not owned by this user.");
      error.code = "REMINDER_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    return { id: reminder, deleted: true };
  }
}

export { ownerId as normalizeTimetableOwnerId };
