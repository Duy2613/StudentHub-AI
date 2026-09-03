# Friend Backend Reuse Boundary

**Status:** `CONTRACT_DERIVATION_ONLY_PENDING_LEGAL_REVIEW`

**Source:** pinned friend snapshot `0625b1b950f29edd714507e485284208207039fb`

## License finding

The pinned repository tree contains no explicit `LICENSE` file and no identified SPDX license declaration in the inspected root/source metadata. This is a source observation, not a legal opinion.

Because licensing is absent or unclear, StudentHub must not wholesale-copy substantial friend implementation, prompts, or source modules into the canonical repository.

## Permitted engineering use

The following may be used as interoperability and migration evidence:

- public endpoint paths, HTTP methods, content types, and DTO field shapes;
- observed enum values, nullability, defaulting, and response envelopes;
- source-derived behavior classifications and incompatibility findings;
- sanitized fixtures created independently from the pinned contract;
- small compatibility code needed to communicate with the external service, kept behind `LegacyVerificationAdapter`;
- independent implementations of the same provider capability using official provider documentation.

## Prohibited reuse without explicit legal approval

- copying complete controllers, services, models, prompts, or migrations;
- copying substantial blocks of implementation code;
- importing the friend database schema or credentials into StudentHub;
- treating the friend repository as a runtime package or unpinned dependency;
- reproducing secrets, private configuration, or generated artifacts containing secrets;
- presenting friend behavior as StudentHub-owned canonical semantics.

## Canonical implementation rule

StudentHub owns the anti-corruption adapter, provider ports, normalized evidence model, deterministic Trust policy, Passport, TrustGraph, Community, Expert, authentication, and canonical Supabase data plane. The adapter may translate the pinned wire contract, but it may not transfer the friend backend's unsafe semantics such as `NO MATCH => SAFE`, keyword-count truth heuristics, global `TrustScore`, or raw provider confidence authority.

## Review gate

Before any substantial source reuse, an authorized owner must provide or approve a compatible license interpretation and attribution/notice requirements. Until then, implementation work must be an independent reimplementation guided by the source-derived contract and documented behavior.
