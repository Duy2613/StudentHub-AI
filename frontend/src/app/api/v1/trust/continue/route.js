/**
 * StudentHub AI — Canonical Trust Continuation Route (Server-Owned Stage State)
 * 
 * Implements authoritative server-side continuation:
 * - Accepts ONLY { caseId, runId, targetStageId }
 * - STRICT ANTI-TAMPER RULE: Rejects or ignores any client-supplied `layer1`, `layer2`,
 *   or `layer3` payloads. Previous stage outputs MUST be loaded from PostgreSQL persistence.
 * - Enforces case ownership via SecurityFabric principal.
 */

import { SecurityFabric } from "../../../../../lib/security/SecurityFabric.js";
import { TrustPersistenceService } from "../../../../../lib/server/database/TrustPersistenceService.js";
import { DurableTrustRepository } from "../../../../../lib/server/database/DurableTrustRepository.js";
import { getPostgresPool } from "../../../../../lib/server/database/PostgresPool.js";

export const runtime = "nodejs";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export async function runTrustContinuation(request, routeParams, principal, securityContext) {
  const ownerId = principalUserId(principal);
  if (!ownerId) {
    return Response.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authenticated user identity required for case continuation." } },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_JSON", message: "Payload must be valid JSON." } },
      { status: 400 }
    );
  }

  const caseId = body?.caseId;
  const runId = body?.runId;

  if (!caseId || !runId) {
    return Response.json(
      { success: false, error: { code: "CASE_AND_RUN_REQUIRED", message: "caseId and runId are required to continue an existing Trust run." } },
      { status: 400 }
    );
  }

  // ANTI-TAMPER CHECK:
  // If the client submitted arbitrary prior-layer results (e.g. layer2, layer3), reject them!
  if (body?.layer2 !== undefined || body?.layer3 !== undefined || body?.previousStageResult !== undefined) {
    return Response.json(
      {
        success: false,
        error: {
          code: "CLIENT_SUPPLIED_STAGE_REJECTED",
          message: "Client cannot supply previous layer results. Prior stage state is server-owned and loaded from persistence.",
        },
      },
      { status: 400 }
    );
  }

  try {
    // 1. Authoritative ownership check
    const caseRecord = await TrustPersistenceService.getCaseForOwner(caseId, ownerId);
    if (!caseRecord) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Trust case not found or access denied." } },
        { status: 404 }
      );
    }

    // 2. Load canonical server-persisted stage runs
    const pool = getPostgresPool();
    const stageRunsRes = await pool.query(
      `SELECT stage_id, status, result_digest, summary, created_at
         FROM public.trust_stage_runs
        WHERE run_id = $1 AND case_id = $2 AND owner_id = $3
        ORDER BY stage_index ASC`,
      [runId, caseId, ownerId]
    );

    const canonicalStages = {};
    for (const row of stageRunsRes.rows) {
      canonicalStages[row.stage_id] = {
        status: row.status,
        digest: row.result_digest,
        summary: row.summary,
      };
    }

    return Response.json({
      success: true,
      caseId,
      runId,
      contractVersion: "trust.v5",
      authoritativeSource: "POSTGRESQL_PERSISTENCE",
      loadedStages: Object.keys(canonicalStages),
      canonicalStages,
      nextAction: "CONTINUE",
    });
  } catch (err) {
    console.error("[TrustContinuationAPI] Error continuing case:", err.message);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Could not execute stage continuation." } },
      { status: 500 }
    );
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "CONTINUE_TRUST_STAGE",
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024,
  },
  runTrustContinuation
);
