import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectTrust, safeTrustUrl, sameTrustIdentity, advancesTrustSnapshot, hasFixtureMarker, isTrustTerminalResponse, truthLabel } from '../../src/lib/trust/trustV4Model.js';

test('source-only response never manufactures evidence or conclusion', () => {
  const model = projectTrust({ requestId: 'a', data: { layerResults: { layer3: { sources: [{ sourceId: 's', url: 'https://example.org', retrievalOrigin: 'USER_SUPPLIED' }] } } } });
  assert.equal(model.evidence.length, 0); assert.equal(model.hasConclusion, false); assert.equal(model.persisted, false); assert.equal(model.sources[0].origin, 'USER_SUPPLIED'); assert.equal(model.metrics.length, 0);
});
test('IDs alone establish claim evidence source relationships', () => {
  const model = projectTrust({ data: { layerResults: { layer2: { claims: [{ claimId: 'c', text: 'Claim' }] }, layer3: { sources: [{ sourceId: 's', title: 'Source' }], evidence: [{ claimId: 'c', sourceId: 'missing', relation: 'SUPPORTS' }, { claimId: 'c', sourceId: 's', relation: 'CONTRADICTS' }] } } } });
  assert.equal(model.evidence[0].source, null); assert.equal(model.evidence[1].source.title, 'Source');
});
test('fixture markers at canonical layer and envelope boundaries rejected', () => {
  for (const response of [{ demo: true }, { data: { layerResults: { layer3: { fixture: true } } } }, { data: { layerResults: { layer3: { sources: [{ sourceMode: 'DEMO_FIXTURE' }] } } } }]) {
    assert.equal(hasFixtureMarker(response), true); assert.throws(() => projectTrust(response), /FIXTURE_REJECTED/);
  }
});
test('URLs exclude executable schemes, credentials and secret-bearing queries', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'https://u:p@example.org', 'https://example.org?access_token=secret', 'https://example.org?api_key=x']) assert.equal(safeTrustUrl(url), null);
  assert.equal(safeTrustUrl('https://example.org/policy?year=2026'), 'https://example.org/policy?year=2026');
});
test('request, case, run and revision identity must agree', () => {
  const active = { requestId: 'r', caseId: 'c', caseRevision: 3, runId: 'run' };
  assert.equal(sameTrustIdentity({ ...active, data: { requestId: 'r' } }, active), true);
  for (const change of [{ requestId: 'old' }, { caseId: 'other' }, { caseRevision: 2 }, { runId: 'old-run' }, { data: { requestId: 'wrong' } }]) assert.equal(sameTrustIdentity({ ...active, ...change }, active), false);
  assert.equal(sameTrustIdentity({}, active), false);
});
test('late running snapshots cannot undo terminal pipeline or stage', () => {
  assert.equal(advancesTrustSnapshot({ pipelineStatus: 'RUNNING' }, { pipelineStatus: 'COMPLETED' }), false);
  assert.equal(advancesTrustSnapshot({ pipelineStatus: 'RUNNING' }, { pipelineStatus: 'PARTIAL' }), false);
  assert.equal(advancesTrustSnapshot({ stages: { l1: { operationStatus: 'RUNNING' } } }, { stages: { l1: { operationStatus: 'COMPLETED' } } }), false);
  assert.equal(advancesTrustSnapshot({ stages: { l1: { operationStatus: 'RUNNING' } } }, { stages: { l1: { operationStatus: 'PARTIAL' } } }), false);
});

test('identical final and terminal snapshots retain their durable result identity', () => {
  const requestId = 'trust-request-current';
  const active = { requestId };
  const response = {
    requestId,
    caseId: 'e7338472-6392-4ca0-9d63-63028558713a',
    caseRevision: 7,
    runId: 'run-current',
    persistence: { persisted: true },
    data: { requestId, pipelineStatus: 'COMPLETED', finalPredict: { status: 'READY' } },
  };
  const finalReadySnapshot = structuredClone(response.data);
  assert.equal(advancesTrustSnapshot(response.data, finalReadySnapshot), true);
  assert.equal(isTrustTerminalResponse(response, active), true);
  assert.equal(isTrustTerminalResponse({ ...response, requestId: 'older-request' }, active), false);
  assert.equal(isTrustTerminalResponse({ ...response, caseRevision: null }, active), false);
  assert.equal(isTrustTerminalResponse({ ...response, data: { ...response.data, pipelineStatus: 'RUNNING' } }, active), false);
});
test('missing and malformed metrics remain absent; unknown statuses never become positive', () => {
  const model = projectTrust({ data: { finalPredict: { sourceQuality: {}, evidenceAgreement: null, truthVerdict: 'SAFE' } } });
  assert.equal(model.metrics.length, 0); assert.equal(model.confidence, null); assert.match(truthLabel('SAFE'), /Chưa có/);
});

test('AI citations stay linked to the persisted Trust revision and only safe structured URLs render', () => {
  const model = projectTrust({
    requestId: 'request-current', caseId: 'e7338472-6392-4ca0-9d63-63028558713a', caseRevision: 7, runId: 'run-current',
    persistence: { persisted: true },
    data: { layerResults: {
      layer3: {
        sources: [{ sourceId: 'source-current', title: 'Policy source', url: 'https://example.org/policy', retrievalOrigin: 'TAVILY_INITIAL' }],
        evidence: [{ evidenceId: 'evidence-current', sourceId: 'source-current', relation: 'SUPPORTS', revision: 7 }],
      },
      layer4: { aiVerificationStatus: 'VERIFIED', aiVerification: {
        provider: 'google', supportingSourceIds: ['source-current'], contradictingSourceIds: [],
        citationsUsed: [
          { id: 'source-current', url: 'https://example.org/policy', validationStatus: 'LAYER3_VALIDATED' },
          { id: 'unsafe', url: 'javascript:alert(1)' },
          { id: 'credential', url: 'https://example.org/policy?api_key=secret' },
        ],
        citationValidation: { checkedCount: 3, acceptedCount: 1, rejectedCount: 2, allLinksValidated: false },
      } },
    } },
  });
  assert.equal(model.aiProvenance.available, true);
  assert.equal(model.aiProvenance.revisionBound, true);
  assert.equal(model.aiProvenance.caseRevision, 7);
  assert.equal(model.aiProvenance.runId, 'run-current');
  assert.equal(model.aiProvenance.citations.length, 1);
  assert.equal(model.aiProvenance.citations[0].title, 'Policy source');
  assert.equal(model.aiProvenance.citations[0].relation, 'SUPPORTS');
  assert.equal(model.aiProvenance.citations[0].evidenceRevision, 7);

  const unpersisted = projectTrust({
    requestId: 'request-current', caseId: 'e7338472-6392-4ca0-9d63-63028558713a', caseRevision: 7, runId: 'run-current',
    persistence: { persisted: false }, data: { layerResults: { layer4: { aiVerification: { provider: 'google', citationsUsed: [{ url: 'https://example.org' }] } } } },
  });
  assert.equal(unpersisted.aiProvenance.revisionBound, false);
  assert.equal(unpersisted.aiProvenance.caseRevision, null);
  assert.equal(unpersisted.aiProvenance.runId, null);
});
