# 11 — Corrected Core Reduction & Feature Disposition

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max decision review  
**Claim discipline:** Route observations are `VERIFIED`; product disposition is a frozen decision. No deletion is authorized in F00/F01.

## Required dependencies

The current core requires Trust, Community, Expert, Dashboard, Profile, Settings/Privacy, authentication, onboarding, the public landing entry, and the explicitly demo-labelled Case Lab. These surfaces support the three pillars or the identity/privacy/case lifecycle.

## Feature disposition

| Feature/route family | Disposition | Reason |
| --- | --- | --- |
| Trust | REQUIRED_DEPENDENCY / P0 | Flagship investigation and action lifecycle |
| Community | REQUIRED_DEPENDENCY / P1 | Time-bound corroboration and student observations |
| Expert | REQUIRED_DEPENDENCY / P1 | Scoped authority and escalation |
| Case Lab | REQUIRED_DEPENDENCY for contract review, demo-only | Deterministic superflow fixture; not live evidence |
| Dashboard/Profile/Settings/Auth | REQUIRED_DEPENDENCY | Case history, identity, privacy, and access boundary |
| Academic routes and credit scheduler | POST_V1 | Valuable domain, but not a current pillar |
| Safety Map and SOS | POST_V1 | Operational/legal/safety ownership required |
| Scholarships and Tuition Radar | POST_V1 | Freshness, source, eligibility, and financial-risk contracts required |
| `/ai` | MERGE_INTO:`/trust` | Generic chat is not an independent product promise |
| `/contract-check` | MERGE_INTO:`/trust` | Document investigation belongs to multimodal Trust |
| `/scam-check` | MERGE_INTO:`/trust` | Duplicate Trust entry |
| `/prof-rating` | MERGE_INTO:`/expert` | Only scoped, evidence-bound expertise survives; ratings do not become authority |
| `/intelligence/*` | MERGE_INTO pillar owner | Duplicate lens/umbrella routes |
| `/forum` | REMOVE | Legacy social engagement model conflicts with observation semantics |
| `/marketplace` | REMOVE | Unrelated transaction feature |
| `/quests` | REMOVE | Gamification sprawl |
| `/ultra` | REMOVE | Internal visual showcase, not product surface |

## Corrected implementation instruction

F00/F01 does not delete route folders, handlers, data, or navigation entries. A later bounded removal phase must search references, choose temporary redirect versus 404/410, test inbound links, review privacy/data ownership, document release notes, and preserve rollback. This replaces the earlier unsupported “delete in F1” instruction.
