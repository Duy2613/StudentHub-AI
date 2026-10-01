// Read-only evidence helper. Never reads application row contents or secrets.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '../../../..');
const operatorRoot = process.env.STUDENTHUB_OPERATOR_ROOT;
if (!operatorRoot) throw new Error('OPERATOR_ROOT_REQUIRED');
const { Pool } = createRequire(resolve(root, 'frontend/package.json'))('pg');
const query = `SELECT jsonb_build_object(
 'tables',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.name) FROM (SELECT n.nspname AS schema,c.relname AS name,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls,pg_get_userbyid(c.relowner) AS owner,c.relacl AS grants FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private') AND c.relkind='r') t),
 'columns',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.table_name,t.position) FROM (SELECT n.nspname AS schema,c.relname AS table_name,a.attname AS name,a.attnum AS position,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,a.attidentity AS identity,a.attgenerated AS generated,pg_get_expr(d.adbin,d.adrelid) AS default FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE n.nspname IN ('public','private') AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped) t),
 'constraints',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.table_name,t.name) FROM (SELECT n.nspname AS schema,c.relname AS table_name,con.conname AS name,con.contype AS type,con.convalidated AS validated,con.condeferrable AS deferrable,con.condeferred AS deferred,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private')) t),
 'indexes',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.name) FROM (SELECT n.nspname AS schema,c.relname AS name,i.indisunique AS unique,i.indisvalid AS valid,pg_get_indexdef(i.indexrelid) AS definition FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private')) t),
 'policies',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schemaname,t.tablename,t.policyname) FROM (SELECT * FROM pg_policies WHERE schemaname IN ('public','private')) t),
 'routines',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.name,t.signature) FROM (SELECT n.nspname AS schema,p.proname AS name,pg_get_function_identity_arguments(p.oid) AS signature,pg_get_userbyid(p.proowner) AS owner,p.prosecdef AS security_definer,p.proconfig AS configuration,p.proacl AS grants,md5(pg_get_functiondef(p.oid)) AS definition_hash FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.prokind IN ('f','p')) t),
 'triggers',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.table_name,t.name) FROM (SELECT n.nspname AS schema,c.relname AS table_name,tr.tgname AS name,tr.tgenabled AS enabled,pg_get_triggerdef(tr.oid) AS definition FROM pg_trigger tr JOIN pg_class c ON c.oid=tr.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private') AND NOT tr.tgisinternal) t),
 'sequences',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.schema,t.name) FROM (SELECT n.nspname AS schema,c.relname AS name,pg_get_userbyid(c.relowner) AS owner,c.relacl AS grants FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private') AND c.relkind='S') t),
 'migrationLedger',(SELECT jsonb_agg(row_to_json(t) ORDER BY t.version) FROM (SELECT version,name,md5(statements::text) AS statements_hash FROM supabase_migrations.schema_migrations) t)
) AS catalog`;
for (const [label, projectRef, file] of [['production','kytdomflmjytzyaabogi','.env.local'],['staging','bniwtkjtramqaozrrtrk','.env.staging.local']]) {
  const env = parseEnv(readFileSync(resolve(operatorRoot, 'frontend', file), 'utf8'));
  const target = new URL(env.DATABASE_URL);
  if (new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${projectRef}.supabase.co` || !(target.hostname === `db.${projectRef}.supabase.co` || target.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(target.username) === `postgres.${projectRef}`)) throw new Error('READ_ONLY_IDENTITY_MISMATCH');
  const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false', ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g,'\n') } : {}) }, max: 1 });
  try {
    const client = await pool.connect();
    let catalog;
    try { await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); catalog = (await client.query(query)).rows[0].catalog; await client.query('COMMIT'); } finally { client.release(); }
    const report = { recordedAt: new Date().toISOString(), candidateSha: execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(), target:label, projectRef, readOnly:true, catalogSha256:createHash('sha256').update(JSON.stringify(catalog)).digest('hex'), catalog };
    writeFileSync(resolve(root, `docs/reports/four-core-repair-2026-10-01/schema-${label}.json`), JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({ label, projectRef, tables:catalog.tables.length, allTablesRls:catalog.tables.every(t=>t.rls), migrations:catalog.migrationLedger.length, catalogSha256:report.catalogSha256 }));
  } catch (e) { console.error(JSON.stringify({label,status:'READ_ONLY_OBSERVATION_UNAVAILABLE',code:e.code || e.name})); process.exitCode=1; }
  finally { await pool.end(); }
}
