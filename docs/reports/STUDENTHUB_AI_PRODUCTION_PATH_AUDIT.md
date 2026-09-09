# StudentHub AI — Production Path Audit

**Date:** 2026-09-09  
**Status:** `LOCAL_PATH_CONTRACT_VERIFIED; LIVE_PROVIDER_NOT_ESTABLISHED`

The local execution path is:

`TrustV5Engine → Claim Intelligence → Evidence Discovery/fixed runtime adapter → Evidence Forensics → MultiModelVerifier → CitationValidator → VerdictPolicyEngine → Decision Twin`

`TrustV5Engine` now emits a versioned stage trace and stable base fingerprint. FULL and FULL_MINUS_CRITIC share that fingerprint; the only permitted toggle is `Independent Critic` execution. Runtime source fixtures are allowlisted and evaluation-only fields (`goldLabel`, expected verdict/risk, hard category, difficulty and related keys) are stripped before evidence processing.

The Independent Critic is currently a deterministic policy layer and is labelled `deterministic_policy`; its trace no longer implies an LLM provider call. The Deep Reasoner uses the gateway when configured and deterministic fallback otherwise. The current local run did not establish live provider reachability or billing evidence.

No claim is made here that a gold label entered the production DTO. The controlled AI TEVV scorer reads gold labels only after the DTO returns.

