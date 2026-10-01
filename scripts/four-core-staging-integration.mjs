// Cloud staging only. Operational credentials stay in this parent process;
// all feature requests use normal users' application sessions in isolated browsers.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(resolve(root, 'frontend/package.json'));
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const { chromium } = require('playwright');
const projectRef = 'bniwtkjtramqaozrrtrk';
const envPath = process.env.STUDENTHUB_STAGING_ENV_PATH;
if (!envPath || process.env.STUDENTHUB_STAGING_FIXTURE_ACK !== 'STAGING_SYNTHETIC_ONLY') throw new Error('STAGING_OPERATOR_ENV_REQUIRED');
const env = parseEnv(readFileSync(envPath, 'utf8'));
const authUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const sqlUrl = new URL(env.DATABASE_URL);
if (new URL(authUrl).hostname !== `${projectRef}.supabase.co` || !(sqlUrl.hostname === `db.${projectRef}.supabase.co` || decodeURIComponent(sqlUrl.username) === `postgres.${projectRef}` && sqlUrl.hostname.endsWith('.pooler.supabase.com'))) throw new Error('STAGING_IDENTITY_MISMATCH');
const origin = process.argv[2] || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('STAGING_APP_MUST_BE_LOOPBACK');
const auth = createClient(authUrl, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false', ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, '\n') } : {}) }, max: 3 });
const runTag = `fourcore-${Date.now()}`;
const domain = `REPAIR_QA_${Date.now()}`;
const report = { recordedAt: new Date().toISOString(), candidateSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), workingTreeChanges: Boolean(execFileSync('git', ['status', '--porcelain', '--', 'frontend/src', 'database/migrations', 'scripts/four-core-staging-integration.mjs'], { cwd: root, encoding: 'utf8' }).trim()), projectRef, origin, runTag, providerMode: 'OFF', providerBudget: 0, evidenceClass: 'REAL_STAGING_BUSINESS_PATH_WITH_LABELLED_SYNTHETIC_FIXTURES', gates: [], checks: [], fixtureUserIds: [], retainedImmutableFixtureIds: [], cleanup: [] };
const file = resolve(root, 'docs/reports/four-core-repair-2026-10-01/staging-integration.json');
const previous = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
report.sourceOriginOwnerIds = [...new Set([...(previous?.sourceOriginOwnerIds || []), ...(previous?.fixtureUserIds || [])])];
const save = () => writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
const users = [];
let browser;
async function gate(name, work) {
  try { const result = await work(); report.gates.push({ name, status: result?.status || 'PASS', ...result }); }
  catch (e) {
    const location = String(e.stack || '').match(/four-core-staging-integration\.mjs:(\d+):(\d+)/);
    const safeScalar = value => typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && /^[A-Z_]{1,64}$/.test(value)) ? value : undefined;
    report.gates.push({
      name,
      status: 'FAIL',
      code: /^[A-Z0-9_:-]{1,120}$/.test(e.code || e.message) ? e.code || e.message : e.name,
      assertion: e instanceof assert.AssertionError ? String(e.message).split('\n')[0].slice(0, 160) : null,
      failureLine: location ? Number(location[1]) : null,
      expected: safeScalar(e.expected),
      actual: safeScalar(e.actual),
    });
  }
  save();
}
async function api(user, path, body, options = {}) {
  const result = await user.page.evaluate(async ({ path, body, options }) => {
    const response = await fetch(path, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(180000), method: options.method || (body === undefined ? 'GET' : 'POST'), headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...options.headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { path, body, options });
  report.checks.push({ path: path.split('?')[0], actor: user.kind, status: result.status, code: result.body?.error?.code || result.body?.persistence?.errorCode || null, persistenceStatus: result.body?.persistence?.status || null, persistenceErrorCode: result.body?.persistence?.errorCode || null, correlationId: result.body?.meta?.correlationId || result.body?.requestId || null });
  if (options.expected) assert.ok(options.expected.includes(result.status), `HTTP_STATUS_${result.status}_${result.body?.error?.code || 'UNKNOWN'}`);
  return result.body;
}
async function login(user) {
  user.context = await browser.newContext();
  user.page = await user.context.newPage();
  await user.page.goto(`${origin}/login?next=%2Fprofile`, { waitUntil: 'domcontentloaded' });
  await user.page.waitForTimeout(1600);
  await user.page.locator('input[type="email"]').fill(user.email);
  await user.page.locator('input[type="password"]').first().fill(user.password);
  await user.page.locator('button[type="submit"]').first().click();
  await user.page.waitForURL(url => url.pathname !== '/login', { timeout: 30000 });
  const session = await api(user, '/api/auth/session', undefined, { expected: [200] });
  assert.equal(session.user.userId.replace(/^user:/, ''), user.id, 'APPLICATION_OWNER_UUID_MISMATCH');
  await user.page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal((await api(user, '/api/auth/session', undefined, { expected: [200] })).authenticated, true);
}

async function stream(user, cursor) {
  await user.page.evaluate(({ cursor }) => {
    window.__repairStream?.controller.abort();
    const capture = { controller: new AbortController(), connected: false, events: [], status: null };
    window.__repairStream = capture;
    void (async () => {
      const response = await fetch(`/api/realtime/stream?channels=expert&cursor=${cursor}`, { credentials: 'include', signal: capture.controller.signal });
      capture.status = response.status;
      if (!response.ok) return;
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = '';
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        pending += decoder.decode(chunk.value, { stream: true });
        const frames = pending.split('\n\n'); pending = frames.pop();
        for (const frame of frames) {
          if (frame.includes('event: system:connected')) capture.connected = true;
          const line = frame.split('\n').find(line => line.startsWith('data: '));
          if (!line) continue;
          try { const event = JSON.parse(line.slice(6)); if (event.data?.roomId) capture.events.push({ roomId: event.data.roomId, revision: event.data.revision, sequence: event.sequence }); } catch {}
        }
      }
    })().catch(() => {});
  }, { cursor });
  await user.page.waitForFunction(() => window.__repairStream?.connected, null, { timeout: 20000 });
}

try {
  const health = await fetch(`${origin}/api/health/ready`).then(r => r.json());
  report.readiness = health;
  browser = await chromium.launch({ headless: true });
  for (const kind of ['student-a', 'student-b', 'admin', 'expert-a', 'expert-b', 'expert-c', 'expert-unscoped']) {
    const password = `Repair!${randomBytes(24).toString('hex')}aA1`;
    const email = `${runTag}-${kind}@studenthub.local.test`;
    const { data, error } = await auth.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Synthetic ${kind}`, repair_fixture: runTag } });
    if (error || !data?.user?.id) throw new Error(`STAGING_AUTH_CREATE_${error?.status || 'FAILED'}`);
    const user = { id: data.user.id, email, password, kind }; users.push(user); report.fixtureUserIds.push(user.id); save();
    const roles = kind === 'admin' ? ['STUDENT', 'ADMIN'] : kind.startsWith('expert') ? ['STUDENT', 'EXPERT'] : ['STUDENT'];
    await pool.query(`INSERT INTO private.user_roles(user_id,role_id,granted_by,granted_at) SELECT $1,id,$1,now() FROM private.roles WHERE code=ANY($2::text[]) ON CONFLICT(user_id,role_id) DO UPDATE SET revoked_at=NULL`, [user.id, roles]);
    if (kind.startsWith('expert') && kind !== 'expert-unscoped') await pool.query(`INSERT INTO private.expert_verifications(user_id,domain_code,status,qualification_state,verified_by,verified_at,evidence_ref) VALUES($1,$2,'VERIFIED','DOMAIN_VERIFIED',$1,now(),$3)`, [user.id, domain, `SYNTHETIC-STAGING:${runTag}`]);
    await gate(`login-reload-${kind}`, () => login(user));
  }
  const [owner, other, admin, ...experts] = users;
  await gate('profile-five-fields-reload', async () => {
    const fields = { fullName: 'Synthetic Repair Owner', avatarId: 'avatar-02', bio: `Synthetic integration ${runTag}`, university: 'Synthetic Test University', major: 'Integration Testing' };
    await api(owner, '/api/users/me', fields, { method: 'PATCH', expected: [200] });
    await owner.page.reload({ waitUntil: 'domcontentloaded' });
    const row = await pool.query("SELECT COALESCE(to_jsonb(p)->>'full_name',p.display_name) AS full_name,p.avatar_id,p.bio,p.university,p.major FROM public.profiles p WHERE id=$1", [owner.id]);
    assert.equal(row.rows[0].full_name, fields.fullName); assert.equal(row.rows[0].avatar_id, fields.avatarId); assert.equal(row.rows[0].bio, fields.bio); assert.equal(row.rows[0].university, fields.university); assert.equal(row.rows[0].major, fields.major);
    return { ownerReadback: 'SQL_AND_RELOADED_APPLICATION' };
  });
  await gate('v5-source-real-canonical-ingestion', async () => {
    const host = 'developer.mozilla.org';
    const existing = (await pool.query('SELECT id,created_by FROM private.expert_v5_source_registry WHERE canonical_host=$1', [host])).rows[0];
    if (existing && !report.sourceOriginOwnerIds.includes(existing.created_by)) return { status: 'BLOCKED_EXTERNAL', code: 'EXISTING_SOURCE_POLICY_MUST_BE_PRESERVED' };
    let snapshot;
    let provenance;
    if (existing) {
      const snapshots = await api(admin, `/api/expert/v5/sources?sourceId=${existing.id}`, undefined, { expected: [200] });
      snapshot = snapshots.data[0];
      provenance = 'READBACK_PRIOR_SAME_HARNESS_CANONICAL_TRUST_DIRECT_URL';
    } else {
      const registered = await api(admin, '/api/expert/v5/source-registry', { source: { canonicalHost: host, domainCode: domain, category: 'OFFICIAL_DOCUMENTATION', licenseNotes: `Public MDN documentation; labelled staging run ${runTag}`, enabled: true, maxRequestsPerDay: 1, minRequestIntervalSeconds: 60 } }, { expected: [200, 201] });
      const id = registered.data.id; report.retainedImmutableFixtureIds.push(id);
      const result = await api(admin, '/api/expert/v5/sources/ingest', { registryId: id, url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200' }, { headers: { 'Idempotency-Key': `${runTag}:real-source` }, expected: [200, 201] });
      snapshot = result.data.snapshot;
      provenance = 'CANONICAL_TRUST_DIRECT_URL';
    }
    assert.ok(snapshot?.snapshotId, 'SOURCE_SNAPSHOT_MISSING');
    report.retainedImmutableFixtureIds.push(snapshot.snapshotId);
    const readback = await pool.query('SELECT retrieval_status,content_hash,evidence_items,jsonb_array_length(evidence_items) AS evidence_count FROM private.expert_v5_source_snapshots WHERE id=$1', [snapshot.snapshotId]);
    assert.equal(readback.rows[0].retrieval_status, snapshot.retrievalStatus);
    if (snapshot.retrievalStatus === 'SUCCESS') {
      const evidenceItems = Array.isArray(readback.rows[0].evidence_items) ? readback.rows[0].evidence_items : [];
      const supporting = evidenceItems.find(item => /HTTP Semantics/i.test(item.excerpt || ''));
      assert.ok(supporting, 'REAL_SOURCE_ANSWER_SUPPORT_MISSING');
      const prompt = 'Which exact phrase appears in the cited retrieved excerpt?';
      const activeQuestion = async () => (await pool.query(`SELECT question_id,question_version,answer_key FROM private.expert_v5_questions
        WHERE source_snapshot_id=$1 AND prompt=$2 AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1`, [snapshot.snapshotId, prompt])).rows[0];
      let questionRow = await activeQuestion();
      if (!questionRow) {
        const question = await api(admin, '/api/expert/v5/questions', { action: 'CREATE_DRAFT', question: { sourceSnapshotId: snapshot.snapshotId, questionType: 'SINGLE_CHOICE', prompt, choices: [{ id: 'a', label: 'HTTP Semantics' }, { id: 'b', label: 'CSS Color' }], answerKey: 'a', explanation: 'The cited excerpt contains the literal phrase HTTP Semantics; this item checks excerpt-bound retrieval.', evidenceIds: [supporting.id], difficultyReview: { ambiguity: 0, temporalReasoning: false } } }, { expected: [201] });
        await api(admin, '/api/expert/v5/questions', { action: 'ACTIVATE', questionId: question.data.question_id, questionVersion: question.data.questionVersion, reviewChecks: { sourceSupport: true, distractorsReviewed: true, domainFit: true, difficultyConfirmed: true } }, { expected: [200] });
        questionRow = await activeQuestion();
      }
      assert.ok(questionRow, 'REAL_SOURCE_QUESTION_ACTIVATION_FAILED');
      assert.equal(typeof questionRow.answer_key === 'string' ? questionRow.answer_key : questionRow.answer_key?.[0], 'a', 'REAL_SOURCE_QUESTION_KEY_NOT_GROUNDED');
      const sourceDomain = (await pool.query('SELECT domain_code FROM private.expert_v5_source_registry WHERE id=$1', [snapshot.sourceId])).rows[0].domain_code;
      const activeSourceQuestions = await pool.query(`SELECT q.prompt,q.answer_key,q.source_content_hash,s.content_hash,s.canonical_url
        FROM private.expert_v5_questions q JOIN private.expert_v5_source_snapshots s ON s.id=q.source_snapshot_id
        WHERE q.source_snapshot_id=$1 AND q.domain_code=$2 AND q.status='ACTIVE'`, [snapshot.snapshotId, sourceDomain]);
      assert.ok(activeSourceQuestions.rows.length, 'REAL_SOURCE_ACTIVE_QUESTION_MISSING');
      assert.ok(activeSourceQuestions.rows.every(row => (typeof row.answer_key === 'string' ? row.answer_key : row.answer_key?.[0]) === 'a' && row.source_content_hash === row.content_hash), 'REAL_SOURCE_QA_BANK_NOT_ISOLATED');
      for (const expert of experts.slice(0, 2)) await pool.query(`INSERT INTO private.expert_verifications(user_id,domain_code,status,qualification_state,verified_by,verified_at,evidence_ref) VALUES($1,$2,'VERIFIED','DOMAIN_VERIFIED',$3,now(),$4) ON CONFLICT(user_id,domain_code) DO NOTHING`, [expert.id, sourceDomain, admin.id, `SYNTHETIC-STAGING:${runTag}`]);
      for (const [index, expert] of experts.slice(0, 2).entries()) {
        const assigned = await api(expert, '/api/expert/missions', undefined, { method: 'POST', expected: [200] });
        const mission = assigned.data.missions.find(item => item.domainCode === sourceDomain && item.question?.source?.canonicalUrl === snapshot.canonicalUrl); assert.ok(mission, 'REAL_SOURCE_QUESTION_NOT_ASSIGNED');
        assert.equal('answerKey' in mission.question, false);
        const assignedQuestion = activeSourceQuestions.rows.find(row => row.prompt === mission.question.prompt && row.canonical_url === mission.question.source.canonicalUrl);
        assert.ok(assignedQuestion, 'REAL_SOURCE_MISSION_QUESTION_NOT_IN_SNAPSHOT');
        await api(expert, `/api/expert/missions/${mission.missionId}`, { action: 'START' }, { expected: [200] });
        const correctAnswer = typeof assignedQuestion.answer_key === 'string' ? assignedQuestion.answer_key : assignedQuestion.answer_key?.[0];
        const result = await api(expert, `/api/expert/missions/${mission.missionId}`, { action: 'SUBMIT', answer: index === 0 ? correctAnswer : correctAnswer === 'a' ? 'b' : 'a' }, { expected: [200] }); assert.equal(result.data.attempt.score, index === 0 ? 100 : 0);
      }
    }
    return { status: snapshot.retrievalStatus === 'SUCCESS' ? 'PASS' : 'BLOCKED_EXTERNAL', retrievalStatus: snapshot.retrievalStatus, blockedReason: snapshot.blockedReason, evidenceCount: readback.rows[0].evidence_count, contentHash: readback.rows[0].content_hash, provenance, realSourceReviewedAndGraded: snapshot.retrievalStatus === 'SUCCESS' };
  });
  await gate('v5-mission-correct-incorrect-idempotency-scope', async () => {
    const source = randomUUID(), snapshot = randomUUID(), evidence = `${runTag}:synthetic-evidence`;
    const syntheticDomain = `${domain}_SYNTHETIC`;
    for (const expert of experts.slice(0, 2)) await pool.query(`INSERT INTO private.expert_verifications(user_id,domain_code,status,qualification_state,verified_by,verified_at,evidence_ref) VALUES($1,$2,'VERIFIED','DOMAIN_VERIFIED',$3,now(),$4)`, [expert.id, syntheticDomain, admin.id, `SYNTHETIC-STAGING:${runTag}`]);
    const hash = createHash('sha256').update(`${runTag}:declared-synthetic-source`).digest('hex');
    await pool.query(`INSERT INTO private.expert_v5_source_registry(id,canonical_host,domain_code,category,license_notes,enabled,created_by) VALUES($1,$2,$3,'QA_FIXTURE',$4,true,$5)`, [source, `${runTag}.example.com`, syntheticDomain, `SYNTHETIC fixture ${runTag}; not live retrieval evidence`, admin.id]);
    await pool.query(`INSERT INTO private.expert_v5_source_snapshots(id,source_id,requested_url,canonical_url,title,publisher,content_hash,retrieval_status,ingestion_key,evidence_items,provider_metadata) VALUES($1,$2,$3,$3,'Declared synthetic answer fixture','QA_FIXTURE',$4,'SUCCESS',$5,$6::jsonb,$7::jsonb)`, [snapshot, source, `https://${runTag}.example.com/fixture`, hash, `${runTag}:synthetic`, JSON.stringify([{ id: evidence, excerpt: 'Declared synthetic document states the answer is option a.', sourceUrl: `https://${runTag}.example.com/fixture` }]), JSON.stringify({ synthetic: true, assuranceRun: runTag, liveRetrieval: false })]);
    report.retainedImmutableFixtureIds.push(source, snapshot);
    const draft = await api(admin, '/api/expert/v5/questions', { action: 'CREATE_DRAFT', question: { sourceSnapshotId: snapshot, questionType: 'SINGLE_CHOICE', prompt: 'Which option is stated in the declared synthetic source fixture?', choices: [{ id: 'a', label: 'Synthetic answer A' }, { id: 'b', label: 'Synthetic distractor B' }], answerKey: 'a', explanation: 'The labelled synthetic source excerpt explicitly states option a.', evidenceIds: [evidence], difficultyReview: { ambiguity: 0, temporalReasoning: false } } }, { expected: [201] });
    await api(admin, '/api/expert/v5/questions', { action: 'ACTIVATE', questionId: draft.data.question_id, questionVersion: draft.data.questionVersion, reviewChecks: { sourceSupport: true, distractorsReviewed: true, domainFit: true, difficultyConfirmed: true } }, { expected: [200] });
    await api(owner, '/api/expert/v5/questions', undefined, { expected: [403] });
    const unscoped = await api(experts[3], '/api/expert/missions', undefined, { expected: [200] }); assert.equal(unscoped.data.bankState, 'VERIFIED_SCOPE_REQUIRED');
    for (const [index, expert] of experts.slice(0, 2).entries()) {
      const assigned = await api(expert, '/api/expert/missions', undefined, { method: 'POST', expected: [200] });
      const mission = assigned.data.missions.find(item => item.question.questionId === draft.data.question_id); assert.ok(mission, 'VALIDATED_QUESTION_NOT_ASSIGNED'); assert.equal('answerKey' in mission.question, false); assert.equal('explanation' in mission.question, false);
      await api(experts[2], `/api/expert/missions/${mission.missionId}`, { action: 'START' }, { expected: [403, 404] });
      const started = await api(expert, `/api/expert/missions/${mission.missionId}`, { action: 'START' }, { expected: [200] });
      assert.ok(started.data.attempt.deadlineAt, 'SERVER_DEADLINE_MISSING');
      const answer = index === 0 ? 'a' : 'b';
      const result = await api(expert, `/api/expert/missions/${mission.missionId}`, { action: 'SUBMIT', answer }, { expected: [200] });
      assert.equal(result.data.attempt.score, index === 0 ? 100 : 0);
      const retry = await api(expert, `/api/expert/missions/${mission.missionId}`, { action: 'SUBMIT', answer }, { expected: [200] }); assert.equal(retry.data.idempotent, true);
      await api(expert, `/api/expert/missions/${mission.missionId}`, { action: 'SUBMIT', answer: index === 0 ? 'b' : 'a' }, { expected: [409] });
      const completed = (await pool.query("SELECT count(*)::int AS count FROM private.expert_daily_missions WHERE user_id=$1 AND status='COMPLETED'", [expert.id])).rows[0].count;
      const progress = await pool.query('SELECT completed_missions,mission_level FROM private.expert_mission_progression WHERE user_id=$1', [expert.id]); assert.equal(progress.rows[0].completed_missions, completed); assert.equal(progress.rows[0].mission_level, 1);
      const rewards = await pool.query('SELECT count(*)::int AS count FROM private.reputation_events WHERE user_id=$1', [expert.id]); assert.equal(rewards.rows[0].count, 0);
    }
    return { fixtureClass: 'EXPLICIT_SYNTHETIC_SOURCE_REAL_STAGING_API', correctScore: 100, incorrectScore: 0, duplicateProgression: false, credentialStarsMutated: false };
  });
  await gate('v5-room-presence-timer-private-answer-reconnect', async () => {
    const cursor = Number((await pool.query('SELECT COALESCE(max(sequence),0) AS cursor FROM private.realtime_events')).rows[0].cursor);
    await stream(experts[0], cursor); await stream(experts[3], cursor);
    for (const expert of experts.slice(0, 3)) await api(expert, '/api/expert/rooms/presence', undefined, { method: 'POST', expected: [200] });
    const body = { domainCode: domain, inputType: 'URL', content: 'https://www.rfc-editor.org/rfc/rfc9110.html' };
    const created = await api(owner, '/api/expert/rooms', body, { headers: { 'Idempotency-Key': `${runTag}:room` }, expected: [201] });
    const id = created.data.room.roomId; report.retainedImmutableFixtureIds.push(id);
    const replay = await api(owner, '/api/expert/rooms', body, { headers: { 'Idempotency-Key': `${runTag}:room` }, expected: [201] }); assert.equal(replay.data.room.roomId, id); assert.equal(replay.data.idempotent, true);
    const supervisor = experts.find(e => e.id === created.data.room.supervisorId); assert.ok(supervisor, 'INDEPENDENT_SUPERVISOR_NOT_SELECTED');
    const participants = experts.slice(0, 3).filter(e => e !== supervisor);
    const path = `/api/expert/rooms/${id}`;
    await api(other, path, undefined, { expected: [403, 404] });
    await api(supervisor, path, { action: 'ACCEPT_SUPERVISOR', conflictFree: true }, { expected: [200] });
    for (const expert of participants) await api(expert, path, { action: 'JOIN' }, { expected: [200] });
    const started = await api(owner, path, { action: 'START_ROUND', deadlineAt: '2999-01-01T00:00:00Z' }, { expected: [200] });
    const duration = (Date.parse(started.data.round.deadlineAt) - Date.parse(started.data.round.startedAt)) / 1000;
    assert.equal(duration, 30, 'CLIENT_CHANGED_SERVER_TIMER');
    await api(participants[0], path, { action: 'SUBMIT_ANSWER', response: 'Synthetic first private answer with explicit uncertainty.' }, { expected: [200] });
    const hidden = await Promise.all([api(owner, path, undefined, { expected: [200] }), api(participants[1], path, undefined, { expected: [200] })]);
    assert.equal(hidden[0].data.round.answers.length, 0, 'HOST_READ_PRIVATE_ANSWER');
    assert.equal(hidden[1].data.round.answers.length, 0, 'PEER_READ_PRIVATE_ANSWER');
    await api(participants[0], path, { action: 'SUBMIT_ANSWER', response: 'Synthetic first private answer with explicit uncertainty.' }, { expected: [200] });
    await api(participants[0], path, { action: 'SUBMIT_ANSWER', response: 'Changed answer must be rejected.' }, { expected: [409] });
    await api(participants[1], path, { action: 'SUBMIT_ANSWER', response: 'Synthetic second answer; more evidence is required.' }, { expected: [200] });
    await owner.page.reload({ waitUntil: 'domcontentloaded' });
    const locked = await api(owner, path, undefined, { expected: [200] }); assert.equal(locked.data.room.status, 'ANSWER_LOCKED'); assert.equal(locked.data.round.answers.length, 2);
    const analyzed = await api(owner, path, { action: 'LOCK_AND_ANALYZE' }, { expected: [200] });
    const room = analyzed.data.room;
    assert.ok(['ADJUDICATION', 'ADJUDICATION_BLOCKED', 'TRUST_UNAVAILABLE'].includes(room.room.status));
    let settlement = 'BLOCKED_EXTERNAL_SOURCE_EVIDENCE';
    if (room.room.status === 'ADJUDICATION') {
      const evidenceIds = room.evidencePackage.evidenceIds.slice(0, 1);
      assert.ok(evidenceIds.length, 'ROOM_SOURCE_EVIDENCE_MISSING');
      const rubric = { SOURCE_ALIGNMENT: 100, EVIDENCE_USE: 50, UNCERTAINTY_CALIBRATION: 100 };
      const proposal = await api(supervisor, path, { action: 'PROPOSE_SCORE', expertId: participants[0].id, ratings: rubric, evidenceIds, reason: 'Synthetic review exercise cites the actual retrieved RFC source; uncertainty remains explicit.' }, { expected: [200] });
      assert.equal(proposal.data.proposal.score, 85);
      const proposalHash = proposal.data.proposal.proposalHash;
      await api(supervisor, path, { action: 'CONFIRM_SCORE', expertId: participants[0].id, proposalHash }, { expected: [200] });
      const ack = await api(owner, path, { action: 'ACKNOWLEDGE_SCORE', expertId: participants[0].id, proposalHash }, { expected: [200] }); assert.equal(ack.data.reputationDelta, 1);
      const retry = await api(owner, path, { action: 'ACKNOWLEDGE_SCORE', expertId: participants[0].id, proposalHash }, { expected: [200] }); assert.equal(retry.data.idempotent, true);
      const disputeProposal = await api(supervisor, path, { action: 'PROPOSE_SCORE', expertId: participants[1].id, ratings: rubric, evidenceIds, reason: 'Synthetic dispute exercise references real source evidence and checks mismatched proposal rejection.' }, { expected: [200] });
      assert.ok(disputeProposal.data.proposal.proposalHash);
      const disputed = await api(supervisor, path, { action: 'CONFIRM_SCORE', expertId: participants[1].id, proposalHash: '0'.repeat(64) }, { expected: [200] }); assert.equal(disputed.data.disputed, true); assert.equal(disputed.data.state, 'DISPUTED');
      const ledger = await pool.query("SELECT user_id,delta FROM private.reputation_events WHERE user_id=ANY($1::uuid[]) AND event_type='EXPERT_ROOM_ADJUDICATION'", [participants.map(p => p.id)]);
      assert.equal(ledger.rows.length, 1); assert.equal(ledger.rows[0].user_id, participants[0].id); assert.equal(Number(ledger.rows[0].delta), 1);
      settlement = 'PASS_SETTLEMENT_RETRY_AND_DISPUTE';
    }
    const events = await pool.query(`SELECT count(*)::int AS count FROM private.realtime_events WHERE subject_id=$1 AND correlation_id=$2`, [participants[0].id, `expert-room:${id}`]);
    assert.ok(events.rows[0].count > 0, 'ROOM_RECIPIENT_EVENTS_NOT_DURABLE');
    await experts[0].page.waitForFunction(id => window.__repairStream.events.some(event => event.roomId === id), id, { timeout: 20000 });
    const observed = await experts[0].page.evaluate(id => window.__repairStream.events.filter(event => event.roomId === id), id);
    assert.equal(await experts[3].page.evaluate(id => window.__repairStream.events.some(event => event.roomId === id), id), false, 'OUTSIDER_RECEIVED_PRIVATE_ROOM_EVENT');
    const afterSequence = observed[0].sequence;
    await stream(experts[0], afterSequence);
    await experts[0].page.waitForFunction(id => window.__repairStream.events.some(event => event.roomId === id), id, { timeout: 20000 });
    const replayed = await experts[0].page.evaluate(id => window.__repairStream.events.filter(event => event.roomId === id), id);
    assert.ok(replayed.every(event => event.sequence > afterSequence), 'REPLAY_IGNORED_CURSOR');
    await api(owner, path, { action: 'CLOSE' }, { expected: [200] });
    return { serverDurationSeconds: duration, immutableAnswers: true, privateAnswers: true, reloadReadback: true, trustState: room.room.status, scoringGate: settlement, recipientEventCount: events.rows[0].count, secondBrowserSse: true, outsiderEventDenied: true, replayAfterCursor: true, receivedEvents: observed.length, replayedEvents: replayed.length };
  });
  for (const input of [
    { type: 'text', content: `Synthetic validation ${runTag}: verify this academic notice against independent source evidence before relying on it.` },
    { type: 'url', content: 'https://www.rfc-editor.org/rfc/rfc9110.html' },
    { type: 'image', content: '', metadata: { bytes: readFileSync(resolve(root, 'fixtures/trust-multimodal/screenshot-text.png')).toString('base64'), mimeType: 'image/png', fileName: 'synthetic-screenshot.png' } },
    { type: 'qr', content: '', metadata: { bytes: readFileSync(resolve(root, 'fixtures/trust-multimodal/01-https.png')).toString('base64'), mimeType: 'image/png', fileName: 'synthetic-qr.png' } },
  ]) await gate(`trust-canonical-${input.type}-persistence-owner-isolation`, async () => {
    const result = await api(owner, '/api/v1/trust', { ...input, depth: 'full', version: 'v5' }, { headers: { 'Idempotency-Key': `${runTag}:trust:${input.type}` }, expected: [200] });
    assert.equal(result.persistence?.persisted, true, 'AUTHENTICATED_CANONICAL_CASE_NOT_PERSISTED');
    assert.ok(result.caseId && result.caseRevision, 'DURABLE_CASE_REVISION_MISSING');
    report.retainedImmutableFixtureIds.push(result.caseId);
    const saved = await api(owner, `/api/v1/trust/cases/${result.caseId}?revision=${result.caseRevision}`, undefined, { expected: [200] });
    assert.ok(saved.case?.savedResult, 'OWNER_SNAPSHOT_READBACK_MISSING');
    assert.equal(Number(saved.case.savedResult.caseRevision), Number(result.caseRevision), 'OWNER_SNAPSHOT_REVISION_MISMATCH');
    await api(other, `/api/v1/trust/cases/${result.caseId}?revision=${result.caseRevision}`, undefined, { expected: [404] });
    const stages = await pool.query('SELECT stage_id,status FROM public.trust_stage_runs WHERE case_id=$1 ORDER BY stage_id', [result.caseId]);
    const revisions = await pool.query('SELECT count(*)::int AS count FROM public.trust_case_revisions WHERE case_id=$1', [result.caseId]);
    assert.equal(revisions.rows[0].count, 1);
    return { caseId: result.caseId, caseRevision: result.caseRevision, persisted: true, stages: stages.rows, providerMode: 'OFF', liveAiVerdictGate: 'BLOCKED_EXTERNAL_GEMINI_NOT_CONFIGURED' };
  });
  await gate('community-durable-publication-nested-comments-idempotency', async () => {
    const trustCase = report.gates.find(g => g.name === 'trust-canonical-text-persistence-owner-isolation' && g.status === 'PASS');
    assert.ok(trustCase?.caseId && trustCase.caseRevision, 'COMMUNITY_TRUST_CASE_FIXTURE_MISSING');
    const statement = 'Synthetic staging fixture: HTTP cache directives control when a response may be reused by a cache.';
    const preview = await api(owner, '/api/intelligence/community/posts', {
      caseId: trustCase.caseId,
      caseRevision: trustCase.caseRevision,
      statement,
      contributionType: 'CONTEXT',
      phase: 'PREVIEW',
    }, { expected: [200] });
    assert.equal(preview.state, 'PREVIEW_READY', 'COMMUNITY_PRIVACY_PREVIEW_NOT_READY');
    assert.equal(preview.preview?.validation?.ok, true, `COMMUNITY_PREVIEW_VALIDATION_${(preview.preview?.validation?.errors || []).join('_') || 'FAILED'}`);
    assert.ok(preview.preview?.previewDigest, 'COMMUNITY_PREVIEW_DIGEST_MISSING');
    const published = await api(owner, '/api/intelligence/community/posts', {
      caseId: trustCase.caseId,
      caseRevision: trustCase.caseRevision,
      statement,
      contributionType: 'CONTEXT',
      phase: 'PUBLISH',
      privacyConfirmed: true,
      previewDigest: preview.preview.previewDigest,
    }, { headers: { 'Idempotency-Key': `${runTag}:community:publish` }, expected: [201] });
    assert.equal(published.state, 'PUBLISHED', 'COMMUNITY_CONTRIBUTION_NOT_PUBLISHED');
    assert.equal(published.provenance, 'DURABLE_POSTGRES', 'COMMUNITY_FIXTURE_ORIGIN_NOT_DURABLE');
    const contributionId = published.post?.contributionId;
    assert.ok(contributionId, 'COMMUNITY_CONTRIBUTION_ID_MISSING');
    const linked = await pool.query(
      `SELECT case_id, case_revision, publication_state
         FROM public.community_contributions WHERE id = $1`,
      [contributionId]
    );
    assert.equal(linked.rows.length, 1, 'COMMUNITY_CONTRIBUTION_SQL_READBACK_MISSING');
    assert.equal(linked.rows[0].case_id, trustCase.caseId, 'COMMUNITY_TRUST_CASE_LINK_MISMATCH');
    assert.equal(Number(linked.rows[0].case_revision), Number(trustCase.caseRevision), 'COMMUNITY_TRUST_REVISION_LINK_MISMATCH');
    assert.equal(linked.rows[0].publication_state, 'PUBLISHED', 'COMMUNITY_PUBLICATION_STATE_NOT_DURABLE');

    const threadPath = `/api/intelligence/community/posts/${contributionId}/comments`;
    const rootText = 'Synthetic staging comment checks durable thread persistence.';
    const rootKey = `${runTag}:community:comment-root`;
    const root = await api(other, threadPath, { content: rootText }, { headers: { 'Idempotency-Key': rootKey }, expected: [201] });
    assert.equal(root.comment?.depth, 0, 'COMMUNITY_ROOT_DEPTH_MISMATCH');
    const retry = await api(other, threadPath, { content: rootText }, { headers: { 'Idempotency-Key': rootKey }, expected: [200] });
    assert.equal(retry.comment?.commentId, root.comment.commentId, 'COMMUNITY_IDEMPOTENT_COMMENT_CHANGED');
    assert.equal(retry.comment?.idempotent, true, 'COMMUNITY_IDEMPOTENT_RETRY_NOT_RECOGNIZED');
    const reply = await api(owner, threadPath, { content: 'Synthetic nested reply confirms parent linkage.', parentCommentId: root.comment.commentId }, {
      headers: { 'Idempotency-Key': `${runTag}:community:comment-reply` }, expected: [201],
    });
    assert.equal(reply.comment?.depth, 1, 'COMMUNITY_REPLY_DEPTH_MISMATCH');
    assert.equal(reply.comment?.parentCommentId, root.comment.commentId, 'COMMUNITY_REPLY_PARENT_MISMATCH');
    const visible = await api(other, threadPath, undefined, { expected: [200] });
    assert.equal(visible.comments?.length, 1, 'COMMUNITY_PUBLIC_THREAD_ROOT_MISSING');
    assert.equal(visible.comments[0].commentId, root.comment.commentId, 'COMMUNITY_PUBLIC_ROOT_ID_MISMATCH');
    assert.equal(visible.comments[0].replies?.length, 1, 'COMMUNITY_NESTED_REPLY_READBACK_MISSING');
    assert.equal(visible.comments[0].replies[0].commentId, reply.comment.commentId, 'COMMUNITY_NESTED_REPLY_ID_MISMATCH');
    const rows = await pool.query(
      `SELECT depth, parent_comment_id FROM public.community_comments
        WHERE contribution_id = $1 ORDER BY depth, created_at, id`,
      [contributionId]
    );
    assert.equal(rows.rows.length, 2, 'COMMUNITY_COMMENT_SQL_ROW_COUNT_MISMATCH');
    assert.deepEqual(rows.rows.map(row => Number(row.depth)), [0, 1], 'COMMUNITY_COMMENT_SQL_DEPTH_MISMATCH');
    assert.equal(rows.rows[1].parent_comment_id, root.comment.commentId, 'COMMUNITY_COMMENT_SQL_PARENT_MISMATCH');
    return { previewConfirmed: true, publishedToPostgres: true, trustCaseRevisionLinked: true, publicReadback: true, nestedCommentDepths: [0, 1], idempotentRetry: true };
  });
} catch (e) {
  report.gates.push({ name: 'staging-setup', status: 'FAIL', code: /^[A-Z0-9_:-]{1,120}$/.test(e.message) ? e.message : e.name });
} finally {
  for (const user of users) {
    try {
      if (user.page) {
        const token = await user.page.evaluate(() => {
          const key = Object.keys(localStorage).find(key => /^sb-.+-auth-token$/.test(key));
          if (!key) return null;
          try { return JSON.parse(localStorage.getItem(key)).access_token || null; } catch { return null; }
        });
        if (token) { const { error } = await auth.auth.admin.signOut(token, 'global'); if (error) throw new Error('SYNTHETIC_REFRESH_SESSION_REVOKE_FAILED'); }
      }
      if (user.page) await api(user, '/api/auth/session/logout', undefined, { method: 'POST', expected: [200, 401] });
      await pool.query('UPDATE private.user_roles SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]);
      await pool.query("UPDATE private.expert_verifications SET suspended_at=now() WHERE user_id=$1", [user.id]);
      const { error } = await auth.auth.admin.updateUserById(user.id, { ban_duration: '876000h' });
      if (error) throw new Error('SYNTHETIC_USER_BAN_FAILED');
      await pool.query('DELETE FROM private.server_sessions WHERE user_id=$1', [user.id]);
      report.cleanup.push({ userId: user.id, status: 'SYNTHETIC_IDENTITY_DISABLED_ROLES_REVOKED', history: 'IMMUTABLE_HISTORY_RETAINED_WITH_RUN_LABEL' });
    } catch (e) { report.cleanup.push({ userId: user.id, status: 'FAIL', code: /^[A-Z0-9_:-]{1,120}$/.test(e.message) ? e.message : e.name }); }
    await user.context?.close().catch(() => {});
  }
  await browser?.close(); await pool.end(); save();
  console.log(JSON.stringify({ report: file, projectRef, gates: report.gates, cleanup: report.cleanup.map(({ status }) => status) }));
  if (report.gates.some(g => g.status === 'FAIL') || report.cleanup.some(c => c.status === 'FAIL')) process.exitCode = 1;
}
