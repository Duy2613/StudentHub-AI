# 01 — Route Inventory and Product Decisions

**Audit date:** 2026-09-01  
**Scope:** every page file under frontend/src/app  
**Decision posture:** information-architecture recommendation only. No route was deleted or rewritten.

## Rating legend

- **Mobile:** Good means the sampled composition is usable; Mixed means partial evidence or a route-specific concern; Gap means the canonical shell defect is visible at 390 px; n/a means redirect or non-UI handler.
- **A11y:** Good/Mixed/Gap is based on the browser sample and source inspection, not a full WCAG certification. Not sampled means no claim is made.
- **Design:** Strong/Mixed/Drift is a qualitative baseline assessment, not an instruction to preserve every visual choice.
- **State:** REAL means a product UI exists; SEEDED means the UI is backed by local deterministic data; DEMO means explicitly fixture-driven; REDIRECT means compatibility behavior; LEGACY means a UI remains but should not define the new product.

## Master inventory

| Path | Purpose / pillar | State | Current dependency | Mobile | A11y | Design | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| / | Public landing and product discovery | REAL | Static landing assets | Good | Mixed | Strong | KEEP |
| /academic | Academic 360 overview | REAL + SEEDED | Academic engine/local state | Gap | Not sampled | Mixed | POST_V1 |
| /academic/execution | Semester execution workflow | REAL + SEEDED | Workflow engine/local state | Not sampled | Not sampled | Mixed | POST_V1 |
| /academic/planner | What-if course planner | REAL + SEEDED | Academic planner | Not sampled | Not sampled | Mixed | POST_V1 |
| /academic/profile | Transcript and degree audit | REAL + SEEDED | Records/profile state | Not sampled | Good in targeted sample | Mixed | CONSOLIDATE |
| /academic/roadmap | Graduation roadmap | REAL + SEEDED | Academic roadmap | Not sampled | Not sampled | Mixed | POST_V1 |
| /ai | Generic AI compatibility entry | REDIRECT | Client redirect to /trust | n/a | n/a | n/a | CONSOLIDATE |
| /callback | OAuth callback boundary | REAL | Supabase/session exchange | n/a | n/a | n/a | KEEP |
| /cases | Evidence Case Lab and superflows | DEMO | Local deterministic fixtures | Gap | Not sampled | Strong | KEEP, hierarchy pending |
| /community | Student observation feed | REAL + SEEDED | CommunityStore and typed API seam | Gap | Mixed | Mixed | KEEP |
| /contract-check | Contract-check compatibility entry | REDIRECT | Client redirect to /trust | n/a | n/a | n/a | CONSOLIDATE |
| /credit-scheduler | Scheduler compatibility entry | REDIRECT | Client redirect to /academic?view=planner | n/a | n/a | n/a | POST_V1 |
| /dashboard | Personal command center | REAL + AUTH-GATED | Session and dashboard API paths | Gap | Not sampled | Mixed | KEEP |
| /expert | Expert directory and scoped assessment | REAL + SEEDED | ExpertStore and /api/expert/evaluate | Gap | Mixed | Mixed | KEEP |
| /forum | Legacy social forum | LEGACY | Legacy local/API behavior | Not sampled | Not sampled | Drift | REMOVE from primary IA |
| /intelligence | Intelligence umbrella | REAL + SEEDED | Fusion/local stores | Not sampled | Not sampled | Mixed | CONSOLIDATE |
| /intelligence/ai-trust | Duplicate AI Trust surface | DEMO / SEEDED | Trust components and fixtures | Not sampled | Not sampled | Mixed | CONSOLIDATE into /trust |
| /intelligence/community | Community intelligence subview | REAL + SEEDED | CommunityStore | Not sampled | Not sampled | Mixed | CONSOLIDATE into /community |
| /intelligence/evidence | Raw evidence lens | REAL + SEEDED | Evidence/local data | Not sampled | Not sampled | Mixed | CONSOLIDATE into Trust Level 3 |
| /intelligence/experts | Expert graph subview | REAL + SEEDED | ExpertStore | Not sampled | Not sampled | Mixed | CONSOLIDATE into /expert |
| /intelligence/knowledge | Knowledge fusion studio | REAL + SEEDED | Knowledge/local data | Gap in targeted sample | Good in targeted sample | Mixed | CONSOLIDATE |
| /intelligence/trust | Trust graph subview | REAL + SEEDED | Epistemic graph/local data | Not sampled | Not sampled | Mixed | CONSOLIDATE into /trust |
| /login | Authentication and OTP | REAL | Supabase/proxy | Mixed | Gap in moderate axe checks | Mixed | KEEP |
| /marketplace | Marketplace compatibility entry | REDIRECT | Client redirect to /community | n/a | n/a | n/a | REMOVE feature; retain compat redirect temporarily |
| /onboarding | First-run role/profile setup | REAL | Supabase/profile state | Not sampled | Not sampled | Mixed | KEEP |
| /prof-rating | Professor-rating compatibility entry | REDIRECT | Client redirect to /expert | n/a | n/a | n/a | CONSOLIDATE into Expert authority |
| /profile | Personal profile and reputation | REAL | Session/profile data | Not sampled | Not sampled | Drift / legacy mix | KEEP, align to Passport |
| /profile/[id] | Public profile view | REAL | Public profile DTO/state | Not sampled | Not sampled | Drift / legacy mix | CONSOLIDATE with public Passport |
| /quests | Gamification compatibility entry | REDIRECT | Client redirect to /dashboard | n/a | n/a | n/a | REMOVE feature; retain compat redirect temporarily |
| /register | Account creation | REAL | Supabase/proxy | Not sampled | Not sampled | Mixed | KEEP |
| /safety-map | Physical safety map | LEGACY / SEEDED | Static registry and map mock | Not sampled | Not sampled | Drift | POST_V1 |
| /scam-check | Legacy trust compatibility entry | REDIRECT | Server redirect to /trust | n/a | n/a | n/a | CONSOLIDATE |
| /scholarships | Scholarship registry | LEGACY / SEEDED | Static registry | Not sampled | Not sampled | Drift | POST_V1 |
| /settings | Preferences and account settings | REAL | Session/localStorage | Not sampled | Not sampled | Mixed | KEEP |
| /settings/privacy | Privacy and retention controls | REAL | LocalStorage/session | Good in targeted sample | Good in targeted sample | Mixed | KEEP |
| /sos | Emergency and complaint drafting | LEGACY / SEEDED | Static registry | Not sampled | Not sampled | Drift | POST_V1, legal scope required |
| /trust | Flagship multimodal investigation | REAL + explicit DEMO | Typed Trust API, local OCR, opt-in demo | Gap | Mixed | Strong but dense | KEEP |
| /tuition-radar | Tuition compatibility entry | REDIRECT | Client redirect to /academic | n/a | n/a | n/a | POST_V1 |
| /ultra | Internal showcase/playground | DEMO | None | Not sampled | Not sampled | Drift / showcase | REMOVE from product IA |

