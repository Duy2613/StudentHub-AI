import { createHash, randomUUID } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { detectPII, redactText } from "../../communityExpert/promaxDomain.js";
import {
  QUIZ_DURATION_SECONDS,
  QUIZ_MAX_ATTEMPTS,
  QUIZ_VERSION,
  drawQuizQuestionIds,
  getPublicQuizQuestions,
  getQuizQuestion,
  gradeQuiz,
} from "./ExpertQualificationQuiz.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOMAIN_PATTERN = /^[A-Z][A-Z0-9_:-]{1,79}$/;
const APPLICATION_STATUSES = new Set([
  "IDENTITY_REVIEW",
  "QUIZ_ELIGIBLE",
  "QUIZ_IN_PROGRESS",
  "DOMAIN_REVIEW",
  "ACTIVE",
  "REJECTED",
  "APPEALED",
]);
const REVIEW_DECISIONS = new Set(["APPROVE_QUIZ", "ACTIVATE", "REJECT", "APPEAL_REVIEW"]);
const PRACTICE_DECISIONS = new Set(["PASS", "FAIL", "REQUEST_REVISION"]);
const PRACTICE_PROMPT_VERSION = "expert-practice.v1";
const PRACTICE_RUBRIC_VERSION = "expert-practice-rubric.v1";

export class ExpertQualificationError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "ExpertQualificationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function storageError(error) {
  if (error instanceof ExpertQualificationError) return error;
  if (["42P01", "42703", "3F000"].includes(error?.code)) {
    return new ExpertQualificationError("PROMAX_MIGRATION_REQUIRED", "Expert Promax storage is not initialized in this environment; no fallback data is available.", 503);
  }
  if (error?.code === "23505") {
    return new ExpertQualificationError("QUALIFICATION_ALREADY_EXISTS", "An expert qualification record already exists.", 409);
  }
  return new ExpertQualificationError("QUALIFICATION_STORAGE_UNAVAILABLE", "Expert qualification storage is temporarily unavailable.", 503);
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

async function appendQualificationOutbox(client, { eventType, aggregateType, aggregateId, subject, payload, correlationId = "expert-qualification" }) {
  await client.query(
    `INSERT INTO private.integration_outbox
      (event_id, integration, aggregate_type, aggregate_id, event_type,
       schema_version, occurred_at, produced_at, producer, environment,
       correlation_id, subject, classification, payload, payload_hash, status)
     VALUES ($1, 'INTERNAL', $2, $3, $4, 'expert-qualification.v1',
             now(), now(), 'studenthub-qualification', $5, $6, $7, 'INTERNAL', $8::jsonb, $9, 'PENDING')
     ON CONFLICT (event_id) DO NOTHING`,
    [randomUUID(), aggregateType, aggregateId, eventType, process.env.NODE_ENV || "development", correlationId, subject, JSON.stringify(payload), digest(payload)]
  );
}

function normalizeUuid(value, label) {
  const candidate = String(value || "").trim().replace(/^(?:student|expert|user):/i, "");
  if (!UUID_PATTERN.test(candidate)) {
    throw new ExpertQualificationError(`${label.toUpperCase()}_UUID_REQUIRED`, "A durable authenticated identity is required for this workflow.", 403);
  }
  return candidate.toLowerCase();
}

export function authenticatedUserId(principal) {
  if (!principal?.isAuthenticated) {
    throw new ExpertQualificationError("AUTHENTICATION_REQUIRED", "Authentication is required for expert qualification.", 401);
  }
  return normalizeUuid(principal.subjectId, "user");
}

function boundedText(value, { field, min = 0, max }) {
  if (value === undefined || value === null) {
    if (min > 0) throw new ExpertQualificationError("QUALIFICATION_INPUT_INVALID", `${field} is required.`, 400);
    return "";
  }
  if (typeof value !== "string") throw new ExpertQualificationError("QUALIFICATION_INPUT_INVALID", `${field} must be text.`, 400);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ExpertQualificationError("QUALIFICATION_INPUT_INVALID", `${field} is outside the allowed length.`, 400);
  }
  return normalized;
}

function normalizeDomains(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    throw new ExpertQualificationError("QUALIFICATION_DOMAINS_INVALID", "At least one requested domain is required.", 400);
  }
  const domains = [...new Set(value.map((entry) => String(entry || "").trim().toUpperCase()))];
  if (domains.some((domain) => !DOMAIN_PATTERN.test(domain))) {
    throw new ExpertQualificationError("QUALIFICATION_DOMAINS_INVALID", "Requested domains contain an invalid value.", 400);
  }
  return domains;
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new ExpertQualificationError("QUALIFICATION_PROFILE_INVALID", "A profile is required before the quiz.", 400);
  }
  const credentials = Array.isArray(profile.credentials)
    ? [...new Set(profile.credentials.filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))].slice(0, 20)
    : [];
  if (credentials.some((value) => value.length > 200)) {
    throw new ExpertQualificationError("QUALIFICATION_PROFILE_INVALID", "A credential entry is too long.", 400);
  }
  return {
    displayName: boundedText(profile.displayName || profile.name, { field: "displayName", min: 1, max: 120 }),
    institution: boundedText(profile.institution, { field: "institution", max: 180 }),
    bio: boundedText(profile.bio, { field: "bio", max: 1000 }),
    credentials,
  };
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

function jsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest();
}

function sanitizePractice(value, depth = 0) {
  if (depth > 4) return null;
  if (typeof value === "string") return redactText(value).slice(0, 12_000);
  if (Array.isArray(value)) return value.slice(0, 50).map((entry) => sanitizePractice(entry, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).slice(0, 80).map(([key, entry]) => [String(key).slice(0, 100), sanitizePractice(entry, depth + 1)]));
  return value;
}

function practicePrompt(domainCode) {
  return {
    promptVersion: PRACTICE_PROMPT_VERSION,
    domain: String(domainCode).toUpperCase(),
    scenario: "Một thông báo học bổng yêu cầu người nhận chuyển tiền trước khi xác nhận hồ sơ.",
    claims: [
      "Chương trình học bổng có tồn tại hay không?",
      "Yêu cầu chuyển tiền có được nguồn chính thức hỗ trợ hay không?",
    ],
    instructions: "Nêu phạm vi kết luận, nguồn cần đối chiếu, điều chưa biết, cách khai báo xung đột lợi ích và bước tiếp theo an toàn.",
    rubricVersion: PRACTICE_RUBRIC_VERSION,
  };
}

function applicationDTO(row) {
  if (!row) return null;
  return {
    applicationId: row.id,
    status: String(row.status || "IDENTITY_REVIEW"),
    profile: jsonObject(row.profile_snapshot),
    requestedDomains: jsonArray(row.requested_domains),
    approvedDomains: jsonArray(row.approved_domains),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  };
}

function orderedPublicQuestions(questionIds) {
  const byId = new Map(getPublicQuizQuestions(questionIds).map((question) => [question.questionId, question]));
  return jsonArray(questionIds).map((questionId) => byId.get(String(questionId))).filter(Boolean);
}

function attemptDTO(row, answerRows = []) {
  if (!row) return null;
  const answers = {};
  for (const answerRow of answerRows) {
    if (typeof answerRow.question_id !== "string") continue;
    answers[answerRow.question_id] = typeof answerRow.answer === "string" ? answerRow.answer : jsonObject(answerRow.answer);
  }
  return {
    attemptId: row.id,
    applicationId: row.application_id,
    status: String(row.status || "IN_PROGRESS"),
    quizVersion: row.quiz_version,
    questions: orderedPublicQuestions(row.question_ids),
    answers,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    deadlineAt: row.deadline_at ? new Date(row.deadline_at).toISOString() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    maxScore: Number(row.max_score || 0),
  };
}

