import { createHash } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { authenticatedUserId, ExpertQualificationError } from "./ExpertQualificationService.js";
import {
  canServeQuestion,
  difficultyForMissionLevel,
  gradeExpertV5Question,
  resolveMissionLevel,
} from "./ExpertV5Domain.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

function missionError(code, message, statusCode = 400) {
  return new ExpertQualificationError(code, message, statusCode);
}

function normalizeUuid(value, field) {
  const id = String(value || "").trim().replace(/^(student|expert|user):/i, "");
  if (!UUID_PATTERN.test(id)) throw missionError("EXPERT_V5_ID_INVALID", `${field} must be a durable identifier.`, 400);
  return id.toLowerCase();
}

function storageError(error) {
  if (error instanceof ExpertQualificationError) return error;
  if (["42P01", "42703", "3F000"].includes(error?.code)) {
    return missionError("EXPERT_V5_MIGRATION_REQUIRED", "Expert V5 storage is not initialized; no fallback data is available.", 503);
  }
  return missionError("EXPERT_V5_STORAGE_UNAVAILABLE", "Expert mission storage is temporarily unavailable.", 503);
}

async function withStorageErrors(operation) {
  try {
    return await operation();
  } catch (error) {
    throw storageError(error);
  }
}

async function transaction(operation) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch { return {}; }
  }
  return {};
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function configValue(row, fallback) {
  if (!row) return fallback;
  const raw = row.config_value;
  const parsed = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : raw;
  return parsed ?? fallback;
}

function publicQuestion(row) {
  return {
    questionId: row.question_id,
    questionVersion: Number(row.question_version),
    questionType: row.question_type,
    prompt: row.prompt,
    choices: asArray(row.choices).map((choice) => ({ id: String(choice.id), label: String(choice.label) })),
    domainCode: row.domain_code,
    difficulty: row.difficulty,
    source: {
      canonicalUrl: row.canonical_url,
      title: row.source_title || null,
      publisher: row.publisher || null,
      retrievedAt: row.retrieved_at ? new Date(row.retrieved_at).toISOString() : null,
      contentHash: row.source_content_hash,
    },
  };
}

function dailyMissionDto(row) {
  if (!row) return null;
  return {
    missionId: row.id,
    missionType: row.mission_type,
    missionDate: String(row.mission_date),
    timezone: row.timezone,
    domainCode: row.domain_code,
    missionLevel: Number(row.mission_level),
    difficulty: row.difficulty,
    status: row.status,
    assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : null,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    question: row.question_id ? publicQuestion(row) : null,
  };
}

