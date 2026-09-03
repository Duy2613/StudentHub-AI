/**
 * StudentHub AI — Connector Registry V1 (Production-Truthful)
 * 
 * Manages active platform connectors, registration, health monitoring,
 * and capability checks for all external and internal data sources.
 */

import {
  ISourceConnector,
  CONNECTOR_PLATFORM,
  CONNECTOR_CAPABILITY,
  SOURCE_CLASSIFICATION,
  CONNECTOR_HEALTH
} from "./ISourceConnector.js";
import { InstitutionalRssConnector } from "./InstitutionalRssConnector.js";
import { GitHubAcademicConnector } from "./GitHubAcademicConnector.js";

export class ConnectorRegistry {
  static #connectors = new Map();

  static {
    this.#initializeDefaultConnectors();
  }

  static #initializeDefaultConnectors() {
    // 1. Official Portal Connector
    this.registerConnector(new ISourceConnector({
      connectorId: "official_portal_hcmute",
      platform: CONNECTOR_PLATFORM.OFFICIAL_PORTAL,
      sourceClassification: SOURCE_CLASSIFICATION.OFFICIAL,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_PUBLIC_CONTENT,
        CONNECTOR_CAPABILITY.CAN_SEARCH,
        CONNECTOR_CAPABILITY.CAN_SYNC,
        CONNECTOR_CAPABILITY.CAN_GET_AUTHOR_METADATA
      ],
      authorizationRequired: false,
      rateLimits: { requestsPerMinute: 120, burstQuota: 20 },
      termsProfile: { allowIndexing: true, requiresAttribution: true }
    }));

    // 2. Institutional RSS Announcements Connector (Live XML Fetcher)
    this.registerConnector(new InstitutionalRssConnector({
      connectorId: "institutional_rss_announcements"
    }));

    // 3. Academic GitHub Connector (Live REST Fetcher)
    this.registerConnector(new GitHubAcademicConnector({
      connectorId: "github_academic_repos"
    }));

    // 4. User-Authorized Discord Study Group Connector
    this.registerConnector(new ISourceConnector({
      connectorId: "discord_study_groups",
      platform: CONNECTOR_PLATFORM.DISCORD_COMMUNITY,
      sourceClassification: SOURCE_CLASSIFICATION.COMMUNITY,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_USER_AUTHORIZED_CONTENT,
        CONNECTOR_CAPABILITY.CAN_SYNC,
        CONNECTOR_CAPABILITY.CAN_GET_COMMENTS
      ],
      authorizationRequired: true,
      rateLimits: { requestsPerMinute: 50, burstQuota: 5 }
    }));

    // 5. Public Community Forum Connector
    this.registerConnector(new ISourceConnector({
      connectorId: "studenthub_community_forum",
      platform: CONNECTOR_PLATFORM.FORUM_COMMUNITY,
      sourceClassification: SOURCE_CLASSIFICATION.COMMUNITY,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_PUBLIC_CONTENT,
        CONNECTOR_CAPABILITY.CAN_SEARCH,
        CONNECTOR_CAPABILITY.CAN_SYNC,
        CONNECTOR_CAPABILITY.CAN_GET_COMMENTS,
        CONNECTOR_CAPABILITY.CAN_GET_AUTHOR_METADATA
      ],
      rateLimits: { requestsPerMinute: 180, burstQuota: 30 }
    }));

    // 6. Facebook Groups Connector (Truthful: NOT_CONFIGURED until Meta App Approved)
    const fbConn = new ISourceConnector({
      connectorId: "facebook_academic_groups",
      platform: CONNECTOR_PLATFORM.FACEBOOK_PUBLIC,
      sourceClassification: SOURCE_CLASSIFICATION.COMMUNITY,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_USER_AUTHORIZED_CONTENT,
        CONNECTOR_CAPABILITY.CAN_SYNC
      ],
      authorizationRequired: true,
      rateLimits: { requestsPerMinute: 30, burstQuota: 5 }
    });
    fbConn.setHealth(CONNECTOR_HEALTH.NOT_CONFIGURED);
    this.registerConnector(fbConn);

    // 7. Instagram Campus Stories Connector (Truthful: NOT_CONFIGURED)
    const igConn = new ISourceConnector({
      connectorId: "instagram_campus_stories",
      platform: CONNECTOR_PLATFORM.INSTAGRAM_PUBLIC,
      sourceClassification: SOURCE_CLASSIFICATION.COMMUNITY,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_USER_AUTHORIZED_CONTENT
      ],
      authorizationRequired: true,
      rateLimits: { requestsPerMinute: 30, burstQuota: 5 }
    });
    igConn.setHealth(CONNECTOR_HEALTH.NOT_CONFIGURED);
    this.registerConnector(igConn);
  }

  /**
   * Registers a connector into the registry
   * @param {ISourceConnector} connector 
   */
  static registerConnector(connector) {
    if (!(connector instanceof ISourceConnector)) {
      throw new Error("[REGISTRY_ERROR] Connector must be an instance of ISourceConnector.");
    }
    this.#connectors.set(connector.connectorId, connector);
  }

  /**
   * Retrieves a connector by connectorId
   * @param {string} connectorId 
   * @returns {ISourceConnector|null}
   */
  static getConnector(connectorId) {
    return this.#connectors.get(connectorId) || null;
  }

  /**
   * Lists all registered connectors with metadata
   * @returns {Array<object>}
   */
  static listConnectors() {
    return Array.from(this.#connectors.values()).map(c => ({
      connectorId: c.connectorId,
      platform: c.platform,
      sourceClassification: c.sourceClassification,
      capabilities: Array.from(c.capabilities),
      authorizationRequired: c.authorizationRequired,
      rateLimits: c.rateLimits,
      health: c.health,
      lastSync: c.lastSync
    }));
  }

  /**
   * Updates health status for a connector
   * @param {string} connectorId 
   * @param {string} health 
   */
  static updateConnectorHealth(connectorId, health) {
    const conn = this.getConnector(connectorId);
    if (conn) {
      conn.setHealth(health);
    }
  }

  /**
   * Resets registry to default configuration (for unit tests)
   */
  static clear() {
    this.#connectors.clear();
    this.#initializeDefaultConnectors();
  }
}
