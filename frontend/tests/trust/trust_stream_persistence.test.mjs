import test from 'node:test';
import assert from 'node:assert/strict';
import { trustApi } from '../../src/lib/api/trust.ts';
import { projectTrust } from '../../src/lib/trust/trustV4Model.js';

const requestId = 'stream-persistence-test';
const caseId = 'af22e56a-8fbc-4c31-a34e-fe92554e390b';
function pipeline() {
  const stages = Object.fromEntries(['l1', 'l2', 'l3', 'l4'].map(stageId => [stageId, {
    schemaVersion: 'test.stage', requestId, stageId, architecturalLayer: stageId,
    stageName: stageId, role: 'test', checking: 'test', operationStatus: 'COMPLETED',
    finding: 'UNKNOWN', severity: 'INFO', startedAt: null, completedAt: null,
    latencyMs: null, providerStatus: 'NOT_REQUESTED', providerId: null, modelId: null,
    modelVersion: null, confidence: null, confidenceKind: 'UNQUANTIFIED',
    summary: 'test', reasons: [], signals: [], evidenceRefs: [], meaning: 'test',
    notProve: 'test', limitations: ['test'], nextStage: null, safeToContinue: true,
    userAction: 'test', audit: { attempt: 1, attemptCount: 1, errorCode: null, transition: 'COMPLETED' },
  }]));
  return { schemaVersion: 'trust.v5', pipelineVersion: 'test', pipelineModel: 'FOUR_LAYER',
    publicLayerCount: 4, requestId, pipelineStatus: 'COMPLETED', currentStage: null,
    stages, finalDecision: null, finalPredict: { status: 'READY', truthAssessment: 'INSUFFICIENT_EVIDENCE' },
    assurance: null, startedAt: null, completedAt: null,
    audit: { requestId, stageSequence: [], stageAttempts: [], hardNegativePropagation: [], policyVersion: 'test', assuranceVersion: null },
  };
}
const chunk = event => new TextEncoder().encode('data: ' + JSON.stringify(event) + '\n\n');

test('delayed terminal commit binds the displayed decision to its saved revision', async t => {
  let streamController;
  let cancelled = false;
  const data = pipeline();
  const stream = new ReadableStream({ start(controller) { streamController = controller; }, cancel() { cancelled = true; } });
  t.mock.method(globalThis, 'fetch', async () => new Response(stream, { headers: { 'content-type': 'text/event-stream' } }));
  const events = [];
  let returned = false;
  const pending = trustApi.sequential({ type: 'text', content: 'test' }, undefined, event => events.push(event), requestId).then(value => { returned = true; return value; });
  streamController.enqueue(chunk({ type: 'final_predict', event: 'FINAL_PREDICT_READY', requestId, data }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(events[0].event, 'FINAL_PREDICT_READY');
  assert.equal(returned, false, 'follow-up actions must await the server commit');
  assert.equal(cancelled, false, 'the terminal persistence event must remain readable');
  streamController.enqueue(chunk({ type: 'complete', event: 'PIPELINE_COMPLETED', requestId, caseId, caseRevision: 1, runId: 'saved-run', persistence: { persisted: true, idempotent: false, status: 'PERSISTED' }, data }));
  const response = await pending;
  const model = projectTrust(response);
  assert.equal(model.persisted, true);
  assert.equal(model.caseId, caseId);
  assert.equal(model.caseRevision, 1);
  assert.equal(model.runId, 'saved-run');
});

test('a failed terminal save stays explicitly unbound without losing the decision', async t => {
  const data = pipeline();
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ start(controller) {
    controller.enqueue(chunk({ type: 'final_predict', event: 'FINAL_PREDICT_READY', requestId, data }));
    controller.enqueue(chunk({ type: 'complete', event: 'PIPELINE_COMPLETED', requestId, caseId: null, persistence: { persisted: false, idempotent: false, status: 'UNAVAILABLE', errorCode: 'TRUST_PERSISTENCE_UNAVAILABLE' }, data }));
    controller.close();
  } }), { headers: { 'content-type': 'text/event-stream' } }));
  const response = await trustApi.sequential({ type: 'text', content: 'test' }, undefined, undefined, requestId);
  assert.equal(response.data.finalPredict.status, 'READY');
  assert.equal(projectTrust(response).persisted, false);
  assert.equal(response.persistence.status, 'UNAVAILABLE');
});
