# Trust Engine pre-edit source snapshot

Captured before the Trust Engine hardening changes from the repository `HEAD`
commit `ea30f90` using `git show HEAD:<path>`. The blocks below are verbatim
source, including comments and whitespace visible in the committed files.

## `frontend/src/lib/ai-trust/layer1/engine/DecisionEngine.js`

```js
/**
 * Layer 1 — DecisionEngine
 * 
 * Deterministic final decision resolver.
 * Maps signals and hard rules into normalized tri-state output: BLOCK / SUSPICIOUS / PASS.
 */

import { LAYER_1_STATUS, LAYER_1_REASONS, SIGNAL_SEVERITY, createLayer1Result } from "../types.js";
import { SignalAggregator } from "./SignalAggregator.js";
import { HardRuleEngine } from "./HardRuleEngine.js";
import { ConfidenceEngine } from "./ConfidenceEngine.js";

export class DecisionEngine {
  /**
   * Resolves final Layer 1 status and confidence
   * @param {object} params
   * @param {Array} params.signals - All detected signals
   * @param {boolean} [params.isWhitelisted=false] - Authoritative whitelist indicator
   * @param {string} [params.requestId]
   * @param {object} [params.metrics]
   * @returns {object} Standardized Layer 1 Result DTO
   */
  static resolve({ signals = [], isWhitelisted = false, requestId = null, metrics = {} }) {
    // 1. Deduplicate and aggregate signals
    const { uniqueSignals, severityCounts } = SignalAggregator.aggregate(signals);

    // 2. Evaluate Hard Rules (P0/P1)
    const hardRuleRes = HardRuleEngine.evaluate(uniqueSignals);

    // CASE 1: HARD BLOCK (Early Exit STOP)
    if (hardRuleRes.isHardBlock) {
      const confidence = ConfidenceEngine.calculate({
        status: LAYER_1_STATUS.BLOCK,
        signals: uniqueSignals,
        hardRuleConfidence: hardRuleRes.primaryConfidence,
      });

      return createLayer1Result({
        status: LAYER_1_STATUS.BLOCK,
        confidence,
        reasons: hardRuleRes.reasons,
        signals: uniqueSignals,
        nextLayer: null,
        requestId,
        metrics,
        details: {
          hardTriggersCount: hardRuleRes.matchedRules.length,
          matchedRules: hardRuleRes.matchedRules,
          decisionRationale: "Phát hiện bằng chứng gian lận / lừa đảo hoặc tệp độc hại chắc chắn theo quy tắc cứng (Hard Rules).",
        },
      });
    }

    // CASE 2: AUTHORITATIVE WHITELIST PASS
    if (isWhitelisted) {
      const confidence = ConfidenceEngine.calculate({
        status: LAYER_1_STATUS.PASS,
        isWhitelisted: true,
        signals: uniqueSignals,
      });

      return createLayer1Result({
        status: LAYER_1_STATUS.PASS,
        confidence,
        reasons: [LAYER_1_REASONS.WHITELISTED_DOMAIN],
        signals: uniqueSignals,
        nextLayer: 2,
        requestId,
        metrics,
        details: {
          hardTriggersCount: 0,
          decisionRationale: "Tên miền thuộc danh mục xác thực chính thống (.edu.vn / .gov.vn / Đối tác xác minh).",
        },
      });
    }

    // CASE 3: SUSPICIOUS (Routing to Layer 2 for deeper analysis)
    const hasCritical = severityCounts[SIGNAL_SEVERITY.CRITICAL] > 0;
    const hasHigh = severityCounts[SIGNAL_SEVERITY.HIGH] > 0;
    const hasMedium = severityCounts[SIGNAL_SEVERITY.MEDIUM] > 0;

    if (hasCritical || hasHigh || hasMedium) {
      const confidence = ConfidenceEngine.calculate({
        status: LAYER_1_STATUS.SUSPICIOUS,
        signals: uniqueSignals,
      });

      const reasons = Array.from(
        new Set(
          uniqueSignals
            .filter((s) => s.severity !== SIGNAL_SEVERITY.INFO)
            .map((s) => s.type)
        )
      );

      return createLayer1Result({
        status: LAYER_1_STATUS.SUSPICIOUS,
        confidence,
        reasons,
        signals: uniqueSignals,
        nextLayer: 2,
        requestId,
        metrics,
        details: {
          hardTriggersCount: 0,
          severityCounts,
          decisionRationale: "Phát hiện tín hiệu bất thường cần đối chiếu sâu với Aggregator API & AI Vector RAG ở Layer 2.",
        },
      });
    }

    // CASE 4: CLEAN PASS (Routing to Layer 2)
    const confidence = ConfidenceEngine.calculate({
      status: LAYER_1_STATUS.PASS,
      signals: uniqueSignals,
    });

    return createLayer1Result({
      status: LAYER_1_STATUS.PASS,
      confidence,
      reasons: [],
      signals: uniqueSignals,
      nextLayer: 2,
      requestId,
      metrics,
      details: {
        hardTriggersCount: 0,
        decisionRationale: "Không phát hiện mối đe dọa trực diện ở Tầng 1. Chuyển tiếp Layer 2 để thẩm định nội dung chuyên sâu.",
      },
    });
  }
}
```

