import test from 'node:test';
import assert from 'node:assert/strict';
import { roomRoundEligibility } from '../../src/lib/server/expert/ExpertRoomEligibility.js';
const room = { id: 'room-1', domain_code: 'AI_ML', status: 'LOBBY', host_user_id: 'host', supervisor_user_id: 'supervisor' };
const supervisor = { user_id: 'supervisor', role: 'SUPERVISOR_EXPERT', conflict_declaration: 'NO_KNOWN_CONFLICT' };
const expert = { user_id: 'answerer', role: 'PARTICIPANT_EXPERT' };
const client = rows => ({ query: async (sql, params) => {
  assert.deepEqual(params, ['room-1', 'AI_ML']);
  assert.match(sql, /presence\.expires_at > now\(\)/);
  assert.match(sql, /v\.status = 'VERIFIED'/);
  assert.match(sql, /v\.qualification_state = 'DOMAIN_VERIFIED'/);
  assert.match(sql, /v\.suspended_at IS NULL/);
  assert.match(sql, /v\.expires_at > now\(\)/);
  return { rows };
} });
test('Supervisor acceptance alone does not make its own answers eligible for independent adjudication', async () => {
  const result = await roomRoundEligibility(client([supervisor]), room);
  assert.deepEqual(result.eligibility, { canStart:false, supervisorEligible:true, answerExpertCount:0, blockReason:'EXPERT_ROOM_EXPERT_REQUIRED' });
});
test('assigned online qualified Supervisor and distinct answerer enable round creation', async () => {
  const result = await roomRoundEligibility(client([supervisor,expert,expert]), room);
  assert.equal(result.eligibility.canStart, true);
  assert.equal(result.eligibility.blockReason, null);
  assert.deepEqual(result.answerExpertIds, ['answerer']);
});
test('wrong Supervisor assignment, conflict, expired presence/scope cannot enable a round', async () => {
  for(const rows of [[expert], [{...supervisor,user_id:'wrong'},expert], [{...supervisor,conflict_declaration:'DECLARED_CONFLICT'},expert]]) {
    const result = await roomRoundEligibility(client(rows),room);
    assert.equal(result.eligibility.canStart,false);
    assert.equal(result.eligibility.blockReason,'EXPERT_ROOM_SUPERVISOR_REQUIRED');
  }
});
test('Host and Supervisor cannot be inserted in the scored answerer set', async () => {
  const result = await roomRoundEligibility(client([supervisor,{...expert,user_id:'host'},{...expert,user_id:'supervisor'}]),room);
  assert.deepEqual(result.answerExpertIds,[]);
});
