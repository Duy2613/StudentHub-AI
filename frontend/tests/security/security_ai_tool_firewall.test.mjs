/**
 * StudentHub AI — Security Fabric AI Tool Firewall & Delegation Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { AgentIdentity, AGENT_TYPE } from "../../src/lib/security/ai/AgentIdentity.js";
import { AiDelegationEngine } from "../../src/lib/security/ai/AiDelegationEngine.js";
import { AiToolFirewall } from "../../src/lib/security/ai/AiToolFirewall.js";
import { SecurityPrincipal, PRINCIPAL_TYPE } from "../../src/lib/security/core/SecurityPrincipal.js";
import { CapabilityManager } from "../../src/lib/security/capability/CapabilityManager.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../../src/lib/security/core/SecurityErrorEnvelope.js";

describe("Security Fabric — AI Agent Identity & Tool Firewall", () => {
  beforeEach(() => {
    CapabilityManager.clear();
  });

  it("should create bounded delegated principal with scope intersection", () => {
    const userPrincipal = new SecurityPrincipal({
      subjectId: "student:24110001",
      roles: ["student"],
      scopes: ["academic:read", "community:read"] // User does NOT have academic:plan
    });

    const agent = AgentIdentity.createAcademicPlannerAgent("24110001");
    const delegated = AiDelegationEngine.createDelegatedPrincipal({
      userPrincipal,
      agentIdentity: agent,
      delegatedScopes: ["academic:read", "academic:plan"]
    });

    assert.strictEqual(delegated.isAgent, true);
    assert.strictEqual(delegated.hasScope("academic:read"), true);
    // User lacked academic:plan, so delegated principal does not receive it
    assert.strictEqual(delegated.hasScope("academic:plan"), false);
  });

  it("should execute allowlisted tool and apply data minimization to output", async () => {
    const userPrincipal = new SecurityPrincipal({
      subjectId: "student:24110001",
      roles: ["student"],
      scopes: ["academic:read", "academic:plan"]
    });

    const agent = AgentIdentity.createAcademicPlannerAgent("24110001");
    const delegated = AiDelegationEngine.createDelegatedPrincipal({
      userPrincipal,
      agentIdentity: agent
    });

    const rawTranscriptDatabaseRecord = {
      studentId: "24110001",
      cohort: 2024,
      programCode: "7480103",
      academicSummary: { cgpa: 3.65, earnedCredits: 75, academicStanding: "EXCELLENT" },
      courses: [
        { courseId: "MATH141701", courseName: "Giải tích 1", credits: 4, status: "PASSED", gradeLetter: "A" }
      ],
      // Sensitive internal fields that MUST be filtered out for AI:
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehash",
      otpSecret: "JBSWY3DPEHPK3PXP",
      internalRiskSignals: ["HIGH_COMMUNITY_FLAG"],
      administrativeNotes: "Disciplinary hearing scheduled for next term.",
      authUserId: "supabase-uuid-12345"
    };

    const output = await AiToolFirewall.executeTool({
      agentPrincipal: delegated,
      toolId: "Academic.ReadTranscript",
      toolInput: { studentId: "24110001" },
      purpose: "ACADEMIC_PLANNING",
      executor: async () => rawTranscriptDatabaseRecord
    });

    assert.strictEqual(output.studentId, "24110001");
    assert.strictEqual(output.academicSummary.cgpa, 3.65);
    // Verify Data Minimization: sensitive fields are stripped
    assert.strictEqual(output.passwordHash, undefined);
    assert.strictEqual(output.otpSecret, undefined);
    assert.strictEqual(output.internalRiskSignals, undefined);
    assert.strictEqual(output.administrativeNotes, undefined);
    assert.strictEqual(output.authUserId, undefined);
  });

  it("should block AI agent from attempting cross-student data exfiltration", async () => {
    const userPrincipal = new SecurityPrincipal({
      subjectId: "student:24110001",
      roles: ["student"],
      scopes: ["academic:read"]
    });

    const agent = AgentIdentity.createAcademicPlannerAgent("24110001");
    const delegated = AiDelegationEngine.createDelegatedPrincipal({
      userPrincipal,
      agentIdentity: agent
    });

    await assert.rejects(
      async () => {
        await AiToolFirewall.executeTool({
          agentPrincipal: delegated,
          toolId: "Academic.ReadTranscript",
          toolInput: { studentId: "24110002" }, // Cross-student target!
          purpose: "ACADEMIC_PLANNING",
          executor: async () => ({})
        });
      },
      (err) => {
        assert.strictEqual(err.code, SECURITY_ERROR_CODE.OBJECT_NOT_OWNED);
        return true;
      }
    );
  });
});
