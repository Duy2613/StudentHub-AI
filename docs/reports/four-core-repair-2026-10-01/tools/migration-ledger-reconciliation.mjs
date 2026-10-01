// Read-only comparison of repository migration blobs with live Supabase ledgers.
// It never applies DDL, edits migration history, or reads application rows.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../../../..');
const operatorRoot = process.env.STUDENTHUB_OPERATOR_ROOT;
const sourceSha = process.argv[2] || 'eea55564ebaef4dc2edc7af14586fe8f04324114';
if (!operatorRoot) throw new Error('OPERATOR_ROOT_REQUIRED');
if (execFileSync('git', ['merge-base', 'HEAD', sourceSha], { cwd: root, encoding: 'utf8' }).trim() !== sourceSha) throw new Error('CANDIDATE_NOT_IN_CURRENT_BRANCH');

const { Pool } = createRequire(resolve(root, 'frontend/package.json'))('pg');
const migrationDir = resolve(root, 'database/migrations');
const normalize = (value) => String(value ?? '').replace(/\r\n?/g, '\n').replace(/\n+$/, '');
const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
function canonicalSql(value) {
  const sql = normalize(value);
  let out = '';
  let i = 0;
  let pendingSpace = false;
  const append = (chunk) => {
    if (pendingSpace && out && !out.endsWith(' ')) out += ' ';
    pendingSpace = false;
    out += chunk;
  };
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) { pendingSpace = true; i += 1; continue; }
    if (ch === '-' && sql[i + 1] === '-') {
      i += 2;
      while (i < sql.length && sql[i] !== '\n') i += 1;
      pendingSpace = true;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2;
      let depth = 1;
      while (i < sql.length && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') { depth += 1; i += 2; }
        else if (sql[i] === '*' && sql[i + 1] === '/') { depth -= 1; i += 2; }
        else i += 1;
      }
      pendingSpace = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let end = i + 1;
      while (end < sql.length) {
        if (quote === "'" && sql[end] === '\\') { end += 2; continue; }
        if (sql[end] === quote && sql[end + 1] === quote) { end += 2; continue; }
        if (sql[end] === quote) break;
        end += 1;
      }
      append(sql.slice(i, Math.min(sql.length, end + 1)));
      i = Math.min(sql.length, end + 1);
      continue;
    }
    if (ch === '$') {
      const tag = sql.slice(i).match(/^\$[a-zA-Z_0-9]*\$/)?.[0];
      if (tag) {
        const close = sql.indexOf(tag, i + tag.length);
        if (close >= 0) {
          append(sql.slice(i, close + tag.length));
          i = close + tag.length;
          continue;
        }
      }
    }
    append(ch);
    i += 1;
  }
  return out.trim();
}
const schemaQuery = [
  'SELECT jsonb_build_object(',
  "'tables',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private','storage','auth') AND c.relkind='r'),",
  "'columns',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'table_name',c.relname,'name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY n.nspname,c.relname,a.attnum) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE n.nspname IN ('public','private','storage','auth') AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped),",
  "'constraints',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'table_name',c.relname,'name',con.conname,'type',con.contype,'validated',con.convalidated,'definition',pg_get_constraintdef(con.oid)) ORDER BY n.nspname,c.relname,con.conname) FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private','storage','auth')),'indexes',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'unique',i.indisunique,'valid',i.indisvalid,'definition',pg_get_indexdef(i.indexrelid)) ORDER BY n.nspname,c.relname) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private','storage','auth')),",
  "'policies',(SELECT jsonb_agg(jsonb_build_object('schema',schemaname,'table_name',tablename,'name',policyname,'command',cmd,'roles',roles,'using',qual,'check',with_check) ORDER BY schemaname,tablename,policyname) FROM pg_policies WHERE schemaname IN ('public','private','storage','auth')),",
  "'routines',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),'security_definer',p.prosecdef,'definition_hash',md5(pg_get_functiondef(p.oid))) ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private','storage','auth') AND p.prokind IN ('f','p')),",
  "'triggers',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'table_name',c.relname,'name',tr.tgname,'enabled',tr.tgenabled,'definition',pg_get_triggerdef(tr.oid)) ORDER BY n.nspname,c.relname,tr.tgname) FROM pg_trigger tr JOIN pg_class c ON c.oid=tr.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private','storage','auth') AND NOT tr.tgisinternal)"
  , ') AS catalog'
].join('\n');

