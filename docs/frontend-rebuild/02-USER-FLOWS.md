# 02 — User Flow and Information Architecture Audit

**Audit date:** 2026-09-01  
**Scope:** current landing, Trust, Community, Expert, authentication, search, navigation, and supporting case flows.

## Executive summary

The current product has three recognizable pillars, but the user journey is split between a canonical shell, legacy pages, compatibility redirects, and an explicitly demo-only Case Lab. Trust is the most complete end-to-end flow; Community and Expert are useful directories/feeds but stop before the evidence and accountability actions described in the brief.

The main IA problem is not that any single page is empty. It is that users cannot reliably predict where an observation, an expert assessment, a case revision, or a Passport record will live.

## Flow 1 — Landing to investigation

### Current observed flow

    / landing
       ↓
    editorial chapters, product preview, trust/community/expert explanation
       ↓
    CTA or navigation
       ↓
    /trust
       ↓
    choose image, text, or URL
       ↓
    validate input and run sequential Trust request
       ↓
    staged pipeline and result
       ├── verdict, reasons, actions
       ├── provider status, related cases
       ├── TrustGraph
       └── community/expert handoff

The landing experience is a coherent discovery surface and has a separate mobile composition. Its product preview is illustrative; it does not run the same investigation as /trust.

### Target delta

The brief asks the landing page to make a real investigation legible through ten chapters, including a purpose-built demo and a final action. The current Atlas has a strong visual narrative, but it is a six-part-ish composition rather than the specified ten-step information sequence, and its preview is not a verified end-to-end case.

**Risk:** designing the landing before the Trust information architecture is frozen will create a promise that the product report cannot yet fulfil.

## Flow 2 — Trust investigation

### Current observed flow

    Student
       ↓
    /trust input mode: image, text, or URL
       ↓
    local validation / OCR for image
       ↓
    /api/v1/trust sequential request
       ↓
    processing timeline
       ↓
    V5 report stack
       ├── verdict and safety actions
       ├── reasons and case timeline
       ├── provider statuses
       ├── related cases
       ├── TrustGraph
       └── community/expert handoff

The current flow has explicit opt-in deterministic demo cases when the competition demo flag is enabled. It has abort handling, a scan sequence guard, typed error mapping, and explicit unknown/unavailable language. These are strong foundations.

### Missing or unclear transitions

- Image input has upload and preview behavior, but no visible entity bounding boxes or investigation rail for suspicious domain, OTP request, payment QR, or urgent wording.
- QR can be represented by extracted content in the technical data, but there is no dedicated camera/QR mode or camera permission flow.
- The result is a long staged stack. Level 1 decision, Level 2 explanation tabs, and Level 3 technical drilldown are not explicit navigational layers.
- Risk, confidence, evidence coverage, and source agreement are not presented as the four independent numeric/semantic metrics requested by the brief.
- The current Trust page can hand off to Community and Expert, but it does not clearly create or open an Evidence Passport record.
- Passport and Decision Twin are visible in the separate /cases demo surface, not owned by the primary Trust report.

## Flow 3 — Community observation and corroboration

### Current observed flow

    /community
       ↓
    search and topic filter
       ↓
    seeded observation cards
       ↓
    read title, body, cohort/status, date, source community

The current page is a real UI with deterministic local CommunityStore data. It is not a social empty shell; it provides useful student-language observations and a feed-level reading guide.

### Missing transitions

- No observation detail route or stable observation identifier is visible in the primary flow.
- No evidence attachment/count view, source URL/timestamp, corroboration action, or conflict state is exposed on the card.
- There is no submit-observation or add-corroboration flow.
- There is no clear path from a specific observation to the TrustGraph or a Trust case.
- Search is feed filtering, not a cross-pillar search.

**IA consequence:** Community currently answers “what is being posted?” but not “what evidence supports this observation, and what can I contribute?”

## Flow 4 — Expert discovery and assessment

### Current observed flow

    /expert
       ↓
    search / filter
       ↓
    expert directory card
       ↓
    dossier panel
       ├── scope and meter
       ├── credentials/publication counts
       └── claim assessment form
              ↓
          /api/expert/evaluate

The current UI correctly warns that expertise is not the same as authority and bounds an assessment to a scope. That vocabulary should be preserved.

