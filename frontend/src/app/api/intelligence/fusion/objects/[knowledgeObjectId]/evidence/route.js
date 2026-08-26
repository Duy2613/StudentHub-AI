import { NextResponse } from "next/server";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";
import { EvidenceFusionGraph } from "@/lib/intelligence/fusion/evidenceFusionGraph.js";

export async function GET(request, { params }) {
  try {
    const { knowledgeObjectId } = await params;
    const kno = EvidenceFusionStore.getById(knowledgeObjectId, { redactPrivate: true });

    if (!kno) {
      return NextResponse.json({ success: false, error: "Knowledge Object not found" }, { status: 404 });
    }

    const graph = new EvidenceFusionGraph();
    const rootNode = graph.addNode({ id: kno.knowledgeObjectId, label: kno.subject, type: "KNOWLEDGE_OBJECT" });

    if (kno.officialTruth) {
      const offNode = graph.addNode({ id: kno.officialTruth.sourceId, label: kno.officialTruth.statement, layer: "OFFICIAL_TRUTH" });
      graph.addEdge(offNode.id, rootNode.id, "SUPPORTS");
    }

    for (const exp of kno.expertInterpretation || []) {
      const expNode = graph.addNode({ id: exp.expertId, label: exp.interpretation, layer: "EXPERT_INTERPRETATION" });
      graph.addEdge(expNode.id, rootNode.id, "INTERPRETS");
    }

    return NextResponse.json({
      success: true,
      knowledgeObjectId,
      evidenceGraph: graph.toJSON(),
      supportingEvidence: kno.supportingEvidence
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Failed to load evidence lineage" }, { status: 500 });
  }
}