function expectedObjects(sql) {
  const out = [];
  const patterns = [
    ['table', /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_][\w$]*)\.([a-z_][\w$]*)/gi],
    ['routine', /\bcreate\s+(?:or\s+replace\s+)?function\s+([a-z_][\w$]*)\.([a-z_][\w$]*)/gi],
    ['trigger', /\bcreate\s+trigger\s+([a-z_][\w$]*)[\s\S]*?\bon\s+([a-z_][\w$]*)\.([a-z_][\w$]*)/gi],
    ['policy', /\bcreate\s+policy\s+([a-z_][\w$]*)[\s\S]*?\bon\s+([a-z_][\w$]*)\.([a-z_][\w$]*)/gi],
    ['index', /\bcreate\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-z_][\w$]*)[\s\S]*?\bon\s+([a-z_][\w$]*)\.([a-z_][\w$]*)/gi],
    ['constraint', /\badd\s+constraint\s+([a-z_][\w$]*)/gi],
    ['column', /\badd\s+column\s+(?:if\s+not\s+exists\s+)?([a-z_][\w$]*)/gi]
  ];
  for (const [kind, re] of patterns) {
    let m;
    while ((m = re.exec(sql))) {
      if (kind === 'table' || kind === 'routine') out.push({ kind, schema: m[1], name: m[2] });
      else if (kind === 'trigger' || kind === 'policy') out.push({ kind, name: m[1], schema: m[2], table: m[3] });
      else if (kind === 'index') out.push({ kind, name: m[1], schema: m[2], table: m[3] });
      else if (kind === 'constraint' || kind === 'column') {
        const before = sql.slice(Math.max(0, m.index - 500), m.index);
        const table = [...before.matchAll(/\balter\s+table\s+(?:if\s+exists\s+)?([a-z_][\w$]*)\.([a-z_][\w$]*)/gi)].at(-1);
        out.push({ kind, name: m[1], schema: table?.[1] ?? null, table: table?.[2] ?? null });
      }
    }
  }
  return [...new Map(out.map((x) => [JSON.stringify(x), x])).values()];
}

function presence(expected, catalog) {
  return expected.map((o) => {
    let found = false;
    if (o.kind === 'table') found = (catalog.tables ?? []).some((x) => x.schema === o.schema && x.name === o.name);
    if (o.kind === 'routine') found = (catalog.routines ?? []).some((x) => x.schema === o.schema && x.name === o.name);
    if (o.kind === 'trigger') found = (catalog.triggers ?? []).some((x) => x.schema === o.schema && x.table_name === o.table && x.name === o.name);
    if (o.kind === 'policy') found = (catalog.policies ?? []).some((x) => x.schema === o.schema && x.table_name === o.table && x.name === o.name);
    if (o.kind === 'index') found = (catalog.indexes ?? []).some((x) => x.schema === o.schema && x.name === o.name);
    if (o.kind === 'constraint') found = (catalog.constraints ?? []).some((x) => x.schema === o.schema && x.table_name === o.table && x.name === o.name);
    if (o.kind === 'column') found = (catalog.columns ?? []).some((x) => x.schema === o.schema && x.table_name === o.table && x.name === o.name);
    return { ...o, present: found };
  });
}

const files = readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort();
const repositoryMigrations = files.map((name) => {
  const path = 'database/migrations/' + name;
  const blob = execFileSync('git', ['show', sourceSha + ':' + path], { cwd: root });
  const stem = name.slice(0, -4);
  const split = stem.indexOf('_');
  return { path, version: stem.slice(0, split), slug: stem.slice(split + 1), name: stem, blob, sql: normalize(blob.toString('utf8')), sha256: hash('sha256', blob) };
});

