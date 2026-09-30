import assert from "node:assert/strict";
import test from "node:test";
import { resolveTrustCapabilityPlan } from "../../src/lib/ai-trust/TrustCapabilityRouter.js";

test("Friend Trust is an advisory-only capability for supported TEXT and URL inputs", () => {
  for (const type of ["text", "url"]) {
    const plan = resolveTrustCapabilityPlan({ type }, { friendEnabled: true });
    assert.equal(plan.canonicalProvider, "STUDENTHUB");
    assert.deepEqual(plan.canonicalStages, ["L1", "L2", "L3", "L4"]);
    assert.equal(plan.friendTrust.mode, "SHADOW");
    assert.equal(plan.friendTrust.layer2, true);
    assert.equal(plan.friendTrust.layer3, true);
    assert.equal(plan.friendTrust.layer4, true);
    assert.equal(plan.friendTrust.canAffectCanonicalConclusion, false);
  }
});

test("IMAGE and QR remain StudentHub-only until Friend media contracts are verified", () => {
  for (const type of ["image", "qr", "file"]) {
    const plan = resolveTrustCapabilityPlan({ type }, { friendEnabled: true });
    assert.equal(plan.friendTrust.mode, "DISABLED");
    assert.equal(plan.friendTrust.layer2, false);
    assert.equal(plan.friendTrust.layer3, false);
    assert.equal(plan.friendTrust.layer4, false);
    assert.equal(plan.friendTrust.canAffectCanonicalConclusion, false);
  }
});

test("Friend Trust stays disabled unless the server explicitly enables its adapter", () => {
  const plan = resolveTrustCapabilityPlan({ type: "text" });
  assert.equal(plan.friendTrust.mode, "DISABLED");
  assert.equal(plan.friendTrust.layer2, false);
  assert.equal(plan.friendTrust.canAffectCanonicalConclusion, false);
});
