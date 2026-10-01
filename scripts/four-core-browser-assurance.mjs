// Public browser evidence only; credentials stay in memory and traces are disabled.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { DEMO_ACCOUNT_ALLOWLIST } from '../frontend/src/lib/server/auth/demoAccountPolicy.js';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(resolve(root, 'frontend/package.json'));
const { chromium, firefox, webkit } = require('playwright');
const origin = process.argv[2] || 'http://127.0.0.1:3000';
const label = process.argv[3] || 'candidate-staging';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('INVALID_EVIDENCE_LABEL');
const artifact = resolve(root, `docs/reports/four-core-repair-2026-10-01/browser-${label}.json`);
const safe = (value) => String(value || '').replace(/Bearer\s+\S+|eyJ[A-Za-z0-9._-]+/g, '[REDACTED]').replace(/([?&](?:token|key|password|code|access_token)=)[^&\s]+/gi, '$1[REDACTED]').slice(0, 1600);
const sourceChanges = execFileSync('git', ['status', '--porcelain', '--', 'frontend/src', 'frontend/next.config.ts', 'database/migrations', 'scripts/four-core-browser-assurance.mjs'], { cwd: root, encoding: 'utf8' }).trim();
const report = { recordedAt: new Date().toISOString(), candidateSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), workingTreeChanges: Boolean(sourceChanges), origin, label, routes: [], logins: [] };

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch({ headless: true });
  try {
    for (const width of [360, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 960 } });
      for (const route of ['/trust', '/community', '/expert', '/profile']) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push({ type: 'pageerror', message: safe(error.message), stack: safe(error.stack) }));
        page.on('console', (message) => { if (message.type() === 'error') errors.push({ type: 'console', message: safe(message.text()), location: { url: safe(message.location().url).split('?')[0], line: message.location().lineNumber } }); });
        let status = null;
        try {
          status = (await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }))?.status();
          await page.waitForTimeout(1800);
          const layout = await page.evaluate(() => {
            const viewport = document.documentElement.clientWidth;
            const overflowing = [...document.querySelectorAll('body *')].map((el) => ({ el, rect: el.getBoundingClientRect() }))
              .filter(({ el, rect }) => rect.width > 0 && (rect.right > viewport + 1 || rect.left < -1) && getComputedStyle(el).position !== 'fixed')
              .slice(0, 16).map(({ el, rect }) => ({ tag: el.tagName, className: String(el.className || '').slice(0, 200), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), parent: String(el.parentElement?.className || '').slice(0, 180) }));
            return { viewport, scrollWidth: document.documentElement.scrollWidth, overflowing };
          });
          report.routes.push({ browser: name, route, width, httpStatus: status, status: layout.scrollWidth <= width + 1 && !errors.some((error) => error.type === 'pageerror') ? 'PASS' : 'FAIL', ...layout, errors });
        } catch (error) { report.routes.push({ browser: name, route, width, status: 'FAIL', httpStatus: status, errors: [...errors, { type: 'navigation', message: safe(error.message) }] }); }
        await page.close();
      }
      await context.close();
    }
    if (name === 'chromium' && process.env.STUDENTHUB_DIAGNOSE_EXISTING_DEMO_LOGIN === '1') {
      const operatorRoot = process.env.STUDENTHUB_OPERATOR_ROOT;
      if (!operatorRoot) throw new Error('OPERATOR_ROOT_REQUIRED');
      const accounts = DEMO_ACCOUNT_ALLOWLIST.map((email) => ({ email }));
      report.identitySource = 'CANONICAL_SERVER_POLICY_INVENTORY';
      const helper = readFileSync(resolve(operatorRoot, 'scripts/recording-suite/recording-helper.mjs'), 'utf8');
      const match = helper.match(/QA_PASSWORD\s*=\s*process\.env\.DEMO_QA_PASSWORD\s*\|\|\s*(["'])([^"']+)\1/);
      const password = process.env.DEMO_QA_PASSWORD || match?.[2];
      if (!password) throw new Error('OPERATOR_DEMO_CREDENTIAL_UNAVAILABLE');
      const providerEnv = parseEnv(readFileSync(resolve(operatorRoot, 'frontend/.env.local'), 'utf8'));
      const providerUrl = providerEnv.NEXT_PUBLIC_SUPABASE_URL;
      if (new URL(providerUrl).hostname !== 'kytdomflmjytzyaabogi.supabase.co') throw new Error('DEMO_DIAGNOSTIC_AUTH_TARGET_MISMATCH');
      for (let slot = 0; slot < accounts.length; slot++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const network = [];
        const responses = [];
        page.on('response', (response) => {
          const url = new URL(response.url());
          if (url.pathname === '/auth/v1/token') responses.push(response.json().then((body) => { network.push({ path: url.pathname, projectRef: url.hostname.split('.')[0], status: response.status(), code: /^[a-z0-9_]{1,80}$/i.test(body.error_code || body.code || '') ? body.error_code || body.code : null }); }).catch(() => {}));
          if (['/api/auth/session/exchange', '/api/auth/session'].includes(url.pathname)) network.push({ path: url.pathname, status: response.status() });
        });
        let failure = null;
        try {
          await page.goto(`${origin}/login?next=%2Fprofile`, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => document.querySelector('button[type="submit"]') && !document.querySelector('button[type="submit"]').disabled);
          await page.waitForTimeout(1200);
          await page.locator('input[type="email"]').fill(accounts[slot].email);
          await page.locator('input[type="password"]').first().fill(password);
          const providerResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/auth/v1/token', { timeout: 15000 }).catch(() => null);
          await page.locator('button[type="submit"]').first().click();
          await providerResponse;
          await page.waitForURL((url) => url.pathname !== '/login', { timeout: 15000 }).catch(() => {});
          await Promise.allSettled(responses);
          const session = await page.evaluate(async () => { const response = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' }); const body = await response.json(); return { status: response.status, authenticated: body.authenticated === true || body.success === true && body.session?.authenticated === true }; });
          await page.reload({ waitUntil: 'domcontentloaded' });
          const reload = await page.evaluate(async () => { const r = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' }); const b = await r.json(); return { status: r.status, authenticated: b.authenticated === true }; });
          const upstream = await page.evaluate(() => {
            const key = Object.keys(localStorage).find((key) => /^sb-.+-auth-token$/.test(key));
            try {
              const session = key ? JSON.parse(localStorage.getItem(key)) : null;
              return { providerSessionPersisted: Boolean(session), providerRefreshTokenPersisted: Boolean(session?.refresh_token) };
            } catch { return { providerSessionPersisted: false, providerRefreshTokenPersisted: false }; }
          });
          const applicationSession = { status: reload.status, authenticatedAfterReload: reload.authenticated, serverOwned: true, providerSessionPersisted: upstream.providerSessionPersisted, providerRefreshTokenPersisted: upstream.providerRefreshTokenPersisted };
          const logout = await page.evaluate(async () => { const r = await fetch('/api/auth/session/logout', { method: 'POST', credentials: 'include' }); const after = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' }); return { status: r.status, afterStatus: after.status }; });
          report.logins.push({ slot, network, session, reload, applicationSession, logout, finalRoute: new URL(page.url()).pathname, cause: session.authenticated && reload.authenticated && logout.afterStatus === 401 ? 'APPLICATION_SESSION_VERIFIED' : network.some((row) => row.code === 'invalid_credentials') ? 'PROVIDER_REJECTED_SUPPLIED_CREDENTIAL_PAIR' : network.some((row) => row.status === 400) ? 'PROVIDER_REJECTED_SIGN_IN' : network.some((row) => row.path === '/auth/v1/token') ? 'PROVIDER_REQUEST_OBSERVED' : 'NO_PROVIDER_REQUEST_OBSERVED' });
        } catch (error) { failure = safe(error.message).replaceAll(password, '[REDACTED]').replaceAll(accounts[slot].email, '[ACCOUNT]'); report.logins.push({ slot, network, cause: 'BROWSER_SUBMISSION_FAILED', failure }); }
        await context.close();
      }
    }
  } finally { await browser.close(); }
  mkdirSync(dirname(artifact), { recursive: true });
  writeFileSync(artifact, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ label, browser: name, tested: report.routes.filter((row) => row.browser === name).length, failed: report.routes.filter((row) => row.browser === name && row.status !== 'PASS').length, loginCauses: report.logins.map(({ slot, cause }) => ({ slot, cause })) }));
}
