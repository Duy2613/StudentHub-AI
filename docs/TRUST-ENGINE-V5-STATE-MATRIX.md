# Trust Engine V5 — State Transition Matrix

This is the implementation state matrix for the sequential orchestrator. A stage finding is never inferred from an operation status alone.

| Trigger | Action | Boundary condition | Result |
| --- | --- | --- | --- |
| New request accepted | create request ID, fingerprint and seven `NOT_STARTED` stages | input is bounded before service calls | `PIPELINE_STATUS=RUNNING` |
| Stage begins | set only current stage to `RUNNING`, emit transition | later stages remain `NOT_STARTED` | no final decision is present |
| Deterministic L1 block | record `LOCAL_BLOCK`, continue safe analysis | no unsafe fetch/render/execute | interaction is blocked; hard negative must reach L4 |
| L2A threat match | record `THREAT_MATCH` | semantic/domain/evidence may disagree | L4 must be `MALICIOUS/BLOCK` |
| L2A no-match | record `NO_KNOWN_THREAT` | provider success and provenance contract required | no `SAFE`; L4 can only use provider-scoped no-match |
| L2A/L3 transient error | emit retry event once | retry budget is one; deterministic L1 is not rerun | final provider finding remains unknown/partial if unresolved |
| L2B/L2C advisory signal | retain signal and taxonomy/model metadata | no authoritative clearance | L4 may raise suspicion only |
| L3 retrieval result | retain source lineage, freshness and conflicts | local/stale/concentrated evidence is labeled | truth remains supported/mixed/insufficient as evidence permits |
| L4 evaluation | apply deterministic precedence | L5/AI cannot supply policy authority | separate security/truth/action output |
| L5 audit | check stage set/order, hard negatives, failure optimism, evidence, confidence | L5 cannot upgrade | pass or downgrade/recheck/block missing evidence |
| Caller abort/new request | abort active controller | late response must not publish | `CANCELLED`; only current request may render |
| All stages terminal | publish final snapshot | completion is not proof of safety | `COMPLETED` or `PARTIAL` with explicit limitations |
