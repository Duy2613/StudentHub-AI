// Read existing operator credentials in memory; never change identities/passwords/roles.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { DEMO_ACCOUNT_ALLOWLIST } from '../frontend/src/lib/server/auth/demoAccountPolicy.js';
const root = resolve(import.meta.dirname, '..');
const operatorRoot = process.env.STUDENTHUB_OPERATOR_ROOT;
if (!operatorRoot) throw new Error('OPERATOR_ROOT_REQUIRED');
const label = process.argv[2] || 'staging';
if (!['staging', 'production'].includes(label)) throw new Error('UNAPPROVED_TARGET');
const envPath = label === 'staging' ? resolve(operatorRoot, 'frontend/.env.staging.local') : resolve(operatorRoot, 'frontend/.env.local');
const env = parseEnv(readFileSync(envPath, 'utf8'));
const expected = label === 'staging' ? 'bniwtkjtramqaozrrtrk' : 'kytdomflmjytzyaabogi';
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
if (url.hostname !== `${expected}.supabase.co`) throw new Error('AUTH_TARGET_MISMATCH');
const inventory = JSON.parse(readFileSync(resolve(operatorRoot, 'DEMO_ACCOUNT_INVENTORY.json'), 'utf8'));
const canonical = process.argv.includes('--canonical-demo');
const accounts = canonical ? DEMO_ACCOUNT_ALLOWLIST.map((email) => ({ email })) : inventory;
const helper = readFileSync(resolve(operatorRoot, 'scripts/recording-suite/recording-helper.mjs'), 'utf8');
const password = process.env.DEMO_QA_PASSWORD || helper.match(/QA_PASSWORD\s*=\s*process\.env\.DEMO_QA_PASSWORD\s*\|\|\s*(["'])([^"']+)\1/)?.[2];
if (!password) throw new Error('OPERATOR_DEMO_CREDENTIAL_UNAVAILABLE');
const { Pool } = createRequire(resolve(root, 'frontend/package.json'))('pg');
const databaseRef = new URL(env.DATABASE_URL).username.split('.').at(-1);
if (databaseRef !== expected) throw new Error('DATABASE_TARGET_MISMATCH');
const ca = env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');
const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false', ...(ca ? { ca } : {}) }, connectionTimeoutMillis: 8000 });
const report = { recordedAt: new Date().toISOString(), candidateSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), workingTreeChanges: true, target: label, projectRef: expected, identitySource: canonical ? 'CANONICAL_SERVER_ALLOWLIST' : 'OPERATOR_INVENTORY', inventoryCanonicalMatches: inventory.filter((account) => DEMO_ACCOUNT_ALLOWLIST.includes(account.email)).length, mode: 'EXISTING_IDENTITY_DIAGNOSTIC_NO_ACCOUNT_MUTATION', accounts: [] };
try {
  for (let slot = 0; slot < accounts.length; slot++) {
    const state = await pool.query(`select u.id is not null as exists, u.email_confirmed_at is not null as confirmed,
      length(coalesce(u.encrypted_password,''))>0 as password_configured,
      coalesce(u.banned_until>now(),false) as banned,
      exists(select 1 from auth.identities i where i.user_id=u.id and i.provider='email') as email_identity
      from (select $1::text as email) expected left join auth.users u on lower(u.email)=lower(expected.email)`, [accounts[slot].email]);
    const response = await fetch(`${url.origin}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: accounts[slot].email, password }), signal: AbortSignal.timeout(15000) });
    const body = await response.json();
    const row = { slot, ...state.rows[0], status: response.status, providerCode: /^[a-z0-9_]{1,80}$/i.test(body.error_code || body.code || '') ? body.error_code || body.code : null, authenticated: !!body.access_token };
    if (body.access_token) {
      const revoke = await fetch(`${url.origin}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, authorization: `Bearer ${body.access_token}` } });
      row.syntheticDiagnosticSessionRevoked = revoke.ok;
    }
    report.accounts.push(row);
  }
} catch (error) { report.failure = { code: /^[a-z0-9_]{1,80}$/i.test(error.code || '') ? error.code : 'DIAGNOSTIC_UNAVAILABLE' }; }
finally { await pool.end(); }
const folder = resolve(root, 'docs/reports/four-core-repair-2026-10-01');
mkdirSync(folder, { recursive: true });
writeFileSync(resolve(folder, `auth-${label}${canonical ? '-canonical' : ''}.json`), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
