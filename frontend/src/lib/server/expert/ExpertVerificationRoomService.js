import { createHash, randomUUID } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { MediaArtifactService } from "../media/MediaArtifactService.js";
import { publishRealtimeEvent } from "../realtime/RealtimePublisher.js";
import { authenticatedUserId, ExpertQualificationError } from "./ExpertQualificationService.js";
import { roomRoundEligibility } from "./ExpertRoomEligibility.js";
import { validateRemoteUrl, validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import {
  assertRoomTransition,
  capReputationDelta,
  classifyRoomTrustRetrieval,
  proposeEvidenceRubricScore,
  selectIndependentSupervisor,
} from "./ExpertV5Domain.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INPUT_TYPE = new Set(["TEXT", "URL", "IMAGE", "QR"]);
const BODY_METADATA_FIELDS = new Set(["url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "inputKind", "fileType", "extractionAuthority", "institutionContext", "mediaArtifactId", "imageHash", "bytes", "width", "height"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_ROOM_PARTICIPANTS = 6;

function roomError(code, message, statusCode = 400) {
  return new ExpertQualificationError(code, message, statusCode);
}

function normalizeUuid(value, field) {
  const candidate = String(value || "").trim().replace(/^(student|expert|user):/i, "");
  if (!UUID_PATTERN.test(candidate)) throw roomError("EXPERT_ROOM_ID_INVALID", `${field} is invalid.`, 400);
  return candidate.toLowerCase();
}

function storageError(caught) {
  if (caught instanceof ExpertQualificationError) return caught;
  if (["42P01", "42703", "3F000"].includes(caught?.code)) return roomError("EXPERT_ROOM_MIGRATION_REQUIRED", "Expert V5 room storage is not initialized; no fallback room exists.", 503);
  return roomError("EXPERT_ROOM_STORAGE_UNAVAILABLE", "Verification room storage is temporarily unavailable.", 503);
}

async function withStorageErrors(operation) {
  try { return await operation(); } catch (caught) { throw storageError(caught); }
}

async function transaction(operation) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (caught) {
    await client.query("ROLLBACK").catch(() => {});
    throw caught;
  } finally {
    client.release();
  }
}

async function roomSetting(client, key, fallback, min, max) {
  const result = await client.query(
    `SELECT config_value #>> '{}' AS value FROM private.expert_v5_config WHERE config_key = $1`, [key],
  );
  const value = Number(result.rows[0]?.value ?? fallback);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.trunc(value))) : fallback;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function boundedText(value, maxLength) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, maxLength) : "";
}

function cleanMetadata(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw roomError("EXPERT_ROOM_METADATA_INVALID", "Room input metadata must be an object.", 400);
  const result = {};
  for (const key of BODY_METADATA_FIELDS) {
    if (!Object.hasOwn(value, key)) continue;
    const item = value[key];
    if (key === "bytes") {
      if (typeof item === "string" && item.length <= Math.ceil(MAX_IMAGE_BYTES * 1.5)) result.bytes = item;
      else if (Array.isArray(item) && item.length <= MAX_IMAGE_BYTES && item.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) result.bytes = item;
      else throw roomError("EXPERT_ROOM_IMAGE_INVALID", "Image data exceeds the accepted limit or is malformed.", 413);
    } else if (typeof item === "string") {
      result[key] = item.slice(0, ["ocrText", "qrContent", "qrPayload", "institutionContext"].includes(key) ? 500_000 : 2_048);
    } else if (typeof item === "number" && Number.isFinite(item)) result[key] = item;
  }
  return result;
}

function normalizeChallenge({ inputType, content, metadata }) {
  const type = String(inputType || "").trim().toUpperCase();
  if (!INPUT_TYPE.has(type)) throw roomError("EXPERT_ROOM_INPUT_UNSUPPORTED", "Supported Trust inputs are TEXT, URL, IMAGE and QR.", 422);
  const normalizedContent = boundedText(content, type === "TEXT" ? 500_000 : type === "IMAGE" ? 12_000_000 : 4_096);
  const normalizedMetadata = cleanMetadata(metadata);
  if (type === "TEXT" && !normalizedContent) throw roomError("EXPERT_ROOM_CONTENT_REQUIRED", "Enter text for the room challenge.", 400);
  if (type === "URL") {
    const url = normalizedContent || normalizedMetadata.url || "";
    const safe = validateRemoteUrlSync(url);
    if (!safe.ok) throw roomError("EXPERT_ROOM_URL_INVALID", "Enter a safe public HTTP or HTTPS URL without credentials.", 400);
    normalizedMetadata.url = safe.url;
  }
  if (type === "IMAGE" && !normalizedMetadata.bytes && !normalizedMetadata.mediaArtifactId && !normalizedContent.startsWith("data:image/")) {
    throw roomError("EXPERT_ROOM_IMAGE_REQUIRED", "Provide an image through the canonical Trust image intake.", 400);
  }
  if (type === "QR" && !normalizedContent && !normalizedMetadata.bytes && !normalizedMetadata.qrContent && !normalizedMetadata.qrPayload) {
    throw roomError("EXPERT_ROOM_QR_REQUIRED", "Provide a QR image or decoded payload to the canonical Trust intake.", 400);
  }
  return { type: type.toLowerCase(), content: normalizedContent, metadata: normalizedMetadata };
}

async function appendRoomEvent(client, { roomId, roundId = null, actorId = null, eventType, payload = {}, idempotencyKey }) {
  await client.query(
    `INSERT INTO private.expert_room_events(room_id, round_id, actor_id, event_type, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6) ON CONFLICT (idempotency_key) DO NOTHING`,
    [roomId, roundId, actorId, eventType, JSON.stringify(payload), idempotencyKey],
  );
}

async function publishRoomRevision(roomId, revision, status, recipientIds, roundId = null) {
  const ids = [...new Set((recipientIds || []).map((id) => String(id || "").toLowerCase()).filter((id) => UUID_PATTERN.test(id)))];
  await Promise.all(ids.map((subjectId) => publishRealtimeEvent({
    channel: "expert",
    eventType: "expert:revision",
    subjectId,
    classification: "INTERNAL",
    producer: "studenthub-expert-v5-room",
    correlationId: `expert-room:${roomId}`,
    idempotencyKey: `room-revision:${roomId}:${revision}:${subjectId}`,
    // The durable revision is the event identity. A retry must carry the same
    // payload rather than a new wall-clock timestamp under the old key.
    data: { roomId, roundId, revision, state: status },
  })));
}

async function roomRecipients(client, roomId, extraIds = []) {
  const result = await client.query(
    `SELECT user_id FROM private.expert_room_participants WHERE room_id = $1 AND state <> 'LEFT'`, [roomId],
  );
  return [...new Set([...result.rows.map((row) => String(row.user_id)), ...extraIds.map(String)])];
}

async function addParticipant(client, { roomId, userId, role, conflictDeclaration = "NOT_REQUIRED" }) {
  await client.query(
    `INSERT INTO private.expert_room_participants
       (room_id, user_id, role, state, conflict_declaration, conflict_declared_at, joined_at, last_seen_at)
     VALUES ($1,$2,$3,'JOINED',$4,CASE WHEN $4 = 'NO_KNOWN_CONFLICT' THEN now() ELSE NULL END,now(),now())
     ON CONFLICT (room_id, user_id) DO UPDATE SET state = 'JOINED', role = EXCLUDED.role,
       conflict_declaration = EXCLUDED.conflict_declaration,
       conflict_declared_at = EXCLUDED.conflict_declared_at, left_at = NULL, last_seen_at = now()`,
    [roomId, userId, role, conflictDeclaration],
  );
}

async function findOnlineSupervisors(client, { domainCode, hostId, roomId, excludedIds = [] }) {
  const result = await client.query(
    `SELECT DISTINCT ev.user_id, upper(ev.domain_code) AS domain_code,
            presence.heartbeat_at AS last_seen_at,
            true AS is_verified
       FROM private.expert_room_presence presence
       JOIN private.expert_verifications ev ON ev.user_id = presence.user_id
      WHERE upper(ev.domain_code) = $1
        AND ev.status = 'VERIFIED'
        AND ev.qualification_state = 'DOMAIN_VERIFIED'
        AND ev.suspended_at IS NULL
        AND (ev.expires_at IS NULL OR ev.expires_at > now())
        AND presence.expires_at > now()
        AND presence.user_id <> $2
        AND NOT EXISTS (
          SELECT 1 FROM private.expert_room_events e
           WHERE e.room_id = $3 AND e.actor_id = presence.user_id AND e.event_type = 'SUPERVISOR_OFFERED'
             AND (e.payload->>'declined' = 'true' OR e.payload->>'conflictDeclared' = 'true')
        )
      ORDER BY presence.heartbeat_at DESC`, [domainCode, hostId, roomId],
  );
  const exclude = new Set(excludedIds.map((id) => String(id).toLowerCase()));
  return result.rows.filter((row) => !exclude.has(String(row.user_id).toLowerCase())).map((row) => ({
    userId: String(row.user_id),
    domainCode: String(row.domain_code).toUpperCase(),
    lastSeenAt: row.last_seen_at,
    isVerified: row.is_verified === true,
    hasConflict: row.has_conflict === true,
  }));
}

async function selectSupervisor(client, { domainCode, hostId, roomId, excludedIds = [] }) {
  const participants = await client.query(
    `SELECT user_id FROM private.expert_room_participants WHERE room_id = $1 AND state = 'JOINED'`, [roomId],
  );
  const candidates = await findOnlineSupervisors(client, { domainCode, hostId, roomId, excludedIds });
  return selectIndependentSupervisor({
    candidates,
    hostId,
    participantIds: participants.rows.map((row) => String(row.user_id)),
    domainCode,
  });
}

async function memberFor(client, roomId, userId) {
  const result = await client.query(
    `SELECT role, state, conflict_declaration, conflict_declared_at, joined_at, last_seen_at FROM private.expert_room_participants
      WHERE room_id = $1 AND user_id = $2`, [roomId, userId],
  );
  if (!result.rows[0] || result.rows[0].state === "LEFT") throw roomError("EXPERT_ROOM_MEMBERSHIP_REQUIRED", "You are not an active member of this room.", 403);
  return result.rows[0];
}

