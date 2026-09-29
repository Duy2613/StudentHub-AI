import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('eight canonical demo identities remain present without credential material', () => {
  const accounts = JSON.parse(readFileSync(path.join(repoRoot, 'DEMO_ACCOUNT_INVENTORY.json'), 'utf8'));
  assert.equal(accounts.length, 8);
  assert.deepEqual(accounts.map((account) => account.accountId).sort(), Array.from({ length: 8 }, (_, index) => `DEMO-${String(index + 1).padStart(2, '0')}`));
  assert.equal(accounts.filter((account) => account.role === 'USER').length, 4);
  assert.equal(accounts.filter((account) => account.role === 'EXPERT').length, 4);
  assert.equal(accounts.every((account) => account.enabled === true), true);
  const keys = accounts.flatMap((account) => Object.keys(account));
  assert.equal(keys.some((key) => /password|secret|token|api.?key|credential/i.test(key)), false);
});

test('Trust-to-Expert handoff carries the persisted case revision and exact scope', () => {
  const trustResult = readFileSync(path.join(repoRoot, 'frontend/src/components/trust/TrustV4Result.jsx'), 'utf8');
  const requestSheet = readFileSync(path.join(repoRoot, 'frontend/src/components/expert/RequestExpertReviewSheet.jsx'), 'utf8');
  const repository = readFileSync(path.join(repoRoot, 'frontend/src/lib/server/database/ExpertRepository.js'), 'utf8');
  assert.match(trustResult, /RequestExpertReviewSheet caseId=\{model\.caseId\} caseRevision=\{model\.caseRevision\}/);
  assert.match(requestSheet, /caseRevision:\s*Number\(effectiveCaseRevision\)/);
  assert.match(requestSheet, /claimId:\s*claimId\s*\|\|\s*null/);
  assert.match(repository, /case_id\s*=\s*\$2\s+AND\s+case_revision\s*=\s*\$3/);
  assert.match(repository, /community_contribution_id, status, idempotency_key, request_digest,[\s\S]*?VALUES\s*\(\$1,\s*\$2,\s*\$3,\s*\$4,\s*\$5,\s*\$6,\s*\$7,\s*\$8::jsonb,\s*\$9/);
  assert.match(repository, /WHERE id = \$1 AND case_id = \$2 AND case_revision = \$3[\s\S]*?AND claim_id IS NOT DISTINCT FROM \$4::uuid/);
});

test('Trust AI has structured citation and revision provenance; Omni chat remains text-contract bound', () => {
  const trustContracts = readFileSync(path.join(repoRoot, 'frontend/src/lib/ai-trust/v5/contracts.js'), 'utf8');
  const trustRoute = readFileSync(path.join(repoRoot, 'frontend/src/app/api/v1/trust/route.js'), 'utf8');
  const chatRoute = readFileSync(path.join(repoRoot, 'frontend/src/app/api/chat/route.js'), 'utf8');
  assert.match(trustContracts, /function publicAiVerification\(value\)[\s\S]*?citationsUsed,[\s\S]*?citationValidation:/);
  assert.match(trustRoute, /caseRevision:[\s\S]*?runId:[\s\S]*?persistence:/);
  assert.match(chatRoute, /content:\s*result\.text/);
  assert.doesNotMatch(chatRoute, /citationsUsed|citationValidation|caseRevision|runId/);
});
