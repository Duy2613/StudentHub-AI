import assert from "node:assert/strict";
import test from "node:test";
import { SecurityPrincipal, PRINCIPAL_TYPE } from "../../src/lib/security/core/SecurityPrincipal.js";
import { ReBACPolicy, RELATIONSHIPS } from "../../src/lib/security/authorization/ReBACPolicy.js";

const ownerId = "11111111-1111-4111-8111-111111111111";
const assignedExpertId = "22222222-2222-4222-8222-222222222222";
const otherExpertId = "33333333-3333-4333-8333-333333333333";

function principal(subjectId, roles, principalType = PRINCIPAL_TYPE.STUDENT) {
  return new SecurityPrincipal({
    subjectId,
    principalType,
    roles,
    permissions: [],
    scopes: []
  });
}

test("assigned expert access is explicit and does not weaken owner isolation", () => {
  const assignedTask = { ownerId, assigneeId: assignedExpertId, taskId: "TASK_ASSIGNED" };
  const assignedExpert = principal(assignedExpertId, ["EXPERT"], PRINCIPAL_TYPE.EXPERT);
  const otherExpert = principal(otherExpertId, ["EXPERT"], PRINCIPAL_TYPE.EXPERT);
  const ordinaryStudent = principal(assignedExpertId, ["STUDENT"], PRINCIPAL_TYPE.STUDENT);
  const owner = principal(ownerId, ["STUDENT"], PRINCIPAL_TYPE.STUDENT);

  assert.equal(ReBACPolicy.evaluate({ principal: assignedExpert, resource: assignedTask, requiredRelationship: RELATIONSHIPS.OWNS }).allowed, true);
  assert.equal(ReBACPolicy.evaluate({ principal: otherExpert, resource: assignedTask, requiredRelationship: RELATIONSHIPS.OWNS }).allowed, false);
  assert.equal(ReBACPolicy.evaluate({ principal: ordinaryStudent, resource: assignedTask, requiredRelationship: RELATIONSHIPS.OWNS }).allowed, false);
  assert.equal(ReBACPolicy.evaluate({ principal: owner, resource: assignedTask, requiredRelationship: RELATIONSHIPS.OWNS }).allowed, true);
});
