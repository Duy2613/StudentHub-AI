/** Shared authorization checks against the existing Trust records. */
export function scopeError(code, statusCode = 409) {
  return Object.assign(new Error(code), { code, statusCode });
}

export function isCanonicalUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export async function assertCaseScope(client, { actorId, caseId, caseRevision, claimId, evidenceRevisionIds = [], publicOnly = false }) {
  if (!isCanonicalUuid(caseId)) throw scopeError('CASE_ID_INVALID', 400);
  if (!Number.isInteger(Number(caseRevision)) || Number(caseRevision) < 1) throw scopeError('CASE_REVISION_REQUIRED', 400);
  if (claimId && !isCanonicalUuid(claimId)) throw scopeError('CLAIM_ID_INVALID', 400);
  const result = await client.query(`SELECT id, owner_id, visibility FROM public.trust_cases WHERE id=$1 FOR SHARE`, [caseId]);
  const record = result.rows[0];
  const sameOwner = String(record?.owner_id || '').toLowerCase() === String(actorId || '').toLowerCase();
  if (!record || (publicOnly ? record.visibility !== 'PUBLIC' : record.visibility !== 'PUBLIC' && !sameOwner)) {
    throw scopeError('CASE_NOT_AVAILABLE', 404);
  }
  const revision = await client.query(`SELECT revision FROM public.trust_case_revisions WHERE case_id=$1 ORDER BY revision DESC LIMIT 1`, [caseId]);
  if (!revision.rows[0] || Number(revision.rows[0].revision) !== Number(caseRevision)) throw scopeError('STALE_CASE_REVISION');
  if (claimId) {
    const claim = await client.query(`SELECT 1 FROM public.claim_sources cs JOIN public.evidence e ON e.id=cs.evidence_id WHERE cs.claim_id=$1 AND e.case_id=$2 LIMIT 1`, [claimId, caseId]);
    if (!claim.rows[0]) throw scopeError('CLAIM_CASE_MISMATCH');
  }
  if (!Array.isArray(evidenceRevisionIds) || evidenceRevisionIds.length > 100 || evidenceRevisionIds.some(id => typeof id !== 'string' || !isCanonicalUuid(id))) throw scopeError('EVIDENCE_INPUT_INVALID', 400);
  if (evidenceRevisionIds.length) {
    const evidence = await client.query(`SELECT id FROM public.evidence WHERE case_id=$1 AND id=ANY($2::uuid[])`, [caseId, evidenceRevisionIds]);
    if (evidence.rows.length !== new Set(evidenceRevisionIds).size) throw scopeError('EVIDENCE_CASE_MISMATCH');
  }
  return record;
}

export async function assertCoordinator(client, actorId, subjectId) {
  if (!actorId || String(actorId).toLowerCase() === String(subjectId || '').toLowerCase()) throw scopeError('INDEPENDENT_COORDINATOR_REQUIRED', 403);
  const role = await client.query(`SELECT 1 FROM private.user_roles ur JOIN private.roles r ON r.id=ur.role_id WHERE ur.user_id=$1 AND ur.revoked_at IS NULL AND r.code='ADMIN'`, [actorId]);
  if (!role.rows[0]) throw scopeError('COORDINATOR_REQUIRED', 403);
}
