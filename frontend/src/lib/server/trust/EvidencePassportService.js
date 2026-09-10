/**
 * StudentHub AI — EvidencePassportService
 *
 * Implements Living Evidence Passport & Layer Artifacts:
 * - Immutable versioned passport binding (case, run, revision)
 * - Cryptographic artifact hash (SHA-256) over frozen evidence & verdict
 * - Historical passport preservation: immune to downstream web changes
 */

import { createHash } from "node:crypto";

function hex(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value.toString("hex");
  const text = String(value);
  return text.startsWith("\\x") ? text.slice(2) : text;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function assessmentLineage(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      assessmentId: row.assessmentId || row.id || null,
      expertId: row.expertId || row.expert_id || null,
      verifiedDomain: row.verifiedDomain || row.verified_domain || row.domainCode || row.domain_code || null,
      verificationId: row.verificationId || row.verification_id || null,
      verificationRevision: row.verificationRevision ?? row.verification_revision ?? null,
      verificationStatus: row.verificationStatus || row.verification_status || null,
      qualificationState: row.verificationQualificationState || row.verification_qualification_state || null,
      assignmentId: row.assignmentId || row.assignment_id || null,
      assignmentRevision: row.assignmentRevision ?? row.assignment_revision ?? null,
      caseId: row.caseId || row.case_id || null,
      caseRevision: row.caseRevision ?? row.case_revision ?? null,
      claimId: row.claimId || row.claim_id || null,
      evidenceRevisionIds: row.evidenceRevisionIds || row.evidence_revision_ids || [],
      authoritySnapshotVersion: row.authoritySnapshotVersion ?? row.authority_snapshot_version ?? 0,
      authoritySnapshotDigest: hex(row.authoritySnapshotDigest || row.authority_snapshot_digest),
      coiState: row.coiState || row.coi_state || "LEGACY_UNKNOWN",
      coiDeclarationRef: row.coiDeclarationRef || row.coi_declaration_ref || null,
      submittedAt: row.submittedAt || row.submitted_at || null,
    }))
    .sort((left, right) => String(left.assessmentId || "").localeCompare(String(right.assessmentId || "")));
}

export class EvidencePassportService {
  /**
   * Generates a frozen Evidence Passport and layer artifact hash.
   */
  static issuePassport({
    caseId,
    runId,
    revision = 1,
    claims = [],
    sources = [],
    relationships = [],
    independenceGroups = [],
    modelTraces = [],
    verdictResult = {},
    decisionTwin = {},
    expertAssessments = [],
    issuedAt: suppliedIssuedAt = null,
  } = {}) {
    const issuedAt = suppliedIssuedAt ? new Date(suppliedIssuedAt).toISOString() : new Date().toISOString();
    const passportId = `pass-${caseId || "anonymous"}-rev${revision}`;
    const expertAssessmentLineage = assessmentLineage(expertAssessments);

    // Issuance time is presentation metadata, not evidence. Excluding it from
    // the artifact hash makes a replay of the same frozen inputs verifiable.
    const artifactPayload = canonicalize({
      passportId,
      caseId,
      runId,
      revision,
      claims,
      sources,
      relationships,
      independenceGroups,
      modelTraces,
      verdictResult,
      decisionTwin,
      expertAssessmentLineage,
      engineVersion: "trust-v5.0-native",
    });

    const artifactHash = createHash("sha256")
      .update(JSON.stringify(artifactPayload))
      .digest("hex");

    return {
      passportId,
      caseId,
      runId,
      revision,
      issuedAt,
      artifactHash,
      engineVersion: "trust-v5.0-native",
      claimsSnapshot: claims.map((c) => ({
        claimId: c.claimId,
        text: c.text,
        normalizedText: c.normalizedText,
        type: c.type,
      })),
      sourcesSnapshot: sources.map((s) => ({
        sourceId: s.sourceId,
        evidenceId: s.evidenceId,
        publisher: s.publisher,
        domain: s.domain,
        canonicalUrl: s.canonicalUrl,
        contentDigest: s.contentDigest,
        publishedAt: s.publishedAt,
        retrievedAt: s.retrievedAt,
        snapshotUri: s.snapshotUri,
      })),
      relationsSnapshot: relationships,
      independenceSnapshot: independenceGroups,
      expertAssessmentLineage,
      modelLineage: modelTraces.map((t) => ({
        role: t.role,
        provider: t.provider,
        model: t.model,
        decisionSummary: t.decisionSummary,
        latencyMs: t.latencyMs,
      })),
      decisionTwinSnapshot: decisionTwin,
      status: "IMMUTABLE_LOCKED",
    };
  }
}