function practiceDTO(row) {
  if (!row) return null;
  return {
    practiceId: row.id,
    applicationId: row.application_id,
    domainCode: row.domain_code,
    promptVersion: row.prompt_version,
    prompt: jsonObject(row.prompt_snapshot),
    response: jsonObject(row.response),
    evidenceRevisionIds: jsonArray(row.evidence_revision_ids),
    state: String(row.state || "SUBMITTED"),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

async function answersFor(client, attemptId) {
  const result = await client.query(
    `SELECT question_id, answer, answered_at
       FROM public.expert_quiz_answers
      WHERE attempt_id = $1
      ORDER BY question_id ASC`,
    [attemptId]
  );
  return result.rows;
}

async function attemptForUpdate(client, attemptId, userId) {
  const result = await client.query(
    `SELECT id, application_id, user_id, quiz_version, question_ids, status,
            started_at, deadline_at, submitted_at, score, max_score
       FROM public.expert_quiz_attempts
      WHERE id = $1 AND user_id = $2
      FOR UPDATE`,
    [attemptId, userId]
  );
  if (!result.rows[0]) throw new ExpertQualificationError("QUIZ_ATTEMPT_NOT_FOUND", "Quiz attempt is not available.", 404);
  return result.rows[0];
}

async function expireAttempt(client, attempt) {
  if (attempt?.status !== "IN_PROGRESS" || new Date(attempt.deadline_at).getTime() > Date.now()) return attempt;
  const result = await client.query(
    `UPDATE public.expert_quiz_attempts
        SET status = 'EXPIRED', submitted_at = now()
      WHERE id = $1 AND status = 'IN_PROGRESS'
      RETURNING id, application_id, user_id, quiz_version, question_ids, status,
                started_at, deadline_at, submitted_at, score, max_score`,
    [attempt.id]
  );
  await client.query(
    `UPDATE public.expert_applications
        SET status = CASE WHEN status = 'QUIZ_IN_PROGRESS' THEN 'QUIZ_ELIGIBLE' ELSE status END,
            updated_at = now()
      WHERE id = $1`,
    [attempt.application_id]
  );
  return result.rows[0] || { ...attempt, status: "EXPIRED", submitted_at: new Date().toISOString() };
}

export class ExpertQualificationService {
  static async getStatus(userId) {
    const normalizedUserId = normalizeUuid(userId, "user");
    return withStorageErrors(() => transaction(async (client) => {
      const applicationResult = await client.query(
        `SELECT id, status, profile_snapshot, requested_domains, approved_domains,
                created_at, updated_at, reviewed_at
           FROM public.expert_applications
          WHERE user_id = $1`,
        [normalizedUserId]
      );
      const application = applicationResult.rows[0];
      if (!application) return { state: "NOT_APPLIED", application: null, latestAttempt: null };

      const attemptResult = await client.query(
        `SELECT id, application_id, user_id, quiz_version, question_ids, status,
                started_at, deadline_at, submitted_at, score, max_score
           FROM public.expert_quiz_attempts
          WHERE application_id = $1 AND user_id = $2
          ORDER BY created_at DESC
          LIMIT 1`,
        [application.id, normalizedUserId]
      );
      let attempt = attemptResult.rows[0] || null;
      if (attempt?.status === "IN_PROGRESS") {
        const previousStatus = attempt.status;
        attempt = await expireAttempt(client, attempt);
        if (previousStatus !== attempt.status && attempt.status === "EXPIRED") application.status = "QUIZ_ELIGIBLE";
      }
      const answers = attempt ? await answersFor(client, attempt.id) : [];
      const practiceResult = await client.query(
        `SELECT id, application_id, user_id, domain_code, prompt_version,
                prompt_snapshot, response, evidence_revision_ids, state,
                reviewed_by, reviewed_at, created_at, updated_at
           FROM private.expert_practice_submissions
          WHERE application_id = $1 AND user_id = $2
          ORDER BY created_at ASC`,
        [application.id, normalizedUserId]
      );
      return {
        state: application.status,
        application: applicationDTO(application),
        latestAttempt: attemptDTO(attempt, answers),
        practiceReviews: practiceResult.rows.map(practiceDTO),
      };
    }));
  }

  static async apply({ userId, profile, requestedDomains }) {
    const normalizedUserId = normalizeUuid(userId, "user");
    const profileSnapshot = normalizeProfile(profile);
    const domains = normalizeDomains(requestedDomains);
    return withStorageErrors(() => transaction(async (client) => {
      const existing = await client.query(
        `SELECT id, status, profile_snapshot, requested_domains, approved_domains,
                created_at, updated_at, reviewed_at
           FROM public.expert_applications
          WHERE user_id = $1
          FOR UPDATE`,
        [normalizedUserId]
      );
      if (existing.rows[0]) {
        throw new ExpertQualificationError("QUALIFICATION_ALREADY_EXISTS", "An expert application already exists for this account.", 409);
      }
      const inserted = await client.query(
        `INSERT INTO public.expert_applications
          (id, user_id, status, profile_snapshot, requested_domains, approved_domains, created_at, updated_at)
         VALUES ($1, $2, 'IDENTITY_REVIEW', $3, $4, '[]'::jsonb, now(), now())
         RETURNING id, status, profile_snapshot, requested_domains, approved_domains,
                   created_at, updated_at, reviewed_at`,
        [randomUUID(), normalizedUserId, JSON.stringify(profileSnapshot), JSON.stringify(domains)]
      );
      return {
        state: "IDENTITY_REVIEW",
        application: applicationDTO(inserted.rows[0]),
        latestAttempt: null,
      };
    }));
  }

  static async startQuiz(userId) {
    const normalizedUserId = normalizeUuid(userId, "user");
    return withStorageErrors(() => transaction(async (client) => {
      const applicationResult = await client.query(
        `SELECT id, user_id, status, profile_snapshot, requested_domains, approved_domains,
                created_at, updated_at, reviewed_at
           FROM public.expert_applications
          WHERE user_id = $1
          FOR UPDATE`,
        [normalizedUserId]
      );
      const application = applicationResult.rows[0];
      if (!application) throw new ExpertQualificationError("QUALIFICATION_NOT_FOUND", "Submit an expert profile before starting the quiz.", 404);

      let activeAttemptResult = await client.query(
        `SELECT id, application_id, user_id, quiz_version, question_ids, status,
                started_at, deadline_at, submitted_at, score, max_score
           FROM public.expert_quiz_attempts
          WHERE application_id = $1 AND user_id = $2 AND status = 'IN_PROGRESS'
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE`,
        [application.id, normalizedUserId]
      );
      if (activeAttemptResult.rows[0]) {
        const current = await expireAttempt(client, activeAttemptResult.rows[0]);
        if (current.status === "IN_PROGRESS") {
          return { state: application.status, application: applicationDTO(application), attempt: attemptDTO(current, await answersFor(client, current.id)) };
        }
        application.status = "QUIZ_ELIGIBLE";
      }

      if (application.status !== "QUIZ_ELIGIBLE") {
        throw new ExpertQualificationError("QUIZ_NOT_ELIGIBLE", `Quiz is not available while the application is ${application.status}.`, 409);
      }
      const countResult = await client.query(
        `SELECT count(*)::int AS count
           FROM public.expert_quiz_attempts
          WHERE application_id = $1 AND user_id = $2 AND status <> 'CANCELLED'`,
        [application.id, normalizedUserId]
      );
      const attemptsUsed = Number(countResult.rows[0]?.count || 0);
      if (attemptsUsed >= QUIZ_MAX_ATTEMPTS) {
        await client.query(`UPDATE public.expert_applications SET status = 'REJECTED', updated_at = now() WHERE id = $1`, [application.id]);
        throw new ExpertQualificationError("QUIZ_ATTEMPTS_EXHAUSTED", "The maximum number of quiz attempts has been reached.", 409);
      }

      const questionIds = drawQuizQuestionIds();
      const deadline = new Date(Date.now() + QUIZ_DURATION_SECONDS * 1000);
      const attemptResult = await client.query(
        `INSERT INTO public.expert_quiz_attempts
          (id, application_id, user_id, quiz_version, question_ids, status, started_at, deadline_at, max_score)
         VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', now(), $6, $7)
         RETURNING id, application_id, user_id, quiz_version, question_ids, status,
                   started_at, deadline_at, submitted_at, score, max_score`,
        [randomUUID(), application.id, normalizedUserId, QUIZ_VERSION, JSON.stringify(questionIds), deadline, questionIds.length]
      );
      await client.query(`UPDATE public.expert_applications SET status = 'QUIZ_IN_PROGRESS', updated_at = now() WHERE id = $1`, [application.id]);
      const attempt = attemptResult.rows[0];
      return { state: "QUIZ_IN_PROGRESS", application: applicationDTO({ ...application, status: "QUIZ_IN_PROGRESS", updated_at: new Date() }), attempt: attemptDTO(attempt, []) };
    }));
  }

  static async saveAnswer({ userId, attemptId, questionId, answer }) {
    const normalizedUserId = normalizeUuid(userId, "user");
    const normalizedAttemptId = normalizeUuid(attemptId, "attempt");
    const normalizedQuestionId = boundedText(questionId, { field: "questionId", min: 2, max: 120 });
    const normalizedAnswer = boundedText(answer, { field: "answer", min: 1, max: 320 });
    return withStorageErrors(() => transaction(async (client) => {
      let attempt = await attemptForUpdate(client, normalizedAttemptId, normalizedUserId);
      attempt = await expireAttempt(client, attempt);
      if (attempt.status !== "IN_PROGRESS") throw new ExpertQualificationError("QUIZ_NOT_IN_PROGRESS", "This quiz attempt is no longer accepting answers.", 409);
      if (!jsonArray(attempt.question_ids).map(String).includes(normalizedQuestionId)) {
        throw new ExpertQualificationError("QUIZ_QUESTION_INVALID", "This question does not belong to the current quiz.", 400);
      }
      const question = getQuizQuestion(normalizedQuestionId);
      if (!question || !question.choices.some((choice) => choice.id === normalizedAnswer)) {
        throw new ExpertQualificationError("QUIZ_ANSWER_INVALID", "The selected answer is not valid for this question.", 400);
      }
      await client.query(
        `INSERT INTO public.expert_quiz_answers (attempt_id, user_id, question_id, answer, answered_at)
         VALUES ($1, $2, $3, $4::jsonb, now())
         ON CONFLICT (attempt_id, question_id) DO UPDATE
           SET answer = EXCLUDED.answer, answered_at = now()`,
        [normalizedAttemptId, normalizedUserId, normalizedQuestionId, JSON.stringify(normalizedAnswer)]
      );
      return { state: "IN_PROGRESS", attempt: attemptDTO(attempt, await answersFor(client, normalizedAttemptId)) };
    }));
  }

  static async submitQuiz({ userId, attemptId }) {
    const normalizedUserId = normalizeUuid(userId, "user");
    const normalizedAttemptId = normalizeUuid(attemptId, "attempt");
    return withStorageErrors(() => transaction(async (client) => {
      let attempt = await attemptForUpdate(client, normalizedAttemptId, normalizedUserId);
      attempt = await expireAttempt(client, attempt);
      if (attempt.status === "EXPIRED") throw new ExpertQualificationError("QUIZ_EXPIRED", "The quiz deadline has passed.", 409);
      const answerRows = await answersFor(client, normalizedAttemptId);
      const answers = Object.fromEntries(answerRows.map((row) => [row.question_id, typeof row.answer === "string" ? row.answer : ""]));
      const missingQuestions = jsonArray(attempt.question_ids).map(String).filter((questionId) => !Object.hasOwn(answers, questionId));
      if (missingQuestions.length > 0) {
        throw new ExpertQualificationError("QUIZ_INCOMPLETE", "Every quiz question must have a saved answer before submission.", 400);
      }
      const grade = gradeQuiz({ questionIds: jsonArray(attempt.question_ids), answers });
      const finalStatus = grade.passed ? "PASSED" : "FAILED";
      await client.query(
        `UPDATE public.expert_quiz_attempts
            SET status = $2, submitted_at = now(), score = $3
          WHERE id = $1`,
        [normalizedAttemptId, finalStatus, grade.score]
      );
      const countResult = await client.query(
        `SELECT count(*)::int AS count
           FROM public.expert_quiz_attempts
          WHERE application_id = $1 AND user_id = $2 AND status <> 'CANCELLED'`,
        [attempt.application_id, normalizedUserId]
      );
      const attemptsUsed = Number(countResult.rows[0]?.count || 0);
      const nextState = grade.passed ? "DOMAIN_REVIEW" : attemptsUsed >= QUIZ_MAX_ATTEMPTS ? "REJECTED" : "QUIZ_ELIGIBLE";
      await client.query(
        `UPDATE public.expert_applications SET status = $2, updated_at = now() WHERE id = $1`,
        [attempt.application_id, nextState]
      );
      if (grade.passed) {
        const applicationDomains = await client.query(`SELECT requested_domains FROM public.expert_applications WHERE id = $1`, [attempt.application_id]);
        for (const domain of jsonArray(applicationDomains.rows[0]?.requested_domains).map((value) => String(value).toUpperCase())) {
          await client.query(
            `INSERT INTO private.expert_verifications AS ev (user_id, domain_code, status, qualification_state, verified_at)
             VALUES ($1, $2, 'PENDING', 'PRACTICE_REVIEW', NULL)
             ON CONFLICT (user_id, domain_code) DO UPDATE
               SET status = CASE WHEN ev.status = 'VERIFIED' THEN ev.status ELSE 'PENDING' END,
                   qualification_state = CASE WHEN ev.status = 'VERIFIED' THEN ev.qualification_state ELSE 'PRACTICE_REVIEW' END`,
            [normalizedUserId, domain]
          );
        }
      }
      const updatedAttempt = { ...attempt, status: finalStatus, submitted_at: new Date(), score: grade.score };
      return {
        state: nextState,
        attempt: attemptDTO(updatedAttempt, answerRows),
        result: {
          quizVersion: grade.quizVersion,
          points: grade.points,
          maxScore: grade.maxScore,
          score: grade.score,
          passed: grade.passed,
          results: grade.results,
          nextState,
        },
      };
    }));
  }

  static async submitPractice({ userId, domainCode, response, evidenceRevisionIds = [], idempotencyKey, correlationId = "expert-practice" }) {
    const normalizedUserId = normalizeUuid(userId, "user");
    const domains = normalizeDomains([domainCode]);
    const normalizedDomain = domains[0];
    if (!response || typeof response !== "object" || Array.isArray(response)) throw new ExpertQualificationError("PRACTICE_INPUT_INVALID", "A structured practice response is required.", 400);
    if (!Array.isArray(evidenceRevisionIds) || evidenceRevisionIds.length > 50 || evidenceRevisionIds.some((value) => typeof value !== "string" || value.trim().length < 1 || value.trim().length > 240)) throw new ExpertQualificationError("PRACTICE_EVIDENCE_INVALID", "Practice evidence references must be a bounded list.", 400);
    if (!evidenceRevisionIds.length) throw new ExpertQualificationError("PRACTICE_EVIDENCE_REQUIRED", "A practice response must cite at least one evidence reference.", 400);
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new ExpertQualificationError("PRACTICE_IDEMPOTENCY_REQUIRED", "A stable Idempotency-Key is required for practice submission.", 400);
    const scan = detectPII(JSON.stringify(response));
    if (scan.blocked) throw new ExpertQualificationError("PRIVACY_SCAN_BLOCKED", "The practice response contains identifying content and cannot be stored.", 422);
    const sanitizedResponse = sanitizePractice(response);
    const prompt = practicePrompt(normalizedDomain);
    const requestDigest = digest({ normalizedUserId, normalizedDomain, response: sanitizedResponse, evidenceRevisionIds, promptVersion: prompt.promptVersion });
    return withStorageErrors(() => transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`practice:${normalizedUserId}:${idempotencyKey}`]);
      const existing = await client.query(
        `SELECT * FROM private.expert_practice_submissions WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [normalizedUserId, idempotencyKey]
      );
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw new ExpertQualificationError("IDEMPOTENCY_CONFLICT", "The same practice key was used for a different response.", 409);
        return { state: existing.rows[0].state, practice: practiceDTO(existing.rows[0]), idempotent: true };
      }
      const applicationResult = await client.query(
        `SELECT id, user_id, status, requested_domains
           FROM public.expert_applications
          WHERE user_id = $1
          FOR UPDATE`,
        [normalizedUserId]
      );
      const application = applicationResult.rows[0];
      if (!application) throw new ExpertQualificationError("QUALIFICATION_NOT_FOUND", "Submit an expert profile before the practice review.", 404);
      if (!['DOMAIN_REVIEW', 'APPEALED'].includes(application.status)) throw new ExpertQualificationError("PRACTICE_NOT_ELIGIBLE", "A passed quiz and identity review are required before practice.", 409);
      if (!jsonArray(application.requested_domains).map((value) => String(value).toUpperCase()).includes(normalizedDomain)) throw new ExpertQualificationError("PRACTICE_DOMAIN_INVALID", "The practice domain was not requested in the application.", 400);
      const prior = await client.query(`SELECT * FROM private.expert_practice_submissions WHERE application_id = $1 AND domain_code = $2 FOR UPDATE`, [application.id, normalizedDomain]);
      if (prior.rows[0]) throw new ExpertQualificationError("PRACTICE_ALREADY_SUBMITTED", "A practice response already exists for this domain.", 409);
      const inserted = await client.query(
        `INSERT INTO private.expert_practice_submissions
          (application_id, user_id, domain_code, prompt_version, prompt_snapshot,
           response, evidence_revision_ids, state, idempotency_key, request_digest,
           created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, 'SUBMITTED', $8, $9, now(), now())
         RETURNING id, application_id, user_id, domain_code, prompt_version,
                   prompt_snapshot, response, evidence_revision_ids, state,
                   reviewed_by, reviewed_at, created_at, updated_at`,
        [application.id, normalizedUserId, normalizedDomain, prompt.promptVersion, JSON.stringify(prompt), JSON.stringify(sanitizedResponse), JSON.stringify(evidenceRevisionIds.map((value) => String(value).trim()).slice(0, 50)), idempotencyKey, requestDigest]
      );
      await client.query(
        `INSERT INTO private.expert_verifications AS ev (user_id, domain_code, status, qualification_state, verified_at)
         VALUES ($1, $2, 'PENDING', 'PRACTICE_REVIEW', NULL)
         ON CONFLICT (user_id, domain_code) DO UPDATE
           SET status = CASE WHEN ev.status = 'VERIFIED' THEN ev.status ELSE 'PENDING' END,
               qualification_state = CASE WHEN ev.status = 'VERIFIED' THEN ev.qualification_state ELSE 'PRACTICE_REVIEW' END`,
        [normalizedUserId, normalizedDomain]
      );
      await appendQualificationOutbox(client, {
        eventType: "EXPERT_PRACTICE_SUBMITTED",
        aggregateType: "EXPERT_PRACTICE_SUBMISSION",
        aggregateId: inserted.rows[0].id,
        subject: normalizedUserId,
        correlationId,
        payload: {
          practiceId: inserted.rows[0].id,
          applicationId: application.id,
          domainCode: normalizedDomain,
          promptVersion: prompt.promptVersion,
          evidenceRevisionIds,
          state: "SUBMITTED",
        },
      });
      return { state: "SUBMITTED", practice: practiceDTO(inserted.rows[0]), idempotent: false };
    }));
  }

  static async reviewPractice({ reviewerId, practiceId, decision, reason, idempotencyKey, rubricVersion = PRACTICE_RUBRIC_VERSION, correlationId = "expert-practice-review" }) {
    const normalizedReviewerId = normalizeUuid(reviewerId, "reviewer");
    const normalizedPracticeId = normalizeUuid(practiceId, "practice");
    const normalizedDecision = String(decision || "").trim().toUpperCase();
    if (!PRACTICE_DECISIONS.has(normalizedDecision)) throw new ExpertQualificationError("PRACTICE_DECISION_INVALID", "Practice review decision is invalid.", 400);
    const normalizedReason = boundedText(reason, { field: "reason", min: 20, max: 4000 });
    if (!idempotencyKey || String(idempotencyKey).length > 180) throw new ExpertQualificationError("PRACTICE_IDEMPOTENCY_REQUIRED", "A stable Idempotency-Key is required for practice review.", 400);
    const scan = detectPII(normalizedReason);
    if (scan.blocked) throw new ExpertQualificationError("PRIVACY_SCAN_BLOCKED", "The practice review contains identifying content and cannot be stored.", 422);
    return withStorageErrors(() => transaction(async (client) => {
      const role = await client.query(
        `SELECT 1 FROM private.user_roles ur JOIN private.roles r ON r.id = ur.role_id
          WHERE ur.user_id = $1 AND ur.revoked_at IS NULL AND r.code = 'ADMIN'`,
        [normalizedReviewerId]
      );
      if (!role.rows[0]) throw new ExpertQualificationError("COORDINATOR_REQUIRED", "An authorized reviewer is required for supervised practice.", 403);
      const submissionResult = await client.query(
        `SELECT id, application_id, user_id, domain_code, prompt_version,
                prompt_snapshot, response, evidence_revision_ids, state,
                reviewed_by, reviewed_at, created_at, updated_at
           FROM private.expert_practice_submissions
          WHERE id = $1
          FOR UPDATE`,
        [normalizedPracticeId]
      );
      const submission = submissionResult.rows[0];
      if (!submission) throw new ExpertQualificationError("PRACTICE_NOT_FOUND", "Practice submission is not available.", 404);
      if (String(submission.user_id).toLowerCase() === normalizedReviewerId) throw new ExpertQualificationError("REVIEWER_CANNOT_SELF_APPROVE", "A reviewer cannot evaluate their own practice response.", 403);
      const requestDigest = digest({ normalizedReviewerId, normalizedPracticeId, decision: normalizedDecision, reason: normalizedReason, rubricVersion });
      const existing = await client.query(`SELECT * FROM private.expert_practice_decisions WHERE reviewer_id = $1 AND idempotency_key = $2 LIMIT 1`, [normalizedReviewerId, idempotencyKey]);
      if (existing.rows[0]) {
        if (!Buffer.from(existing.rows[0].request_digest).equals(requestDigest)) throw new ExpertQualificationError("IDEMPOTENCY_CONFLICT", "The same practice review key was used for a different decision.", 409);
        return { state: submission.state, practice: practiceDTO(submission), idempotent: true };
      }
      const decisionRow = await client.query(
        `SELECT id FROM private.expert_practice_decisions WHERE reviewer_id = $1 AND submission_id = $2 LIMIT 1`,
        [normalizedReviewerId, normalizedPracticeId]
      );
      if (decisionRow.rows[0]) throw new ExpertQualificationError("PRACTICE_REVIEW_ALREADY_RECORDED", "This reviewer has already reviewed the practice response.", 409);
      const inserted = await client.query(
        `INSERT INTO private.expert_practice_decisions
          (submission_id, application_id, user_id, reviewer_id, decision,
           rubric_version, reason, idempotency_key, request_digest, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
         RETURNING id, submission_id, reviewer_id, decision, rubric_version, reason, created_at`,
        [normalizedPracticeId, submission.application_id, submission.user_id, normalizedReviewerId, normalizedDecision, rubricVersion, redactText(normalizedReason), idempotencyKey, requestDigest]
      );
      const nextState = normalizedDecision === "PASS" ? "PASSED" : normalizedDecision === "FAIL" ? "FAILED" : "UNDER_REVIEW";
      const updated = await client.query(
        `UPDATE private.expert_practice_submissions
            SET state = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now()
          WHERE id = $1
          RETURNING id, application_id, user_id, domain_code, prompt_version,
                    prompt_snapshot, response, evidence_revision_ids, state,
                    reviewed_by, reviewed_at, created_at, updated_at`,
        [normalizedPracticeId, nextState, normalizedReviewerId]
      );
      await client.query(
        `UPDATE private.expert_verifications
            SET qualification_state = $3,
                status = CASE WHEN $3 = 'TRAINEE' THEN 'PENDING' ELSE status END,
                suspended_at = CASE WHEN $3 = 'SUSPENDED' THEN now() ELSE suspended_at END
          WHERE user_id = $1 AND domain_code = $2`,
        [submission.user_id, submission.domain_code, normalizedDecision === "PASS" ? "TRAINEE" : normalizedDecision === "FAIL" ? "SUSPENDED" : "PRACTICE_REVIEW"]
      );
      if (normalizedDecision === "FAIL") await client.query(`UPDATE public.expert_applications SET status = 'REJECTED', updated_at = now() WHERE id = $1 AND status IN ('DOMAIN_REVIEW','APPEALED')`, [submission.application_id]);
      await client.query(`INSERT INTO private.expert_qualification_reviews (application_id, user_id, reviewer_id, decision, approved_domains, reason, created_at) VALUES ($1, $2, $3, $4, '[]'::jsonb, $5, now())`, [submission.application_id, submission.user_id, normalizedReviewerId, `PRACTICE_${normalizedDecision}`, redactText(normalizedReason)]);
      await appendQualificationOutbox(client, {
        eventType: "EXPERT_PRACTICE_REVIEWED",
        aggregateType: "EXPERT_PRACTICE_SUBMISSION",
        aggregateId: normalizedPracticeId,
        subject: submission.user_id,
        correlationId,
        payload: {
          practiceId: normalizedPracticeId,
          applicationId: submission.application_id,
          domainCode: submission.domain_code,
          reviewerId: normalizedReviewerId,
          decision: normalizedDecision,
          state: nextState,
          rubricVersion,
        },
      });
      return {
        state: nextState,
        practice: practiceDTO(updated.rows[0]),
        decision: {
          decisionId: inserted.rows[0].id,
          submissionId: inserted.rows[0].submission_id,
          decision: inserted.rows[0].decision,
          rubricVersion: inserted.rows[0].rubric_version,
          reason: inserted.rows[0].reason,
          createdAt: inserted.rows[0].created_at ? new Date(inserted.rows[0].created_at).toISOString() : null,
        },
        idempotent: false,
      };
    }));
  }

  static async adminReview({ reviewerId, applicationId, decision, approvedDomains = [], reason = "" }) {
    const normalizedReviewerId = normalizeUuid(reviewerId, "reviewer");
    const normalizedApplicationId = normalizeUuid(applicationId, "application");
    const normalizedDecision = String(decision || "").trim().toUpperCase();
    if (!REVIEW_DECISIONS.has(normalizedDecision)) throw new ExpertQualificationError("REVIEW_DECISION_INVALID", "Review decision is invalid.", 400);
    const normalizedReason = reason ? boundedText(reason, { field: "reason", min: 1, max: 1000 }) : null;
    const domains = approvedDomains.length ? normalizeDomains(approvedDomains) : [];

    return withStorageErrors(() => transaction(async (client) => {
      const applicationResult = await client.query(
        `SELECT id, user_id, status, profile_snapshot, requested_domains, approved_domains,
                created_at, updated_at, reviewed_at
           FROM public.expert_applications
          WHERE id = $1
          FOR UPDATE`,
        [normalizedApplicationId]
      );
      const application = applicationResult.rows[0];
      if (!application) throw new ExpertQualificationError("QUALIFICATION_NOT_FOUND", "Expert application is not available.", 404);
      if (normalizedReviewerId === String(application.user_id).toLowerCase()) {
        throw new ExpertQualificationError("REVIEWER_CANNOT_SELF_APPROVE", "A reviewer cannot approve or reject their own expert application.", 403);
      }
      const requested = new Set(jsonArray(application.requested_domains).map((value) => String(value).toUpperCase()));
      if (domains.some((domain) => !requested.has(domain))) {
        throw new ExpertQualificationError("REVIEW_DOMAINS_INVALID", "Approved domains must be requested domains.", 400);
      }

      let nextStatus = normalizedDecision === "APPROVE_QUIZ"
        ? "QUIZ_ELIGIBLE"
        : normalizedDecision === "ACTIVATE"
          ? "ACTIVE"
          : normalizedDecision === "APPEAL_REVIEW"
            ? "APPEALED"
            : "REJECTED";
      if (normalizedDecision === "APPROVE_QUIZ" && !["IDENTITY_REVIEW", "APPEALED"].includes(application.status)) {
        throw new ExpertQualificationError("REVIEW_TRANSITION_INVALID", "The application is not awaiting identity review.", 409);
      }
      if (normalizedDecision === "REJECT" && application.status === "ACTIVE") {
        throw new ExpertQualificationError("REVIEW_TRANSITION_INVALID", "An active expert must be revoked through the domain verification workflow.", 409);
      }
      if (normalizedDecision === "APPEAL_REVIEW" && application.status !== "REJECTED") {
        throw new ExpertQualificationError("REVIEW_TRANSITION_INVALID", "Only a rejected application can be appealed.", 409);
      }
      if (normalizedDecision === "ACTIVATE") {
        if (!['DOMAIN_REVIEW', 'APPEALED'].includes(application.status)) {
          throw new ExpertQualificationError("REVIEW_TRANSITION_INVALID", "A passed quiz and domain review are required before activation.", 409);
        }
        const passed = await client.query(
          `SELECT 1 FROM public.expert_quiz_attempts WHERE application_id = $1 AND status = 'PASSED' LIMIT 1`,
          [application.id]
        );
        if (!passed.rows[0]) throw new ExpertQualificationError("QUIZ_PASS_REQUIRED", "A passed quiz is required before activation.", 409);
        if (domains.length === 0) throw new ExpertQualificationError("REVIEW_DOMAINS_REQUIRED", "At least one approved domain is required for activation.", 400);
        const practice = await client.query(
          `SELECT domain_code, count(*) filter (where state = 'PASSED')::int AS passed
             FROM private.expert_practice_submissions
            WHERE application_id = $1 AND domain_code = ANY($2::text[])
            GROUP BY domain_code`,
          [application.id, domains]
        );
        const passedByDomain = new Map(practice.rows.map((row) => [String(row.domain_code).toUpperCase(), Number(row.passed)]));
        if (domains.some((domain) => (passedByDomain.get(domain) || 0) < 1)) {
          throw new ExpertQualificationError("PRACTICE_REVIEW_REQUIRED", "An evidence-based practice review must pass before domain activation.", 409);
        }
        const expertRole = await client.query(
          `INSERT INTO private.user_roles (user_id, role_id, granted_by, granted_at, revoked_at)
           SELECT $1, r.id, $2, now(), NULL
             FROM private.roles r
            WHERE r.code = 'EXPERT'
           ON CONFLICT (user_id, role_id) DO UPDATE
             SET granted_by = EXCLUDED.granted_by, granted_at = now(), revoked_at = NULL
           RETURNING user_id`,
          [application.user_id, normalizedReviewerId]
        );
        if (!expertRole.rows[0]) {
          throw new ExpertQualificationError("EXPERT_ROLE_UNAVAILABLE", "The expert role is not configured for activation.", 503);
        }
        const profile = jsonObject(application.profile_snapshot);
        await client.query(
          `INSERT INTO public.expert_profiles (user_id, public_title, public_bio, created_at, updated_at)
           VALUES ($1, $2, $3, now(), now())
           ON CONFLICT (user_id) DO UPDATE
             SET public_title = EXCLUDED.public_title, public_bio = EXCLUDED.public_bio, updated_at = now()`,
          [application.user_id, profile.displayName || "Verified expert", profile.bio || null]
        );
        for (const domain of domains) {
          await client.query(
            `INSERT INTO private.expert_verifications
              (user_id, domain_code, status, qualification_state, verified_by, verified_at, evidence_ref)
             VALUES ($1, $2, 'VERIFIED', 'DOMAIN_VERIFIED', $3, now(), $4)
             ON CONFLICT (user_id, domain_code) DO UPDATE
               SET status = 'VERIFIED', qualification_state = 'DOMAIN_VERIFIED',
                   suspended_at = NULL, verified_by = EXCLUDED.verified_by,
                   verified_at = now(), evidence_ref = EXCLUDED.evidence_ref`,
            [application.user_id, domain, normalizedReviewerId, `expert-qualification:${application.id}`]
          );
        }
      }
      await client.query(
        `UPDATE public.expert_applications
            SET status = $2, approved_domains = $3::jsonb,
                reviewed_at = now(), reviewed_by = $4, updated_at = now()
          WHERE id = $1`,
        [application.id, nextStatus, JSON.stringify(domains.length ? domains : jsonArray(application.approved_domains)), normalizedReviewerId]
      );
      await client.query(
        `INSERT INTO private.expert_qualification_reviews
          (application_id, user_id, reviewer_id, decision, approved_domains, reason, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, now())`,
        [application.id, application.user_id, normalizedReviewerId, normalizedDecision, JSON.stringify(domains), normalizedReason]
      );
      return {
        state: nextStatus,
        application: applicationDTO({ ...application, status: nextStatus, approved_domains: domains.length ? domains : jsonArray(application.approved_domains), reviewed_by: normalizedReviewerId, reviewed_at: new Date(), updated_at: new Date() }),
      };
    }));
  }
}
