/**
 * Layer 2 — EntityExtractor
 * 
 * Extracts, classifies, and normalizes entities (Universities, Banks, Gov portals, Tech brands).
 * Determines identity claims vs mere brand mentions.
 */

import { TrustedEntityRegistry } from "../registry/TrustedEntityRegistry.js";
import { createEntity } from "../types.js";

const REPRESENTATION_MARKERS = [
  /thông báo chính thức từ\s+([a-zA-Z0-9\s.À-ỹ]+)/i,
  /ban giám hiệu\s+([a-zA-Z0-9\s.À-ỹ]+)/i,
  /phòng an ninh\s+([a-zA-Z0-9\s.À-ỹ]+)/i,
  /từ\s+ngân hàng\s+([a-zA-Z0-9\s.À-ỹ]+)/i,
  /hệ thống\s+([a-zA-Z0-9\s.À-ỹ]+)\s+thông báo/i,
  /chúng tôi là\s+([a-zA-Z0-9\s.À-ỹ]+)/i,
  /this is\s+([a-zA-Z0-9\s.]+)\s+security/i,
  /official\s+([a-zA-Z0-9\s.]+)\s+announcement/i,
];

export class EntityExtractor {
  /**
   * Extracts all referenced entities from text and metadata
   * @param {string} text
   * @param {object} context
   * @returns {Array<object>} Array of Entity DTOs
   */
  static extract(text, context = {}) {
    if (!text || typeof text !== "string") return [];

    const matchedEntities = TrustedEntityRegistry.extractAllEntities(text);
    const entities = [];

    // Check representation markers
    let isExplicitRepresentation = false;
    for (const marker of REPRESENTATION_MARKERS) {
      if (marker.test(text)) {
        isExplicitRepresentation = true;
        break;
      }
    }

    for (const ent of matchedEntities) {
      entities.push(
        createEntity({
          name: ent.shortName || ent.name,
          type: ent.type,
          normalizedName: ent.name,
          isClaimedAuthor: isExplicitRepresentation,
          officialDomains: ent.officialDomains || [],
          confidence: 0.95,
        })
      );
    }

    // Fallback: If URL is present and belongs to an entity, link it
    if (context.url) {
      const urlEntity = TrustedEntityRegistry.findEntity(context.url);
      if (urlEntity && !entities.some((e) => e.normalizedName === urlEntity.name)) {
        entities.push(
          createEntity({
            name: urlEntity.shortName || urlEntity.name,
            type: urlEntity.type,
            normalizedName: urlEntity.name,
            isClaimedAuthor: false,
            officialDomains: urlEntity.officialDomains || [],
            confidence: 0.90,
          })
        );
      }
    }

    return entities;
  }
}