async function getRoomRow(client, roomId, { forUpdate = false } = {}) {
  const result = await client.query(
    `SELECT id, host_user_id, domain_code, input_type, challenge_payload, status,
            supervisor_user_id, supervisor_offer_expires_at, current_round_id,
            trust_case_id, trust_revision, evidence_package_id, revision,
            idempotency_key, request_hash, created_at, updated_at
       FROM private.expert_verification_rooms WHERE id = $1${forUpdate ? " FOR UPDATE" : ""}`,
    [roomId],
  );
  if (!result.rows[0]) throw roomError("EXPERT_ROOM_NOT_FOUND", "Verification room was not found.", 404);
  return result.rows[0];
}

async function currentRound(client, room) {
  if (!room.current_round_id) return null;
  const result = await client.query(
    `SELECT id, room_id, round_number, status, round_started_at, answer_deadline_at,
            answer_locked_at, trust_started_at, trust_completed_at, eligible_expert_ids, created_at
       FROM private.expert_room_rounds WHERE id = $1`, [room.current_round_id],
  );
  return result.rows[0] || null;
}

async function updateRoomState(client, room, nextState) {
  const state = assertRoomTransition(room.status, nextState);
  const result = await client.query(
    `UPDATE private.expert_verification_rooms SET status = $2, revision = revision + 1, updated_at = now()
      WHERE id = $1 RETURNING revision`, [room.id, state],
  );
  return { status: state, revision: Number(result.rows[0]?.revision || Number(room.revision) + 1) };
}

async function bumpRoomRevision(client, room) {
  const result = await client.query(
    `UPDATE private.expert_verification_rooms SET revision = revision + 1, updated_at = now()
      WHERE id = $1 RETURNING revision`, [room.id],
  );
  return { status: room.status, revision: Number(result.rows[0].revision) };
}

function dataPackageFromTrust(payload, challenge, { remoteRetrieval, trustAnalysis, persisted }) {
  const pipeline = payload?.data?.data || payload?.data || {};
  const layer3 = pipeline?.layerResults?.layer3 || pipeline?.layer3 || pipeline?.layers?.layer3 || {};
  const trustSources = Array.isArray(layer3.sources) ? layer3.sources : [];
  const sources = trustSources.slice(0, 30).map((source) => ({
    sourceId: boundedText(source.sourceId, 160),
    url: boundedText(source.url, 2048),
    title: boundedText(source.title, 240),
    publisher: boundedText(source.publisher, 180),
    sourceType: boundedText(source.sourceType, 80),
    retrievalOutcome: boundedText(source.retrievalOutcome, 80),
    providerStatus: boundedText(source.providerStatus, 80),
    liveEvidence: source.liveEvidence === true,
    retrievedAt: boundedText(source.retrievedAt, 80) || null,
  }));
  const evidenceRows = Array.isArray(layer3.evidence) ? layer3.evidence : [];
  const evidence = evidenceRows.slice(0, 80).map((item) => ({
    evidenceId: boundedText(item.evidenceId, 160),
    sourceId: boundedText(item.sourceId, 160),
    sourceUrl: boundedText(item.sourceUrl, 2048),
    sourceTitle: boundedText(item.sourceTitle, 240),
    excerpt: boundedText(item.excerpt, 400),
    relation: boundedText(item.relation, 80),
    liveEvidence: item.liveEvidence === true,
    providerStatus: boundedText(item.providerStatus, 80),
    retrievalOutcome: boundedText(item.retrievalOutcome, 80),
    retrievedAt: boundedText(item.retrievedAt, 80) || null,
  })).filter((item) => item.evidenceId);
  const claims = (Array.isArray(layer3.claims) ? layer3.claims : []).slice(0, 30).map((claim) => ({
    claimId: boundedText(claim.claimId, 160),
    text: boundedText(claim.rawText, 500),
    sourceScope: boundedText(claim.sourceScope, 100),
  }));
  const finalPredict = pipeline.finalPredict && typeof pipeline.finalPredict === "object" ? pipeline.finalPredict : {};
  const decision = finalPredict.decision && typeof finalPredict.decision === "object" ? finalPredict.decision : {};
  const uncertainty = [finalPredict.uncertainty, ...(Array.isArray(finalPredict.remainingUncertainty) ? finalPredict.remainingUncertainty : []), ...(Array.isArray(finalPredict.uncertainties) ? finalPredict.uncertainties : [])]
    .find((value) => typeof value === "string" && value.trim());
  return {
    contractVersion: "expert-room-evidence-package.v1",
    trustCaseId: payload?.caseId || payload?.caseID || null,
    trustRevision: Number.isInteger(Number(payload?.caseRevision)) ? Number(payload.caseRevision) : null,
    inputType: challenge.type.toUpperCase(),
    remoteRetrieval,
    trustAnalysis,
    trustPredictionStatus: boundedText(finalPredict.status, 80) || null,
    trustConclusion: boundedText(finalPredict.verdict || finalPredict.label || finalPredict.classification || finalPredict.truthVerdict || finalPredict.truthStatus || (typeof finalPredict.decision === "string" ? finalPredict.decision : null) || decision.label || decision.verdict || decision.truthVerdict || decision.truthStatus || decision.status || pipeline.finalAssessment?.label || pipeline.finalAssessment?.status, 180) || null,
    uncertainty: boundedText(uncertainty, 120) || null,
    claims,
    evidence,
    sources,
    sourceUrls: [...new Set(sources.map((source) => source.url).filter(Boolean))],
    limitations: Array.isArray(layer3.limitations) ? layer3.limitations.slice(0, 20).map((value) => boundedText(value, 240)) : [],
    evidenceIds: [...new Set(evidence.map((item) => item.evidenceId))],
    persistence: persisted ? "PERSISTED" : "UNAVAILABLE",
  };
}

function trustRemoteStatus(payload, challenge) {
  const pipeline = payload?.data?.data || payload?.data || {};
  const layer3 = pipeline?.layerResults?.layer3 || pipeline?.layer3 || pipeline?.layers?.layer3 || {};
  const sources = Array.isArray(layer3.sources) ? layer3.sources : [];
  const requestedUrl = challenge.content || challenge.metadata?.url;
  const candidate = sources.find((source) => (source.retrievalOrigin === "DIRECT_INPUT" || source.sourceScope === "direct_input")
    && source?.requestedUrl && sameUrl(source.requestedUrl, requestedUrl))
    || sources.find((source) => (source.retrievalOrigin === "DIRECT_INPUT" || source.sourceScope === "direct_input") && sameUrl(source.url, requestedUrl));
  return classifyRoomTrustRetrieval({
    inputType: challenge.type,
    directSource: candidate,
    fallbackStatus: layer3.retrievalStatus,
    httpStatus: payload?.httpStatus,
  });
}

function sameUrl(left, right) {
  try {
    const a = new URL(left); const b = new URL(right);
    a.hash = ""; b.hash = "";
    return a.protocol === "https:" && b.protocol === "https:" && a.hostname.toLowerCase() === b.hostname.toLowerCase()
      && a.pathname.replace(/\/$/, "") === b.pathname.replace(/\/$/, "") && a.search === b.search;
  } catch { return false; }
}

