import { cpSync, mkdirSync, existsSync, readdirSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'frontend');
const lab = path.join(root, 'artifacts/lab/ai-omni-v4/frontend');
const evidence = path.join(root, 'artifacts/visual/AI_OMNI_V4/2026-09-28');
const action = process.argv[2] || 'all';
mkdirSync(lab, { recursive: true }); mkdirSync(evidence, { recursive: true });
for (const name of ['src', 'public', 'tests']) cpSync(path.join(source, name), path.join(lab, name), { recursive: true, filter: (p) => !path.basename(p).startsWith('.env') });
for (const entry of readdirSync(source, { withFileTypes: true })) {
  if (entry.isFile() && /^(package(-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\.ts|postcss\.config\.mjs|eslint\.config\.mjs|playwright\.(ai-omni-v4|trust-v4)\.config\.ts)$/.test(entry.name)) cpSync(path.join(source, entry.name), path.join(lab, entry.name));
}
cpSync(path.join(source, 'src'), path.join(lab, 'frontend/src'), { recursive: true });
cpSync(path.join(root, 'database/migrations'), path.join(lab, '../database/migrations'), { recursive: true });
if (!existsSync(path.join(lab, 'node_modules'))) symlinkSync(path.join(source, 'node_modules'), path.join(lab, 'node_modules'), 'junction');
const env = {};
for (const [key, value] of Object.entries(process.env)) if (/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS)$/i.test(key)) env[key] = value;
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', STUDENTHUB_HERMETIC_TEST_MODE: '1', STUDENTHUB_NEXT_DIST_DIR: '.next-ai-omni-v4-lab', NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE: 'LIVE', NEXT_PUBLIC_COMPETITION_DEMO: 'false', OMNI_V4_ARTIFACTS: evidence });

const owned = ['.gitignore','frontend/package.json','frontend/src/components/command/AcademicCommandPalette.jsx','frontend/src/components/command/CommandPalette.jsx','frontend/src/components/layout/UnifiedAppShell.jsx','frontend/src/app/ai/page.jsx','frontend/src/lib/search/searchProviders.js','frontend/src/lib/omni/omniV4Model.js','frontend/src/lib/omni/omniV4Client.js','frontend/src/components/omni/OmniV4Surface.jsx','frontend/src/components/omni/OmniAiAnswer.jsx','frontend/src/components/omni/OmniRouteTrigger.jsx','frontend/src/components/trust/TrustV4Workspace.jsx','frontend/src/components/omni/omni-v4.module.css','frontend/next.config.ts','frontend/tests/omni/omni_v4_model.test.mjs','frontend/tests/e2e/ai-omni-v4-isolated.spec.ts','frontend/playwright.ai-omni-v4.config.ts','scripts/ai-omni-v4-lab.mjs','docs/reports/AI_OMNI_V4_CONTRACT_AUDIT.md','docs/reports/AI_OMNI_V4_DOMAIN_GAPS.md','docs/reports/AI_OMNI_V4_IA_AND_STATE_MODEL.md','docs/reports/AI_OMNI_V4_IMPLEMENTATION_REPORT.md','docs/reports/AI_OMNI_V4_DEFERRED_ASSURANCE.md','docs/vault/00 - 🧠 AI Agent Permanent Context/Active-Session-Context.md','docs/vault/04 - 📋 Roadmap & Tasks/Sprint-Board.md'];
const targets = owned.filter((p) => p.startsWith('frontend/src/') && /\.(jsx|js)$/.test(p)).map((p) => p.slice('frontend/'.length));
const commands = {
  lint: ['node_modules/eslint/bin/eslint.js', ...targets],
  type: ['node_modules/typescript/bin/tsc', '--noEmit'],
  build: ['node_modules/next/dist/bin/next', 'build', '--webpack'],
  unit: ['--test', 'tests/omni/omni_v4_model.test.mjs'],
  regression: ['--test','tests/trust/trust_v4_model.test.mjs','tests/trust/image_forensics_client_tamper.test.mjs','tests/community/community_production_fixture_boundary.test.mjs','tests/community_expert/expert_review_request_contract.test.mjs','tests/community_expert/ui_reality_contract.test.mjs','tests/expert/expert_v4_frontend_contract.test.mjs','tests/platform/product_scope_registry.test.mjs'],
};
async function run(name, args = commands[name]) {
  let log = '';
  const child = spawn(process.execPath, args, { cwd: lab, env, stdio: ['ignore','pipe','pipe'], windowsHide: true });
  for(const stream of [child.stdout,child.stderr]) stream.on('data', (chunk) => { log += chunk; process.stdout.write(chunk); });
  const code = await new Promise((resolve, reject) => { child.once('error',reject); child.once('exit',resolve); });
  writeFileSync(path.join(evidence,`${name}.log`),log);
  writeFileSync(path.join(evidence,`${name}.status.json`),JSON.stringify({ timestamp:new Date().toISOString(),code,command:args,cwd:lab,isolation:'code mirror; whitelisted environment; no dotenv files; no database/provider credentials' },null,2));
  if(code!==0) throw new Error(`${name} failed (${code})`);
}
async function browser() {
  const probe = createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(3114,'127.0.0.1',()=>probe.close(resolve));});
  const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3114'],{cwd:lab,env,stdio:'ignore',windowsHide:true});
  try {
    let ready=false;
    for(let attempt=0;attempt<60;attempt++) {
      if(server.exitCode!==null) break;
      try { if((await fetch('http://127.0.0.1:3114/trust')).ok){ready=true;break;} } catch {}
      await new Promise((resolve)=>setTimeout(resolve,1000));
    }
    if(!ready) throw new Error('Isolated Omni production server did not become ready.');
    await run('browser',['node_modules/@playwright/test/cli.js','test','--config=playwright.ai-omni-v4.config.ts',...process.argv.slice(3)]);
  } finally { server.kill(); }
}
function manifest() {
  const present=owned.filter((p)=>existsSync(path.join(root,p)));
  writeFileSync(path.join(evidence,'task-owned-changes.json'),JSON.stringify({ timestamp:new Date().toISOString(),commitCreated:false,startingHead:readFileSync(path.join(evidence,'head.txt'),'utf8').trim(),paths:present.map((file)=>({file,sha256:createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex')})),isolation:lab,classification:'ISOLATED CONTRACT FIXTURES; NOT LIVE ASSURANCE' },null,2));
}
try {
  if(action==='all'){for(const name of ['unit','regression','lint','build','type']) await run(name);await browser();manifest();}
  else if(action==='browser') await browser();
  else if(action==='manifest') manifest();
  else if(commands[action]) await run(action);
  else throw new Error('Unknown lab action.');
} catch(error) { process.stderr.write(`${error.message}\n`); process.exitCode=1; }
