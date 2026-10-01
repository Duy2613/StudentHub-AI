// Local PostgreSQL rehearsal only. Never accepts a cloud DATABASE_URL.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = 'studenthub-migration-assurance-20261001';
const suffix = process.argv[2] || '20261001';
assert.match(suffix, /^[a-z0-9_]{1,40}$/);
const artifactDir = path.join(root, 'artifacts/production-blocker-closure/reconciliation-20261001');
fs.mkdirSync(artifactDir, { recursive: true });
function docker(args, input, mustPass = true) {
  const result = spawnSync('docker', args, { cwd: root, input, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (mustPass && result.status !== 0) throw new Error((result.stderr || result.stdout || 'Docker failed').trim());
  return result;
}
const info = JSON.parse(docker(['inspect', container]).stdout)[0];
assert.equal(info.Config.Image, 'postgres:17.6');
assert.equal(info.HostConfig.NetworkMode, 'none');
assert.equal(Object.keys(info.HostConfig.PortBindings || {}).length, 0);
function sql(database, query, mustPass = true) {
  assert.match(database, /^studenthub_reconcile_[a-z0-9_]+$|^postgres$/);
  return docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database, '-At'], query, mustPass);
}
function json(database, query) { return JSON.parse(sql(database, query).stdout.trim()); }
function create(database, template) {
  assert.equal(sql('postgres', `select count(*) from pg_database where datname = '${database}';`).stdout.trim(), '0', 'Refusing database overwrite');
  sql('postgres', `create database ${database}${template ? ` template ${template}` : ''};`);
}
const dir = path.join(root, 'database/migrations');
const migrations = fs.readdirSync(dir).filter(file => /^\d+.*\.sql$/.test(file)).sort();
const report = { recordedAt: new Date().toISOString(), image: info.Config.Image, network: 'none', migrationCount: migrations.length, migrations: [], gates: {}, limitations: [
  'Vanilla PostgreSQL17.6 with minimal Supabase Auth/Storage compatibility, not the full Supabase platform.',
  'Upgrade fixtures reproduce read-only observed table/column/check drift and synthetic data; they are not production/staging dumps.',
  'Cloud policies, grants, functions, triggers and indexes remain unverified where list_tables does not expose them.',
] };
function apply(database, file) {
  const start = performance.now();
  sql(database, 'begin; set local lock_timeout = \'5s\'; set local statement_timeout = \'60s\';\n' + fs.readFileSync(path.join(dir, file), 'utf8') + '\ncommit;');
  report.migrations.push({ database, file, result: 'PASS', durationMs: Math.round(performance.now() - start) });
}
const fresh = `studenthub_reconcile_fresh_${suffix}`;
create(fresh);
sql(fresh, `
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  end $$;
  create schema auth;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}');
  create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''app.test_uid'', true), '''')::uuid';
  grant usage on schema auth to authenticated, service_role;
  create schema storage;
  create table storage.buckets(id text primary key, name text not null, public boolean not null default false, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text not null references storage.buckets(id), name text not null);
  create function storage.foldername(text) returns text[] language sql immutable as 'select string_to_array($1, ''/'')';
`);
for (const file of migrations) apply(fresh, file);
report.gates.FRESH_DB_MIGRATION_CHAIN = 'PASS';
console.log(`FRESH_DB_MIGRATION_CHAIN=PASS MIGRATIONS=${migrations.length}`);

