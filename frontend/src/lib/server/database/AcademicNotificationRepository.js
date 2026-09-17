import { getPostgresPool } from "./PostgresPool.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireOwnerId(value) {
  const ownerId = String(value || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(ownerId)) {
    const error = new Error("A canonical authenticated owner ID is required for durable notifications.");
    error.code = "DURABLE_IDENTITY_REQUIRED";
    error.statusCode = 422;
    throw error;
  }
  return ownerId;
}

function jsonObject(value, fallback = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function jsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function iso(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function stableMaterialRevision(notification) {
  const explicit = Number(notification?.materialChangeRevision);
  if (Number.isInteger(explicit) && explicit > 0) return explicit;
  const source = String(notification?.notificationId || notification?.dedupeKey || "academic_notification");
  let hash = 0;
  for (const character of source) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) || 1;
}

function notificationDto(row) {
  if (!row) return null;
  const payload = jsonObject(row.payload);
  const status = row.status || payload.status || "SCHEDULED";
  return {
    ...payload,
    notificationId: row.notification_key || row.id,
    studentId: row.owner_id,
    type: row.notification_type || payload.type,
    materialChangeRevision: Number(row.material_change_revision || payload.materialChangeRevision || 1),
    priority: row.priority || payload.priority || "MEDIUM",
    sourceType: row.source_type || payload.sourceType || row.subject_type,
    sourceId: row.source_id || payload.sourceId || row.subject_id,
    taskId: row.task_id || payload.taskId || null,
    dedupeKey: row.dedupe_key || payload.dedupeKey || null,
    title: row.title || payload.title,
    body: row.body || payload.body,
    actionUrl: row.action_url || payload.actionUrl || null,
    dueAt: iso(row.due_at, payload.dueAt),
    scheduledAt: iso(row.scheduled_at, payload.scheduledAt),
    expiresAt: iso(row.expires_at, payload.expiresAt),
    sentAt: iso(row.sent_at, payload.sentAt),
    readAt: iso(row.read_at, payload.readAt),
    acknowledgedAt: iso(row.acknowledged_at, payload.acknowledgedAt),
    status,
    metadata: jsonObject(row.metadata, payload.metadata || {}),
    history: jsonArray(row.history || payload.history),
    revision: Number(row.revision || payload.revision || 1),
    createdAt: iso(row.created_at, payload.createdAt),
    updatedAt: iso(row.updated_at, payload.updatedAt),
  };
}

export class AcademicNotificationRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async getNotificationsByStudent(studentId, { status = null, unreadOnly = false, excludeCancelled = false, limit = 100 } = {}) {
    const ownerId = requireOwnerId(studentId);
    const values = [ownerId];
    const where = ["owner_id = $1"];
    if (status) {
      values.push(String(status));
      where.push(`status = $${values.length}`);
    }
    if (unreadOnly) where.push("read_at is null");
    if (excludeCancelled) where.push("status not in ('CANCELLED','EXPIRED')");
    values.push(Math.min(100, Math.max(1, Number(limit) || 100)));
    const result = await this.pool.query(
      `select * from public.notifications
        where ${where.join(" and ")}
        order by created_at desc, id desc
        limit $${values.length}`,
      values
    );
    return result.rows.map(notificationDto);
  }

  async countUnreadByStudent(studentId) {
    const ownerId = requireOwnerId(studentId);
    const result = await this.pool.query(
      `select count(*)::int as count
         from public.notifications
        where owner_id = $1
          and read_at is null
          and status not in ('CANCELLED','EXPIRED','ACKNOWLEDGED')`,
      [ownerId]
    );
    return Number(result.rows[0]?.count || 0);
  }

  async getNotificationById(notificationId, { ownerId } = {}) {
    const scopedOwner = requireOwnerId(ownerId);
    const result = await this.pool.query(
      `select * from public.notifications
        where owner_id = $2
          and (notification_key = $1 or id::text = $1)
        limit 1`,
      [String(notificationId || "").trim(), scopedOwner]
    );
    return notificationDto(result.rows[0]);
  }

  async getNotificationByDedupeKey(dedupeKey, ownerId) {
    const scopedOwner = requireOwnerId(ownerId);
    const result = await this.pool.query(
      `select * from public.notifications
        where owner_id = $1 and dedupe_key = $2
        limit 1`,
      [scopedOwner, String(dedupeKey || "")]
    );
    return notificationDto(result.rows[0]);
  }

  async getNotificationsByTask(taskId, ownerId) {
    const scopedOwner = requireOwnerId(ownerId);
    const result = await this.pool.query(
      `select * from public.notifications
        where owner_id = $1 and task_id = $2
        order by created_at asc, id asc`,
      [scopedOwner, String(taskId || "").trim()]
    );
    return result.rows.map(notificationDto);
  }

  async getPendingScheduled(now = Date.now(), limit = 100) {
    const result = await this.pool.query(
      `select * from public.notifications
        where status = 'SCHEDULED'
          and coalesce(scheduled_at, created_at) <= to_timestamp($1 / 1000.0)
        order by coalesce(scheduled_at, created_at) asc, created_at asc
        limit $2`,
      [Number(now), Math.min(100, Math.max(1, Number(limit) || 100))]
    );
    return result.rows.map(notificationDto);
  }

  async updateNotificationById(notificationId, ownerId, { action, snoozeHours = 4 } = {}) {
    const scopedOwner = requireOwnerId(ownerId);
    const key = String(notificationId || "").trim();
    const allowedActions = new Set(["MARK_READ", "ACKNOWLEDGE", "SNOOZE", "DISMISS"]);
    if (!key || !allowedActions.has(action)) {
      const error = new Error("Notification action is invalid.");
      error.code = "NOTIFICATION_ACTION_INVALID";
      error.statusCode = 422;
      throw error;
    }
    const hours = Math.min(168, Math.max(1, Number(snoozeHours) || 4));
    const values = [scopedOwner, key];
    let setClause;
    if (action === "MARK_READ") setClause = "status = 'READ', read_at = coalesce(read_at, now()), updated_at = now()";
    if (action === "ACKNOWLEDGE") setClause = "status = 'ACKNOWLEDGED', read_at = coalesce(read_at, now()), acknowledged_at = now(), updated_at = now()";
    if (action === "SNOOZE") {
      values.push(hours);
      setClause = `status = 'SNOOZED', scheduled_at = now() + ($3::numeric * interval '1 hour'), updated_at = now()`;
    }
    if (action === "DISMISS") setClause = "status = 'CANCELLED', expires_at = coalesce(expires_at, now()), updated_at = now()";
    const result = await this.pool.query(
      `update public.notifications
          set ${setClause}
        where owner_id = $1
          and (notification_key = $2 or id::text = $2)
        returning *`,
      values,
    );
    if (!result.rows[0]) {
      const error = new Error("The notification is not owned by this user.");
      error.code = "NOTIFICATION_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    return notificationDto(result.rows[0]);
  }

  async saveNotification(notification) {
    const ownerId = requireOwnerId(notification?.studentId || notification?.ownerId);
    const notificationKey = String(notification?.notificationId || "").trim();
    if (!notificationKey) throw new Error("NOTIFICATION_ID_REQUIRED");
    const now = new Date().toISOString();
    const payload = { ...notification, notificationId: notificationKey, studentId: ownerId, updatedAt: now };
    const type = String(notification.type || notification.notificationType || "ACADEMIC_CHANGE").slice(0, 120);
    const sourceType = String(notification.sourceType || notification.subjectType || "ACADEMIC_TASK").slice(0, 120);
    const sourceId = String(notification.sourceId || notification.taskId || notificationKey).slice(0, 180);
    const status = String(notification.status || "SCHEDULED").slice(0, 80);
    const revision = Math.max(1, Number(notification.revision || 1));
    const materialChangeRevision = stableMaterialRevision(notification);
    const history = jsonArray(notification.history);
    const metadata = jsonObject(notification.metadata);
    const result = await this.pool.query(
      `insert into public.notifications
        (owner_id, notification_key, dedupe_key, task_id, notification_type,
         subject_type, subject_id, material_change_revision, title, body,
         status, priority, source_type, source_id, action_url, due_at,
         scheduled_at, expires_at, sent_at, read_at, acknowledged_at,
         metadata, history, payload, revision, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
               $16,$17,$18,$19,$20,$21,$22::jsonb,$23::jsonb,$24::jsonb,
               $25,coalesce($26::timestamptz,now()),now())
       on conflict (owner_id, notification_key) where notification_key is not null do update
         set dedupe_key = excluded.dedupe_key,
             task_id = excluded.task_id,
             notification_type = excluded.notification_type,
             subject_type = excluded.subject_type,
             subject_id = excluded.subject_id,
             material_change_revision = excluded.material_change_revision,
             title = excluded.title,
             body = excluded.body,
             status = excluded.status,
             priority = excluded.priority,
             source_type = excluded.source_type,
             source_id = excluded.source_id,
             action_url = excluded.action_url,
             due_at = excluded.due_at,
             scheduled_at = excluded.scheduled_at,
             expires_at = excluded.expires_at,
             sent_at = excluded.sent_at,
             read_at = excluded.read_at,
             acknowledged_at = excluded.acknowledged_at,
             metadata = excluded.metadata,
             history = excluded.history,
             payload = excluded.payload,
             revision = greatest(public.notifications.revision, excluded.revision),
             updated_at = now()
       returning *`,
      [ownerId, notificationKey, notification.dedupeKey || null, notification.taskId || null, type, sourceType, sourceId, materialChangeRevision, String(notification.title || "Academic notification").slice(0, 200), String(notification.body || "").slice(0, 1000), status, String(notification.priority || "MEDIUM").slice(0, 40), sourceType, sourceId, notification.actionUrl || null, notification.dueAt || null, notification.scheduledAt || null, notification.expiresAt || null, notification.sentAt || null, notification.readAt || null, notification.acknowledgedAt || null, JSON.stringify(metadata), JSON.stringify(history), JSON.stringify(payload), revision, notification.createdAt || now]
    );
    return notificationDto(result.rows[0]);
  }
}
