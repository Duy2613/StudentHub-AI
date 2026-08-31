/**
 * StudentHub AI — Social Intelligence Fabric
 * ISourceConnector & Connector Capability Model V1
 * 
 * Base interface and typed contracts for all external data sources.
 * Enforces legitimate access boundaries, rate limits, and explicit capabilities.
 */

export const CONNECTOR_CAPABILITY = Object.freeze({
  CAN_READ_PUBLIC_CONTENT: "CAN_READ_PUBLIC_CONTENT",
  CAN_READ_USER_AUTHORIZED_CONTENT: "CAN_READ_USER_AUTHORIZED_CONTENT",
  CAN_SEARCH: "CAN_SEARCH",
  CAN_SYNC: "CAN_SYNC",
  CAN_GET_COMMENTS: "CAN_GET_COMMENTS",
  CAN_GET_MEDIA_METADATA: "CAN_GET_MEDIA_METADATA",
  CAN_GET_AUTHOR_METADATA: "CAN_GET_AUTHOR_METADATA"
});

export const CONNECTOR_PLATFORM = Object.freeze({
  OFFICIAL_PORTAL: "OFFICIAL_PORTAL",
  INSTITUTIONAL_RSS: "INSTITUTIONAL_RSS",
  GITHUB_ACADEMIC: "GITHUB_ACADEMIC",
  DISCORD_COMMUNITY: "DISCORD_COMMUNITY",
  TELEGRAM_CHANNEL: "TELEGRAM_CHANNEL",
  REDDIT_SUB: "REDDIT_SUB",
  GOOGLE_WORKSPACE: "GOOGLE_WORKSPACE",
  FORUM_COMMUNITY: "FORUM_COMMUNITY",
  FACEBOOK_PUBLIC: "FACEBOOK_PUBLIC",
  INSTAGRAM_PUBLIC: "INSTAGRAM_PUBLIC"
});

export const CONNECTOR_HEALTH = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  RATE_LIMITED: "RATE_LIMITED",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  OFFLINE: "OFFLINE",
  NOT_CONFIGURED: "NOT_CONFIGURED"
});

export const SOURCE_CLASSIFICATION = Object.freeze({
  OFFICIAL: "OFFICIAL",
  EXPERT: "EXPERT",
  COMMUNITY: "COMMUNITY",
  SOCIAL: "SOCIAL",
  USER_PROVIDED: "USER_PROVIDED",
  SYSTEM_DERIVED: "SYSTEM_DERIVED"
});

export class ISourceConnector {
  /**
   * @param {object} config
   * @param {string} config.connectorId
   * @param {string} config.platform - CONNECTOR_PLATFORM
   * @param {string} config.sourceClassification - SOURCE_CLASSIFICATION
   * @param {Set<string>|Array<string>} config.capabilities - Array of CONNECTOR_CAPABILITY
   * @param {boolean} [config.authorizationRequired=false]
   * @param {object} [config.rateLimits]
   * @param {object} [config.termsProfile]
   */
  constructor({
    connectorId,
    platform,
    sourceClassification = SOURCE_CLASSIFICATION.SOCIAL,
    capabilities = [],
    authorizationRequired = false,
    rateLimits = { requestsPerMinute: 60, burstQuota: 10 },
    termsProfile = { allowIndexing: true, requiresAttribution: true }
  }) {
    if (!connectorId || !platform) {
      throw new Error("[CONNECTOR_ERROR] connectorId and platform are required.");
    }

    this.connectorId = connectorId;
    this.platform = platform;
    this.sourceClassification = sourceClassification;
    this.capabilities = new Set(capabilities);
    this.authorizationRequired = authorizationRequired;
    this.rateLimits = Object.freeze({ ...rateLimits });
    this.termsProfile = Object.freeze({ ...termsProfile });

    this.lastSync = null;
    this.health = CONNECTOR_HEALTH.HEALTHY;
    this.syncCursor = null;
  }

  /**
   * Asserts whether this connector possesses a required capability
   * @param {string} capability - CONNECTOR_CAPABILITY
   * @returns {boolean}
   */
  hasCapability(capability) {
    if (!Object.values(CONNECTOR_CAPABILITY).includes(capability)) {
      return false; // Unknown capability = DENY
    }
    return this.capabilities.has(capability);
  }

  /**
   * Enforces capability presence, throwing an error if absent
   * @param {string} capability 
   */
  assertCapability(capability) {
    if (!this.hasCapability(capability)) {
      throw new Error(`[CAPABILITY_DENIED] Connector '${this.connectorId}' lacks capability '${capability}'.`);
    }
  }

  /**
   * Fetch public content items incrementally (Template method)
   * @param {object} params
   * @param {string} [params.cursor]
   * @param {number} [params.limit=20]
   * @returns {Promise<{ items: Array<object>, nextCursor: string|null }>}
   */
  async syncIncremental({ cursor = null, limit = 20 } = {}) {
    this.assertCapability(CONNECTOR_CAPABILITY.CAN_SYNC);
    throw new Error(`[NOT_IMPLEMENTED] syncIncremental not implemented in ${this.constructor.name}`);
  }

  /**
   * Search content on this platform
   * @param {object} params
   * @param {string} params.query
   * @param {number} [params.limit=10]
   * @returns {Promise<Array<object>>}
   */
  async search({ query, limit = 10 } = {}) {
    this.assertCapability(CONNECTOR_CAPABILITY.CAN_SEARCH);
    throw new Error(`[NOT_IMPLEMENTED] search not implemented in ${this.constructor.name}`);
  }

  /**
   * Update connector health status
   * @param {string} health - CONNECTOR_HEALTH
   */
  setHealth(health) {
    if (Object.values(CONNECTOR_HEALTH).includes(health)) {
      this.health = health;
    }
  }
}
