import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertIntelligenceModel } from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertAuthorizationPrivacy", () => {
  it("should redact private phone, email, and personal IDs from public profile view", () => {
    const internalExpert = ExpertIntelligenceModel.createExpert({
      name: "TS. Nguyễn Văn Minh",
      privateContact: {
        personalPhone: "+84903123456",
        personalEmail: "private.minh@gmail.com",
        citizenId: "079088001234"
      }
    });

    assert.ok(internalExpert.privateContact);

    const publicProfile = ExpertIntelligenceModel.redactForPublic(internalExpert);
    assert.strictEqual(publicProfile.privateContact, undefined);
    assert.strictEqual(publicProfile.name, "TS. Nguyễn Văn Minh");
  });
});
