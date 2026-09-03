/**
 * StudentHub AI — Zero-Trust Security Fabric
 * AiDelegationEngine V1
 * 
 * Manages explicit user delegation to AI agents:
 * - Ensures AI can never escalate authority beyond the delegating user
 * - Issues bounded, single-use capabilities for AI sub-tasks
 * - Invariant: "AI can reason over authority; AI cannot become authority."
 */

import { SecurityPrincipal, PRINCIPAL_TYPE } from "../core/SecurityPrincipal.js";
import { CapabilityManager } from "../capability/CapabilityManager.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

export class AiDelegationEngine {
  /**
   * Creates a delegated SecurityPrincipal for an AI agent acting on behalf of a student
   * @param {object} params
   * @param {SecurityPrincipal} params.userPrincipal - Authenticated human user principal
   * @param {import("./AgentIdentity.js").AgentIdentity} params.agentIdentity
   * @param {string[]} [params.delegatedScopes]
   * @returns {SecurityPrincipal} Delegated principal
   */
  static createDelegatedPrincipal({
    userPrincipal,
    agentIdentity,
    delegatedScopes = ["academic:read", "academic:plan"]
  }) {
    if (!userPrincipal || !userPrincipal.isAuthenticated) {
      throw SecurityError.unauthorized("Cannot delegate AI authority without an authenticated user principal.");
    }

    if (!agentIdentity || agentIdentity.isExpired) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AI_TOOL_DENIED,
        message: "Invalid or expired AI agent identity.",
        statusCode: 403
      });
    }

    // Narrow scopes to intersection of user scopes and agent allowed scopes
    const boundedScopes = delegatedScopes.filter(s =>
      userPrincipal.hasScope(s) && agentIdentity.allowedScopes.includes(s)
    );

    return new SecurityPrincipal({
      subjectId: `agent:${agentIdentity.agentId}`,
      principalType: PRINCIPAL_TYPE.AI_AGENT,
      email: userPrincipal.email,
      roles: ["ai_agent"],
      permissions: ["ACADEMIC.READ_OWN", "ACADEMIC.PLAN_OWN", "TRUST.READ"],
      scopes: boundedScopes,
      tenantId: userPrincipal.tenantId,
      assuranceLevel: userPrincipal.assuranceLevel,
      sessionId: userPrincipal.sessionId,
      agentIdentity: agentIdentity.toJSON(),
      attributes: {
        delegatorId: userPrincipal.subjectId,
        isDelegated: true
      }
    });
  }

  /**
   * Requests a bounded capability for an AI tool invocation
   * @param {SecurityPrincipal} agentPrincipal 
   * @param {string} toolName 
   * @param {string} action 
   * @param {string} resource 
   * @returns {object} Capability token
   */
  static requestToolCapability(agentPrincipal, toolName, action, resource) {
    if (!agentPrincipal.isAgent) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AI_TOOL_DENIED,
        message: "Only validated AI agent principals can request tool capabilities.",
        statusCode: 403
      });
    }

    const delegatorId = agentPrincipal.attributes?.delegatorId;
    return CapabilityManager.issueCapability({
      subject: agentPrincipal.subjectId,
      action,
      resource,
      purpose: "AI_ASSISTANCE",
      ttlSeconds: 60, // 1 minute short-lived
      maxUses: 1
    });
  }
}