function normalizedLedgerName(name) {
  return String(name ?? '').replace(/\.sql$/i, '').replace(/^\d{8,}_/, '');
}
function nameMatches(entryName, migration) {
  const n = normalizedLedgerName(entryName);
  return n === migration.slug || n === migration.name || n === migration.slug + '_' + migration.version || n === migration.version + '_' + migration.slug;
}

const environments = [];
for (const [label, projectRef, envFile] of [['production','kytdomflmjytzyaabogi','.env.local'],['staging','bniwtkjtramqaozrrtrk','.env.staging.local']]) {
  const env = parseEnv(readFileSync(resolve(operatorRoot, 'frontend', envFile), 'utf8'));
  const target = new URL(env.DATABASE_URL);
  if (new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !== projectRef + '.supabase.co' || !(target.hostname === 'db.' + projectRef + '.supabase.co' || target.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(target.username) === 'postgres.' + projectRef)) throw new Error(label.toUpperCase() + '_READ_ONLY_IDENTITY_MISMATCH');
  const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false', ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, '\n') } : {}) }, max: 1 });
  try {
    const client = await pool.connect();
    let catalog;
    let ledger;
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      catalog = (await client.query(schemaQuery)).rows[0].catalog;
      ledger = (await client.query('SELECT version,name,statements,md5(statements::text) AS statements_hash FROM supabase_migrations.schema_migrations ORDER BY version')).rows;
      await client.query('COMMIT');
    } finally { client.release(); }
    const rows = repositoryMigrations.map((migration) => {
      const rawSqlMatches = ledger.filter((entry) => (entry.statements ?? []).some((statement) => normalize(statement) === migration.sql));
      const executableSqlMatches = ledger.filter((entry) => (entry.statements ?? []).some((statement) => canonicalSql(statement) === canonicalSql(migration.sql)));
      const versionMatches = ledger.filter((entry) => entry.version === migration.version);
      const nameMatchesRows = ledger.filter((entry) => nameMatches(entry.name, migration));
      const matched = rawSqlMatches[0] || executableSqlMatches[0];
      const expected = presence(expectedObjects(migration.sql), catalog);
      let status;
      let reason;
      if (matched) {
        const exactIdentity = matched.version === migration.version && normalizedLedgerName(matched.name) === migration.slug;
        const rawMatches = rawSqlMatches.includes(matched);
        status = exactIdentity && rawMatches ? 'APPLIED_EXACT' : 'APPLIED_EQUIVALENT';
        reason = status === 'APPLIED_EXACT' ? 'ledger version/name and stored SQL match repository blob' : (rawMatches ? 'stored SQL matches repository blob; ledger version/name is an alias' : 'executable SQL matches after removing comments and insignificant whitespace; source SHA remains separately recorded');
      } else if (versionMatches.length && versionMatches.some((entry) => !nameMatches(entry.name, migration))) {
        status = 'NAME_MISMATCH';
        reason = 'repository version exists under a different ledger name and stored SQL does not match';
      } else if (nameMatchesRows.length) {
        status = 'HASH_MISMATCH';
        reason = 'ledger name maps to this repository migration, but stored SQL differs';
      } else if (versionMatches.length) {
        status = 'NAME_MISMATCH';
        reason = 'repository version exists but ledger name does not match';
      } else if (expected.length && expected.every((object) => !object.present)) {
        status = 'NOT_APPLIED';
        reason = 'no matching ledger content/name/version and all parsed target objects are absent';
      } else {
        status = 'UNKNOWN';
        reason = expected.length ? 'no matching ledger content/name/version; some target objects exist or source has no fully classifiable object set' : 'no ledger match and no reliable target-object proof';
      }
      return {
        path: migration.path,
        version: migration.version,
        name: migration.slug,
        sha256: migration.sha256,
        status,
        reason,
        matchedLedger: matched ? { version: matched.version, name: matched.name, statementsHash: matched.statements_hash } : (nameMatchesRows[0] || versionMatches[0] ? { version: (nameMatchesRows[0] || versionMatches[0]).version, name: (nameMatchesRows[0] || versionMatches[0]).name, statementsHash: (nameMatchesRows[0] || versionMatches[0]).statements_hash } : null),
        targetObjects: expected
      };
    });
    environments.push({ label, projectRef, observedAt: new Date().toISOString(), catalogSha256: hash('sha256', JSON.stringify(catalog)), ledgerCount: ledger.length, rows });
  } finally { await pool.end(); }
}

