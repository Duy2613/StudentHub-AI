# Trust Engine V5 — Threat Model

## Assets and security objectives

The system protects students from unsafe interaction, unsupported claims, credential/payment collection, malicious URLs, and overconfident automation. It also protects provider credentials, request correlation, evidence provenance and privacy-bound audit data.

The primary security invariant is asymmetric: uncertainty may stop or slow an action, but no non-authoritative component may turn a hard negative, provider failure or insufficient evidence into safety.

## Adversaries and controls

| Threat | Control | Honest residual limitation |
| --- | --- | --- |
| Hostile text, malformed input, oversized input | bounded route/orchestrator input, typed schema and no raw client metadata | unseen formats can still be unknown |
| SSRF, unsafe URL, dangerous file/payload | L1 local screening, URL/provider boundary validation and interaction block | safe analysis may still observe a target through a guarded provider |
| Provider compromise or contradictory DTO | L2A response normalization, contract contradiction state, trust boundary and L4 precedence | provider coverage is not universal |
| Provider timeout, network loss, circuit open, dependency outage | typed `UNKNOWN`/`PARTIAL`, bounded retry and review action | no live result is claimed during outage |
| Prompt injection in input, model prompt or retrieved source | untrusted-data isolation and bounded structured calls; injection is a signal, not an instruction | content can remain semantically ambiguous |
| Retrieval poisoning, source duplication, stale evidence | provenance, source fingerprint/cluster, freshness, conflict retention and L5 checks | source authority still requires operational verification |
| DoS / slow dependency | body bounds, request limits, timeout, one retry and cancellation | infrastructure-level capacity remains an operations concern |
| AI overconfidence or unsupported narrative | score semantics, null calibration, L4 deterministic authority and L5 narrative-reference checks | a bounded model can still miss a novel pattern |
| Race/new-input stale result | request-scoped controller, input fingerprint and stale callback suppression | clients should still treat a cancelled request as incomplete |
| Privacy leakage | sanitized dataset path, bounded public projection and server-only raw metadata | operators must configure retention and access controls correctly |

## Trust boundaries

The browser is an untrusted caller. API validation is a boundary. L2A, AI, retrieval and community material are non-authoritative inputs. L3 can describe provenance only when the adapter supplies it. L4 is the policy boundary. L5 observes all prior outputs and has downgrade-only authority.

## Abuse outcomes

If the system cannot establish sufficient evidence, the allowed outcome is `UNKNOWN`, `REVIEW`, `PARTIAL`, or `BLOCKED` as appropriate. It must not display “verified safe”, `SAFE`, or an equivalent absolute claim.