const fingerprintQuery = `select json_build_object(
 'tables', (select json_agg(x order by x.name) from (select n.nspname||'.'||c.relname as name, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls, c.relacl::text as grants from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','private')) x),
 'columns', (select json_agg(x order by x.name) from (select n.nspname||'.'||c.relname||'.'||a.attname as name, format_type(a.atttypid,a.atttypmod) as type, a.attnotnull as not_null, a.attidentity as identity, a.attgenerated as generated, pg_get_expr(d.adbin,d.adrelid) as default_value from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where c.relkind='r' and n.nspname in ('public','private') and a.attnum>0 and not a.attisdropped) x),
 'constraints', (select json_agg(x order by x.name) from (select n.nspname||'.'||r.relname||'.'||c.conname as name, c.contype as type, c.convalidated as validated, pg_get_constraintdef(c.oid) as definition from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace where n.nspname in ('public','private')) x),
 'indexes', (select json_agg(x order by x.name) from (select schemaname||'.'||indexname as name, indexdef as definition from pg_indexes where schemaname in ('public','private')) x),
 'policies', (select json_agg(x order by x.name) from (select schemaname||'.'||tablename||'.'||policyname as name, permissive, roles, cmd, qual, with_check from pg_policies where schemaname in ('public','private')) x),
 'schemas', (select json_agg(x order by x.name) from (select nspname as name,nspacl::text as grants from pg_namespace where nspname in ('public','private')) x),
 'sequences', (select json_agg(x order by x.name) from (select n.nspname||'.'||c.relname as name,c.relacl::text as grants from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='S' and n.nspname in ('public','private')) x),
 'functions', (select json_agg(x order by x.name) from (select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as name,pg_get_functiondef(p.oid) as definition,p.proacl::text as grants from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')) x),
 'triggers', (select json_agg(x order by x.name) from (select n.nspname||'.'||c.relname||'.'||t.tgname as name,pg_get_triggerdef(t.oid) as definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and not t.tgisinternal) x)
);`;
const canonical = json(fresh, fingerprintQuery);
const v5Tables = canonical.tables.filter(x => /^private\.expert_(v5_|mission_|daily_missions$|room_|verification_rooms$)/.test(x.name)).map(x => x.name);
assert.equal(v5Tables.length, 27, "Question Bank adds six canonical Expert V5 relations");
fs.writeFileSync(path.join(artifactDir, 'CANONICAL_SCHEMA_FINGERPRINT.json'), JSON.stringify(canonical, null, 2) + '\n');
report.canonicalFingerprintSha256 = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
const forward = migrations.filter(x => x.startsWith('20261001'));
const oneShotMigrations = new Set(['202610010004_grounded_multimodal_question_bank.sql']);
const replaySafeForward = forward.filter(file => !oneShotMigrations.has(file));
for (const file of replaySafeForward) apply(fresh, file);
assert.deepEqual(json(fresh, fingerprintQuery), canonical, 'Replay-safe forward migrations must be idempotent');
report.oneShotMigrationsExcludedFromReplayCheck = [...oneShotMigrations];
report.gates.FORWARD_MIGRATION_IDEMPOTENCY = 'PASS_FOR_REPLAY_SAFE_MIGRATIONS';