## Disposition totals

| Disposition | Count | Meaning |
| --- | ---: | --- |
| KEEP | 13 | Retain as product or platform surfaces, subject to redesign/spec |
| CONSOLIDATE | 13 | Preserve useful behavior but give it one canonical home |
| REMOVE | 4 | Remove from user-facing product scope after inbound-link/rollback review |
| POST_V1 | 9 | Preserve as deferred value; do not design into the current flagship scope |
| UNKNOWN | 0 | Every current route has an observed purpose; unresolved product choices are recorded below rather than hidden as UNKNOWN |

## Decisions that still require a scope owner

### Case Lab URL and hierarchy

The /cases surface is a polished, deterministic, explicitly labelled competition demo. It is valuable connective tissue for Trust, Community, and Expert, but the brief does not decide whether it remains a top-level route, becomes a Trust mode, or becomes a private case detail route. Keep the route while freezing this hierarchy.

### Compatibility semantics

Redirect pages are not proof that the underlying feature should survive. Keep inbound compatibility only long enough to measure links and decide whether a permanent redirect, a removed route, or a preserved later feature is appropriate.

### Academic and safety features

Academic 360 has real algorithmic value, and SOS/safety features may have high student value, but neither should be silently folded into Trust. They need explicit product, legal, and data ownership decisions before a later phase.

### Forum versus Community

Community is the intended evidence-first pillar. Forum is a separate social model with different incentives and moderation assumptions. The recommendation is to remove Forum from primary navigation and preserve only a compatibility path if required.

## Proposed canonical information architecture

    /
    ├── /trust
    │   ├── investigation report
    │   ├── TrustGraph
    │   └── case / passport detail (URL decision pending)
    ├── /community
    │   ├── observations
    │   └── observation evidence detail
    ├── /expert
    │   ├── directory
    │   └── authority / assessment detail
    ├── /cases  (supporting lab; top-level versus nested decision pending)
    └── personal
        ├── /dashboard
        ├── /profile
        └── /settings

No implementation or route deletion should begin until the pending choices are recorded in an approved product scope.