## `frontend/src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js`

```js
/**
 * Layer 4 — HardDecisionPolicy
 * 
 * Deterministic hard rules for decisive risk overrides:
 * Rule 1: Layer 1 hard malicious signals + no valid educational immunity -> BLOCK (CRITICAL)
 * Rule 2: Credential harvesting + institutional impersonation -> BLOCK (CRITICAL)
 * Rule 3: Malicious binary / executable payload -> BLOCK (CRITICAL)
 * Rule 4: Compound financial task deposit scam -> BLOCK (HIGH/CRITICAL)
 */

import { FINAL_CLASSIFICATION, SECURITY_RISK_LEVEL, RECOMMENDED_ACTION } from "../types.js";

export class HardDecisionPolicy {
  /**
   * Evaluates deterministic hard rules across fused evidence
   * @param {object} fusedGraph
   * @returns {object|null} Hard rule decision or null if no hard rule triggered
   */
  static evaluate(fusedGraph) {
    const isEducational =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "educational_discussion") ||
      fusedGraph.layer2Classification === "INFORMATIVE";

    // 1. Rule 1: Layer 1 BLOCK — Deterministic hard block CANNOT be overridden by educational immunity
    if (fusedGraph.layer1Status === "BLOCK") {
      return {
        ruleId: "HARD_RULE_1_LAYER1_BLOCK",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.99,
        reason: "Phát hiện chỉ dấu tấn công độc hại / lừa đảo trực tiếp từ Layer 1.",
      };
    }

    // 1b. Rule 1b: Layer 2 Semantic & Neural BLOCK — Deterministic block CANNOT be overridden
    if (fusedGraph.layer2Status === "BLOCK") {
      return {
        ruleId: "HARD_RULE_1B_LAYER2_BLOCK",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        reason: "Phát hiện mối đe dọa lừa đảo / thao túng tâm lý nguy hiểm từ phân tích ngữ nghĩa và mô hình AI Tầng 2.",
      };
    }

    // 2. Rule 2: Credential Harvesting + Impersonation
    const hasCredentialDemand =
      fusedGraph.layer1Signals.some((s) => s.type === "credential_request" || s.type === "otp_request") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "credential_harvesting_context" || s.type === "account_takeover_context");

    const hasImpersonation =
      fusedGraph.layer2CrossModalFindings.some((f) => f.type === "impersonation_mismatch") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "credential_harvesting_context");

    if (hasCredentialDemand && !isEducational) {
      return {
        ruleId: "HARD_RULE_2_CREDENTIAL_PHISHING",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        reason: "Nội dung yêu cầu cung cấp thông tin đăng nhập / mã xác thực OTP trái phép.",
      };
    }

    // 3. Rule 3: Financial Scam / Deposit Task Demand
    const hasFinancialScam =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "financial_scam_context");

    if (hasFinancialScam && !isEducational) {
      return {
        ruleId: "HARD_RULE_4_FINANCIAL_FRAUD",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.HIGH,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.96,
        reason: "Phát hiện dấu hiệu bẫy tài chính nạp tiền đặt cọc / tuyển cộng tác viên lừa đảo.",
      };
    }

    // 4. Rule 4: Academic Project / Lab / Club Advance Deposit Trap
    const hasAcademicDepositTrap =
      fusedGraph.layer1Signals.some((s) => s.type === "advance_reservation_deposit_demand") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "unauthorized_academic_deposit_trap");

    if (hasAcademicDepositTrap && !isEducational) {
      return {
        ruleId: "HARD_RULE_5_ACADEMIC_DEPOSIT_TRAP",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        reason: "Phát hiện bẫy đóng cọc giữ chỗ / nộp phí tham gia dự án NCKH, Lab nghiên cứu hoặc CLB sinh viên trái quy chế.",
      };
    }

    return null;
  }
}
```

