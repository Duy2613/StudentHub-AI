import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { getLocalSupabaseRuntime, assertLoopbackUrl } from "./local-supabase-runtime.mjs";

if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== "I_UNDERSTAND_DISPOSABLE_DB_ONLY") throw new Error("DISPOSABLE_DB_ACK_REQUIRED");
const root = resolve(import.meta.dirname, "..");
const runtime = getLocalSupabaseRuntime();
assertLoopbackUrl(runtime.apiUrl);
assertLoopbackUrl(runtime.dbUrl);
const container = "supabase_db_studenthub-local-supabase";
const image = execFileSync("docker", ["inspect", "--format", "{{.Config.Image}}", container], { encoding: "utf8" }).trim();
if (!image.includes("supabase/postgres:17.6")) throw new Error("LOCAL_SUPABASE_CONTAINER_IDENTITY_INVALID");

process.env.STUDENTHUB_HERMETIC_TEST_MODE = "1";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = runtime.dbUrl;
process.env.DATABASE_SSL = "disable";
process.env.SUPABASE_URL = runtime.apiUrl;
process.env.NEXT_PUBLIC_SUPABASE_URL = runtime.apiUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = runtime.serviceRoleKey;
process.env.SUPABASE_PROJECT_REF = "";
process.env.SUPABASE_DATABASE_PROJECT_REF = "";
const require = createRequire(resolve(root, "frontend/package.json"));
const { createClient } = require("@supabase/supabase-js");
const { MediaArtifactService } = await import("../frontend/src/lib/server/media/MediaArtifactService.js");
const { ExpertVerificationRoomService } = await import("../frontend/src/lib/server/expert/ExpertVerificationRoomService.js");
const { getPostgresPool, closePostgresPoolForTests } = await import("../frontend/src/lib/server/database/PostgresPool.js");
const pool = getPostgresPool();
const admin = createClient(runtime.apiUrl, runtime.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const report = {
  environment: "LOCAL_DISPOSABLE_SUPABASE_17_6",
  recordedAt: new Date().toISOString(),
  sourceSha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  sourceWorkingTreeModified: Boolean(execFileSync("git", ["status", "--porcelain", "--", "frontend/src", "frontend/package.json", "frontend/package-lock.json"], { cwd: root, encoding: "utf8" }).trim()),
  apiHost: new URL(runtime.apiUrl).host,
  dbHost: new URL(runtime.dbUrl).host,
  providerCalls: 0,
  productionAcceptance: "NOT_RUN",
  trustL1L4Live: "NOT_RUN",
  evidencePackageInput: "SYNTHETIC_TERMINAL_RESPONSE_LOCAL_ONLY",
  migrations: [],
  checks: [],
  cleanup: [],
};
const users = [];
const rooms = [];
const artifacts = [];
const cases = [];
const runId = `local-room-media-${Date.now()}-${randomUUID().slice(0, 8)}`;
const principal = (user) => ({ isAuthenticated: true, subjectId: `user:${user.id}` });
const check = (name, ok, details = {}) => { report.checks.push({ name, pass: Boolean(ok), ...details }); assert.equal(Boolean(ok), true, name); };

async function user(label) {
  const password = `LocalRoom-${randomUUID()}-Aa1!`;
  const email = `${runId}-${label}@studenthub.local.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data?.user?.id) throw new Error("LOCAL_AUTH_USER_CREATE_FAILED");
  const item = { id: created.data.user.id, label };
  users.push(item);
  item.client = createClient(runtime.apiUrl, runtime.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signedIn = await item.client.auth.signInWithPassword({ email, password });
  if (signedIn.error || signedIn.data.user?.id !== item.id) throw new Error("LOCAL_AUTH_LOGIN_FAILED");
  return item;
}

try {
  for (const file of [
    "202609010001_private_screenshot_storage.sql",
    "20260929135354_studenthub_expert_v5_missions_rooms.sql",
    "20260929135553_expert_v5_trigger_path_and_fk_indexes.sql",
    "202610010003_expert_v5_event_sequence_permissions.sql",
  ]) {
    const sql = readFileSync(resolve(root, "database/migrations", file), "utf8");
    execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-1", "-q"], { input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    report.migrations.push({ file, sha256: createHash("sha256").update(sql).digest("hex"), result: "PASS_LOCAL_REHEARSAL" });
  }
  const bucket = await admin.storage.getBucket("trust-screenshots-private");
  check("private_bucket", !bucket.error && bucket.data?.public === false);
  const owner = await user("host");
  const participant = await user("participant");
  const outsider = await user("outsider");
  const anonymous = createClient(runtime.apiUrl, runtime.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const fixture of [
    { kind: "IMAGE", path: "fixtures/trust-multimodal/screenshot-text.png" },
    { kind: "QR", path: "frontend/tests/trust/fixtures/room-media-qr.png" },
  ]) {
    const bytes = readFileSync(resolve(root, fixture.path));
    const hash = createHash("sha256").update(bytes).digest("hex");
    const input = { principal: principal(owner), domainCode: "COMPUTER_SCIENCE", inputType: fixture.kind, content: "", metadata: { bytes: `data:image/png;base64,${bytes.toString("base64")}`, mimeType: "image/png", fileName: `${fixture.kind.toLowerCase()}.png`, fileSize: bytes.length }, idempotencyKey: `${runId}:${fixture.kind}` };
    const created = await ExpertVerificationRoomService.createRoom(input);
    const roomId = created.room.roomId;
    rooms.push(roomId);
    const metadata = created.room.challenge.metadata;
    const mediaId = metadata.mediaArtifactId;
    const runArtifact = { mediaId, ownerId: owner.id, objectKey: null, caseId: null };
    artifacts.push(runArtifact);
    check(`${fixture.kind}_create_room`, Boolean(roomId) && metadata.imageHash === hash);
    const stored = await pool.query("SELECT challenge_payload FROM private.expert_verification_rooms WHERE id = $1", [roomId]);
    check(`${fixture.kind}_canonical_reference`, stored.rows[0].challenge_payload.metadata.mediaArtifactId === mediaId && !Object.hasOwn(stored.rows[0].challenge_payload.metadata, "bytes") && stored.rows[0].challenge_payload.content === "");
    const row = (await pool.query("SELECT id, object_key, encode(sha256,'hex') AS sha256 FROM public.screenshot_objects WHERE id = $1", [mediaId.slice(4)])).rows[0];
    runArtifact.objectKey = row.object_key;
    const downloaded = await admin.storage.from("trust-screenshots-private").download(row.object_key);
    check(`${fixture.kind}_durable_object`, !downloaded.error && createHash("sha256").update(Buffer.from(await downloaded.data.arrayBuffer())).digest("hex") === hash && row.sha256 === hash);
    const duplicate = await ExpertVerificationRoomService.createRoom(input);
    check(`${fixture.kind}_idempotent_replay`, duplicate.idempotent && duplicate.room.roomId === roomId && duplicate.room.challenge.metadata.mediaArtifactId === mediaId);
    await pool.query("INSERT INTO private.expert_room_participants(room_id,user_id,role,state) VALUES ($1,$2,'PARTICIPANT_EXPERT','JOINED')", [roomId, participant.id]);
    for (const actor of [owner, participant]) {
      const read = await ExpertVerificationRoomService.getRoom({ principal: principal(actor), roomId });
      const response = await fetch(read.room.challenge.metadata.mediaUrl);
      check(`${fixture.kind}_${actor.label}_readback`, response.ok && createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex") === hash && read.room.challenge.metadata.mediaArtifactId === mediaId);
    }
    await assert.rejects(ExpertVerificationRoomService.getRoom({ principal: principal(outsider), roomId }), (e) => e.statusCode === 403);
    check(`${fixture.kind}_outsider_room_denied`, true);
    const denied = await MediaArtifactService.createSignedReadUrl(mediaId, { requesterUserId: outsider.id, roomId });
    const anonymousDenied = await MediaArtifactService.createSignedReadUrl(mediaId, { requesterUserId: null, roomId });
    check(`${fixture.kind}_signed_url_authorization`, !denied.ok && denied.error.statusCode === 403 && !anonymousDenied.ok && anonymousDenied.error.statusCode === 403);
    for (const actor of [outsider, { client: anonymous, label: "anonymous" }]) {
      const rawRead = await actor.client.storage.from("trust-screenshots-private").download(row.object_key);
      check(`${fixture.kind}_${actor.label}_private_object_denied`, Boolean(rawRead.error));
    }
    await pool.query("UPDATE private.expert_room_participants SET state='DISCONNECTED' WHERE room_id=$1 AND user_id=$2", [roomId, participant.id]);
    const reconnectRead = await ExpertVerificationRoomService.getRoom({ principal: principal(participant), roomId });
    check(`${fixture.kind}_disconnected_membership_readback`, reconnectRead.room.challenge.metadata.mediaArtifactId === mediaId && Boolean(reconnectRead.room.challenge.metadata.mediaUrl));
    await pool.query("UPDATE private.expert_room_participants SET state='JOINED' WHERE room_id=$1 AND user_id=$2", [roomId, participant.id]);
    const coldCode = `
      const {MediaArtifactService:M}=await import('./frontend/src/lib/server/media/MediaArtifactService.js');
      const {closePostgresPoolForTests}=await import('./frontend/src/lib/server/database/PostgresPool.js');
      const [id,userId,roomId,hash,kind]=process.argv.slice(1);
      const before=M.getArtifactBytes(id);
      const r=await M.hydrateArtifact(id,{requesterUserId:userId,roomId,expectedSha256:hash});
      let qr=null;
      if(r.ok && kind==='QR'){const {decodeQrArtifactBytes}=await import('./frontend/src/lib/server/media/QrArtifactDecoder.js');qr=await decodeQrArtifactBytes(M.getArtifactBytes(id));}
      console.log(JSON.stringify({cacheEmptyBefore:!before,ok:r.ok,mediaArtifactId:r.artifact?.mediaArtifactId,sha256:r.artifact?.sha256,qrDecoded:qr?.ok||null}));
      await closePostgresPoolForTests();
    `;
    const cold = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", coldCode, mediaId, participant.id, roomId, hash, fixture.kind], { cwd: root, encoding: "utf8", env: process.env, stdio: ["ignore", "pipe", "pipe"] }).trim());
    check(`${fixture.kind}_cold_process_hydration`, cold.cacheEmptyBefore && cold.ok && cold.sha256 === hash && cold.mediaArtifactId === mediaId && (fixture.kind !== "QR" || cold.qrDecoded), { canonicalMediaArtifactId: mediaId, sha256: hash });

    // Exercise package persistence with an explicitly synthetic terminal DTO;
    // this does not count as real L1-L4 or live evidence acceptance.
    const caseId = randomUUID();
    cases.push(caseId);
    runArtifact.caseId = caseId;
    await pool.query("INSERT INTO public.trust_cases(id,owner_id,state,visibility) VALUES ($1,$2,'INSUFFICIENT_EVIDENCE','PRIVATE')", [caseId, owner.id]);
    const roundId = randomUUID();
    await pool.query("INSERT INTO private.expert_room_rounds(id,room_id,round_number,status,round_started_at,answer_deadline_at) VALUES ($1,$2,1,'TRUST_ANALYZING',now()-interval '60 seconds',now()-interval '30 seconds')", [roundId, roomId]);
    await pool.query("UPDATE private.expert_verification_rooms SET status='TRUST_ANALYZING',current_round_id=$2 WHERE id=$1", [roomId, roundId]);
    const completed = await ExpertVerificationRoomService.completeTrust({ principal: principal(owner), roomId, roundId, httpStatus: 200, payload: { success: true, caseId, caseRevision: 1, persistence: { persisted: true }, data: { layerResults: { layer3: { evidence: [{ evidenceId: `local-fixture:${roundId}`, relation: "CONTEXT", liveEvidence: false }] } } } } });
    const provenance = completed.room.evidencePackage?.inputProvenance;
    check(`${fixture.kind}_synthetic_package_provenance`, provenance?.mediaArtifactId === mediaId && provenance.sha256 === hash && provenance.trustCaseId === caseId && provenance.storageLink === "LINKED");
    const linked = await pool.query("SELECT case_id FROM public.screenshot_objects WHERE id=$1", [mediaId.slice(4)]);
    check(`${fixture.kind}_exact_case_linkage`, linked.rows[0]?.case_id === caseId);
    const reloaded = await ExpertVerificationRoomService.getRoom({ principal: principal(participant), roomId });
    check(`${fixture.kind}_package_reload`, reloaded.evidencePackage?.inputProvenance?.mediaArtifactId === mediaId && Boolean(reloaded.room.challenge.metadata.mediaUrl));
  }
} catch (error) {
  report.failure = { code: error.code || "LOCAL_ASSURANCE_FAILED", message: "Local Room media assurance did not complete; inspect the named failed check." };
  process.exitCode = 1;
} finally {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Local synthetic fixtures only. Append-only domain logs are never altered
    // in production; the loopback/container guards apply before this harness.
    await client.query("SET LOCAL session_replication_role = replica");
    for (const id of rooms) {
      await client.query("UPDATE private.expert_verification_rooms SET evidence_package_id=NULL,current_round_id=NULL WHERE id=$1", [id]);
      await client.query("DELETE FROM private.expert_room_evidence_packages WHERE room_id=$1", [id]);
      await client.query("DELETE FROM private.expert_room_rounds WHERE room_id=$1", [id]);
      await client.query("DELETE FROM private.expert_room_events WHERE room_id=$1", [id]);
      await client.query("DELETE FROM private.expert_room_participants WHERE room_id=$1", [id]);
      await client.query("DELETE FROM private.expert_verification_rooms WHERE id=$1", [id]);
      await client.query("DELETE FROM private.realtime_events WHERE correlation_id=$1", [`expert-room:${id}`]);
    }
    for (const item of artifacts) {
      if (item.caseId) await client.query("UPDATE public.screenshot_objects SET case_id=NULL WHERE id=$1 AND owner_id=$2 AND case_id=$3", [item.mediaId.slice(4), item.ownerId, item.caseId]);
    }
    await client.query("COMMIT");
    const remaining = await pool.query("SELECT count(*)::int AS n FROM private.expert_verification_rooms WHERE id=ANY($1::uuid[])", [rooms]);
    report.cleanup.push({ check: "exact_local_rooms", pass: remaining.rows[0].n === 0 });
  } catch {
    await client.query("ROLLBACK");
    report.cleanup.push({ check: "exact_local_rooms", pass: false });
    process.exitCode = 1;
  } finally { client.release(); }
  for (const item of artifacts) {
    const result = await MediaArtifactService.cleanupUnreferencedArtifact({ mediaArtifactId: item.mediaId, ownerUserId: item.ownerId });
    const row = await pool.query("SELECT count(*)::int AS n FROM public.screenshot_objects WHERE id=$1", [item.mediaId.slice(4)]);
    const missing = item.objectKey && await admin.storage.from("trust-screenshots-private").download(item.objectKey);
    report.cleanup.push({ check: "exact_local_artifact", mediaArtifactId: item.mediaId, pass: result.ok && result.removed && row.rows[0].n === 0 && Boolean(missing?.error) });
  }
  for (const id of cases) {
    const deleted = await pool.query("DELETE FROM public.trust_cases WHERE id=$1 RETURNING id", [id]);
    report.cleanup.push({ check: "exact_local_synthetic_case", pass: deleted.rowCount === 1 });
  }
  for (const item of users) {
    const remaining = await pool.query("SELECT count(*)::int AS n FROM private.expert_verification_rooms WHERE host_user_id=$1", [item.id]);
    if (remaining.rows[0].n !== 0) { report.cleanup.push({ check: "local_user_preserved_due_to_remaining_room", pass: false }); continue; }
    const deleted = await admin.auth.admin.deleteUser(item.id);
    const missing = await admin.auth.admin.getUserById(item.id);
    report.cleanup.push({ check: "exact_local_auth_user", id: item.id, pass: !deleted.error && Boolean(missing.error) });
  }
  report.result = !report.failure && report.cleanup.every((r) => r.pass) ? "PASS_LOCAL_ONLY" : "FAIL_LOCAL";
  if (report.result !== "PASS_LOCAL_ONLY") process.exitCode = 1;
  writeFileSync(resolve(root, "docs/reports/four-core-repair-2026-10-01/room-media-local-assurance.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ environment: report.environment, result: report.result, checks: report.checks.length, cleanup: report.cleanup, failure: report.failure || null }));
  await closePostgresPoolForTests();
}
