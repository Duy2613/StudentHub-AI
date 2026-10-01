import test from 'node:test';
import assert from 'node:assert/strict';
import { ExpertBlindReviewService } from '../../src/lib/server/expert/ExpertBlindReviewService.js';

test('Community-bound Expert summary contains only the published statement, never source-case evidence or intake', () => {
  const privateEvidenceId = '00000000-0000-4000-8000-000000000030';
  const dto = ExpertBlindReviewService._buildBlindSummaryDTO({
    assignment_id: 'assignment', case_revision: 1,
    community_contribution_id: 'published-contribution',
    community_statement: 'Published bounded observation',
    claim_statement: 'private source case claim',
    context_refs: [privateEvidenceId, { snippet: 'private intake', url: 'https://private.example.test', mediaArtifactId: 'private-media' }],
    evidence: [{ id: privateEvidenceId, sourceIdentifier: 'private source' }],
  });
  assert.equal(dto.claim, 'Published bounded observation');
  assert.deepEqual(dto.evidenceRevisionIds, []);
  assert.deepEqual(dto.evidence, []);
  assert.doesNotMatch(JSON.stringify(dto), /private source|private intake|private\.example|private-media|00000000-0000-4000-8000-000000000030/);
});
