/**
 * StudentHub AI — API Route: GET /api/intelligence/claims/[claimId]
 * First-class claim entity details, provenance, and validation history
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ProvenanceGraph } from "@/lib/intelligence/fabric/ProvenanceGraph.js";
import { SnapshotReproducibilityStore } from "@/lib/intelligence/fusion/SnapshotReproducibilityStore.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_CLAIM_DETAIL",
    requiredPermission: "TRUST.READ",
    requiredScopes: ["trust:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { claimId } = await routeParams.params;

    const lineage = ProvenanceGraph.traceLineage(claimId);
    const snapshots = SnapshotReproducibilityStore.getSnapshotsForEntity(claimId);

    return Response.json({
      success: true,
      data: {
        claimId,
        provenanceLineage: lineage,
        historicalSnapshots: snapshots
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
