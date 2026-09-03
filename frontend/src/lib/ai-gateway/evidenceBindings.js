/**
 * Evidence-binding guards for structured AI output.
 *
 * AI may summarize or explain normalized records, but it cannot manufacture
 * a citation. Callers provide the identifiers that are in scope for the
 * current request; any explicit unknown reference fails validation.
 */

const REFERENCE_FIELDS = Object.freeze(["evidenceIds", "evidenceRefs", "sourceIds", "sourceDocumentIds", "citations"]);
const MAX_REFERENCES = 40;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeId(value) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : null;
}

function collectIds(value, field) {
  if (!Array.isArray(value)) return { ok: false, ids: [], code: `${field.toUpperCase()}_MUST_BE_ARRAY` };
  if (value.length > MAX_REFERENCES) return { ok: false, ids: [], code: `${field.toUpperCase()}_TOO_MANY` };
  const references = [];
  for (const item of value) {
    if (field === "citations" && isRecord(item)) {
      const evidenceId = safeId(item.evidenceId || item.observationId || item.id);
      const sourceId = safeId(item.sourceDocumentId || item.sourceId);
      if (!evidenceId && !sourceId) return { ok: false, references: [], code: `${field.toUpperCase()}_INVALID` };
      if (evidenceId) references.push({ kind: "evidence", id: evidenceId });
      if (sourceId) references.push({ kind: "source", id: sourceId });
      continue;
    }
    const id = safeId(item);
    if (!id) return { ok: false, references: [], code: `${field.toUpperCase()}_INVALID` };
    references.push({ kind: field === "sourceIds" || field === "sourceDocumentIds" ? "source" : "evidence", id });
  }
  return { ok: true, references };
}

function idsFromRecords(records, fields) {
  const ids = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    if (!isRecord(record)) continue;
    for (const field of fields) {
      const id = safeId(record[field]);
      if (id) ids.add(id);
    }
  }
  return ids;
}

export function evidenceIdsFromRecords(records = []) {
  return idsFromRecords(records, ["evidenceId", "evidenceRef", "observationId", "id"]);
}

export function sourceIdsFromRecords(records = []) {
  return idsFromRecords(records, ["sourceId", "sourceDocumentId", "id"]);
}

export function validateEvidenceReferences(value, { knownEvidenceIds = [], knownSourceIds = [] } = {}) {
  if (!isRecord(value)) return { ok: false, code: "AI_OUTPUT_NOT_OBJECT", unknownEvidenceIds: [], unknownSourceIds: [] };
  const knownEvidence = knownEvidenceIds instanceof Set ? knownEvidenceIds : new Set((Array.isArray(knownEvidenceIds) ? knownEvidenceIds : []).map(safeId).filter(Boolean));
  const knownSources = knownSourceIds instanceof Set ? knownSourceIds : new Set((Array.isArray(knownSourceIds) ? knownSourceIds : []).map(safeId).filter(Boolean));
  const unknownEvidenceIds = [];
  const unknownSourceIds = [];

  for (const field of REFERENCE_FIELDS) {
    if (!(field in value)) continue;
    const collected = collectIds(value[field], field);
    if (!collected.ok) return { ok: false, code: collected.code, unknownEvidenceIds, unknownSourceIds };
    for (const reference of collected.references) {
      const known = reference.kind === "source" ? knownSources : knownEvidence;
      if (!known.has(reference.id)) (reference.kind === "source" ? unknownSourceIds : unknownEvidenceIds).push(reference.id);
    }
  }

  if (unknownEvidenceIds.length || unknownSourceIds.length) {
    return { ok: false, code: "AI_OUTPUT_UNKNOWN_EVIDENCE_REFERENCE", unknownEvidenceIds, unknownSourceIds };
  }
  return { ok: true, code: null, unknownEvidenceIds: [], unknownSourceIds: [] };
}

export function createEvidenceReferenceValidator({ evidence = [], sources = [] } = {}) {
  const knownEvidenceIds = evidenceIdsFromRecords(evidence);
  const knownSourceIds = sourceIdsFromRecords(sources);
  return (value) => validateEvidenceReferences(value, { knownEvidenceIds, knownSourceIds }).ok;
}
