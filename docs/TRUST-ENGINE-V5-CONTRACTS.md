# Trust Engine V5 — Contracts

## Stage envelope

The canonical envelope is created by `createStageEnvelope` in `frontend/src/lib/ai-trust/v5/contracts.js` and contains:

`schemaVersion`, `requestId`, `stageId`, `architecturalLayer`, `stageName`, `role`, `checking`, `operationStatus`, `finding`, `severity`, `startedAt`, `completedAt`, `latencyMs`, `providerStatus`, `providerId`, `modelId`, `modelVersion`, `confidence`, `confidenceKind`, `summary`, `reasons`, `signals`, `evidenceRefs`, `meaning`, `notProve`, `limitations`, `nextStage`, `safeToContinue`, `userAction`, `audit`.

`rawMetadata` exists only inside the server-side envelope. `toPublicStageEnvelope` removes it before the response is sent to the browser.

## Pipeline response

The public V5 response is:

```json
{
  "success": true,
  "contractVersion": "trust.v5",
  "version": "v5",
  "requestId": "req_v5_…",
  "demo": false,
  "data": {
    "schemaVersion": "trust.v5",
    "pipelineVersion": "trust-pipeline-v5.0.0",
    "pipelineStatus": "COMPLETED",
    "currentStage": "l5",
    "stages": { "l1": {}, "l2a": {}, "l2b": {}, "l2c": {}, "l3": {}, "l4": {}, "l5": {} },
    "finalDecision": {
      "security": "UNKNOWN",
      "truth": "INSUFFICIENT_EVIDENCE",
      "action": "REVIEW",
      "decisionAuthority": "L4_DETERMINISTIC_POLICY",
      "assuranceAuthority": "L5_DOWNGRADE_ONLY"
    }
  }
}
```

The actual response is schema-validated by `trustV5ResponseSchema`. The explicit V5 endpoint is `/api/v1/trust/analyze`; the existing `/api/v1/trust` route accepts the same versioned request for compatibility. Legacy `trust.v1` responses are converted to an explicitly partial compatibility view; that view is not V5 maturity evidence.

## Semantics

- `UNKNOWN` and `UNKNOWN_STUDENT_RISK` are abstentions, not safe findings.
- `NO_KNOWN_THREAT` is scoped to a successful provider observation and time; it is never `SAFE`.
- `MODEL_SCORE_UNCALIBRATED` is a score label, not a probability.
- `ASSURANCE_PASS` means only that declared assurance checks found no anomaly; it cannot improve the L4 security/action result.
- Confidence is null when its source semantics are not disclosed or calibration is unavailable.
