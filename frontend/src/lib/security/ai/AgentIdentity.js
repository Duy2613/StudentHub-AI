/**
 * StudentHub AI — Zero-Trust Security Fabric
 * AgentIdentity V1
 * 
 * Distinct identity model for AI Agents:
 * - AI is NEVER treated as a raw human user by default
 * - Bound to explicit agent type, allowed tools, scopes, and delegator
 */

export const AGENT_TYPE = Object.freeze({
  ACADEMIC_PLANNER: "ACADEMIC_PLANNER",
  TRUST_VERIFIER: "TRUST_VERIFIER",
  COPILOT_ADVISOR: "COPILOT_ADVISOR",
  COMMUNITY_MODERATOR: "COMMUNITY_MODERATOR"
});

export class AgentIdentity {
  #agentId;
  #agentType;
  #version;
  #allowedTools;
  #allowedScopes;
  #delegatorId;
  #trustLevel;
  #issuedAt;
  #expiresAt;

  /**
   * @param {object} params
   * @param {string} params.agentId - e.g. "agent_academic_planner_v1"
   * @param {string} params.agentType - AGENT_TYPE enum
   * @param {string} [params.version] - e.g. "1.0.0"
   * @param {string[]} [params.allowedTools]
   * @param {string[]} [params.allowedScopes]
   * @param {string|null} [params.delegatorId] - StudentId who delegated action
   * @param {string} [params.trustLevel] - "SANDBOXED", "VERIFIED", "ELEVATED"
   * @param {number} [params.ttlSeconds] - default 3600 (1 hour)
   */
  constructor({
    agentId,
    agentType = AGENT_TYPE.ACADEMIC_PLANNER,
    version = "1.0.0",
    allowedTools = [],
    allowedScopes = [],
    delegatorId = null,
    trustLevel = "SANDBOXED",
    ttlSeconds = 3600
  }) {
    if (!agentId || !agentType) {
      throw new Error("[AGENT_IDENTITY_ERROR] agentId and agentType are required.");
    }

    const now = Date.now();
    this.#agentId = String(agentId).trim();
    this.#agentType = agentType;
    this.#version = String(version).trim();
    this.#allowedTools = Object.freeze([...allowedTools.map(t => String(t).trim())]);
    this.#allowedScopes = Object.freeze([...allowedScopes.map(s => String(s).trim().toLowerCase())]);
    this.#delegatorId = delegatorId ? String(delegatorId).trim() : null;
    this.#trustLevel = trustLevel;
    this.#issuedAt = now;
    this.#expiresAt = now + (ttlSeconds * 1000);

    Object.freeze(this);
  }

  get agentId() { return this.#agentId; }
  get agentType() { return this.#agentType; }
  get version() { return this.#version; }
  get allowedTools() { return this.#allowedTools; }
  get allowedScopes() { return this.#allowedScopes; }
  get delegatorId() { return this.#delegatorId; }
  get trustLevel() { return this.#trustLevel; }
  get issuedAt() { return this.#issuedAt; }
  get expiresAt() { return this.#expiresAt; }

  get isExpired() {
    return Date.now() > this.#expiresAt;
  }

  canInvokeTool(toolName) {
    if (!toolName) return false;
    const cleanTool = String(toolName).trim();
    return this.#allowedTools.includes(cleanTool) || this.#allowedTools.includes("*");
  }

  toJSON() {
    return {
      agentId: this.#agentId,
      agentType: this.#agentType,
      version: this.#version,
      allowedTools: this.#allowedTools,
      allowedScopes: this.#allowedScopes,
      delegatorId: this.#delegatorId,
      trustLevel: this.#trustLevel,
      isExpired: this.isExpired
    };
  }

  /**
   * Preconfigured Canonical Agent Factories
   */
  static createAcademicPlannerAgent(delegatorStudentId) {
    return new AgentIdentity({
      agentId: `agent_planner_${delegatorStudentId || "generic"}`,
      agentType: AGENT_TYPE.ACADEMIC_PLANNER,
      version: "1.0.0",
      allowedTools: [
        "Academic.ReadTranscript",
        "Academic.ReadSchedule",
        "Academic.PlanSemester",
        "Academic.SimulateWhatIf"
      ],
      allowedScopes: ["academic:read", "academic:plan"],
      delegatorId: delegatorStudentId,
      trustLevel: "VERIFIED"
    });
  }

  static createTrustVerifierAgent() {
    return new AgentIdentity({
      agentId: "agent_trust_verifier_v1",
      agentType: AGENT_TYPE.TRUST_VERIFIER,
      version: "1.0.0",
      allowedTools: [
        "Trust.ReadGraph",
        "Trust.EvaluateClaim",
        "Trust.SearchOfficialSource"
      ],
      allowedScopes: ["trust:read", "trust:evaluate"],
      delegatorId: null,
      trustLevel: "VERIFIED"
    });
  }
}
