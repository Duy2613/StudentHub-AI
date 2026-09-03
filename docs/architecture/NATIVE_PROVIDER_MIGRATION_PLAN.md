# Native Provider Migration Plan

Status: `STRANGLER_BOUNDARY_READY_NATIVE_LIVE_PROOF_PENDING`

The friend backend remains a temporary provider subsystem. Migration is a
capability-by-capability strangler process; it is not a big-bang rewrite and
does not change the Lucid Aether UI, canonical Trust API, deterministic policy,
Passport, TrustGraph, Community, Expert, or canonical Supabase ownership.

## Stages

| Stage | Active path | Required evidence | Current state |
| --- | --- | --- | --- |
| 0. Isolate | Gateway -> legacy adapter | Pinned contracts, redaction, resilience, fixture matrix | Repository complete |
| 1. Prepare native | Gateway -> native capability behind same port | Official API contract, owned adapter, typed failures, tests | Interface/selection ready; native implementations pending |
| 2. Shadow | Legacy active; native comparison only | Privacy-approved duplicate dispatch, semantic differential records, no policy impact | Not enabled |
| 3. Limited cutover | Native active for an approved capability; legacy rollback path retained | Staging success/failure matrix, provenance parity, latency/cost review | Not verified |
| 4. Native default | Native active; legacy fallback only where explicitly approved | Repeated staging/live assurance and rollback rehearsal | Not verified |
| 5. Retire | No friend dependency for the capability | No frontend direct dependency, data ownership proof, archival/retirement plan | Not eligible |

## Capability order

1. `UrlThreatProvider`: Google/Safe Browsing-style known-threat lookup; no-match
   canonicalizes to `NO_KNOWN_THREAT`, never safe proof.
2. `WebEvidenceProvider`: Tavily/search acquisition only; source documents and
   retrieval runs are persisted as observations, never as automatic truth.
3. `IndependentResearchProvider`: independent retrieval/research with distinct
   Layer 4 provenance; it cannot replace deterministic policy.
4. `EvidenceAnalysisProvider` and `FinalSynthesisProvider`: bounded AI
   enrichment through the AI Gateway with schema/evidence binding.

## Selection controls

Server-only flags are defined in
`frontend/src/lib/ai-trust/providerGateway/ProviderSelection.js`:

`L2_PROVIDER`, `L3_PROVIDER`, `L4_PROVIDER`,
`EVIDENCE_ANALYSIS_PROVIDER`, and `FINAL_SYNTHESIS_PROVIDER`.

Values: `auto`, `legacy`, `native`, `shadow`. `auto` prefers an explicitly
provided native capability and otherwise uses enabled legacy compatibility.
`native` has no silent fallback. `shadow` keeps the active provider unchanged.

## Differential comparison

Compare semantic outcomes, not wording:

- provider health/failure class and latency;
- evidence count, source quality, independence, and provenance completeness;
- contradictions and unresolved signals;
- impact on the deterministic decision;
- retries, tokens, and relative cost units.

Shadow output must never mutate the user-visible decision or Passport. Do not
duplicate `USER_PRIVATE`/`HIGHLY_SENSITIVE` data unless the data-classification
and provider-processing review explicitly allows it.

## Retirement gates

Legacy retirement requires native L2/L3/L4 proof, passing shadow comparison,
reversible rollback, staging evidence, canonical StudentHub data ownership,
and no browser/frontend direct dependency. The current P0 secret incident and
missing approved staging environment keep retirement blocked.