const userId = '10000000-0000-4000-8000-000000000001';
const otherId = '10000000-0000-4000-8000-000000000002';
function seed(database, counts) {
  sql(database, `
    insert into auth.users(id,email) values ('${userId}','fixture-owner@local.invalid'),('${otherId}','fixture-other@local.invalid');
    insert into auth.users(id,email) select md5('fixture-user-'||i)::uuid,'fixture-'||i||'@local.invalid' from generate_series(3,20) i;
    -- The canonical auth trigger may already create the profile projection.
    insert into public.profiles(id,display_name) select id,'Synthetic rehearsal account' from auth.users on conflict(id) do nothing;
    insert into public.trust_cases(id,owner_id) select md5('fixture-case-'||i)::uuid,'${userId}' from generate_series(1,${counts.cases}) i;
    insert into public.trust_runs(id,case_id,owner_id,status,pipeline_version,started_at)
      select md5('fixture-run-'||i)::uuid,md5('fixture-case-1')::uuid,'${userId}','COMPLETED','rehearsal-only',now() from generate_series(1,${Math.max(1, counts.stages)}) i;
    insert into public.trust_stage_runs(run_id,case_id,owner_id,stage_id,stage_index,status)
      select md5('fixture-run-'||i)::uuid,md5('fixture-case-1')::uuid,'${userId}','l1',0,'COMPLETED' from generate_series(1,${counts.stages}) i;
    insert into private.reputation_events(user_id,domain_code,event_type,delta,reason)
      select '${userId}','GENERAL_EPISTEMICS','REHEARSAL',0,'Synthetic preservation fixture' from generate_series(1,${counts.reputation}) i;
    insert into private.integration_outbox(event_id,integration,aggregate_type,aggregate_id,event_type,schema_version,occurred_at,produced_at,producer,environment,correlation_id,subject,classification,payload,payload_hash)
      select 'rehearsal-'||i,'LABBE','CASE','rehearsal-case','REHEARSAL','v1',now(),now(),'local-rehearsal','DISPOSABLE','rehearsal-'||i,'fixture','INTERNAL','{}',decode(repeat('ab',32),'hex') from generate_series(1,${counts.outbox}) i;
    insert into private.expert_review_requests(requester_id,case_id,case_revision,domain_code,question,idempotency_key,request_digest)
      select '${userId}',md5('fixture-case-'||i)::uuid,1,'GENERAL_EPISTEMICS','Synthetic rehearsal question only.','rehearsal-'||i,decode(repeat('ab',32),'hex') from generate_series(1,${counts.reviews}) i;
  `);
}
const preservationTables = ['public.profiles','public.trust_cases','public.trust_runs','public.trust_stage_runs','private.reputation_events','private.integration_outbox','private.expert_review_requests'];
function preserve(database) {
  return Object.fromEntries(preservationTables.map(table => {
    const omitted = table === 'private.integration_outbox' ? ['lease_token','lease_count','shadow_count','shadowed_at'] : table === 'private.reputation_events' ? ['context','idempotency_key'] : table === 'private.expert_review_requests' ? ['community_contribution_id'] : [];
    const subtract = omitted.map(name => ` - '${name}'`).join('');
    return [table, json(database, `select json_build_object('rows',count(*),'digest',md5(coalesce(string_agg((to_jsonb(t)${subtract})::text, E'\\n' order by id),'empty'))) from ${table} t;`)];
  }));
}
const stageColumns = ['notification_key','dedupe_key','task_id','status','priority','source_type','source_id','action_url','due_at','scheduled_at','expires_at','sent_at','acknowledged_at','metadata','history','payload','revision','updated_at'];
for (const environment of ['production','staging']) {
  const database = `studenthub_reconcile_${environment}_${suffix}`;
  create(database, fresh);
  sql(database, `drop table public.community_comments;
    alter table public.trust_stage_runs drop constraint trust_stage_runs_stage_id_check;
    alter table public.trust_stage_runs add constraint trust_stage_runs_stage_id_check check(stage_id in ('l1','l2a','l2b','l2c','l3','l4','l5'));`);
  let plan;
  if (environment === 'production') {
    sql(database, v5Tables.map(table => `drop table ${table} cascade;`).join('\n') + `
      alter table private.expert_review_requests drop column community_contribution_id;
      alter table private.reputation_events drop column context;
      alter table private.integration_outbox drop column lease_token,drop column lease_count,drop column shadow_count,drop column shadowed_at;
      alter table private.integration_outbox drop constraint integration_outbox_status_check;
      alter table private.integration_outbox add constraint integration_outbox_status_check check(status in ('PENDING','IN_FLIGHT','DELIVERED','FAILED'));
      drop function private.expert_v5_reject_immutable_mutation();`);
    plan = ['20260926111838_community_nested_comments.sql','20260926112754_community_expert_request_linkage.sql','20260927032100_trust_four_layer_stage_constraint.sql','20260929135354_studenthub_expert_v5_missions_rooms.sql','20260929135553_expert_v5_trigger_path_and_fk_indexes.sql', ...forward];
    seed(database, { cases: 1025, stages: 1366, reputation: 328, outbox: 372, reviews: 573 });
  } else {
    sql(database, `drop table public.academic_workflow_task_events,public.academic_workflow_tasks,public.academic_workflow_plans;
      drop table private.demo_entitlements;
      alter table private.reputation_events drop column idempotency_key;
      drop index private.idx_reputation_events_user_id;
      alter table public.notifications ${stageColumns.map(name => `drop column ${name}`).join(',')};
      alter table public.profiles drop constraint profiles_major_check,drop constraint profiles_avatar_id_check;
      alter table public.profiles add constraint legacy_major_guard check(major is null or char_length(major)<=160);
      alter table public.profiles add constraint legacy_avatar_guard check(avatar_id is null or avatar_id ~ '^[a-z0-9-]{1,80}$'::text);
      alter table public.profiles add column institution_label text;`);
    plan = ['202609170001_durable_academic_workflows.sql','202609170002_demo_entitlements.sql','202609180001_reputation_events_idempotency.sql','20260926111838_community_nested_comments.sql','20260927032100_trust_four_layer_stage_constraint.sql', ...forward];
    seed(database, { cases: 7, stages: 0, reputation: 0, outbox: 0, reviews: 7 });
    sql(database, `update public.profiles set institution_label='Legacy field preservation fixture' where id='${userId}';
      insert into private.expert_verification_rooms(host_user_id,domain_code,input_type,challenge_payload,idempotency_key,request_hash)
        values ('${userId}','GENERAL_EPISTEMICS','TEXT','{}','rehearsal-existing-room',repeat('ab',32));
      insert into private.expert_room_events(room_id,event_type,idempotency_key)
        select id,'ROOM_CREATED','rehearsal-existing-event' from private.expert_verification_rooms;`);
  }
  const before = preserve(database);
  const oldRoomDigest = environment === 'staging' ? sql(database, `select md5(json_agg(x order by x.id)::text) from private.expert_room_events x;`).stdout.trim() : null;
  for (const file of plan) apply(database, file);
  assert.deepEqual(preserve(database), before, 'Migration must preserve every synthetic existing row/value');
  if (oldRoomDigest) assert.equal(sql(database, `select md5(json_agg(x order by x.id)::text) from private.expert_room_events x;`).stdout.trim(), oldRoomDigest);
  const after = json(database, fingerprintQuery);
  // Preserve legacy extras while comparing the full canonical object set.
  for (const [category, rows] of Object.entries(canonical)) {
    const names = new Set((rows || []).map(x => x.name));
    assert.deepEqual((after[category] || []).filter(x => names.has(x.name)), rows || [], `${environment} ${category} canonical fingerprint mismatch`);
  }
  report[environment] = { database, plan, before, after: preserve(database), legacyInstitutionLabelPreserved: environment === 'staging', localCanonicalFingerprint: 'MATCH' };
  report.gates[environment.toUpperCase() + '_UPGRADE_SIMULATION'] = 'PASS_OBSERVED_SCHEMA_FIXTURE';
  console.log(`${environment.toUpperCase()}_UPGRADE_SIMULATION=PASS_OBSERVED_SCHEMA_FIXTURE DATA_PRESERVATION=PASS`);
}