const report = { generatedAt: new Date().toISOString(), candidateSourceSha: sourceSha, evidenceCommit: execFileSync('git', ['rev-parse','HEAD'], { cwd: root, encoding: 'utf8' }).trim(), readOnly: true, migrationCount: repositoryMigrations.length, environments };
const dir = resolve(root, 'docs/reports/four-core-repair-2026-10-01');
writeFileSync(resolve(dir, 'migration-ledger-reconciliation.json'), JSON.stringify(report, null, 2) + '\n');
const lines = [
  '# Migration ledger reconciliation', '',
  'Candidate source SHA: ' + sourceSha + '  ',
  'Evidence commit: ' + report.evidenceCommit + '  ',
  'Read mode: repeatable-read, read-only PostgreSQL transactions; no DDL or ledger writes.  ',
  'Repository migration files: ' + repositoryMigrations.length + '.', '',
  'Each row records the SHA-256 of the candidate Git blob. APPLIED_EXACT requires matching local version/name and matching stored SQL text after line-ending normalization. APPLIED_EQUIVALENT means the executable SQL matches after removing comments and insignificant whitespace, or the exact SQL is recorded under a ledger version/name alias. NOT_APPLIED requires no matching ledger content/name/version and all parsed target objects absent. HASH_MISMATCH and UNKNOWN remain explicit where equivalence is not proven.', ''
];
for (const env of environments) {
  const counts = Object.fromEntries(['APPLIED_EXACT','APPLIED_EQUIVALENT','NOT_APPLIED','HASH_MISMATCH','NAME_MISMATCH','UNKNOWN'].map((s) => [s, env.rows.filter((r) => r.status === s).length]));
  lines.push('## ' + env.label + ' — ' + env.projectRef, '', 'Observed catalog SHA-256: ' + env.catalogSha256 + '; ledger rows: ' + env.ledgerCount + '.', '', 'Counts: ' + Object.entries(counts).map(([k,v]) => k + '=' + v).join(', ') + '.', '', '| Repository migration | SHA-256 | Status | Ledger mapping / evidence |', '| --- | --- | --- | --- |');
  for (const row of env.rows) {
    const mapping = row.matchedLedger ? row.matchedLedger.version + ' / ' + row.matchedLedger.name + ' / statement-md5 ' + row.matchedLedger.statementsHash : row.reason + (row.targetObjects.length ? '; targets: ' + row.targetObjects.map((x) => x.kind + ' ' + [x.schema,x.table,x.name].filter(Boolean).join('.')).join(', ') : '');
    lines.push('| ' + row.path + ' (' + row.version + '_' + row.name + ') | ' + row.sha256 + ' | ' + row.status + ' | ' + mapping + ' |');
  }
  lines.push('');
}
lines.push('## Scope note', '', 'This report classifies repository SQL against the directly connected operator projects kytdomflmjytzyaabogi and bniwtkjtramqaozrrtrk. It does not establish that the Vercel production runtime uses the production operator project; that identity remains a separate gate. No migration was applied.');
writeFileSync(resolve(dir, 'MIGRATION_LEDGER_RECONCILIATION.md'), lines.join('\n') + '\n');
for (const env of environments) {
  const counts = Object.fromEntries(['APPLIED_EXACT','APPLIED_EQUIVALENT','NOT_APPLIED','HASH_MISMATCH','NAME_MISMATCH','UNKNOWN'].map((s) => [s, env.rows.filter((r) => r.status === s).length]));
  console.log(JSON.stringify({ environment: env.label, projectRef: env.projectRef, ledgerCount: env.ledgerCount, catalogSha256: env.catalogSha256, counts }));
}
