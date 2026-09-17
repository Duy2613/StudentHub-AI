import { getPostgresPool } from "./PostgresPool.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireOwnerId(value) {
  const ownerId = String(value || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(ownerId)) {
    const error = new Error("A canonical authenticated owner ID is required for durable academic state.");
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

function planDto(row) {
  if (!row) return null;
  const payload = jsonObject(row.payload);
  return {
    ...payload,
    planId: row.id,
    studentId: row.owner_id,
    ownerId: row.owner_id,
    revision: Number(row.revision || payload.revision || 1),
    createdAt: iso(row.created_at, payload.createdAt),
    updatedAt: iso(row.updated_at, payload.updatedAt),
  };
}

function taskDto(row, events = null) {
  if (!row) return null;
  const payload = jsonObject(row.payload);
  const history = events || jsonArray(payload.history);
  return {
    ...payload,
    taskId: row.id,
    studentId: row.owner_id,
    ownerId: row.owner_id,
    assigneeId: row.assignee_id || payload.assigneeId || null,
    planId: row.plan_id || payload.planId || null,
    type: row.task_type || payload.type || "ACADEMIC_ACTION",
    status: row.status || payload.status,
    trustCaseId: row.trust_case_id || payload.trustCaseId || null,
    trustCaseRevision: row.trust_case_revision ?? payload.trustCaseRevision ?? null,
    revision: Number(row.revision || payload.revision || 1),
    createdAt: iso(row.created_at, payload.createdAt),
    updatedAt: iso(row.updated_at, payload.updatedAt),
    completedAt: iso(row.completed_at, payload.completedAt),
    ...(history.length > 0 ? { history } : {}),
  };
}

function taskWriteValues(task) {
  const ownerId = requireOwnerId(task.studentId || task.ownerId);
  const payload = { ...task, studentId: ownerId, ownerId };
  const completedAt = task.completedAt ? iso(task.completedAt) : null;
  return {
    id: String(task.taskId || "").trim(),
    planId: task.planId ? String(task.planId).trim() : null,
    ownerId,
    assigneeId: task.assigneeId ? requireOwnerId(task.assigneeId) : null,
    taskType: String(task.type || "ACADEMIC_ACTION").trim().slice(0, 120),
    status: String(task.status || "READY").trim().slice(0, 80),
    trustCaseId: task.trustCaseId || null,
    trustCaseRevision: task.trustCaseRevision == null ? null : Number(task.trustCaseRevision),
    revision: Number.isInteger(task.revision) && task.revision > 0 ? task.revision : null,
    idempotencyKey: task.idempotencyKey ? String(task.idempotencyKey).slice(0, 180) : null,
    payload,
    completedAt,
  };
}

export class AcademicTaskRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async getPlan(planId, { ownerId = null } = {}) {
    const values = [String(planId || "").trim()];
    let scope = "";
    if (ownerId) {
      values.push(requireOwnerId(ownerId));
      scope = ` and owner_id = $${values.length}`;
    }
    const result = await this.pool.query(
      `select id, owner_id, revision, payload, created_at, updated_at
         from public.academic_workflow_plans
        where id = $1${scope}
        limit 1`,
      values
    );
    return planDto(result.rows[0]);
  }

  async getPlansByStudent(studentId) {
    const ownerId = requireOwnerId(studentId);
    const result = await this.pool.query(
      `select id, owner_id, revision, payload, created_at, updated_at
         from public.academic_workflow_plans
        where owner_id = $1
        order by updated_at desc
        limit 100`,
      [ownerId]
    );
    return result.rows.map(planDto);
  }

  async savePlan(plan) {
    const id = String(plan?.planId || "").trim();
    if (!id) throw new Error("TASK_PLAN_ID_REQUIRED");
    const ownerId = requireOwnerId(plan.studentId || plan.ownerId);
    const existing = await this.pool.query(
      "select owner_id, revision from public.academic_workflow_plans where id = $1 limit 1",
      [id]
    );
    if (existing.rows[0] && existing.rows[0].owner_id !== ownerId) {
      const error = new Error("The academic plan is not owned by this user.");
      error.code = "OBJECT_NOT_OWNED";
      error.statusCode = 403;
      throw error;
    }
    const currentRevision = Number(existing.rows[0]?.revision || 0);
    const revision = Math.max(currentRevision + (existing.rows[0] ? 1 : 0), Number(plan.revision || 1));
    const now = new Date().toISOString();
    const payload = { ...plan, planId: id, studentId: ownerId, ownerId, revision, updatedAt: now };
    const result = await this.pool.query(
      `insert into public.academic_workflow_plans
        (id, owner_id, revision, payload, created_at, updated_at)
       values ($1, $2, $3, $4::jsonb, coalesce($5::timestamptz, now()), now())
       on conflict (id) do update
         set revision = excluded.revision,
             payload = excluded.payload,
             updated_at = now()
       returning id, owner_id, revision, payload, created_at, updated_at`,
      [id, ownerId, revision, JSON.stringify(payload), plan.createdAt || null]
    );
    return planDto(result.rows[0]);
  }

  async getTask(taskId, { ownerId = null } = {}) {
    const values = [String(taskId || "").trim()];
    let scope = "";
    if (ownerId) {
      const scopedOwner = requireOwnerId(ownerId);
      values.push(scopedOwner);
      scope = ` and (owner_id = $${values.length} or assignee_id = $${values.length})`;
    }
    const result = await this.pool.query(
      `select id, plan_id, owner_id, assignee_id, task_type, status,
              trust_case_id, trust_case_revision, revision, payload,
              completed_at, created_at, updated_at
         from public.academic_workflow_tasks
        where id = $1${scope}
        limit 1`,
      values
    );
    const row = result.rows[0];
    if (!row) return null;
    const events = await this.getEvents(row.id, { ownerId: ownerId || row.owner_id });
    return taskDto(row, events);
  }

  async getTasksByStudent(studentId) {
    const ownerId = requireOwnerId(studentId);
    const result = await this.pool.query(
      `select id, plan_id, owner_id, assignee_id, task_type, status,
              trust_case_id, trust_case_revision, revision, payload,
              completed_at, created_at, updated_at
         from public.academic_workflow_tasks
        where owner_id = $1
        order by updated_at desc
        limit 100`,
      [ownerId]
    );
    return Promise.all(result.rows.map(async (row) => taskDto(row, await this.getEvents(row.id, { ownerId }))));
  }

  async getTasksByPlan(planId, studentId) {
    const ownerId = requireOwnerId(studentId);
    const result = await this.pool.query(
      `select id, plan_id, owner_id, assignee_id, task_type, status,
              trust_case_id, trust_case_revision, revision, payload,
              completed_at, created_at, updated_at
         from public.academic_workflow_tasks
        where owner_id = $1 and plan_id = $2
        order by created_at asc`,
      [ownerId, String(planId || "").trim()]
    );
    return Promise.all(result.rows.map(async (row) => taskDto(row, await this.getEvents(row.id, { ownerId }))));
  }

  async saveTask(task) {
    const values = taskWriteValues(task);
    if (!values.id) throw new Error("TASK_ID_REQUIRED");
    const existing = await this.pool.query(
      "select owner_id, revision from public.academic_workflow_tasks where id = $1 limit 1",
      [values.id]
    );
    if (existing.rows[0] && existing.rows[0].owner_id !== values.ownerId) {
      const error = new Error("The academic task is not owned by this user.");
      error.code = "OBJECT_NOT_OWNED";
      error.statusCode = 403;
      throw error;
    }
    const currentRevision = Number(existing.rows[0]?.revision || 0);
    const revision = Math.max(currentRevision + (existing.rows[0] ? 1 : 0), Number(values.revision || 1));
    values.payload.revision = revision;
    values.payload.updatedAt = new Date().toISOString();
    const result = await this.pool.query(
      `insert into public.academic_workflow_tasks
        (id, plan_id, owner_id, assignee_id, task_type, status,
         trust_case_id, trust_case_revision, revision, idempotency_key,
         payload, completed_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,
               coalesce(($11::jsonb->>'createdAt')::timestamptz, now()), now())
       on conflict (id) do update
         set plan_id = excluded.plan_id,
             assignee_id = excluded.assignee_id,
             task_type = excluded.task_type,
             status = excluded.status,
             trust_case_id = excluded.trust_case_id,
             trust_case_revision = excluded.trust_case_revision,
             revision = excluded.revision,
             idempotency_key = excluded.idempotency_key,
             payload = excluded.payload,
             completed_at = excluded.completed_at,
             updated_at = now()
       returning id, plan_id, owner_id, assignee_id, task_type, status,
                 trust_case_id, trust_case_revision, revision, payload,
                 completed_at, created_at, updated_at`,
      [values.id, values.planId, values.ownerId, values.assigneeId, values.taskType, values.status, values.trustCaseId, values.trustCaseRevision, revision, values.idempotencyKey, JSON.stringify(values.payload), values.completedAt]
    );
    return taskDto(result.rows[0], await this.getEvents(values.id, { ownerId: values.ownerId }));
  }

  async recordEvent(taskId, event) {
    const taskResult = await this.pool.query(
      "select owner_id from public.academic_workflow_tasks where id = $1 limit 1",
      [String(taskId || "").trim()]
    );
    const ownerId = taskResult.rows[0]?.owner_id;
    if (!ownerId || !event?.eventId) return null;
    const result = await this.pool.query(
      `insert into public.academic_workflow_task_events
        (event_id, task_id, owner_id, event_type, from_state, to_state, payload)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb)
       on conflict (event_id) do nothing
       returning event_id, task_id, owner_id, event_type, from_state, to_state, payload, created_at`,
      [String(event.eventId), String(taskId), ownerId, String(event.type || event.eventType || "TASK_EVENT"), event.fromState || null, event.toState || null, JSON.stringify(event)]
    );
    return result.rows[0] ? this.#eventDto(result.rows[0]) : { idempotent: true, eventId: String(event.eventId) };
  }

  async getEvents(taskId, { ownerId = null } = {}) {
    const values = [String(taskId || "").trim()];
    let scope = "";
    if (ownerId) {
      values.push(requireOwnerId(ownerId));
      scope = ` and (
        owner_id = $${values.length}
        or exists (
          select 1
            from public.academic_workflow_tasks assigned_task
           where assigned_task.id = public.academic_workflow_task_events.task_id
             and assigned_task.assignee_id = $${values.length}
        )
      )`;
    }
    const result = await this.pool.query(
      `select event_id, task_id, owner_id, event_type, from_state, to_state, payload, created_at
         from public.academic_workflow_task_events
        where task_id = $1${scope}
        order by created_at asc, event_id asc`,
      values
    );
    return result.rows.map((row) => this.#eventDto(row));
  }

  #eventDto(row) {
    return {
      ...jsonObject(row.payload),
      eventId: row.event_id,
      taskId: row.task_id,
      type: row.event_type,
      fromState: row.from_state,
      toState: row.to_state,
      createdAt: iso(row.created_at),
    };
  }
}

export function usesDurableAcademicPersistence() {
  return process.env.NODE_ENV === "production" || process.env.STUDENTHUB_PERSISTENCE_ADAPTER === "postgres";
}
