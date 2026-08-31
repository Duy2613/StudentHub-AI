/**
 * StudentHub AI — API Route: GET /api/expert/graph
 * 
 * Retrieves the full Expert Knowledge Graph nodes and edges.
 */

import { ExpertStore } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_GRAPH",
  allowAnonymous: true,
  maxRequests: 90
}, async () => {
    const experts = ExpertStore.getAllExperts({ redactPrivate: true });

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
      sourceState: "CURATED_EXPERT_GRAPH",
      isAuthoritative: false,
      dataNotice: "Đồ thị chuyên gia tham khảo; thông tin xác thực cần đối soát hồ sơ chính thức."
    });
});