### Missing transitions

- No evidence count, reviewed-case list, assessment timestamp, revision, or disagreement history is attached to the authority view.
- There is no visible case escalation entry from Trust to a selected expert assessment.
- There is no immutable assessment event on a Passport.
- The seeded directory includes an intentionally fake fixture name, including “GS. Bịa Đặt Nguyễn”; this must never be presented as verified production authority.

## Flow 5 — Authentication and account

    /login or /register
       ↓
    Supabase/proxy auth
       ↓
    /callback for OAuth/session exchange
       ↓
    /onboarding for profile and role setup
       ↓
    /dashboard, /profile, /settings

Auth is a separate visual system and the browser sample found moderate landmark/heading/region axe issues on /login. The current UI should be treated as a platform dependency, not an unrelated page: signed-out behavior determines whether Trust, Passport, and expert escalation can be honest.

The audit did not verify every auth edge case. In the local browser run, expected unauthenticated requests produced 401 console entries while the pages still returned 200. This should be represented as an intentional auth boundary in future states.

## Flow 6 — Search and navigation

### Current behavior

Ctrl/Cmd+K opens a command dialog. The results are generated from the static sidebar groups, so the feature is currently navigation search. Its placeholder promises search for cases, evidence, or experts, but the implementation does not query those datasets.

The canonical sidebar includes:

- Trust, Community, Experts;
- Academic 360;
- Evidence Case Lab;
- Forum;
- personal Dashboard, notifications, Profile, Settings.

This is the clearest visible product-scope conflict. It makes all six destinations look equally committed.

### Interaction gaps

- Command dialog autofocus works, but focus is not restored to the trigger after closing and there is no verified focus trap.
- The dialog does not search case/evidence/expert records despite its copy.
- Mobile has both the header menu button and the Margin details control representing navigation state.
- Legacy pages retain a second navigation paradigm, so a user can encounter a different shell after a redirect or deep link.

## Flow 7 — Case Lab, Passport, and Decision Twin

The /cases page contains three deterministic competition superflows with explicit demo disclosure, an Evidence Triangle, conflicts/unknowns, a revisioned Passport event timeline, and Decision Twin options. It is currently the strongest demonstration of the target case model.

The problem is ownership: these capabilities are not yet composed into the primary /trust flow. The product must choose whether /cases is:

1. a supporting demo/lab route;
2. a canonical case-detail route under Trust; or
3. a private case workspace reachable from Dashboard.

Until that decision is recorded, the same concepts can be implemented twice.

## Dead ends, duplicates, and contradictions

| Issue | Verified current behavior | Impact |
| --- | --- | --- |
| Duplicate Trust surfaces | /trust is the canonical studio; /ai, /contract-check, /scam-check, /intelligence/ai-trust, and /intelligence/trust are separate or compatibility paths | Users and analytics can split across multiple names for one task |
| Duplicate Community models | /community is evidence-oriented; /forum is a legacy social forum | Corroboration and moderation expectations conflict |
| Duplicate Expert model | /expert is scoped; /prof-rating is a compatibility entry and /intelligence/experts is a subview | Authority can be confused with rating |
| Case ownership | /cases demonstrates Passport/Decision Twin; /trust does not own them | Revision history and deep-link rules are unresolved |
| Academic prominence | Academic 360 remains a first-class sidebar item despite P0/P1 priority | Design effort can drift into a deferred pillar |
| Search promise | Static navigation filtering is labelled like data search | Users will expect case/evidence results that cannot appear |
| Mobile flow | Canonical shell can make the main column 146 px wide at 390 px | All core journeys become unreadable before their content decisions matter |

## Target flow acceptance criteria for the next spec

The design architecture should make these transitions unambiguous:

1. Landing → Trust starts one clearly labelled investigation.
2. Trust input → processing shows only known real stages.
3. Trust result → decision and action are visible before technical depth.
4. Trust result → evidence, Community, Expert, Graph, and Passport have one owner each.
5. Community observation → evidence detail → corroboration → linked case/graph.
6. Expert directory → authority detail → scoped review → Passport event.
7. Any live/unavailable/demo state is visible at the point of action.
8. Signed-out users receive an honest session boundary, not a silent production-looking fallback.

No current implementation change is made by this audit.