// Transactional negative shape test: a mistaken type must stop reconciliation.
const incompatible = `studenthub_reconcile_incompatible_${suffix}`;
create(incompatible, fresh);
sql(incompatible, 'alter table private.integration_outbox drop column lease_token; alter table private.integration_outbox add column lease_token text;');
const failure = sql(incompatible, fs.readFileSync(path.join(dir, forward[0]), 'utf8'), false);
assert.notEqual(failure.status, 0);
assert.match(failure.stderr, /OUTBOX_RECONCILIATION_INCOMPATIBLE_FIELD/);
report.gates.INCOMPATIBLE_SCHEMA_REJECTED = 'PASS';
const incompatibleProfile = `studenthub_reconcile_profile_guard_${suffix}`;
create(incompatibleProfile, fresh);
sql(incompatibleProfile, 'alter table public.profiles drop constraint profiles_major_check; alter table public.profiles add constraint profiles_major_check check(char_length(major)<=200);');
const profileFailure = sql(incompatibleProfile, fs.readFileSync(path.join(dir, forward[1]), 'utf8'), false);
assert.notEqual(profileFailure.status, 0);
assert.match(profileFailure.stderr, /PROFILE_PRESENTATION_UNREVIEWED_CHECK/);
report.gates.UNREVIEWED_PROFILE_CHECK_REJECTED = 'PASS';

