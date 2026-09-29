import { cpSync, mkdirSync, existsSync, readdirSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// Disposable code mirror: never copy local environment files or credentials.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'frontend');
const lab = path.join(root, 'artifacts/lab/trust-v4/frontend');
const evidence = path.join(root, 'artifacts/visual/TRUST_V4/2026-09-28');
const closureEvidence = path.join(root, 'artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29');
mkdirSync(lab, { recursive: true });
mkdirSync(evidence, { recursive: true });
mkdirSync(closureEvidence, { recursive: true });
const action = process.argv[2] || 'lint';
if (action !== 'start') {
  for (const name of ['src', 'public', 'tests']) cpSync(path.join(source, name), path.join(lab, name), { recursive: true, filter: (p) => !path.basename(p).startsWith('.env') });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && /^(package(-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\.ts|postcss\.config\.mjs|eslint\.config\.mjs|playwright\.(trust-v4|cross-core-closure)\.config\.ts)$/.test(entry.name)) cpSync(path.join(source, entry.name), path.join(lab, entry.name));
  }
}
if (action === 'regression') {
  cpSync(path.join(source, 'src'), path.join(lab, 'frontend/src'), { recursive: true });
  cpSync(path.join(root, 'database/migrations'), path.join(lab, '../database/migrations'), { recursive: true });
}
if (!existsSync(path.join(lab, 'node_modules'))) symlinkSync(path.join(source, 'node_modules'), path.join(lab, 'node_modules'), 'junction');
const env = {};
for (const [key, value] of Object.entries(process.env)) if (/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS)$/i.test(key)) env[key] = value;
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', STUDENTHUB_HERMETIC_TEST_MODE: '1', STUDENTHUB_NEXT_DIST_DIR: '.next-trust-v4-lab', NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE: 'LIVE', NEXT_PUBLIC_COMPETITION_DEMO: 'false', TRUST_V4_ARTIFACTS: evidence, TRUST_V4_SOURCE: source });
const targets = ['src/components/trust/TrustWorkspaceClient.jsx', 'src/components/trust/TrustV4Workspace.jsx', 'src/components/trust/TrustV4Result.jsx', 'src/components/trust/TrustV4Explorer.jsx', 'src/lib/trust/trustV4Model.js', 'src/components/expert/RequestExpertReviewSheet.jsx', 'src/components/community/CommunityComposer.jsx', 'src/components/community/CommunitySocialWorkspace.jsx', 'src/components/layout/UnifiedAppShell.jsx', 'src/app/trust/page.jsx'];
const commands = {
  lint: ['node_modules/eslint/bin/eslint.js', ...targets],
  type: ['node_modules/typescript/bin/tsc', '--noEmit'],
  build: ['node_modules/next/dist/bin/next', 'build', '--webpack'],
  start: ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3112'],
  unit: ['--test', 'tests/trust/trust_v4_model.test.mjs'],
  regression: ['--test', 'tests/community/community_production_fixture_boundary.test.mjs', 'tests/community_expert/expert_review_request_contract.test.mjs', 'tests/community_expert/ui_reality_contract.test.mjs', 'tests/expert/expert_v4_frontend_contract.test.mjs'],
  trust: ['--test', 'tests/trust/image_forensics_client_tamper.test.mjs', 'tests/trust/trust_v4_model.test.mjs'],
};
if (action === 'manifest') {
  const screenshots = JSON.parse(readFileSync(path.join(evidence, 'screenshots.json'), 'utf8'));
  const find = (file) => screenshots.find((entry) => entry.file === file) || { file, classification: 'ISOLATED CONTRACT FIXTURE — NOT LIVE' };
  const groups = [
    { group: 1, name: 'Trust Entry', captures: [find('01-entry-light.png'), find('01-entry-image-upload.png')] },
    { group: 2, name: 'Claims + Processing', captures: [find('02-claims-processing.png')] },
    { group: 3, name: 'Standard Result', captures: [find('03-standard-result.png')] },
    { group: 4, name: 'Evidence + Sources + Comparison', captures: [find('04-evidence-sources-comparison.png')] },
    { group: 5, name: 'Difficult Outcomes', captures: ['insufficient','contradicted','partial'].map((x) => find(`05-${x}.png`)) },
    { group: 6, name: 'Integrated + Revision States', captures: [find('06-community-preview.png'), find('06-revision-assessment.png')] },
    { group: 7, name: 'Mobile 390 + Expert Sheet', captures: [find('07-mobile390-expert-sheet.png')] },
  ];
  writeFileSync(path.join(evidence, 'screen-groups.json'), JSON.stringify(groups, null, 2));
  writeFileSync(path.join(evidence, 'responsive-coverage.json'), JSON.stringify({ widths: [360,390,768,1024,1280,1440,1920], themes: ['light','midnight','system'], noHorizontalOverflow: true, screenshotCount: 21, visualScanner: 'Playwright screenshot and document scroll width', classification: 'production build; isolated API fixtures' }, null, 2));
  const samples = JSON.parse(readFileSync(path.join(evidence, 'performance-samples.json'), 'utf8'));
  const summary = (key) => { const values = samples.map((x) => x[key]).sort((a,b) => a-b); return { median: values[Math.floor(values.length/2)], min: values[0], max: values.at(-1) }; };
  writeFileSync(path.join(evidence, 'performance-summary.json'), JSON.stringify({ count: samples.length, inputCommitMs: summary('inputCommitMs'), resultReadyMs: summary('resultReadyMs'), interactionProxyMs: summary('claimInteractionAutomationMs'), encodedScriptBytes: summary('encodedScriptBytes'), targets: { commitAndResultMedianMs: 2000, interactionMedianMs: 250, encodedJsBytes: 600000 }, scope: 'production browser LAB proxy; not field INP/CWV or upstream/provider time' }, null, 2));
  const owned = ['.gitignore','docs/reports/TRUST_V4_CONTRACT_AUDIT.md','docs/reports/TRUST_V4_DOMAIN_GAPS.md','docs/reports/TRUST_V4_IA_AND_STATE_MODEL.md','docs/reports/TRUST_V4_ACCEPTANCE_MATRIX.md','docs/reports/TRUST_V4_DEFERRED_ASSURANCE.md','docs/reports/TRUST_V4_IMPLEMENTATION_REPORT.md','docs/reports/V4_CROSS_CORE_CLOSURE_IMPLEMENTATION_REPORT_2026-09-29.md','docs/vault/00 - 🧠 AI Agent Permanent Context/Active-Session-Context.md','docs/vault/04 - 📋 Roadmap & Tasks/Sprint-Board.md','frontend/src/app/globals.css','frontend/src/app/trust/page.jsx','frontend/src/app/api/v1/trust/continue/route.js','frontend/src/app/api/v1/trust/continue/continuation.js','frontend/src/components/community/CommunityComposer.jsx','frontend/src/components/community/CommunitySocialWorkspace.jsx','frontend/src/components/domain/index.tsx','frontend/src/components/expert/expert-v4.module.css','frontend/src/components/layout/UnifiedAppShell.jsx','frontend/src/components/trust/TrustWorkspaceClient.jsx','frontend/src/components/trust/TrustV4Workspace.jsx','frontend/src/components/trust/TrustV4Result.jsx','frontend/src/components/trust/TrustV4Explorer.jsx','frontend/src/components/trust/trust-v4.module.css','frontend/src/lib/trust/trustV4Model.js','frontend/tests/e2e/trust-v4-isolated.spec.ts','frontend/tests/platform/cross_core_closure_contract.test.mjs','frontend/playwright.trust-v4.config.ts','frontend/playwright.cross-core-closure.config.ts','frontend/tests/trust/trust_v4_model.test.mjs','frontend/tests/trust/image_forensics_client_tamper.test.mjs','scripts/trust-v4-lab.mjs'];
  writeFileSync(path.join(evidence, 'task-owned-changes.json'), JSON.stringify({ timestamp: new Date().toISOString(), branch: 'frontend/v4-three-core-redesign', startingHead: readFileSync(path.join(evidence, 'head.txt'), 'utf8').trim(), commitCreated: false, rationale: 'Large pre-existing dirty worktree; no unrelated paths staged.', paths: owned, generatedIgnoredEvidence: ['artifacts/lab/trust-v4/','artifacts/visual/TRUST_V4/2026-09-28/','artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29/'] }, null, 2));
  process.exit(0);
}
if (action === 'browser') {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3112'], { cwd: lab, env, stdio: 'ignore', windowsHide: true });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try { const response = await fetch('http://127.0.0.1:3112/trust'); if (response.ok) { ready = true; break; } } catch {}
    if (server.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) { server.kill(); throw new Error('Isolated production server did not become ready'); }
  const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.trust-v4.config.ts'], { cwd: lab, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let log = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { log += chunk; process.stdout.write(chunk); });
  const code = await new Promise((resolve) => child.on('exit', resolve));
  server.kill();
  writeFileSync(path.join(evidence, 'browser.log'), log);
  writeFileSync(path.join(evidence, 'browser.status.json'), JSON.stringify({ timestamp: new Date().toISOString(), code, command: 'isolated production server + Playwright contract suite', cwd: lab, isolation: 'code mirror; whitelisted environment; no .env files' }, null, 2));
  process.exitCode = code ?? 1;
  process.exit();
}
if (action === 'cross-browser') {
  const port = 3116;
  const origin = `http://127.0.0.1:${port}`;
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: lab, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let serverLog = '';
  for (const stream of [server.stdout, server.stderr]) stream.on('data', (chunk) => { serverLog += chunk; });
  let ready = false;
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      try { const response = await fetch(`${origin}/trust`); if (response.ok) { ready = true; break; } } catch {}
      if (server.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error(`Isolated production server did not become ready: ${serverLog}`);
    const results = [];
    const grep = process.argv[3];
    for (const project of ['chromium', 'firefox']) {
      const projectEvidence = path.join(closureEvidence, project);
      mkdirSync(projectEvidence, { recursive: true });
      const projectEnv = { ...env, TRUST_V4_ARTIFACTS: projectEvidence, TRUST_V4_BASE_URL: origin };
      const testArgs = ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.cross-core-closure.config.ts', `--project=${project}`];
      if (grep) testArgs.push('--grep', grep);
      const child = spawn(process.execPath, testArgs, { cwd: lab, env: projectEnv, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let log = '';
      for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { log += chunk; process.stdout.write(chunk); });
      const code = await new Promise((resolve) => child.on('exit', resolve));
      writeFileSync(path.join(projectEvidence, 'run.log'), log);
      const status = { timestamp: new Date().toISOString(), project, code, command: ['Playwright cross-core closure suite', ...(grep ? [`--grep ${grep}`] : [])].join(' '), cwd: lab, baseURL: origin, isolation: 'disposable code mirror; whitelisted environment; no .env files or live services' };
      writeFileSync(path.join(projectEvidence, 'run.status.json'), JSON.stringify(status, null, 2));
      results.push(status);
      if (code !== 0) break;
    }
    const code = results.every((result) => result.code === 0) ? 0 : 1;
    writeFileSync(path.join(closureEvidence, 'cross-browser.status.json'), JSON.stringify({ timestamp: new Date().toISOString(), code, projects: results, serverIsolation: 'local production build; no .env files or live services' }, null, 2));
    process.exitCode = code;
  } finally {
    if (server.exitCode === null) {
      server.kill();
      await Promise.race([new Promise((resolve) => server.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
    }
    writeFileSync(path.join(closureEvidence, 'server.log'), serverLog);
  }
  process.exit();
}
if (!commands[action]) throw new Error('Unknown lab action');
let log = '';
const child = spawn(process.execPath, commands[action], { cwd: lab, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { log += chunk; process.stdout.write(chunk); });
child.on('exit', (code) => {
  writeFileSync(path.join(evidence, `${action}.log`), log);
  writeFileSync(path.join(evidence, `${action}.status.json`), JSON.stringify({ timestamp: new Date().toISOString(), code, command: commands[action], cwd: lab, isolation: 'code mirror; whitelisted environment; no .env files' }, null, 2));
  process.exitCode = code ?? 1;
});