async function addMissionEvent(client, { missionId, userId, eventType, payload = {}, idempotencyKey }) {
  await client.query(
    `INSERT INTO private.expert_mission_events(mission_id, user_id, event_type, payload, idempotency_key)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [missionId, userId, eventType, JSON.stringify(payload), idempotencyKey],
  );
}

async function missionDay(client) {
  const config = await client.query(
    `SELECT config_value FROM private.expert_v5_config WHERE config_key = 'mission_timezone'`,
  );
  const timezone = String(configValue(config.rows[0], DEFAULT_TIME_ZONE));
  const result = await client.query(`SELECT (now() AT TIME ZONE $1)::date AS mission_date`, [timezone]);
  return { timezone, date: result.rows[0].mission_date };
}

async function activeVerifiedDomains(client, userId) {
  const result = await client.query(
    `SELECT upper(domain_code) AS domain_code
       FROM private.expert_verifications
      WHERE user_id = $1
        AND status = 'VERIFIED'
        AND qualification_state = 'DOMAIN_VERIFIED'
        AND suspended_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY upper(domain_code) ASC`,
    [userId],
  );
  return [...new Set(result.rows.map((row) => String(row.domain_code || "").toUpperCase()).filter(Boolean))];
}

async function missionPolicy(client, userId) {
  const progressResult = await client.query(
    `SELECT completed_missions FROM private.expert_mission_progression WHERE user_id = $1`, [userId],
  );
  const completed = Number(progressResult.rows[0]?.completed_missions || 0);
  const policyResult = await client.query(
    `SELECT mission_level, completed_missions_required, allowed_difficulties
       FROM private.expert_mission_level_policy
      WHERE enabled = true AND completed_missions_required <= $1
      ORDER BY mission_level DESC LIMIT 1`, [completed],
  );
  const missionLevel = Number(policyResult.rows[0]?.mission_level || resolveMissionLevel(completed));
  return {
    completed,
    missionLevel,
    allowedDifficulties: Array.isArray(policyResult.rows[0]?.allowed_difficulties)
      ? policyResult.rows[0].allowed_difficulties
      : difficultyForMissionLevel(missionLevel),
  };
}

async function selectQuestion(client, { userId, missionDate, domainCode, difficulties }) {
  const result = await client.query(
    `SELECT q.question_id, q.question_version, q.source_snapshot_id, q.domain_code,
            q.question_type, q.difficulty, q.prompt, q.choices, q.answer_key,
            q.explanation, q.evidence_refs, q.source_content_hash, q.status,
            q.valid_until, s.canonical_url, s.title AS source_title, s.publisher,
            s.retrieved_at, s.content_hash AS current_source_hash,
            s.retrieval_status, s.evidence_items
       FROM private.expert_v5_questions q
       JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
       JOIN private.expert_v5_source_registry registry ON registry.id = s.source_id
      WHERE q.status = 'ACTIVE'
        AND registry.enabled = true
        AND s.retrieval_status = 'SUCCESS'
        AND q.source_content_hash = s.content_hash
        AND q.domain_code = $3
        AND q.difficulty = ANY($4::text[])
        AND (q.valid_until IS NULL OR q.valid_until > now())
        AND s.retrieved_at > now() - make_interval(days => (
          SELECT COALESCE((config_value #>> '{}')::integer, 30)
            FROM private.expert_v5_config WHERE config_key = 'question_validity_days'
        ))
        AND NOT EXISTS (
          SELECT 1 FROM private.expert_daily_missions old
           WHERE old.user_id = $1 AND old.question_id = q.question_id
             AND old.question_version = q.question_version
             AND old.mission_date >= $2::date - 30
        )
      ORDER BY md5(q.question_id::text || $1::text || $2::text)
      LIMIT 1`,
    [userId, missionDate, domainCode, difficulties],
  );
  return result.rows[0] || null;
}

async function readMission(client, missionId, userId, { forUpdate = false } = {}) {
  const result = await client.query(
    `SELECT m.id, m.user_id, m.mission_date, m.timezone, m.mission_type,
            m.domain_code, m.mission_level, m.question_id, m.question_version,
            m.difficulty, m.status, m.assigned_at, m.started_at, m.completed_at,
            q.question_type, q.prompt, q.choices, q.explanation, q.evidence_refs,
            q.answer_key, q.status AS question_status, q.source_content_hash,
            q.valid_until, s.canonical_url, s.title AS source_title, s.publisher,
            s.retrieved_at, s.content_hash AS current_source_hash, s.retrieval_status
       FROM private.expert_daily_missions m
       LEFT JOIN private.expert_v5_questions q
         ON q.question_id = m.question_id AND q.question_version = m.question_version
       LEFT JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
      WHERE m.id = $1 AND m.user_id = $2${forUpdate ? " FOR UPDATE OF m" : ""}`,
    [missionId, userId],
  );
  return result.rows[0] || null;
}

export class ExpertMissionService {
  static async heartbeat({ principal }) {
    const userId = authenticatedUserId(principal);
    return withStorageErrors(() => transaction(async (client) => {
      const domains = await activeVerifiedDomains(client, userId);
      if (!domains.length) throw missionError("EXPERT_V5_VERIFIED_SCOPE_REQUIRED", "An active verified Expert domain is required.", 403);
      const lease = await client.query(
        `SELECT COALESCE((config_value #>> '{}')::integer, 45) AS seconds
           FROM private.expert_v5_config WHERE config_key = 'room_presence_lease_seconds'`,
      );
      const leaseSeconds = Math.max(15, Math.min(120, Number(lease.rows[0]?.seconds || 45)));
      const result = await client.query(
        `INSERT INTO private.expert_room_presence(user_id, heartbeat_at, expires_at)
         VALUES ($1, now(), now() + ($2::text || ' seconds')::interval)
         ON CONFLICT (user_id) DO UPDATE SET heartbeat_at = now(), expires_at = now() + ($2::text || ' seconds')::interval
         RETURNING expires_at`,
        [userId, leaseSeconds],
      );
      await client.query(
        `UPDATE private.expert_room_participants SET last_seen_at = now()
          WHERE user_id = $1 AND state = 'JOINED'`, [userId],
      );
      return { online: true, domains, expiresAt: new Date(result.rows[0].expires_at).toISOString(), leaseSeconds };
    }));
  }

  static async assignDailyMissions({ principal, maxMissions = 3 }) {
    const userId = authenticatedUserId(principal);
    const limit = Math.max(1, Math.min(3, Number(maxMissions) || 3));
    return withStorageErrors(() => transaction(async (client) => {
      const { timezone, date } = await missionDay(client);
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`expert-missions:${userId}:${date}`]);
      const domains = await activeVerifiedDomains(client, userId);
      if (!domains.length) throw missionError("EXPERT_V5_VERIFIED_SCOPE_REQUIRED", "An active verified Expert domain is required.", 403);
      await client.query(
        `UPDATE private.expert_daily_missions
            SET status = 'EXPIRED'
          WHERE user_id = $1 AND mission_date < $2::date
            AND status IN ('AVAILABLE','IN_PROGRESS')`, [userId, date],
      );
      const policy = await missionPolicy(client, userId);
      const current = await client.query(
        `SELECT domain_code FROM private.expert_daily_missions WHERE user_id = $1 AND mission_date = $2::date`,
        [userId, date],
      );
      const assignedDomains = new Set(current.rows.map((row) => String(row.domain_code).toUpperCase()));
      let added = 0;
      for (const domainCode of domains.filter((domain) => !assignedDomains.has(domain)).slice(0, limit)) {
        const question = await selectQuestion(client, { userId, missionDate: date, domainCode, difficulties: policy.allowedDifficulties });
        if (!question) continue;
        const validityDays = Number((await client.query(
          `SELECT COALESCE((config_value #>> '{}')::integer, 30) AS days
             FROM private.expert_v5_config WHERE config_key = 'question_validity_days'`,
        )).rows[0]?.days || 30);
        if (!canServeQuestion({ status: question.status, retrievedAt: question.retrieved_at, validityDays })) {
          await client.query(
            `UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now()
              WHERE question_id = $1 AND question_version = $2 AND status = 'ACTIVE'`,
            [question.question_id, question.question_version],
          );
          continue;
        }
        const inserted = await client.query(
          `INSERT INTO private.expert_daily_missions
            (user_id, mission_date, timezone, mission_type, domain_code, mission_level,
             question_id, question_version, difficulty, idempotency_key)
           VALUES ($1, $2::date, $3, 'SOURCE_QUIZ', $4, $5, $6, $7, $8, $9)
           ON CONFLICT (user_id, mission_date, mission_type, domain_code) DO NOTHING
           RETURNING id`,
          [userId, date, timezone, domainCode, policy.missionLevel, question.question_id,
            question.question_version, question.difficulty, `daily:${userId}:${date}:${domainCode}`],
        );
        if (inserted.rows[0]) {
          added += 1;
          await addMissionEvent(client, {
            missionId: inserted.rows[0].id, userId, eventType: "ASSIGNED",
            payload: { missionType: "SOURCE_QUIZ", domainCode, difficulty: question.difficulty, missionLevel: policy.missionLevel },
            idempotencyKey: `mission-assigned:${inserted.rows[0].id}`,
          });
        }
      }
      const result = await client.query(
        `SELECT m.id, m.mission_date, m.timezone, m.mission_type, m.domain_code,
                m.mission_level, m.question_id, m.question_version, m.difficulty,
                m.status, m.assigned_at, m.started_at, m.completed_at,
                q.question_type, q.prompt, q.choices, q.evidence_refs,
                s.canonical_url, s.title AS source_title, s.publisher, s.retrieved_at,
                q.source_content_hash
           FROM private.expert_daily_missions m
           JOIN private.expert_v5_questions q ON q.question_id = m.question_id AND q.question_version = m.question_version
           JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
          WHERE m.user_id = $1 AND m.mission_date = $2::date
          ORDER BY m.assigned_at ASC`,
        [userId, date],
      );
      return {
        missionDate: String(date), timezone, missionLevel: policy.missionLevel,
        completedMissionCount: policy.completed, assignedCount: added,
        bankState: result.rows.length ? "READY" : "NO_VALIDATED_QUESTIONS",
        missions: result.rows.map(dailyMissionDto),
      };
    }));
  }

  static async getDailyMissions({ principal }) {
    const userId = authenticatedUserId(principal);
    return withStorageErrors(() => transaction(async (client) => {
      const { timezone, date } = await missionDay(client);
      const domains = await activeVerifiedDomains(client, userId);
      const policy = await missionPolicy(client, userId);
      const rows = await client.query(
        `SELECT m.id, m.mission_date, m.timezone, m.mission_type, m.domain_code,
                m.mission_level, m.question_id, m.question_version, m.difficulty,
                m.status, m.assigned_at, m.started_at, m.completed_at,
                q.question_type, q.prompt, q.choices, q.evidence_refs,
                s.canonical_url, s.title AS source_title, s.publisher, s.retrieved_at,
                q.source_content_hash
           FROM private.expert_daily_missions m
           JOIN private.expert_v5_questions q ON q.question_id = m.question_id AND q.question_version = m.question_version
           JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
          WHERE m.user_id = $1 AND m.mission_date = $2::date
          ORDER BY m.assigned_at ASC`,
        [userId, date],
      );
      return {
        missionDate: String(date), timezone, missionLevel: policy.missionLevel,
        completedMissionCount: policy.completed,
        bankState: rows.rows.length ? "READY" : domains.length ? "NO_VALIDATED_QUESTIONS" : "VERIFIED_SCOPE_REQUIRED",
        missions: rows.rows.map(dailyMissionDto),
      };
    }));
  }

  static async startMission({ principal, missionId }) {
    const userId = authenticatedUserId(principal);
    const normalizedMissionId = normalizeUuid(missionId, "missionId");
    return withStorageErrors(() => transaction(async (client) => {
      const mission = await readMission(client, normalizedMissionId, userId, { forUpdate: true });
      if (!mission) throw missionError("EXPERT_MISSION_NOT_FOUND", "This mission is not available to this account.", 404);
      if (mission.status === "COMPLETED") return { mission: dailyMissionDto(mission), attempt: null, state: "COMPLETED" };
      const { date } = await missionDay(client);
      if (mission.status === "EXPIRED" || String(mission.mission_date) < String(date)) {
        throw missionError("EXPERT_MISSION_EXPIRED", "This daily mission has expired.", 409);
      }
      const freshness = await client.query(
        `SELECT config_value FROM private.expert_v5_config WHERE config_key = 'question_validity_days'`,
      );
      if (mission.question_status !== "ACTIVE" || mission.retrieval_status !== "SUCCESS"
        || mission.source_content_hash !== mission.current_source_hash
        || (mission.valid_until && new Date(mission.valid_until).getTime() <= Date.now())
        || !canServeQuestion({ status: mission.question_status, retrievedAt: mission.retrieved_at, validityDays: Number(configValue(freshness.rows[0], 30)) })) {
        await client.query(
          `UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now()
            WHERE question_id = $1 AND question_version = $2 AND status = 'ACTIVE'`,
          [mission.question_id, mission.question_version],
        );
        await client.query(`UPDATE private.expert_daily_missions SET status = 'UNRESOLVED' WHERE id = $1`, [normalizedMissionId]);
        await addMissionEvent(client, {
          missionId: normalizedMissionId, userId, eventType: "SOURCE_REVALIDATION_REQUIRED",
          payload: { questionId: mission.question_id, questionVersion: Number(mission.question_version) },
          idempotencyKey: `mission-source-stale:${normalizedMissionId}`,
        });
        return { mission: { ...dailyMissionDto(mission), status: "UNRESOLVED" }, attempt: null, state: "UNRESOLVED", reason: "SOURCE_REVALIDATION_REQUIRED" };
      }
      const config = await client.query(
        `SELECT COALESCE((config_value #>> '{}')::integer, 180) AS seconds
           FROM private.expert_v5_config WHERE config_key = 'mission_attempt_seconds'`,
      );
      const seconds = Math.max(30, Math.min(900, Number(config.rows[0]?.seconds || 180)));
      const attempt = await client.query(
        `INSERT INTO private.expert_mission_attempts
          (mission_id, user_id, question_id, question_version, status, started_at, deadline_at, idempotency_key)
         VALUES ($1, $2, $3, $4, 'IN_PROGRESS', now(), now() + ($5::text || ' seconds')::interval, $6)
         ON CONFLICT (mission_id, user_id) DO UPDATE SET mission_id = EXCLUDED.mission_id
         RETURNING id, status, started_at, deadline_at, score, is_correct, result`,
        [normalizedMissionId, userId, mission.question_id, mission.question_version, seconds, `attempt:${normalizedMissionId}`],
      );
      if (attempt.rows[0].status !== "IN_PROGRESS") {
        return { mission: dailyMissionDto(mission), attempt: attemptDto(attempt.rows[0]), state: attempt.rows[0].status };
      }
      const deadlineState = await client.query(`SELECT now() <= $1::timestamptz AS accepted`, [attempt.rows[0].deadline_at]);
      if (!deadlineState.rows[0]?.accepted) {
        await client.query(`UPDATE private.expert_mission_attempts SET status = 'EXPIRED', submitted_at = now() WHERE id = $1`, [attempt.rows[0].id]);
        await client.query(`UPDATE private.expert_daily_missions SET status = 'EXPIRED' WHERE id = $1`, [normalizedMissionId]);
        await addMissionEvent(client, {
          missionId: normalizedMissionId, userId, eventType: "EXPIRED", payload: { attemptId: attempt.rows[0].id },
          idempotencyKey: `mission-expired:${attempt.rows[0].id}`,
        });
        return { mission: { ...dailyMissionDto(mission), status: "EXPIRED" }, attempt: { ...attemptDto(attempt.rows[0]), state: "EXPIRED" }, state: "EXPIRED" };
      }
      await client.query(
        `UPDATE private.expert_daily_missions SET status = 'IN_PROGRESS', started_at = COALESCE(started_at, now()) WHERE id = $1`,
        [normalizedMissionId],
      );
      await addMissionEvent(client, {
        missionId: normalizedMissionId, userId, eventType: "STARTED", payload: { attemptId: attempt.rows[0].id },
        idempotencyKey: `mission-started:${normalizedMissionId}`,
      });
      return { mission: dailyMissionDto({ ...mission, status: "IN_PROGRESS", started_at: mission.started_at || new Date() }), attempt: attemptDto(attempt.rows[0]), state: "IN_PROGRESS" };
    }));
  }

  static async submitMissionAnswer({ principal, missionId, answer }) {
    const userId = authenticatedUserId(principal);
    const normalizedMissionId = normalizeUuid(missionId, "missionId");
    if (!(typeof answer === "string" || (Array.isArray(answer) && answer.length > 0 && answer.length <= 6))) {
      throw missionError("EXPERT_MISSION_ANSWER_INVALID", "Select a supported answer before submitting.", 400);
    }
    const boundedAnswer = typeof answer === "string" ? answer.trim().slice(0, 120) : [...new Set(answer.map((value) => String(value).trim().slice(0, 120)))].sort();
    return withStorageErrors(() => transaction(async (client) => {
      const attemptResult = await client.query(
        `SELECT a.id, a.mission_id, a.user_id, a.question_id, a.question_version,
                a.status, a.deadline_at, a.score, a.is_correct, a.result,
                q.question_type, q.answer_key, q.explanation, q.evidence_refs,
                q.status AS question_status, q.source_content_hash,
                s.content_hash AS current_source_hash, s.retrieval_status
           FROM private.expert_mission_attempts a
           JOIN private.expert_v5_questions q ON q.question_id = a.question_id AND q.question_version = a.question_version
           JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
          WHERE a.mission_id = $1 AND a.user_id = $2
          FOR UPDATE OF a`,
        [normalizedMissionId, userId],
      );
      const attempt = attemptResult.rows[0];
      if (!attempt) throw missionError("EXPERT_MISSION_NOT_STARTED", "Start this mission before submitting an answer.", 409);
      if (attempt.status === "EVALUATED" || attempt.status === "REVIEW_REQUIRED") {
        const previousAnswer = await client.query(`SELECT answer FROM private.expert_mission_answers WHERE attempt_id = $1`, [attempt.id]);
        const oldValue = previousAnswer.rows[0]?.answer;
        const normalizedOld = typeof oldValue === "string" ? oldValue : Array.isArray(oldValue) ? oldValue : asObject(oldValue);
        if (JSON.stringify(normalizedOld) !== JSON.stringify(boundedAnswer)) {
          throw missionError("EXPERT_MISSION_ANSWER_LOCKED", "This answer has already been submitted and cannot be changed.", 409);
        }
        return { attempt: attemptDto(attempt), missionState: attempt.status, idempotent: true };
      }
      if (attempt.status !== "IN_PROGRESS") throw missionError("EXPERT_MISSION_NOT_IN_PROGRESS", "This mission attempt is no longer accepting answers.", 409);
      const deadline = await client.query(`SELECT now() <= $1::timestamptz AS accepted`, [attempt.deadline_at]);
      if (!deadline.rows[0]?.accepted) {
        await client.query(`UPDATE private.expert_mission_attempts SET status = 'EXPIRED', submitted_at = now() WHERE id = $1`, [attempt.id]);
        await client.query(`UPDATE private.expert_daily_missions SET status = 'EXPIRED' WHERE id = $1`, [normalizedMissionId]);
        await addMissionEvent(client, {
          missionId: normalizedMissionId, userId, eventType: "EXPIRED", payload: { attemptId: attempt.id },
          idempotencyKey: `mission-expired:${attempt.id}`,
        });
        return { attempt: { ...attemptDto(attempt), state: "EXPIRED" }, missionState: "EXPIRED", idempotent: false };
      }
      if (attempt.question_status !== "ACTIVE" || attempt.retrieval_status !== "SUCCESS"
        || attempt.source_content_hash !== attempt.current_source_hash) {
        await client.query(`UPDATE private.expert_mission_attempts SET status = 'REVIEW_REQUIRED', submitted_at = now() WHERE id = $1`, [attempt.id]);
        await client.query(`UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now() WHERE question_id = $1 AND question_version = $2`, [attempt.question_id, attempt.question_version]);
        await client.query(`UPDATE private.expert_daily_missions SET status = 'UNRESOLVED' WHERE id = $1`, [normalizedMissionId]);
        return { attempt: { ...attemptDto(attempt), status: "REVIEW_REQUIRED" }, missionState: "UNRESOLVED", idempotent: false };
      }
      const answerKey = asObject(attempt.answer_key);
      const expected = Array.isArray(attempt.answer_key)
        ? asArray(attempt.answer_key)
        : typeof attempt.answer_key === "string" ? attempt.answer_key
          : answerKey.value ?? answerKey.answer ?? answerKey;
      const grade = gradeExpertV5Question({ questionType: attempt.question_type, answerKey: expected, answer: boundedAnswer });
      if (!grade.supported) {
        await client.query(`UPDATE private.expert_mission_attempts SET status = 'REVIEW_REQUIRED', submitted_at = now() WHERE id = $1`, [attempt.id]);
        return { attempt: { ...attemptDto(attempt), status: "REVIEW_REQUIRED" }, missionState: "UNRESOLVED", idempotent: false };
      }
      const answerHash = digest(boundedAnswer);
      await client.query(
        `INSERT INTO private.expert_mission_answers(attempt_id, user_id, answer, answer_hash)
         VALUES ($1, $2, $3::jsonb, $4)`, [attempt.id, userId, JSON.stringify(boundedAnswer), answerHash],
      );
      await addMissionEvent(client, {
        missionId: normalizedMissionId, userId, eventType: "ANSWER_SUBMITTED",
        payload: { attemptId: attempt.id, answerHash }, idempotencyKey: `mission-answer:${attempt.id}`,
      });
      const result = {
        questionType: attempt.question_type,
        correct: grade.correct,
        score: grade.score,
        explanation: attempt.explanation,
        evidence: asArray(attempt.evidence_refs).map((reference) => ({
          evidenceId: String(reference.evidenceId || ""),
          excerpt: typeof reference.excerpt === "string" ? reference.excerpt.slice(0, 600) : null,
        })),
      };
      const updated = await client.query(
        `UPDATE private.expert_mission_attempts
            SET status = 'EVALUATED', submitted_at = now(), score = $2,
                is_correct = $3, result = $4::jsonb
          WHERE id = $1
          RETURNING id, status, started_at, deadline_at, submitted_at, score, is_correct, result`,
        [attempt.id, grade.score, grade.correct, JSON.stringify(result)],
      );
      await client.query(
        `UPDATE private.expert_daily_missions SET status = 'COMPLETED', completed_at = now() WHERE id = $1`,
        [normalizedMissionId],
      );
      const progression = await client.query(
        `INSERT INTO private.expert_mission_progression(user_id, completed_missions, mission_level)
         VALUES ($1, 1, 1)
         ON CONFLICT (user_id) DO UPDATE
           SET completed_missions = private.expert_mission_progression.completed_missions + 1,
               updated_at = now()
         RETURNING completed_missions`, [userId],
      );
      const nextLevelResult = await client.query(
        `SELECT mission_level FROM private.expert_mission_level_policy
          WHERE enabled = true AND completed_missions_required <= $1
          ORDER BY mission_level DESC LIMIT 1`, [Number(progression.rows[0]?.completed_missions || 1)],
      );
      const nextLevel = Number(nextLevelResult.rows[0]?.mission_level || 1);
      await client.query(`UPDATE private.expert_mission_progression SET mission_level = $2, updated_at = now() WHERE user_id = $1`, [userId, nextLevel]);
      await addMissionEvent(client, {
        missionId: normalizedMissionId, userId, eventType: "EVALUATED",
        payload: { attemptId: attempt.id, score: grade.score, correct: grade.correct, progressionCount: Number(progression.rows[0]?.completed_missions || 1), missionLevel: nextLevel },
        idempotencyKey: `mission-evaluated:${attempt.id}`,
      });
      return { attempt: attemptDto(updated.rows[0]), missionState: "COMPLETED", missionLevel: nextLevel, idempotent: false };
    }));
  }

  static async history({ principal, limit = 50 }) {
    const userId = authenticatedUserId(principal);
    const boundedLimit = Math.max(1, Math.min(100, Number(limit) || 50));
    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `SELECT m.id AS mission_id, m.mission_date, m.timezone, m.domain_code,
                m.mission_level, m.difficulty, m.status AS mission_status,
                m.completed_at, a.id AS attempt_id, a.status AS attempt_status,
                a.started_at, a.submitted_at, a.score, a.is_correct, a.result,
                q.prompt, q.question_type, s.canonical_url, s.title AS source_title,
                s.publisher, s.retrieved_at, q.source_content_hash
           FROM private.expert_daily_missions m
           LEFT JOIN private.expert_mission_attempts a ON a.mission_id = m.id AND a.user_id = m.user_id
           JOIN private.expert_v5_questions q ON q.question_id = m.question_id AND q.question_version = m.question_version
           JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
          WHERE m.user_id = $1
          ORDER BY m.mission_date DESC, m.assigned_at DESC LIMIT $2`, [userId, boundedLimit],
      );
      return result.rows.map((row) => ({
        missionId: row.mission_id,
        missionDate: String(row.mission_date),
        timezone: row.timezone,
        domainCode: row.domain_code,
        missionLevel: Number(row.mission_level),
        difficulty: row.difficulty,
        missionStatus: row.mission_status,
        attempt: row.attempt_id ? {
          attemptId: row.attempt_id,
          status: row.attempt_status,
          startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
          submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
          score: row.score === null ? null : Number(row.score),
          correct: row.is_correct,
          result: asObject(row.result),
        } : null,
        question: row.prompt ? {
          prompt: row.prompt, questionType: row.question_type,
          source: { canonicalUrl: row.canonical_url, title: row.source_title, publisher: row.publisher, retrievedAt: row.retrieved_at, contentHash: row.source_content_hash },
        } : null,
      }));
    }));
  }
}

function attemptDto(row) {
  if (!row) return null;
  return {
    attemptId: row.id,
    state: row.status,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    deadlineAt: row.deadline_at ? new Date(row.deadline_at).toISOString() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    correct: row.is_correct ?? null,
    result: row.result ? asObject(row.result) : null,
  };
}
