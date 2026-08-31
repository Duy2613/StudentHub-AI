/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SecurityPrincipal V1
 * 
 * Immutable representation of an evaluated security principal:
 * - Establishes identity from authenticated server-side context
 * - Never trusts client-supplied identity claims
 * - Contains roles, permissions, scopes, assurance levels, and active agent context
 */

export const AUTH_ASSURANCE_LEVEL = Object.freeze({
  AAL0_UNKNOWN: "AAL0_UNKNOWN",
  AAL1_NORMAL: "AAL1_NORMAL",
  AAL2_STEP_UP: "AAL2_STEP_UP",
  AAL3_HIGH_ASSURANCE: "AAL3_HIGH_ASSURANCE"
});

export const PRINCIPAL_TYPE = Object.freeze({
  STUDENT: "STUDENT",
  EXPERT: "EXPERT",
  MODERATOR: "MODERATOR",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
  AI_AGENT: "AI_AGENT",
  ANONYMOUS: "ANONYMOUS"
});

export class SecurityPrincipal {
  #subjectId;
  #principalType;
  #email;
  #roles;
  #permissions;
  #scopes;
  #tenantId;
  #assuranceLevel;
  #sessionId;
  #agentIdentity;
  #attributes;
  #authenticatedAt;

  /**
   * @param {object} params
   * @param {string} params.subjectId - Authoritative server-side subject identifier (e.g. "student:24110001", "usr_123")
   * @param {string} [params.principalType] - PRINCIPAL_TYPE enum
   * @param {string} [params.email]
   * @param {string[]} [params.roles]
   * @param {string[]} [params.permissions]
   * @param {string[]} [params.scopes]
   * @param {string} [params.tenantId]
   * @param {string} [params.assuranceLevel] - AUTH_ASSURANCE_LEVEL enum
   * @param {string} [params.sessionId]
   * @param {object|null} [params.agentIdentity] - Optional AI Agent identity if delegated
   * @param {object} [params.attributes] - Dynamic ABAC attributes
   * @param {string} [params.authenticatedAt]
   */
  constructor({
    subjectId,
    principalType = PRINCIPAL_TYPE.STUDENT,
    email = "",
    roles = [],
    permissions = [],
    scopes = [],
    tenantId = "hcmute",
    assuranceLevel = AUTH_ASSURANCE_LEVEL.AAL1_NORMAL,
    sessionId = null,
    agentIdentity = null,
    attributes = {},
    authenticatedAt = new Date().toISOString()
  }) {
    if (!subjectId || typeof subjectId !== "string" || !subjectId.trim()) {
      throw new Error("[SECURITY_PRINCIPAL_ERROR] subjectId is required and cannot be empty.");
    }

    this.#subjectId = String(subjectId).trim();
    this.#principalType = Object.values(PRINCIPAL_TYPE).includes(principalType)
      ? principalType
      : PRINCIPAL_TYPE.STUDENT;
    this.#email = String(email || "").trim().toLowerCase();
    this.#roles = Object.freeze([...new Set(roles.map(r => String(r).trim().toUpperCase()))]);
    this.#permissions = Object.freeze([...new Set(permissions.map(p => String(p).trim().toUpperCase()))]);
    this.#scopes = Object.freeze([...new Set(scopes.map(s => String(s).trim().toLowerCase()))]);
    this.#tenantId = String(tenantId || "hcmute").trim();
    this.#assuranceLevel = Object.values(AUTH_ASSURANCE_LEVEL).includes(assuranceLevel)
      ? assuranceLevel
      : AUTH_ASSURANCE_LEVEL.AAL1_NORMAL;
    this.#sessionId = sessionId ? String(sessionId).trim() : null;
    this.#agentIdentity = agentIdentity ? Object.freeze({ ...agentIdentity }) : null;
    this.#attributes = Object.freeze({ ...attributes });
    this.#authenticatedAt = authenticatedAt;

    Object.freeze(this);
  }

  get subjectId() { return this.#subjectId; }
  get principalType() { return this.#principalType; }
  get email() { return this.#email; }
  get roles() { return this.#roles; }
  get permissions() { return this.#permissions; }
  get scopes() { return this.#scopes; }
  get tenantId() { return this.#tenantId; }
  get assuranceLevel() { return this.#assuranceLevel; }
  get sessionId() { return this.#sessionId; }
  get agentIdentity() { return this.#agentIdentity; }
  get attributes() { return this.#attributes; }
  get authenticatedAt() { return this.#authenticatedAt; }

  get isAuthenticated() {
    return this.#principalType !== PRINCIPAL_TYPE.ANONYMOUS && this.#subjectId !== "anonymous";
  }

  get isAgent() {
    return this.#principalType === PRINCIPAL_TYPE.AI_AGENT || this.#agentIdentity !== null;
  }

  /**
   * Checks if principal has a specific role
   * @param {string} role 
   * @returns {boolean}
   */
  hasRole(role) {
    if (!role) return false;
    return this.#roles.includes(String(role).trim().toUpperCase());
  }

  /**
   * Checks if principal has a specific permission
   * @param {string} permission 
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!permission) return false;
    const cleanPerm = String(permission).trim().toUpperCase();
    return this.#permissions.includes(cleanPerm) || this.#permissions.includes("*");
  }

  /**
   * Checks if principal possesses all required scopes
   * @param {string|string[]} requiredScopes 
   * @returns {boolean}
   */
  hasScope(requiredScopes) {
    if (!requiredScopes) return true;
    const reqList = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
    return reqList.every(req => {
      const cleanReq = String(req).trim().toLowerCase();
      return this.#scopes.includes(cleanReq) || this.#scopes.includes("*");
    });
  }

  /**
   * Returns a clean, non-sensitive JSON representation
   */
  toJSON() {
    return {
      subjectId: this.#subjectId,
      principalType: this.#principalType,
      email: this.#email,
      roles: this.#roles,
      permissions: this.#permissions,
      scopes: this.#scopes,
      tenantId: this.#tenantId,
      assuranceLevel: this.#assuranceLevel,
      sessionId: this.#sessionId,
      isAgent: this.isAgent,
      agentIdentity: this.#agentIdentity,
      attributes: this.#attributes,
      authenticatedAt: this.#authenticatedAt
    };
  }

  /**
   * Factory for creating an anonymous / unauthenticated principal
   */
  static anonymous() {
    return new SecurityPrincipal({
      subjectId: "anonymous",
      principalType: PRINCIPAL_TYPE.ANONYMOUS,
      email: "",
      roles: [],
      permissions: [],
      scopes: ["public:read"],
      tenantId: "hcmute",
      assuranceLevel: AUTH_ASSURANCE_LEVEL.AAL0_UNKNOWN
    });
  }
}