export class ExpertVerificationRoomService {
  static async createRoom({ principal, domainCode, inputType, content, metadata, idempotencyKey }) {
    const hostId = authenticatedUserId(principal);
    const domain = boundedText(domainCode, 80).toUpperCase();
    if (!/^[A-Z][A-Z0-9_:-]{1,79}$/.test(domain)) throw roomError("EXPERT_ROOM_DOMAIN_INVALID", "Choose a supported verification domain.", 400);
    const challenge = normalizeChallenge({ inputType, content, metadata });
    if (challenge.type === "url") {
      const publicTarget = await validateRemoteUrl(challenge.metadata.url, { resolveDns: true });
      if (!publicTarget.ok) throw roomError("EXPERT_ROOM_URL_BLOCKED", "The URL failed safe public address checks and was not submitted to Trust.", 422);
      challenge.metadata.url = publicTarget.url;
      challenge.content = publicTarget.url;
    }
    const key = boundedText(idempotencyKey, 160);
    if (!/^[A-Za-z0-9._:-]{1,160}$/.test(key)) throw roomError("EXPERT_ROOM_IDEMPOTENCY_REQUIRED", "A valid Idempotency-Key is required to create a room.", 400);
    const requestHash = digest({ domain, challenge });
    const existing = await withStorageErrors(() => transaction(async (client) => {
      const replay = await client.query(
        `SELECT id, host_user_id, request_hash FROM private.expert_verification_rooms WHERE idempotency_key = $1`, [key],
      );
      if (replay.rows[0]) {
        if (String(replay.rows[0].host_user_id) !== hostId || replay.rows[0].request_hash !== requestHash) {
          throw roomError("EXPERT_ROOM_IDEMPOTENCY_CONFLICT", "This Idempotency-Key is already bound to a different room request.", 409);
        }
        return replay.rows[0].id;
      }
      return null;
    }));
    if (existing) return { ...(await this.getRoom({ principal, roomId: existing })), idempotent: true };

    let uploadedArtifact = null;
    const hasImageBytes = Boolean(challenge.metadata.bytes || challenge.content.startsWith("data:image/"));
    if (["image", "qr"].includes(challenge.type) && hasImageBytes) {
      if (challenge.metadata.mediaArtifactId) throw roomError("EXPERT_ROOM_MEDIA_REFERENCE_UNTRUSTED", "A room must ingest selected media through the canonical upload path.", 422);
      const rawBytes = challenge.metadata.bytes || challenge.content;
      const upload = await MediaArtifactService.ingestImage({
        bytes: Array.isArray(rawBytes) ? Uint8Array.from(rawBytes) : rawBytes,
        claimedMimeType: challenge.metadata.mimeType || "",
        ownerUserId: hostId,
        requireDurableStorage: true,
      });
      if (!upload.ok) {
        const status = upload.error?.statusCode || (upload.error?.code === "FILE_OVERSIZED" ? 413 : 422);
        throw roomError(upload.error?.code || "EXPERT_ROOM_MEDIA_UPLOAD_FAILED", upload.error?.message || "Room media could not be stored.", status);
      }
      uploadedArtifact = upload.artifact;
      challenge.metadata.mediaArtifactId = upload.artifact.mediaArtifactId;
      challenge.metadata.imageHash = upload.artifact.sha256;
      challenge.metadata.mimeType = upload.artifact.mimeType;
      challenge.metadata.width = upload.artifact.width;
      challenge.metadata.height = upload.artifact.height;
      challenge.metadata.fileSize = upload.artifact.byteSize;
      delete challenge.metadata.bytes;
      if (challenge.type === "qr") {
        delete challenge.metadata.qrContent;
        delete challenge.metadata.qrPayload;
      }
      challenge.content = "";
    } else if (["image", "qr"].includes(challenge.type) && challenge.metadata.mediaArtifactId) {
      throw roomError("EXPERT_ROOM_MEDIA_REFERENCE_UNTRUSTED", "A room must ingest selected media through the canonical upload path.", 422);
    }

    let created;
    try {
      created = await withStorageErrors(() => transaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [key]);
      const replay = await client.query(
        `SELECT id, host_user_id, request_hash FROM private.expert_verification_rooms WHERE idempotency_key = $1`, [key],
      );
      if (replay.rows[0]) {
        if (String(replay.rows[0].host_user_id) !== hostId || replay.rows[0].request_hash !== requestHash) {
          throw roomError("EXPERT_ROOM_IDEMPOTENCY_CONFLICT", "This Idempotency-Key is already bound to a different room request.", 409);
        }
        return { roomId: replay.rows[0].id, replay: true, recipients: [hostId] };
      }
      if (uploadedArtifact) await MediaArtifactService.lockRoomArtifact({
        mediaArtifactId: uploadedArtifact.mediaArtifactId,
        ownerUserId: hostId,
        expectedSha256: uploadedArtifact.sha256,
        client,
      });
      const roomId = randomUUID();
      await client.query(
        `INSERT INTO private.expert_verification_rooms
          (id, host_user_id, domain_code, input_type, challenge_payload, status,
           idempotency_key, request_hash)
         VALUES ($1,$2,$3,$4,$5::jsonb,'WAITING_FOR_SUPERVISOR',$6,$7)`,
        [roomId, hostId, domain, challenge.type.toUpperCase(), JSON.stringify(challenge), key, requestHash],
      );
      await addParticipant(client, { roomId, userId: hostId, role: "HOST" });
      const supervisor = await selectSupervisor(client, { domainCode: domain, hostId, roomId });
      if (supervisor) {
        const offerSeconds = await roomSetting(client, "room_supervisor_offer_seconds", 90, 30, 600);
        await client.query(
          `UPDATE private.expert_verification_rooms
              SET supervisor_user_id = $2, supervisor_offer_expires_at = now() + ($3::text || ' seconds')::interval, revision = revision + 1, updated_at = now()
            WHERE id = $1`, [roomId, supervisor.userId, offerSeconds],
        );
        await appendRoomEvent(client, {
          roomId, actorId: hostId, eventType: "SUPERVISOR_OFFERED",
          payload: { domainCode: domain }, idempotencyKey: `room-supervisor-offered:${roomId}:${supervisor.userId}`,
        });
      }
      await appendRoomEvent(client, {
        roomId, actorId: hostId, eventType: "ROOM_CREATED",
        payload: { inputType: challenge.type.toUpperCase(), domainCode: domain }, idempotencyKey: `room-created:${roomId}`,
      });
      return { roomId, replay: false, revision: supervisor ? 2 : 1, recipients: [hostId, ...(supervisor ? [supervisor.userId] : [])] };
      }));
    } catch (error) {
      if (uploadedArtifact) {
        try {
          const cleanup = await MediaArtifactService.cleanupUnreferencedArtifact({ mediaArtifactId: uploadedArtifact.mediaArtifactId, ownerUserId: hostId });
          if (!cleanup.ok) throw new Error("cleanup rejected");
        } catch {
          throw roomError("EXPERT_ROOM_MEDIA_CLEANUP_FAILED", "The room request failed and its unreferenced media could not be safely cleaned up.", 503);
        }
      }
      throw error;
    }
    if (created.replay && uploadedArtifact) {
      const cleanup = await MediaArtifactService.cleanupUnreferencedArtifact({ mediaArtifactId: uploadedArtifact.mediaArtifactId, ownerUserId: hostId });
      if (!cleanup.ok) throw roomError("EXPERT_ROOM_MEDIA_CLEANUP_FAILED", "A duplicate room upload could not be safely cleaned up.", 503);
    }
    if (!created.replay) await publishRoomRevision(created.roomId, created.revision, "WAITING_FOR_SUPERVISOR", created.recipients);
    return { ...(await this.getRoom({ principal, roomId: created.roomId })), idempotent: created.replay };
  }

  // Presence renewal also discovers rooms created before any eligible Expert
  // was online. Lock the durable room, never manufacture a participant or COI.
  static async offerWaitingSupervisors({ principal }) {
    const userId = authenticatedUserId(principal);
    const offers = await withStorageErrors(() => transaction(async (client) => {
      const waiting = await client.query(
        `SELECT r.id, r.host_user_id, r.domain_code, r.revision, r.status
           FROM private.expert_verification_rooms r
          WHERE r.status = 'WAITING_FOR_SUPERVISOR' AND r.host_user_id <> $1
            AND (r.supervisor_user_id IS NULL OR r.supervisor_offer_expires_at IS NULL OR r.supervisor_offer_expires_at <= now())
            AND EXISTS (
              SELECT 1 FROM private.expert_room_presence p
              JOIN private.expert_verifications v ON v.user_id = p.user_id
               WHERE p.user_id = $1 AND p.expires_at > now() AND upper(v.domain_code) = upper(r.domain_code)
                 AND v.status = 'VERIFIED' AND v.qualification_state = 'DOMAIN_VERIFIED'
                 AND v.suspended_at IS NULL AND (v.expires_at IS NULL OR v.expires_at > now())
            )
            AND NOT EXISTS (SELECT 1 FROM private.expert_room_participants p WHERE p.room_id = r.id AND p.user_id = $1 AND p.state = 'JOINED')
            AND NOT EXISTS (
              SELECT 1 FROM private.expert_room_events e
               WHERE e.room_id = r.id AND e.actor_id = $1 AND e.event_type = 'SUPERVISOR_OFFERED'
                 AND (e.payload->>'declined' = 'true' OR e.payload->>'conflictDeclared' = 'true')
            )
          ORDER BY r.created_at ASC LIMIT 5 FOR UPDATE OF r SKIP LOCKED`, [userId],
      );
      const result = [];
      for (const room of waiting.rows) {
        const selected = await selectSupervisor(client, { domainCode: room.domain_code, hostId: String(room.host_user_id), roomId: room.id });
        if (!selected) continue;
        const offerSeconds = await roomSetting(client, "room_supervisor_offer_seconds", 90, 30, 600);
        const updated = await client.query(
          `UPDATE private.expert_verification_rooms
              SET supervisor_user_id = $2, supervisor_offer_expires_at = now() + ($3::text || ' seconds')::interval,
                  revision = revision + 1, updated_at = now()
            WHERE id = $1 RETURNING revision`, [room.id, selected.userId, offerSeconds],
        );
        const revision = Number(updated.rows[0].revision);
        await appendRoomEvent(client, {
          roomId: room.id, actorId: userId, eventType: "SUPERVISOR_OFFERED",
          payload: { domainCode: room.domain_code, offered: true, presenceRenewal: true },
          idempotencyKey: `room-supervisor-online:${room.id}:${revision}`,
        });
        result.push({ roomId: room.id, revision, recipients: await roomRecipients(client, room.id, [selected.userId]) });
      }
      return result;
    }));
    await Promise.all(offers.map((offer) => publishRoomRevision(offer.roomId, offer.revision, "WAITING_FOR_SUPERVISOR", offer.recipients)));
    return { offered: offers.length };
  }

  static async listRooms({ principal }) {
    const userId = authenticatedUserId(principal);
    return withStorageErrors(() => transaction(async (client) => {
      const myRooms = await client.query(
        `SELECT r.id, r.domain_code, r.input_type, r.status, r.revision, r.created_at,
                r.supervisor_user_id, r.supervisor_offer_expires_at, p.role
           FROM private.expert_verification_rooms r
           JOIN private.expert_room_participants p ON p.room_id = r.id AND p.user_id = $1
          WHERE p.state <> 'LEFT'
          UNION ALL
         SELECT r.id, r.domain_code, r.input_type, r.status, r.revision, r.created_at,
                r.supervisor_user_id, r.supervisor_offer_expires_at, 'SUPERVISOR_INVITEE' AS role
           FROM private.expert_verification_rooms r
          WHERE r.supervisor_user_id = $1 AND r.status = 'WAITING_FOR_SUPERVISOR'
            AND r.supervisor_offer_expires_at > now()
            AND EXISTS (SELECT 1 FROM private.expert_verifications v WHERE v.user_id = $1
              AND upper(v.domain_code) = upper(r.domain_code) AND v.status = 'VERIFIED' AND v.qualification_state = 'DOMAIN_VERIFIED'
              AND v.suspended_at IS NULL AND (v.expires_at IS NULL OR v.expires_at > now()))
            AND NOT EXISTS (SELECT 1 FROM private.expert_room_participants p WHERE p.room_id = r.id AND p.user_id = $1 AND p.role = 'SUPERVISOR_EXPERT')
          ORDER BY created_at DESC LIMIT 50`, [userId],
      );
      const domains = await client.query(
        `SELECT DISTINCT upper(domain_code) AS domain_code FROM private.expert_verifications
          WHERE user_id = $1 AND status = 'VERIFIED' AND qualification_state = 'DOMAIN_VERIFIED'
            AND suspended_at IS NULL AND (expires_at IS NULL OR expires_at > now())`, [userId],
      );
      const domainCodes = domains.rows.map((row) => row.domain_code);
      const supported = await client.query(
        `SELECT DISTINCT upper(domain_code) AS domain_code FROM private.expert_verifications
          WHERE status = 'VERIFIED' AND qualification_state = 'DOMAIN_VERIFIED'
            AND suspended_at IS NULL AND (expires_at IS NULL OR expires_at > now())
          ORDER BY upper(domain_code) ASC`,
      );
      const open = domainCodes.length ? await client.query(
        `SELECT id, domain_code, input_type, status, revision, created_at, supervisor_user_id
           FROM private.expert_verification_rooms
          WHERE domain_code = ANY($1::text[]) AND status = 'LOBBY' AND supervisor_user_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM private.expert_room_participants p WHERE p.room_id = id AND p.user_id = $2 AND p.state = 'JOINED')
          ORDER BY created_at DESC LIMIT 50`, [domainCodes, userId],
      ) : { rows: [] };
      const presenceLeaseSeconds = await roomSetting(client, "room_presence_lease_seconds", 45, 15, 120);
      return {
        myRooms: myRooms.rows.map((row) => roomListDto(row)),
        openRooms: open.rows.map((row) => roomListDto(row)),
        domains: domainCodes,
        supportedDomains: supported.rows.map((row) => row.domain_code),
        presenceLeaseSeconds,
      };
    }));
  }

  static async retrySupervisorOffer({ principal, roomId }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      if (String(room.host_user_id) !== userId) throw roomError("EXPERT_ROOM_HOST_REQUIRED", "Only this room's Host can request another supervisor offer.", 403);
      if (room.status !== "WAITING_FOR_SUPERVISOR") throw roomError("EXPERT_ROOM_SUPERVISOR_OFFER_CLOSED", "This room is no longer waiting for a supervisor.", 409);
      if (room.supervisor_user_id && new Date(room.supervisor_offer_expires_at || 0).getTime() > Date.now()) {
        throw roomError("EXPERT_ROOM_SUPERVISOR_OFFER_ACTIVE", "A supervisor offer is already active. Wait for the Expert to accept or decline.", 409);
      }
      const previousSupervisor = room.supervisor_user_id ? [String(room.supervisor_user_id)] : [];
      const selected = await selectSupervisor(client, { domainCode: room.domain_code, hostId: userId, roomId: id, excludedIds: previousSupervisor });
      const offerSeconds = await roomSetting(client, "room_supervisor_offer_seconds", 90, 30, 600);
      const updated = await client.query(
        `UPDATE private.expert_verification_rooms
            SET supervisor_user_id = $2,
                supervisor_offer_expires_at = CASE WHEN $2::uuid IS NULL THEN NULL ELSE now() + ($3::text || ' seconds')::interval END,
                revision = revision + 1, updated_at = now()
          WHERE id = $1 RETURNING revision`, [id, selected?.userId || null, offerSeconds],
      );
      await appendRoomEvent(client, {
        roomId: id, actorId: userId, eventType: "SUPERVISOR_OFFERED",
        payload: { retried: true, offered: Boolean(selected) },
        idempotencyKey: `room-supervisor-retry:${id}:${updated.rows[0].revision}`,
      });
      return { state: room.status, revision: Number(updated.rows[0].revision), offered: Boolean(selected), recipients: await roomRecipients(client, id, selected ? [selected.userId] : []) };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients);
    return { state: result.state, offered: result.offered, room: await this.getRoom({ principal, roomId: id }) };
  }

  static async getRoom({ principal, roomId }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const response = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id);
      const member = await memberFor(client, id, userId);
      const participants = await client.query(
        `SELECT user_id, role, state, conflict_declaration, conflict_declared_at, joined_at, last_seen_at FROM private.expert_room_participants WHERE room_id = $1 AND state <> 'LEFT' ORDER BY role, joined_at`, [id],
      );
      const round = await currentRound(client, room);
      let answerData = { submittedCount: 0, ownSubmitted: false, answers: [] };
      if (round) {
        const counts = await client.query(`SELECT count(*)::int AS submitted FROM private.expert_room_answers WHERE round_id = $1`, [round.id]);
        const own = await client.query(`SELECT response, submitted_at FROM private.expert_room_answers WHERE round_id = $1 AND expert_user_id = $2`, [round.id, userId]);
        answerData.submittedCount = Number(counts.rows[0]?.submitted || 0);
        answerData.ownSubmitted = Boolean(own.rows[0]);
        if (["ANSWER_LOCKED", "TRUST_ANALYZING", "ADJUDICATION", "SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT", "DISPUTED", "SETTLED", "CLOSED", "TRUST_UNAVAILABLE", "ADJUDICATION_BLOCKED"].includes(round.status)) {
          const answers = await client.query(
            `SELECT expert_user_id, response, answer_hash, submitted_at FROM private.expert_room_answers WHERE round_id = $1 ORDER BY submitted_at`, [round.id],
          );
          answerData.answers = answers.rows.map((row) => ({
            expertId: String(row.expert_user_id),
            response: parseJson(row.response, {}),
            answerHash: row.answer_hash,
            submittedAt: new Date(row.submitted_at).toISOString(),
          }));
        } else if (own.rows[0]) {
          answerData.answers = [{ expertId: userId, response: parseJson(own.rows[0].response, {}), submittedAt: new Date(own.rows[0].submitted_at).toISOString() }];
        }
      }
      let evidencePackage = null;
      if (room.evidence_package_id) {
        const pkg = await client.query(`SELECT package, retrieval_state, trust_analysis_state FROM private.expert_room_evidence_packages WHERE id = $1`, [room.evidence_package_id]);
        if (pkg.rows[0]) evidencePackage = { ...parseJson(pkg.rows[0].package, {}), retrievalState: pkg.rows[0].retrieval_state, trustAnalysisState: pkg.rows[0].trust_analysis_state };
      }
      const adjudications = round && ["ADJUDICATION", "SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT", "DISPUTED", "SETTLED", "CLOSED"].includes(round.status)
        ? await client.query(
          `SELECT expert_user_id, supervisor_user_id, rubric_version, rubric_ratings,
                  evidence_ids, proposed_score, reason, proposal_hash, state
             FROM private.expert_room_adjudications WHERE round_id = $1 ORDER BY created_at`, [round.id],
        ) : { rows: [] };
      const challenge = parseJson(room.challenge_payload, {});
      const safeChallenge = { ...challenge, metadata: { ...(challenge.metadata || {}) } };
      delete safeChallenge.metadata.bytes;
      if (typeof safeChallenge.content === "string" && safeChallenge.content.startsWith("data:image/")) safeChallenge.content = "";
      return {
        room: {
          roomId: room.id,
          hostId: String(room.host_user_id),
          domainCode: room.domain_code,
          inputType: room.input_type,
          challenge: safeChallenge,
          status: room.status,
          revision: Number(room.revision),
          supervisorId: room.supervisor_user_id ? String(room.supervisor_user_id) : null,
          supervisorOfferExpiresAt: room.supervisor_offer_expires_at ? new Date(room.supervisor_offer_expires_at).toISOString() : null,
          createdAt: new Date(room.created_at).toISOString(),
        },
        roundEligibility: room.status === "LOBBY" ? (await roomRoundEligibility(client, room)).eligibility : null,
        viewerRole: member.role,
        participants: participants.rows.map((row) => ({ userId: String(row.user_id), role: row.role, state: row.state, conflictDeclaration: row.conflict_declaration, conflictDeclaredAt: row.conflict_declared_at ? new Date(row.conflict_declared_at).toISOString() : null, joinedAt: new Date(row.joined_at).toISOString() })),
        round: round ? {
          roundId: round.id,
          roundNumber: Number(round.round_number),
          status: round.status,
          startedAt: round.round_started_at ? new Date(round.round_started_at).toISOString() : null,
          deadlineAt: round.answer_deadline_at ? new Date(round.answer_deadline_at).toISOString() : null,
          lockedAt: round.answer_locked_at ? new Date(round.answer_locked_at).toISOString() : null,
          eligibleExpertIds: parseJson(round.eligible_expert_ids, []),
          ...answerData,
        } : null,
        evidencePackage,
        adjudications: adjudications.rows.map((row) => ({
          expertId: String(row.expert_user_id),
          supervisorId: String(row.supervisor_user_id),
          rubricVersion: row.rubric_version,
          rubricRatings: parseJson(row.rubric_ratings, {}),
          evidenceIds: parseJson(row.evidence_ids, []),
          proposedScore: Number(row.proposed_score),
          reason: row.reason,
          proposalHash: row.proposal_hash,
          state: row.state,
        })),
      };
    }));
    const mediaArtifactId = response.room.challenge?.metadata?.mediaArtifactId;
    if (mediaArtifactId) {
      const signed = await MediaArtifactService.createSignedReadUrl(mediaArtifactId, { requesterUserId: userId, roomId: id });
      if (!signed.ok) throw roomError(signed.error?.code || "EXPERT_ROOM_MEDIA_READ_UNAVAILABLE", signed.error?.message || "Room media could not be resolved.", signed.error?.statusCode || 503);
      response.room.challenge.metadata.mediaUrl = signed.url;
      response.room.challenge.metadata.mediaUrlExpiresIn = signed.expiresIn;
    }
    return response;
  }

  static async acceptSupervisor({ principal, roomId, accept = true, conflictFree = false }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      if (room.status !== "WAITING_FOR_SUPERVISOR" || String(room.supervisor_user_id) !== userId) {
        throw roomError("EXPERT_ROOM_SUPERVISOR_OFFER_NOT_FOUND", "No current supervisor offer is assigned to this account.", 403);
      }
      if (new Date(room.supervisor_offer_expires_at || 0).getTime() <= Date.now()) {
        const selected = await selectSupervisor(client, { domainCode: room.domain_code, hostId: room.host_user_id, roomId: room.id, excludedIds: [userId] });
        const offerSeconds = await roomSetting(client, "room_supervisor_offer_seconds", 90, 30, 600);
        await client.query(
          `UPDATE private.expert_verification_rooms SET supervisor_user_id = $2,
             supervisor_offer_expires_at = CASE WHEN $2::uuid IS NULL THEN NULL ELSE now() + ($3::text || ' seconds')::interval END,
             revision = revision + 1, updated_at = now() WHERE id = $1`, [id, selected?.userId || null, offerSeconds],
        );
        return { state: "WAITING_FOR_SUPERVISOR", revision: Number(room.revision) + 1, accepted: false, recipients: await roomRecipients(client, id, selected ? [selected.userId] : []) };
      }
      const eligible = await client.query(
        `SELECT 1 FROM private.expert_room_presence p JOIN private.expert_verifications v ON v.user_id = p.user_id
          WHERE p.user_id = $1 AND p.expires_at > now() AND upper(v.domain_code) = upper($2)
            AND v.status = 'VERIFIED' AND v.qualification_state = 'DOMAIN_VERIFIED'
            AND v.suspended_at IS NULL AND (v.expires_at IS NULL OR v.expires_at > now())`, [userId, room.domain_code],
      );
      if (!eligible.rows[0]) throw roomError("EXPERT_ROOM_SUPERVISOR_NO_LONGER_ELIGIBLE", "This supervisor offer expired or the Expert is no longer online and verified.", 409);
      if (!accept || conflictFree !== true) {
        const candidates = await findOnlineSupervisors(client, { domainCode: room.domain_code, hostId: room.host_user_id, roomId: id, excludedIds: [userId] });
        const next = selectIndependentSupervisor({ candidates, hostId: room.host_user_id, participantIds: [userId], domainCode: room.domain_code });
        const offerSeconds = await roomSetting(client, "room_supervisor_offer_seconds", 90, 30, 600);
        await client.query(
          `UPDATE private.expert_verification_rooms SET supervisor_user_id = $2,
             supervisor_offer_expires_at = CASE WHEN $2::uuid IS NULL THEN NULL ELSE now() + ($3::text || ' seconds')::interval END,
             revision = revision + 1, updated_at = now() WHERE id = $1`, [id, next?.userId || null, offerSeconds],
        );
        await appendRoomEvent(client, { roomId: id, actorId: userId, eventType: "SUPERVISOR_OFFERED", payload: { declined: accept !== true, conflictDeclared: accept === true && conflictFree !== true }, idempotencyKey: `room-supervisor-declined:${id}:${userId}` });
        return { state: "WAITING_FOR_SUPERVISOR", revision: Number(room.revision) + 1, accepted: false, recipients: await roomRecipients(client, id, next ? [next.userId] : []) };
      }
      await addParticipant(client, { roomId: id, userId, role: "SUPERVISOR_EXPERT", conflictDeclaration: "NO_KNOWN_CONFLICT" });
      const updated = await updateRoomState(client, room, "LOBBY");
      await appendRoomEvent(client, { roomId: id, actorId: userId, eventType: "SUPERVISOR_ACCEPTED", payload: {}, idempotencyKey: `room-supervisor-accepted:${id}:${userId}` });
      return { state: updated.status, revision: updated.revision, accepted: true, recipients: await roomRecipients(client, id) };
    }));
    await publishRoomRevision(id, result.revision || Date.now(), result.state, result.recipients);
    return result.accepted === false ? { state: result.state, supervisorAccepted: false } : this.getRoom({ principal, roomId: id });
  }

  static async joinRoom({ principal, roomId }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const memberResult = await client.query(`SELECT role, state FROM private.expert_room_participants WHERE room_id = $1 AND user_id = $2`, [id, userId]);
      if (String(room.host_user_id) === userId) throw roomError("EXPERT_ROOM_HOST_CANNOT_JOIN", "The Host is not an Expert participant.", 409);
      if (String(room.supervisor_user_id || "") === userId) throw roomError("EXPERT_ROOM_SUPERVISOR_MUST_ACCEPT", "Accept the independent supervisor offer to enter this room.", 409);
      if (room.status !== "LOBBY") throw roomError("EXPERT_ROOM_LATE_JOIN_DENIED", "Experts can join before the question is revealed.", 409);
      const verified = await client.query(
        `SELECT 1 FROM private.expert_verifications
          WHERE user_id = $1 AND upper(domain_code) = upper($2) AND status = 'VERIFIED'
            AND qualification_state = 'DOMAIN_VERIFIED' AND suspended_at IS NULL
            AND (expires_at IS NULL OR expires_at > now()) LIMIT 1`, [userId, room.domain_code],
      );
      if (!verified.rows[0]) throw roomError("EXPERT_ROOM_DOMAIN_INELIGIBLE", "An active verified Expert scope matching this room is required.", 403);
      const count = await client.query(
        `SELECT count(*)::int AS count FROM private.expert_room_participants
          WHERE room_id = $1 AND role = 'PARTICIPANT_EXPERT' AND state = 'JOINED'`, [id],
      );
      const wasMember = memberResult.rows[0]?.role === "PARTICIPANT_EXPERT" && memberResult.rows[0]?.state === "JOINED";
      const participantLimit = await roomSetting(client, "room_participant_limit", MAX_ROOM_PARTICIPANTS, 1, 30);
      if (!wasMember && Number(count.rows[0]?.count || 0) >= participantLimit) throw roomError("EXPERT_ROOM_PARTICIPANT_LIMIT", "This room has reached its participant limit.", 409);
      await addParticipant(client, { roomId: id, userId, role: "PARTICIPANT_EXPERT" });
      await appendRoomEvent(client, { roomId: id, actorId: userId, eventType: "PARTICIPANT_JOINED", payload: { participantRole: "PARTICIPANT_EXPERT" }, idempotencyKey: `room-joined:${id}:${userId}` });
      const revision = wasMember ? Number(room.revision) : (await bumpRoomRevision(client, room)).revision;
      const recipients = await roomRecipients(client, id);
      return { revision, status: room.status, recipients };
    }));
    await publishRoomRevision(id, result.revision, result.status, result.recipients);
    return this.getRoom({ principal, roomId: id });
  }

  static async startRound({ principal, roomId }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      if (String(room.host_user_id) !== userId) throw roomError("EXPERT_ROOM_HOST_REQUIRED", "Only this room's Host can start a round.", 403);
      if (room.status !== "LOBBY") throw roomError("EXPERT_ROOM_NOT_READY", "The room is not ready for a question round.", 409);
      const { eligibility, answerExpertIds: experts } = await roomRoundEligibility(client, room);
      if (!eligibility.supervisorEligible) throw roomError("EXPERT_ROOM_SUPERVISOR_REQUIRED", "Supervisor cần online, có scope đã xác minh và khai báo không có xung đột trước khi bắt đầu.", 409);
      if (!experts.length) throw roomError("EXPERT_ROOM_EXPERT_REQUIRED", "Supervisor đã nhận vai trò giám sát. Cần thêm một Expert đúng scope tham gia để trả lời độc lập.", 409);
      const previous = await client.query(`SELECT COALESCE(max(round_number),0)::int AS last_round FROM private.expert_room_rounds WHERE room_id = $1`, [id]);
      if (Number(previous.rows[0]?.last_round || 0) > 0) throw roomError("EXPERT_ROOM_ROUND_ALREADY_USED", "V5 rooms currently accept one scored round; create a new room for another challenge.", 409);
      const answerSeconds = await roomSetting(client, "room_answer_seconds", 30, 10, 300);
      const roundId = randomUUID();
      const inserted = await client.query(
        `INSERT INTO private.expert_room_rounds
          (id, room_id, round_number, status, round_started_at, answer_deadline_at, eligible_expert_ids)
         VALUES ($1,$2,1,'QUESTION_ACTIVE',now(),now() + ($4::text || ' seconds')::interval,$3::jsonb)
         RETURNING round_started_at, answer_deadline_at`, [roundId, id, JSON.stringify(experts), answerSeconds],
      );
      const updated = await updateRoomState(client, room, "QUESTION_ACTIVE");
      await client.query(`UPDATE private.expert_verification_rooms SET current_round_id = $2 WHERE id = $1`, [id, roundId]);
      await appendRoomEvent(client, { roomId: id, roundId, actorId: userId, eventType: "ROUND_STARTED", payload: { durationSeconds: answerSeconds, participantCount: experts.length }, idempotencyKey: `room-round-started:${roundId}` });
      return { roundId, startedAt: new Date(inserted.rows[0].round_started_at).toISOString(), deadlineAt: new Date(inserted.rows[0].answer_deadline_at).toISOString(), state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id) };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients, result.roundId);
    return this.getRoom({ principal, roomId: id });
  }

  static async submitAnswer({ principal, roomId, response }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const answerText = boundedText(response, 2_000);
    if (answerText.length < 1) throw roomError("EXPERT_ROOM_ANSWER_REQUIRED", "Submit an answer before the deadline.", 400);
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const member = await memberFor(client, id, userId);
      if (member.role !== "PARTICIPANT_EXPERT") throw roomError("EXPERT_ROOM_PARTICIPANT_REQUIRED", "Only a room participant Expert can submit an answer.", 403);
      if (room.status !== "QUESTION_ACTIVE" || !room.current_round_id) throw roomError("EXPERT_ROOM_ANSWER_WINDOW_CLOSED", "The server has locked this answer window.", 409);
      const round = await currentRound(client, room);
      const eligibleIds = parseJson(round?.eligible_expert_ids, []);
      if (!eligibleIds.includes(userId)) throw roomError("EXPERT_ROOM_ANSWER_NOT_ELIGIBLE", "This Expert joined after the round began.", 403);
      const accepts = await client.query(`SELECT now() <= $1::timestamptz AS accepted`, [round.answer_deadline_at]);
      if (!accepts.rows[0]?.accepted) {
        await client.query(`UPDATE private.expert_room_rounds SET status = 'ANSWER_LOCKED', answer_locked_at = now() WHERE id = $1 AND status = 'QUESTION_ACTIVE'`, [round.id]);
        const updated = await updateRoomState(client, room, "ANSWER_LOCKED");
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: userId, eventType: "ANSWERS_LOCKED", payload: { reason: "DEADLINE_REACHED" }, idempotencyKey: `room-answers-locked:${round.id}` });
        return { late: true, shouldAnalyze: true, roundId: round.id, state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id) };
      }
      const answer = { text: answerText };
      const answerHash = digest(answer);
      const saved = await client.query(
        `INSERT INTO private.expert_room_answers(round_id, room_id, expert_user_id, response, answer_hash)
         VALUES ($1,$2,$3,$4::jsonb,$5) ON CONFLICT (round_id, expert_user_id) DO NOTHING
         RETURNING answer_hash`, [round.id, id, userId, JSON.stringify(answer), answerHash],
      );
      if (!saved.rows[0]) {
        const previous = await client.query(`SELECT answer_hash FROM private.expert_room_answers WHERE round_id = $1 AND expert_user_id = $2`, [round.id, userId]);
        if (previous.rows[0]?.answer_hash !== answerHash) throw roomError("EXPERT_ROOM_ANSWER_LOCKED", "Your submitted answer is immutable.", 409);
      } else {
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: userId, eventType: "ANSWER_SUBMITTED", payload: { expertId: userId, answerHash }, idempotencyKey: `room-answer:${round.id}:${userId}` });
      }
      const count = await client.query(`SELECT count(*)::int AS submitted FROM private.expert_room_answers WHERE round_id = $1`, [round.id]);
      const allSubmitted = Number(count.rows[0]?.submitted || 0) >= eligibleIds.length;
      if (allSubmitted) {
        await client.query(`UPDATE private.expert_room_rounds SET status = 'ANSWER_LOCKED', answer_locked_at = now() WHERE id = $1 AND status = 'QUESTION_ACTIVE'`, [round.id]);
        const updated = await updateRoomState(client, room, "ANSWER_LOCKED");
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: userId, eventType: "ANSWERS_LOCKED", payload: { reason: "ALL_ANSWERS_SUBMITTED" }, idempotencyKey: `room-answers-locked:${round.id}` });
        return { late: false, shouldAnalyze: true, roundId: round.id, allSubmitted, state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id) };
      }
      const revision = saved.rows[0] ? (await bumpRoomRevision(client, room)).revision : Number(room.revision);
      return { late: false, shouldAnalyze: false, roundId: round.id, allSubmitted: false, revision, state: room.status, recipients: await roomRecipients(client, id) };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients, result.roundId);
    return { ...result, room: await this.getRoom({ principal, roomId: id }) };
  }

  static async lockAndAnalyze({ principal, request, securityContext, roomId }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const locked = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const member = await memberFor(client, id, userId);
      if (!new Set(["HOST", "SUPERVISOR_EXPERT"]).has(member.role)) throw roomError("EXPERT_ROOM_LOCK_ROLE_REQUIRED", "Only the Host or assigned supervisor may lock the round.", 403);
      const round = await currentRound(client, room);
      if (!round) throw roomError("EXPERT_ROOM_ROUND_NOT_FOUND", "There is no active round to lock.", 409);
      if (room.status === "QUESTION_ACTIVE") {
        const count = await client.query(`SELECT count(*)::int AS submitted FROM private.expert_room_answers WHERE round_id = $1`, [round.id]);
        const eligible = parseJson(round.eligible_expert_ids, []);
        const deadlinePassed = await client.query(`SELECT now() >= $1::timestamptz AS passed`, [round.answer_deadline_at]);
        if (Number(count.rows[0]?.submitted || 0) < eligible.length && deadlinePassed.rows[0]?.passed !== true) {
          throw roomError("EXPERT_ROOM_DEADLINE_ACTIVE", "The answer window is still open; wait for the server deadline or all submitted answers.", 409);
        }
        await client.query(`UPDATE private.expert_room_rounds SET status = 'ANSWER_LOCKED', answer_locked_at = now() WHERE id = $1`, [round.id]);
        const updated = await updateRoomState(client, room, "ANSWER_LOCKED");
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: userId, eventType: "ANSWERS_LOCKED", payload: { reason: "SERVER_DEADLINE_OR_ALL_SUBMITTED" }, idempotencyKey: `room-answers-locked:${round.id}` });
        return { room, round: { ...round, status: "ANSWER_LOCKED" }, revision: updated.revision };
      }
      if (["ANSWER_LOCKED", "TRUST_ANALYZING"].includes(room.status)) return { room, round, revision: Number(room.revision) };
      throw roomError("EXPERT_ROOM_NOT_READY_FOR_TRUST", "The room is not at the answer lock stage.", 409);
    }));
    await publishRoomRevision(id, locked.revision, "ANSWER_LOCKED", await this.#recipients(id), locked.round.id);
    const challenge = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const round = await currentRound(client, room);
      if (room.status === "TRUST_ANALYZING") return { room, round, challenge: parseJson(room.challenge_payload, {}) };
      if (room.status !== "ANSWER_LOCKED") throw roomError("EXPERT_ROOM_NOT_READY_FOR_TRUST", "The answer lock was not committed.", 409);
      await client.query(`UPDATE private.expert_room_rounds SET status = 'TRUST_ANALYZING', trust_started_at = COALESCE(trust_started_at, now()) WHERE id = $1`, [round.id]);
      const updated = await updateRoomState(client, room, "TRUST_ANALYZING");
      await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: userId, eventType: "TRUST_STARTED", payload: { roundId: round.id }, idempotencyKey: `room-trust-started:${round.id}` });
      return { room: { ...room, status: updated.status, revision: updated.revision }, round: { ...round, status: "TRUST_ANALYZING" }, challenge: parseJson(room.challenge_payload, {}) };
    }));
    if (challenge.room.status !== "TRUST_ANALYZING") throw roomError("EXPERT_ROOM_TRUST_STATE_INVALID", "Trust processing could not start from the committed room state.", 409);

    // Publish the committed in-progress state before the canonical Trust call.
    // This lets the Host and assigned Supervisor see the same running phase,
    // even when the analysis outlasts their initiating HTTP request.
    await publishRoomRevision(
      id,
      challenge.room.revision,
      "TRUST_ANALYZING",
      await this.#recipients(id),
      challenge.round.id,
    );

    let trustPayload = null;
    let trustHttpStatus = 503;
    try {
      const { runCanonicalTrust } = await import("@/app/api/v1/trust/route.js");
      const trustRequest = new Request(new URL("/api/v1/trust", request.url), {
        method: "POST",
        headers: { "content-type": "application/json", "Idempotency-Key": `expert-v5-room:${id}:${challenge.round.id}` },
        body: JSON.stringify({ ...challenge.challenge, roomId: id, version: "v5" }),
        signal: request.signal,
      });
      const response = await runCanonicalTrust(trustRequest, null, principal, securityContext);
      trustHttpStatus = response.status;
      trustPayload = await response.json();
    } catch (caught) {
      trustPayload = { success: false, error: { code: caught?.code || "TRUST_PIPELINE_UNAVAILABLE" } };
    }
    const completed = await this.completeTrust({ principal, roomId: id, roundId: challenge.round.id, payload: trustPayload, httpStatus: trustHttpStatus });
    return { ...completed, lateAnswerAccepted: false };
  }

  static async completeTrust({ principal, roomId, roundId, payload, httpStatus }) {
    const actorId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const rid = normalizeUuid(roundId, "roundId");
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const member = await memberFor(client, id, actorId);
      if (!new Set(["HOST", "SUPERVISOR_EXPERT"]).has(member.role)) throw roomError("EXPERT_ROOM_TRUST_ROLE_REQUIRED", "Only the Host or Supervisor can complete room Trust processing.", 403);
      if (room.evidence_package_id) return { roomId: id, roundId: rid, status: room.status, revision: Number(room.revision), recipients: await roomRecipients(client, id) };
      if (String(room.current_round_id) !== rid || room.status !== "TRUST_ANALYZING") throw roomError("EXPERT_ROOM_TRUST_STATE_INVALID", "This room round is not waiting for Trust output.", 409);
      const challenge = parseJson(room.challenge_payload, {});
      const remote = trustRemoteStatus(payload, challenge);
      const persisted = payload?.persistence?.persisted === true && Boolean(payload?.caseId);
      const packageBody = dataPackageFromTrust(payload, challenge, { ...remote, persisted });
      const mediaArtifactId = boundedText(challenge.metadata?.mediaArtifactId, 80);
      const mediaSha256 = boundedText(challenge.metadata?.imageHash, 64).toLowerCase();
      if (mediaArtifactId) {
        if (!/^[a-f0-9]{64}$/.test(mediaSha256)) throw roomError("EXPERT_ROOM_MEDIA_PROVENANCE_INVALID", "The room media digest is missing or invalid.", 409);
        let linkedToTrustCase = false;
        if (persisted) {
          try {
            await MediaArtifactService.linkToTrustCase({
              mediaArtifactId,
              ownerUserId: String(room.host_user_id),
              caseId: String(payload.caseId),
              expectedSha256: mediaSha256,
              client,
            });
            linkedToTrustCase = true;
          } catch {
            throw roomError("EXPERT_ROOM_MEDIA_PROVENANCE_CONFLICT", "The stored Room media does not match the persisted Trust case.", 409);
          }
        }
        packageBody.inputProvenance = {
          mediaArtifactId,
          sha256: mediaSha256,
          mimeType: boundedText(challenge.metadata?.mimeType, 80),
          byteSize: Number.isFinite(Number(challenge.metadata?.fileSize)) ? Number(challenge.metadata.fileSize) : null,
          trustCaseId: persisted ? String(payload.caseId) : null,
          storageLink: linkedToTrustCase ? "LINKED" : "UNLINKED",
        };
      }
      const hasEvidence = packageBody.evidenceIds.length > 0;
      const blocked = remote.remoteRetrieval === "BLOCKED";
      const urlRetrievalUnavailable = challenge.type === "url" && remote.remoteRetrieval !== "SUCCESS";
      const unavailable = !payload?.success || !persisted || httpStatus >= 500 || [401, 403, 402, 429].includes(Number(httpStatus)) || urlRetrievalUnavailable;
      const state = unavailable ? "TRUST_UNAVAILABLE" : blocked ? "TRUST_UNAVAILABLE" : hasEvidence ? "ADJUDICATION" : "ADJUDICATION_BLOCKED";
      const trustAnalysisState = blocked || unavailable ? "N/A" : hasEvidence ? "COMPLETE" : "PARTIAL";
      packageBody.remoteRetrieval = remote.remoteRetrieval;
      packageBody.trustAnalysis = trustAnalysisState;
      packageBody.persistence = persisted ? "PERSISTED" : "UNAVAILABLE";
      const packageHash = digest(packageBody);
      const inserted = await client.query(
        `INSERT INTO private.expert_room_evidence_packages
          (room_id, round_id, trust_case_id, trust_revision, retrieval_state, trust_analysis_state, package, package_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
         ON CONFLICT (round_id) DO NOTHING
         RETURNING id`,
        [id, rid, persisted ? payload.caseId : null, persisted ? payload.caseRevision : null,
          blocked ? "BLOCKED" : remote.remoteRetrieval === "SUCCESS" ? "SUCCESS" : remote.remoteRetrieval === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "UNAVAILABLE",
          trustAnalysisState, JSON.stringify(packageBody), packageHash],
      );
      let packageId = inserted.rows[0]?.id;
      if (!packageId) {
        const existing = await client.query(`SELECT id FROM private.expert_room_evidence_packages WHERE round_id = $1`, [rid]);
        packageId = existing.rows[0]?.id;
      }
      const updated = await updateRoomState(client, room, state);
      await client.query(
        `UPDATE private.expert_room_rounds SET status = $2, trust_completed_at = now() WHERE id = $1`, [rid, state],
      );
      await client.query(
        `UPDATE private.expert_verification_rooms SET evidence_package_id = $2,
          trust_case_id = $3, trust_revision = $4 WHERE id = $1`,
        [id, packageId, persisted ? payload.caseId : null, persisted ? payload.caseRevision : null],
      );
      await appendRoomEvent(client, {
        roomId: id, roundId: rid, actorId,
        eventType: blocked || unavailable ? "TRUST_BLOCKED" : "TRUST_COMPLETED",
        payload: { remoteRetrieval: remote.remoteRetrieval, trustAnalysis: trustAnalysisState, evidenceCount: packageBody.evidenceIds.length, packageHash },
        idempotencyKey: `room-trust-completed:${rid}`,
      });
      return { roomId: id, roundId: rid, status: updated.status, revision: updated.revision, packageHash, remoteRetrieval: remote.remoteRetrieval, trustAnalysis: trustAnalysisState, recipients: await roomRecipients(client, id) };
    }));
    await publishRoomRevision(id, result.revision, result.status, result.recipients, rid);
    return { ...result, room: await this.getRoom({ principal, roomId: id }) };
  }

  static async proposeScore({ principal, roomId, expertId, ratings, evidenceIds, reason }) {
    const supervisorId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const scoredExpertId = normalizeUuid(expertId, "expertId");
    const justification = boundedText(reason, 4_000);
    if (justification.length < 20) throw roomError("EXPERT_ROOM_RUBRIC_REASON_REQUIRED", "Add a short evidence-based rationale for the rubric ratings.", 400);
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const member = await memberFor(client, id, supervisorId);
      if (member.role !== "SUPERVISOR_EXPERT" || member.conflict_declaration !== "NO_KNOWN_CONFLICT" || String(room.supervisor_user_id) !== supervisorId) throw roomError("EXPERT_ROOM_SUPERVISOR_REQUIRED", "Only the independently assigned, conflict-declaring Supervisor can propose a score.", 403);
      if (!["ADJUDICATION", "SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT"].includes(room.status) || !room.evidence_package_id) throw roomError("EXPERT_ROOM_ADJUDICATION_BLOCKED", "The room has no evidence package available for adjudication.", 409);
      const round = await currentRound(client, room);
      const targetAnswer = await client.query(`SELECT answer_hash FROM private.expert_room_answers WHERE round_id = $1 AND expert_user_id = $2`, [round.id, scoredExpertId]);
      if (!targetAnswer.rows[0]) throw roomError("EXPERT_ROOM_ANSWER_NOT_FOUND", "This Expert did not submit an answer in the locked round.", 404);
      const pkg = await client.query(`SELECT package FROM private.expert_room_evidence_packages WHERE id = $1`, [room.evidence_package_id]);
      const packageBody = parseJson(pkg.rows[0]?.package, {});
      const available = Array.isArray(packageBody.evidenceIds) ? packageBody.evidenceIds.map(String) : [];
      const requestedEvidence = Array.isArray(evidenceIds) ? [...new Set(evidenceIds.map((value) => boundedText(value, 160)).filter(Boolean))] : [];
      if (!requestedEvidence.length || requestedEvidence.some((value) => !available.includes(value))) throw roomError("EXPERT_ROOM_EVIDENCE_REF_INVALID", "Every score proposal must cite evidence IDs from this Trust package.", 400);
      const proposal = proposeEvidenceRubricScore({ ratings, evidenceIds: requestedEvidence, availableEvidenceIds: available });
      if (!proposal.valid) throw roomError(proposal.code, "A complete supported rubric and evidence reference are required.", 400);
      const proposalBody = { roomId: id, roundId: round.id, expertId: scoredExpertId, answerHash: targetAnswer.rows[0].answer_hash, supervisorId, rubricVersion: proposal.rubricVersion, ratings, evidenceIds: proposal.evidenceIds, score: proposal.score, reason: justification };
      const proposalHash = digest(proposalBody);
      const saved = await client.query(
        `INSERT INTO private.expert_room_adjudications
          (room_id, round_id, expert_user_id, supervisor_user_id, rubric_version,
           rubric_ratings, evidence_ids, proposed_score, reason, proposal_hash, state)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,'PROPOSED')
         ON CONFLICT (round_id, expert_user_id) DO NOTHING
         RETURNING id`,
        [id, round.id, scoredExpertId, supervisorId, proposal.rubricVersion, JSON.stringify(ratings), JSON.stringify(proposal.evidenceIds), proposal.score, justification, proposalHash],
      );
      if (!saved.rows[0]) throw roomError("EXPERT_ROOM_SCORE_ALREADY_PROPOSED", "A score proposal already exists for this Expert and round.", 409);
      const updated = room.status === "ADJUDICATION" ? await updateRoomState(client, room, "SUPERVISOR_CONFIRMATION") : await bumpRoomRevision(client, room);
      if (room.status === "ADJUDICATION") await client.query(`UPDATE private.expert_room_rounds SET status = 'SUPERVISOR_CONFIRMATION' WHERE id = $1`, [round.id]);
      await appendRoomEvent(client, {
        roomId: id, roundId: round.id, actorId: supervisorId, eventType: "ADJUDICATION_PROPOSED",
        payload: { expertId: scoredExpertId, proposalHash, score: proposal.score, rubricVersion: proposal.rubricVersion, evidenceIds: proposal.evidenceIds },
        idempotencyKey: `room-adjudication-proposed:${round.id}:${scoredExpertId}`,
      });
      return { proposal: { expertId: scoredExpertId, score: proposal.score, proposalHash, rubricVersion: proposal.rubricVersion }, state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id) };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients);
    return result;
  }

  static async confirmProposal({ principal, roomId, expertId, proposalHash }) {
    const supervisorId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const scoredExpertId = normalizeUuid(expertId, "expertId");
    const suppliedHash = boundedText(proposalHash, 64);
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const member = await memberFor(client, id, supervisorId);
      if (member.role !== "SUPERVISOR_EXPERT" || String(room.supervisor_user_id) !== supervisorId) throw roomError("EXPERT_ROOM_SUPERVISOR_REQUIRED", "Only the assigned Supervisor can confirm a proposed score.", 403);
      const round = await currentRound(client, room);
      const found = await client.query(`SELECT id, proposal_hash, state FROM private.expert_room_adjudications WHERE round_id = $1 AND expert_user_id = $2 FOR UPDATE`, [round.id, scoredExpertId]);
      const proposal = found.rows[0];
      if (!proposal) throw roomError("EXPERT_ROOM_PROPOSAL_NOT_FOUND", "There is no score proposal to confirm.", 404);
      if (proposal.state === "SUPERVISOR_CONFIRMED" || proposal.state === "HOST_ACKNOWLEDGED" || proposal.state === "SETTLED") {
        return { state: room.status, revision: Number(room.revision), recipients: await roomRecipients(client, id), idempotent: true };
      }
      if (proposal.proposal_hash !== suppliedHash || proposal.state !== "PROPOSED") {
        await client.query(`UPDATE private.expert_room_adjudications SET state = 'DISPUTED' WHERE id = $1`, [proposal.id]);
        const updated = ["SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT"].includes(room.status) ? await updateRoomState(client, room, "DISPUTED") : await bumpRoomRevision(client, room);
        await client.query(`UPDATE private.expert_room_rounds SET status = 'DISPUTED' WHERE id = $1`, [round.id]);
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: supervisorId, eventType: "ROUND_DISPUTED", payload: { expertId: scoredExpertId, reason: "SUPERVISOR_PROPOSAL_HASH_MISMATCH" }, idempotencyKey: `room-dispute:${round.id}:${scoredExpertId}` });
        return { state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id), disputed: true };
      }
      await client.query(`UPDATE private.expert_room_adjudications SET state = 'SUPERVISOR_CONFIRMED', supervisor_confirmed_at = now() WHERE id = $1`, [proposal.id]);
      const updated = room.status === "SUPERVISOR_CONFIRMATION" ? await updateRoomState(client, room, "HOST_ACKNOWLEDGEMENT") : await bumpRoomRevision(client, room);
      await client.query(`UPDATE private.expert_room_rounds SET status = 'HOST_ACKNOWLEDGEMENT' WHERE id = $1`, [round.id]);
      await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: supervisorId, eventType: "SUPERVISOR_CONFIRMED", payload: { expertId: scoredExpertId, proposalHash: suppliedHash }, idempotencyKey: `room-supervisor-confirmed:${round.id}:${scoredExpertId}` });
      return { state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id), idempotent: false };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients);
    return result;
  }

  static async acknowledgeScore({ principal, roomId, expertId, proposalHash }) {
    const hostId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const scoredExpertId = normalizeUuid(expertId, "expertId");
    const suppliedHash = boundedText(proposalHash, 64);
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      if (String(room.host_user_id) !== hostId) throw roomError("EXPERT_ROOM_HOST_REQUIRED", "Only the Host can acknowledge the proposal.", 403);
      const round = await currentRound(client, room);
      const found = await client.query(
        `SELECT id, proposal_hash, state, proposed_score, reason, evidence_ids, supervisor_user_id, rubric_version
           FROM private.expert_room_adjudications WHERE round_id = $1 AND expert_user_id = $2 FOR UPDATE`, [round.id, scoredExpertId],
      );
      const proposal = found.rows[0];
      if (!proposal) throw roomError("EXPERT_ROOM_PROPOSAL_NOT_FOUND", "There is no confirmed score proposal to acknowledge.", 404);
      if (proposal.state === "SETTLED") return { state: room.status, revision: Number(room.revision), recipients: await roomRecipients(client, id), idempotent: true };
      if (proposal.state !== "SUPERVISOR_CONFIRMED" || proposal.proposal_hash !== suppliedHash) {
        await client.query(`UPDATE private.expert_room_adjudications SET state = 'DISPUTED' WHERE id = $1`, [proposal.id]);
        const updated = room.status === "HOST_ACKNOWLEDGEMENT" ? await updateRoomState(client, room, "DISPUTED") : { status: room.status, revision: Number(room.revision) };
        await client.query(`UPDATE private.expert_room_rounds SET status = 'DISPUTED' WHERE id = $1`, [round.id]);
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: hostId, eventType: "ROUND_DISPUTED", payload: { expertId: scoredExpertId, reason: "HOST_PROPOSAL_MISMATCH" }, idempotencyKey: `room-dispute:${round.id}:${scoredExpertId}` });
        return { state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id), disputed: true };
      }

      const score = Number(proposal.proposed_score);
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`expert-room-reputation:${scoredExpertId}`]);
      const scoreThreshold = await roomSetting(client, "room_score_threshold_earned", 70, 0, 100);
      const excellentThreshold = await roomSetting(client, "room_score_threshold_excellent", 95, scoreThreshold, 100);
      const earnedDelta = await roomSetting(client, "room_reputation_delta_earned", 1, 0, 10);
      const excellentDelta = await roomSetting(client, "room_reputation_delta_excellent", 2, earnedDelta, 10);
      const requestedDelta = score >= excellentThreshold ? excellentDelta : score >= scoreThreshold ? earnedDelta : 0;
      const dailyCap = await roomSetting(client, "room_daily_reputation_cap", 5, 0, 50);
      const timezoneResult = await client.query(
        `SELECT COALESCE(config_value #>> '{}', 'Asia/Ho_Chi_Minh') AS timezone
           FROM private.expert_v5_config WHERE config_key = 'mission_timezone'`,
      );
      const reputationTimezone = timezoneResult.rows[0]?.timezone || "Asia/Ho_Chi_Minh";
      const earned = await client.query(
        `SELECT COALESCE(sum(delta),0)::numeric AS total
           FROM private.reputation_events
          WHERE user_id = $1 AND event_type = 'EXPERT_ROOM_ADJUDICATION'
            AND created_at >= ((date_trunc('day', now() AT TIME ZONE $2)) AT TIME ZONE $2)`, [scoredExpertId, reputationTimezone],
      );
      const delta = capReputationDelta({ earnedToday: Number(earned.rows[0]?.total || 0), requestedDelta, dailyCap });
      const packageResult = await client.query(`SELECT id, trust_case_id, trust_revision, package_hash FROM private.expert_room_evidence_packages WHERE id = $1`, [room.evidence_package_id]);
      if (!packageResult.rows[0] || !room.trust_case_id) throw roomError("EXPERT_ROOM_TRUST_LINEAGE_REQUIRED", "The score cannot settle without a persisted Trust case and evidence package.", 409);
      const context = {
        roomId: id,
        roundId: round.id,
        score,
        requestedDelta,
        actualDelta: delta,
        supervisorId: String(proposal.supervisor_user_id),
        hostId,
        trustCaseId: String(room.trust_case_id),
        trustRevision: room.trust_revision == null ? null : Number(room.trust_revision),
        evidencePackageId: String(packageResult.rows[0].id),
        evidencePackageHash: packageResult.rows[0].package_hash,
        evidenceIds: parseJson(proposal.evidence_ids, []),
        rubricVersion: proposal.rubric_version,
        policyVersion: "expert-room-reputation.v1",
      };
      const idempotencyKey = `room-settlement:${round.id}:${scoredExpertId}`;
      const reputationInsert = await client.query(
        `INSERT INTO private.reputation_events
          (user_id, domain_code, event_type, delta, reason, actor_id, idempotency_key, context, created_at)
         VALUES ($1,$2,'EXPERT_ROOM_ADJUDICATION',$3,$4,$5,$6,$7::jsonb,now())
         ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
        [scoredExpertId, room.domain_code, delta, boundedText(proposal.reason, 4000), proposal.supervisor_user_id, idempotencyKey, JSON.stringify(context)],
      );
      if (!reputationInsert.rows[0]) {
        const prior = await client.query(`SELECT context FROM private.reputation_events WHERE idempotency_key = $1`, [idempotencyKey]);
        const priorContext = parseJson(prior.rows[0]?.context, {});
        if (digest(priorContext) !== digest(context)) throw roomError("EXPERT_ROOM_SETTLEMENT_IDEMPOTENCY_CONFLICT", "The room settlement key is already bound to another result.", 409);
      }
      await client.query(
        `UPDATE private.expert_room_adjudications
            SET state = 'SETTLED', host_acknowledged_at = now(), host_acknowledged_by = $2 WHERE id = $1`, [proposal.id, hostId],
      );
      await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: hostId, eventType: "HOST_ACKNOWLEDGED", payload: { expertId: scoredExpertId, proposalHash: suppliedHash, score, delta }, idempotencyKey: `room-host-ack:${round.id}:${scoredExpertId}` });
      const answered = await client.query(`SELECT count(*)::int AS count FROM private.expert_room_answers WHERE round_id = $1`, [round.id]);
      const settled = await client.query(`SELECT count(*)::int AS count FROM private.expert_room_adjudications WHERE round_id = $1 AND state = 'SETTLED'`, [round.id]);
      let roomState = room.status;
      let revision;
      if (Number(answered.rows[0]?.count || 0) > 0 && Number(answered.rows[0]?.count) === Number(settled.rows[0]?.count)) {
        const nextRoom = await updateRoomState(client, room, "SETTLED");
        roomState = nextRoom.status;
        revision = nextRoom.revision;
        await client.query(`UPDATE private.expert_room_rounds SET status = 'SETTLED' WHERE id = $1`, [round.id]);
        await appendRoomEvent(client, { roomId: id, roundId: round.id, actorId: hostId, eventType: "ROOM_SETTLED", payload: { scoreCount: Number(settled.rows[0]?.count) }, idempotencyKey: `room-settled:${round.id}` });
      } else revision = (await bumpRoomRevision(client, room)).revision;
      return { state: roomState, revision, score, requestedDelta, reputationDelta: delta, recipients: await roomRecipients(client, id), idempotent: reputationInsert.rows.length === 0 };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients);
    return result;
  }

  static async closeRoom({ principal, roomId }) {
    const userId = authenticatedUserId(principal);
    const id = normalizeUuid(roomId, "roomId");
    const result = await withStorageErrors(() => transaction(async (client) => {
      const room = await getRoomRow(client, id, { forUpdate: true });
      const member = await memberFor(client, id, userId);
      if (member.role !== "HOST") throw roomError("EXPERT_ROOM_HOST_REQUIRED", "Only the Host can close this room.", 403);
      if (room.status === "CLOSED") return { state: "CLOSED", revision: Number(room.revision), recipients: await roomRecipients(client, id, [room.supervisor_user_id].filter(Boolean)) };
      const updated = await updateRoomState(client, room, "CLOSED");
      const round = await currentRound(client, room);
      if (round && round.status !== "SETTLED" && round.status !== "DISPUTED") await client.query(`UPDATE private.expert_room_rounds SET status = 'CLOSED' WHERE id = $1`, [round.id]);
      await appendRoomEvent(client, { roomId: id, roundId: round?.id || null, actorId: userId, eventType: "ROOM_CLOSED", payload: {}, idempotencyKey: `room-closed:${id}` });
      // A pending invitee has no membership yet but must receive closure so
      // its durable inbox/list removes the cancelled invitation immediately.
      return { state: updated.status, revision: updated.revision, recipients: await roomRecipients(client, id, [room.supervisor_user_id].filter(Boolean)) };
    }));
    await publishRoomRevision(id, result.revision, result.state, result.recipients);
    return result;
  }

  static async #recipients(roomId) {
    return withStorageErrors(() => transaction((client) => roomRecipients(client, roomId)));
  }
}

function roomListDto(row) {
  return {
    roomId: row.id,
    domainCode: row.domain_code,
    inputType: row.input_type,
    status: row.status,
    revision: Number(row.revision),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    supervisorId: row.supervisor_user_id ? String(row.supervisor_user_id) : null,
    supervisorOfferExpiresAt: row.supervisor_offer_expires_at ? new Date(row.supervisor_offer_expires_at).toISOString() : null,
    role: row.role || null,
  };
}