// Real PostgreSQL grants/RLS/FK/append-only assertions, never a cloud user bypass.
seed(fresh, { cases: 1, stages: 0, reputation: 0, outbox: 0, reviews: 1 });
const denied = sql(fresh, 'begin; set local role authenticated; select * from public.community_comments; rollback;', false);
assert.notEqual(denied.status, 0);
assert.match(denied.stderr, /permission denied/);
const deniedCases = sql(fresh, 'begin; set local role authenticated; select * from public.trust_cases; rollback;', false);
assert.notEqual(deniedCases.status, 0);
assert.match(deniedCases.stderr, /permission denied/);
assert.equal(sql(fresh, `begin; set local role authenticated; set local app.test_uid='${otherId}'; select count(id) from public.profiles where id='${userId}'; rollback;`).stdout.includes('\n0\n'), true);
assert.equal(sql(fresh, `begin; set local role authenticated; set local app.test_uid='${userId}'; select count(id) from public.profiles where id='${userId}'; rollback;`).stdout.includes('\n1\n'), true);
sql(fresh, `begin; set local role service_role;
  insert into private.expert_verification_rooms(host_user_id,domain_code,input_type,challenge_payload,idempotency_key,request_hash)
    values ('${userId}','GENERAL_EPISTEMICS','TEXT','{}','rehearsal-new-room',repeat('ab',32));
  insert into private.expert_room_events(room_id,event_type,idempotency_key)
    select id,'ROOM_CREATED','rehearsal-new-event' from private.expert_verification_rooms;
  commit;`);
const immutable = sql(fresh, `update private.expert_room_events set payload='{"tampered":true}';`, false);
assert.notEqual(immutable.status, 0);
assert.match(immutable.stderr, /append-only/);
for (const name of ['expert_v5_source_events','expert_v5_question_events','expert_mission_events','expert_room_events']) {
  assert.equal(sql(fresh, `select has_sequence_privilege('service_role',pg_get_serial_sequence('private.${name}','id'),'USAGE') and has_sequence_privilege('service_role',pg_get_serial_sequence('private.${name}','id'),'SELECT');`).stdout.trim(), 't');
  assert.equal(sql(fresh, `select has_table_privilege('authenticated','private.${name}','SELECT');`).stdout.trim(), 'f');
}
sql(fresh, `insert into public.community_contributions(author_id,case_id,case_revision,contribution_type,statement,public_statement,content_digest)
  values ('${userId}',md5('fixture-case-1')::uuid,1,'CONTEXT','Synthetic community rehearsal fixture.','Synthetic community rehearsal fixture.',decode(repeat('ab',32),'hex'));
  insert into public.community_comments(contribution_id,author_id,content,idempotency_key,request_digest)
    select id,'${userId}','Parent fixture','parent-fixture',decode(repeat('ab',32),'hex') from public.community_contributions;
  insert into public.community_comments(contribution_id,parent_comment_id,author_id,content,depth,idempotency_key,request_digest)
    select contribution_id,id,'${userId}','Nested fixture',1,'reply-fixture',decode(repeat('ab',32),'hex') from public.community_comments;
  update private.expert_review_requests set community_contribution_id=(select id from public.community_contributions limit 1);`);
const fkFailure = sql(fresh, `insert into public.community_comments(contribution_id,parent_comment_id,author_id,content,idempotency_key,request_digest)
  select contribution_id,'ffffffff-ffff-4fff-8fff-ffffffffffff','${userId}','Invalid parent','invalid-parent',decode(repeat('ab',32),'hex') from public.community_comments limit 1;`, false);
assert.notEqual(fkFailure.status, 0);
assert.match(fkFailure.stderr, /foreign key constraint/);
report.gates.LOCAL_POSTGRES_RLS_GRANTS_APPEND_ONLY = 'PASS';
report.gates.LOCAL_COMMUNITY_NESTED_FK_LINKAGE = 'PASS';
fs.writeFileSync(path.join(artifactDir, 'DISPOSABLE_MIGRATION_RESULTS.json'), JSON.stringify(report, null, 2) + '\n');
console.log('LOCAL_SCHEMA_CONTRACT=PASS RLS_GRANTS=PASS IMMUTABILITY=PASS NESTED_COMMENT_FK=PASS');