## `frontend/src/app/api/ai-trust/screen/route.js`

```js
import { NextResponse } from "next/server";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * POST /api/ai-trust/screen
 * 
 * Authoritative Layer 1 Fast & Deterministic Screening Endpoint
 * Zero-Trust Backend Enforcement. Execution latency target: < 15ms
 */
async function screenTrustInput(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Yêu cầu không hợp lệ. Định dạng payload phải là JSON.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const { type, content, metadata } = body || {};

    if ((content !== undefined && typeof content !== "string") ||
        (content && content.length > 50_000) ||
        (metadata !== undefined && (!metadata || typeof metadata !== "object" || Array.isArray(metadata)))) {
      return NextResponse.json({ error: { code: "SCREEN_INPUT_INVALID", userMessage: "Dữ liệu sàng lọc không hợp lệ hoặc vượt giới hạn." }, status: "BAD_REQUEST" }, { status: 400 });
    }

    if (!content && !metadata?.bytes && !metadata?.ocrText && !metadata?.qrContent) {
      return NextResponse.json(
        {
          error: "Nội dung đầu vào không được để trống.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result = await Layer1ScreenService.screen({
      type: type || "text",
      content: content || "",
      metadata: metadata || {},
      options: { requestId },
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-AI-Trust-Layer": "1-Deterministic",
        "X-AI-Trust-Request-Id": requestId,
      },
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "SCREEN_TRUST_INPUT",
  allowAnonymous: true,
  maxRequests: 60,
  maxBodyBytes: 256 * 1024,
}, screenTrustInput);
```

## `frontend/src/app/api/ai/trust/evaluate/route.js`

```js
/**
 * StudentHub AI — API Route: POST /api/ai/trust/evaluate
 * 
 * Server-authoritative AI Trust Evaluation endpoint.
 * Evaluates claims, verifies citations, checks temporal validity,
 * guards against prompt injection and returns multi-dimensional trust metrics.
 */

import { AiTrustEngine } from "@/lib/intelligence/trust/aiTrustEngine";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric";
import { NextResponse } from "next/server";

async function evaluateTrust(req, _routeParams, principal, secContext) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, rawAnswer, sources, evidenceSpans, stakeLevel } = body;

    if ((typeof query !== "string" && typeof rawAnswer !== "string") ||
        (!String(query || "").trim() && !String(rawAnswer || "").trim()) ||
        String(query || "").length > 12_000 || String(rawAnswer || "").length > 24_000) {
      return NextResponse.json({ success: false, error: {
        code: "TRUST_EVALUATION_INPUT_INVALID",
        userMessage: "Nội dung cần thẩm định không hợp lệ hoặc vượt giới hạn.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }
    if ((sources !== undefined && (!Array.isArray(sources) || sources.length > 40)) ||
        (evidenceSpans !== undefined && (!Array.isArray(evidenceSpans) || evidenceSpans.length > 80))) {
      return NextResponse.json({ success: false, error: {
        code: "TRUST_EVALUATION_INPUT_TOO_LARGE",
        userMessage: "Số lượng nguồn hoặc đoạn chứng cứ vượt giới hạn an toàn.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 413 });
    }

    const evaluation = AiTrustEngine.evaluate({
      query: query || "",
      rawAnswer: rawAnswer || "",
      sources: Array.isArray(sources) ? sources : [],
      evidenceSpans: Array.isArray(evidenceSpans) ? evidenceSpans : [],
      stakeLevel,
      // Ownership is derived exclusively from the verified SecurityPrincipal;
      // client-supplied student/user identifiers are deliberately ignored.
      ownerId: principal.subjectId
    });

    AiTrustStore.saveEvaluation(evaluation);

    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    // SecurityFabric owns the public error envelope.  Throwing here prevents
    // provider/parser details from being reflected to the caller.
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_TRUST_EVALUATION",
  requiredPermission: "TRUST.ANALYZE",
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, evaluateTrust);
```
