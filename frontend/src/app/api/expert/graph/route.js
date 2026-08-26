/**
 * StudentHub AI — API Route: GET /api/expert/graph
 * 
 * Retrieves the full Expert Knowledge Graph nodes and edges.
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export async function GET() {
  try {
    const experts = ExpertStore.getAllExperts();

    // Construct graph nodes and edges
    const nodes = [];
    const edges = [];

    for (const exp of experts) {
      nodes.push({
        id: exp.expertId,
        label: exp.name,
        type: "EXPERT",
        title: exp.title,
        institution: exp.institution,
        isVerified: exp.isVerified,
        hasRegistrarAuthority: exp.hasRegistrarAuthority
      });

      for (const sc of exp.scopes) {
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

    return NextResponse.json({
      success: true,
      graph: {
        nodes,
        edges,
        totalExperts: experts.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving expert graph" },
      { status: 500 }
    );
  }
}
