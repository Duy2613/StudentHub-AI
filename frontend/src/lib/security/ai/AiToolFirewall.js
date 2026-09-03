/**
 * StudentHub AI — Zero-Trust Security Fabric
 * AiToolFirewall V1
 * 
 * Central AI Tool Authorization Gateway:
 * - Strictly validates Agent Identity, Delegation, Scopes, Capabilities, and Purpose
 * - Enforces explicit Tool Allowlist & Input Schemas
 * - Detects prompt injections in tool arguments & tool returns
 * - Enforces Data Minimization projections before returning results to AI models
 */

import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";
import { PropertyFilter } from "../authorization/PropertyFilter.js";
import { CapabilityManager } from "../capability/CapabilityManager.js";
import { PurposeValidator } from "../purpose/PurposeValidator.js";
import { AdversarialTrustGuard } from "../../intelligence/trust/adversarialTrustGuard.js";

export const AI_TOOL_REGISTRY = Object.freeze({
  "Academic.ReadTranscript": {
    toolId: "Academic.ReadTranscript",
    requiredScopes: ["academic:read"],
    allowedPurposes: ["ACADEMIC_PLANNING", "AI_ASSISTANCE"],
    action: "ACADEMIC.READ_OWN",
    resourceType: "TRANSCRIPT"
  },
  "Academic.ReadSchedule": {
    toolId: "Academic.ReadSchedule",
    requiredScopes: ["academic:read"],
    allowedPurposes: ["ACADEMIC_PLANNING", "AI_ASSISTANCE"],
    action: "ACADEMIC.READ_OWN",
    resourceType: "SCHEDULE"
  },
  "Academic.PlanSemester": {
    toolId: "Academic.PlanSemester",
    requiredScopes: ["academic:plan"],
    allowedPurposes: ["ACADEMIC_PLANNING", "AI_ASSISTANCE"],
    action: "ACADEMIC.PLAN_OWN",
    resourceType: "PLANNER"
  },
  "Academic.SimulateWhatIf": {
    toolId: "Academic.SimulateWhatIf",
    requiredScopes: ["academic:plan"],
    allowedPurposes: ["ACADEMIC_PLANNING", "AI_ASSISTANCE"],
    action: "ACADEMIC.PLAN_OWN",
    resourceType: "SIMULATION"
  },
  "Trust.ReadGraph": {
    toolId: "Trust.ReadGraph",
    requiredScopes: ["trust:read"],
    allowedPurposes: ["TRUST_ANALYSIS", "AI_ASSISTANCE"],
    action: "TRUST.READ",
    resourceType: "TRUST_GRAPH"
  },
  "Trust.EvaluateClaim": {
    toolId: "Trust.EvaluateClaim",
    requiredScopes: ["trust:evaluate"],
    allowedPurposes: ["TRUST_ANALYSIS", "AI_ASSISTANCE"],
    action: "TRUST.EVALUATE",
    resourceType: "CLAIM"
  },
  "Community.ReadPosts": {
    toolId: "Community.ReadPosts",
    requiredScopes: ["community:read"],
    allowedPurposes: ["AI_ASSISTANCE"],
    action: "COMMUNITY.READ",
    resourceType: "COMMUNITY_POSTS"
  }
});

export class AiToolFirewall {
  /**
   * Authorizes and executes an AI Tool invocation within the Security Fabric
   * @param {object} params
   * @param {import("../core/SecurityPrincipal.js").SecurityPrincipal} params.agentPrincipal - The AI Agent principal
   * @param {string} params.toolId - e.g. "Academic.ReadTranscript"
   * @param {object} params.toolInput - Arguments passed by the LLM
   * @param {string} [params.purpose] - Declared purpose
   * @param {object} [params.capability] - Capability token if required
   * @param {Function} params.executor - The raw underlying tool implementation
   * @returns {Promise<object>} Filtered and sanitized minimal output
   */
  static async executeTool({
    agentPrincipal,
    toolId,
    toolInput = {},
    purpose = "AI_ASSISTANCE",
    capability = null,
    executor
  }) {
    if (!agentPrincipal || !agentPrincipal.isAgent) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AI_TOOL_DENIED,
        message: "Tool invocation prohibited: Requester is not a verified AI Agent Principal.",
        statusCode: 403
      });
    }

    // 1. Tool Allowlist Check
    const toolDef = AI_TOOL_REGISTRY[toolId];
    if (!toolDef) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AI_TOOL_DENIED,
        message: `Unknown or prohibited tool: '${toolId}'. Tool is not on the security allowlist.`,
        statusCode: 403
      });
    }

    // 2. Agent Permissions to call tool
    const allowedTools = Array.isArray(agentPrincipal.agentIdentity?.allowedTools)
      ? agentPrincipal.agentIdentity.allowedTools
      : [];
    if (agentPrincipal.agentIdentity && !allowedTools.includes(toolId) && !allowedTools.includes("*")) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AI_TOOL_DENIED,
        message: `Agent '${agentPrincipal.agentIdentity.agentId}' is not authorized to invoke tool '${toolId}'.`,
        statusCode: 403
      });
    }

    // 3. Scope Verification
    const hasRequiredScopes = agentPrincipal.hasScope(toolDef.requiredScopes);
    if (!hasRequiredScopes) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.INSUFFICIENT_SCOPE,
        message: `Agent lacks required scope(s) [${toolDef.requiredScopes.join(", ")}] for tool '${toolId}'.`,
        statusCode: 403
      });
    }

    // 4. Purpose Binding Check
    PurposeValidator.assertPurposeValid(toolDef.action, purpose);

    // 5. Capability Consumption (If capability provided)
    if (capability) {
      CapabilityManager.verifyAndConsume(capability, {
        subject: agentPrincipal.subjectId,
        action: toolDef.action,
        purpose
      });
    }

    // 6. Input Injection & Integrity Inspection
    const inputStr = JSON.stringify(toolInput);
    const inspection = AdversarialTrustGuard.inspectText(inputStr);
    if (inspection.isAdversarial) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.PROMPT_INJECTION_BLOCKED,
        message: "Prompt injection or authority escalation detected inside tool parameters.",
        statusCode: 403,
        details: { patterns: inspection.detectedPatterns }
      });
    }

    // 7. Prevent Cross-Student Data Access via Tool Arguments
    const delegatorId = agentPrincipal.attributes?.delegatorId;
    if (typeof delegatorId === "string" && delegatorId && toolInput.studentId) {
      const cleanDelegator = delegatorId.replace("student:", "").trim();
      const cleanTarget = String(toolInput.studentId).replace("student:", "").trim();
      if (cleanDelegator !== cleanTarget) {
        throw new SecurityError({
          code: SECURITY_ERROR_CODE.OBJECT_NOT_OWNED,
          message: `AI Agent cannot access data for student '${cleanTarget}' while acting on delegation for '${cleanDelegator}'.`,
          statusCode: 403
        });
      }
    }

    // 8. Execute Tool
    let rawResult;
    try {
      rawResult = await executor(toolInput);
    } catch {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.INTERNAL_SECURITY_ERROR,
        message: "Tool execution failed while processing the request.",
        statusCode: 500
      });
    }

    // 9. Output Filtering & Data Minimization Projection
    const filteredResult = PropertyFilter.filterStudentProfile(rawResult, agentPrincipal);

    return Object.freeze(filteredResult);
  }
}
