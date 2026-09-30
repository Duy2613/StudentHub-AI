import { CANONICAL_ENTITIES } from "../../src/lib/server/trust/EntityResolutionService.js";

function normalizedDomain(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
}

const EXPECTED_ENTITY_ID_ALIASES = {
  GOVERNMENT_VN: ["GOV_VN"],
  MOET: ["MOET_VN"],
  HVNH: ["BAV"],
  RMIT: ["RMIT_VN"],
  MPS: ["MPS_VN"],
  NCSC: ["NCSC_VN"],
};

export function expectedEntityResolved(item, detailed) {
  const expectedEntity = String(item?.canonicalEntity || "");
  const expectedIds = new Set([expectedEntity, ...(EXPECTED_ENTITY_ID_ALIASES[expectedEntity] || [])]);
  const canonicalExpectedIds = [...expectedIds].filter((entityId) => CANONICAL_ENTITIES[entityId]);

  // Topics, policy areas, and fraud scenarios do not identify one canonical
  // organization. Keep them out of entity accuracy instead of awarding credit
  // for any unrelated resolver match or penalizing the resolver for no match.
  if (canonicalExpectedIds.length === 0) return null;

  const resolved = Array.isArray(detailed?.matches) ? detailed.matches : [];
  const resolvedIds = resolved.map((match) => match.entityId);
  const exactEntityMatch = resolvedIds.some((entityId) => expectedIds.has(entityId));
  const knownDomains = (Array.isArray(item?.knownOfficialDomains) ? item.knownOfficialDomains : [])
    .map(normalizedDomain);
  const expectedOfficialDomains = canonicalExpectedIds.flatMap((entityId) => (
    CANONICAL_ENTITIES[entityId].allowedDomains || []
  )).map(normalizedDomain);
  const goldDomainBelongsToExpectedEntity = knownDomains.some((domain) => expectedOfficialDomains.includes(domain));
  const expectedDomainMatch = goldDomainBelongsToExpectedEntity && resolved.some((match) => (
    expectedIds.has(match.entityId) &&
    match.allowedDomains?.some((domain) => knownDomains.includes(normalizedDomain(domain)))
  ));

  return exactEntityMatch || expectedDomainMatch;
}
