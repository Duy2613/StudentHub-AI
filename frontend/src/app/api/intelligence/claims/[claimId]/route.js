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
    if (typeof claimId !== "string" || !/^[A-Za-z0-9:_-]{1,160}$/.test(claimId)) {
      return Response.json({ success: false, error: { code: "CLAIM_ID_INVALID", userMessage: "Mã claim không hợp lệ.", requestId: secContext.correlationId, retryable: false } }, { status: 400 });
    }

    const lineage = ProvenanceGraph.traceLineage(claimId);
    const snapshots = SnapshotReproducibilityStore.getSnapshotsForEntity(claimId);
    const publicLineage = {
      entityId: lineage.entityId,
      recordsCount: lineage.recordsCount,
      rootSourceIds: lineage.rootSourceIds,
      transformationsApplied: lineage.transformationsApplied,
      lineageRecords: lineage.lineageRecords.map((record) => ({
        provenanceId: record.provenanceId,
        targetEntityId: record.targetEntityId,
        targetEntityType: record.targetEntityType,
        sourceIds: record.sourceIds,
        parentEvidenceIds: record.parentEvidenceIds,
        transformations: record.transformations,
        confidence: record.confidence,
        contentDigest: record.contentDigest,
        timestamp: record.timestamp,
      }))
    };
    const publicSnapshots = snapshots.map((snapshot) => ({
      snapshotId: snapshot.snapshotId,
      targetEntityId: snapshot.targetEntityId,
      entityType: snapshot.entityType,
      confidenceAssessment: snapshot.confidenceAssessment,
      modelVersion: snapshot.modelVersion,
      policyVersion: snapshot.policyVersion,
      timestamp: snapshot.timestamp,
      stateDigest: snapshot.stateDigest,
    }));

    return Response.json({
      success: true,
      data: {
        claimId,
        provenanceLineage: publicLineage,
        historicalSnapshots: publicSnapshots,
        sourceState: "DERIVED_RUNTIME_GRAPH",
        isAuthoritative: false,
        dataNotice: "Lineage công khai chỉ hiển thị metadata; nội dung chứng cứ riêng tư không được công bố."
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
