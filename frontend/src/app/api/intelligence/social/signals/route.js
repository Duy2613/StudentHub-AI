import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ContentItemNormalizer } from "@/lib/intelligence/social/ContentItemNormalizer.js";
import { SocialClaimExtractor } from "@/lib/intelligence/social/SocialClaimExtractor.js";
import { SocialSignalQualityEngine } from "@/lib/intelligence/social/SocialSignalQualityEngine.js";
import { SocialDuplicationDetector } from "@/lib/intelligence/social/SocialDuplicationDetector.js";
import { CoordinationDetector } from "@/lib/intelligence/social/CoordinationDetector.js";

export const dynamic = "force-dynamic";

// In-memory active signals buffer
const signalsBuffer = [];

export const GET = SecurityFabric.wrapHandler({
  action: "READ_SOCIAL_SIGNALS",
  allowAnonymous: true,
  handler: async ({ correlationId }) => {
    return Response.json({
      success: true,
      data: signalsBuffer.slice(-30).reverse(),
      totalSignals: signalsBuffer.length,
      correlationId
    });
  }
});

export const POST = SecurityFabric.wrapHandler({
  action: "INGEST_SOCIAL_SIGNAL",
  requiredPermission: "COMMUNITY.POST",
  allowAnonymous: false,
  handler: async ({ request, correlationId }) => {
    let payload = {};
    try {
      payload = await request.json();
    } catch {}

    // 1. Normalize
    const normalizedItem = ContentItemNormalizer.normalize(payload, {
      connectorId: payload.connectorId || "community_ingest"
    });

    // 2. Duplication & Coordination check
    const dupCheck = SocialDuplicationDetector.processItem(normalizedItem);
    const coordCheck = CoordinationDetector.evaluateCoordination(normalizedItem);

    // 3. Extract Claim Candidate
    const claimCandidate = SocialClaimExtractor.extractClaimCandidate(normalizedItem);

    // 4. Evaluate Signal Quality
    const quality = SocialSignalQualityEngine.evaluateQuality(normalizedItem, claimCandidate, {
      isDuplicate: dupCheck.isDuplicate
    });

    const enrichedSignal = {
      ...normalizedItem,
      claimCandidate,
      quality,
      duplication: dupCheck,
      coordination: coordCheck
    };

    signalsBuffer.push(enrichedSignal);

    return Response.json({
      success: true,
      data: enrichedSignal,
      correlationId
    });
  }
});
