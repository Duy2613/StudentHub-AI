/**
 * StudentHub AI — API Route: GET /api/expert/graph
 * 
 * Retrieves the full Expert Knowledge Graph nodes and edges.
 */

import { ExpertStore, isExpertDemoMode } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertRepository } from "@/lib/server/database/ExpertRepository.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_GRAPH",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, _routeParams, _principal, securityContext) => {
    let experts;
    try {
      experts = isExpertDemoMode() ? ExpertStore.getAllExperts({ redactPrivate: true }) : await ExpertRepository.listPublicProfiles({ limit: 100 });
    } catch {
      return Response.json({ success: false, error: { code: "EXPERT_STORAGE_UNAVAILABLE", userMessage: "Expert graph storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
    }

    // Construct graph nodes and edges
    const nodes = [];
    const edges = [];

    for (const exp of experts) {
      const publicExpert = ExpertPublicDTO.toPublicDTO(exp);
      nodes.push({
        id: publicExpert.expertId,
        label: publicExpert.name,
        type: "EXPERT",
        title: publicExpert.title,
        institution: publicExpert.institution,
        isVerified: publicExpert.verificationSummary?.identity === "VERIFIED",
        hasRegistrarAuthority: publicExpert.hasRegistrarAuthority
      });

      for (const sc of (exp.scopes || [])) {
        const domainNodeId = `DOMAIN_${sc.domain}`;
        if (!nodes.some(n => n.id === domainNodeId)) {
          nodes.push({
            id: domainNodeId,
            label: sc.domain,
            type: "DOMAIN",
            jurisdiction: sc.jurisdiction
          });
        }
        edges.push({
          source: exp.expertId,
          target: domainNodeId,
          relationship: "HAS_EXPERTISE",
          level: sc.level
        });
      }
    }

    return Response.json({
      success: true,
      graph: {
        nodes,
        edges,
        totalExperts: experts.length
      },
      sourceState: isExpertDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES",
      isAuthoritative: false,
      dataNotice: "Đồ thị chuyên gia tham khảo; thông tin xác thực cần đối soát hồ sơ chính thức."
    });
});
