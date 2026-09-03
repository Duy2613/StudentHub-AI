import { NextResponse } from "next/server";
import { getCompetitionSuperflow, listCompetitionSuperflows } from "@/lib/competition/competitionSuperflows.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function listDemoSuperflows(request) {
  const id = new URL(request.url).searchParams.get("id");
  const selected = id ? getCompetitionSuperflow(id) : null;
  if (id && !selected) {
    return NextResponse.json({ success: false, error: { code: "DEMO_CASE_NOT_FOUND", message: "Không tìm thấy case trình diễn." } }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    demo: true,
    provenance: "DEMO_FIXTURE",
    warning: "Deterministic competition fixtures. Not live evidence or provider output.",
    data: selected || listCompetitionSuperflows(),
  });
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMPETITION_DEMO_SUPERFLOWS",
  allowAnonymous: true,
  maxRequests: 120,
  maxBodyBytes: 0,
}, listDemoSuperflows);
