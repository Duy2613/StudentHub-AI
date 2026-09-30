# AI / Omni V4 — O1 information architecture and state model

## One surface

Canonical shell and public navbar open the same lazy Omni dialog via Ctrl/Cmd+K or Search. `/ai` is a compatibility entry into that surface. Desktop: 880px focused panel with search list and contextual detail. Mobile below 600px: full-height utility sheet, input/close at top, independently scrolling content, safe-area padding and visualViewport keyboard sizing. No fourth navigation pillar.

Opening: real core destinations and permitted account commands. Query: immediate local destinations followed by independent public Community, Expert and attached-source lanes. Exact Trust UUID: authenticated owner lookup. `>` explicitly restricts to deterministic navigation. One input; AI runs only after an explicit button press. No automatic intent classifier/provider request.

## Identity and states

- Surface session is keyed by authenticated principal and route context; unmount clears query, response and private results.
- Search: INITIAL → DEBOUNCING → LOADING → READY / EMPTY / PARTIAL / ERROR. Each query increments request generation synchronously; results are rendered only for the current query/generation. Abort transport on replacement/unmount.
- Result keys are `kind:id` (source also includes parent ID + URL), never title or array index. Social discussion and contribution routes stay distinct.
- Selection: IDLE → REVALIDATING → NAVIGATE / SOURCE_LINK / UNAVAILABLE. Validate ID, public/owner projection and source membership again; unavailable rows cannot navigate.
- AI: IDLE → PENDING → COMPLETE / UNAVAILABLE / ERROR. JSON only. Request snapshot binds query + optional core label; user/route changes unmount it. Never imply revision-bound product explanation.
- Realtime invalidation uses the existing provider; clear/refetch current search, never merge raw event data.

## Context and privacy

Every AI request contains one user message (max 120 typed characters plus fixed formulation instruction) and an optional allowlisted topic label. No claims, sources, thread bodies, dossier, account/profile fields, IDs or revisions are packaged. UI names these exact fields and allows removing the topic label. Product result content stays separate from AI output. Safe text/limited Markdown renders with React escaping, no raw HTML, no images, no executable model actions.

## Keyboard and accessibility

Modal dialog, one labelled combobox controlling grouped listbox options, active descendant, Arrow/Home/End selection, Enter activation, Escape dismissal, Tab focus trap and trigger restoration. Announce settled result count and answer/error once, not token changes. Inert background and scroll lock. Native controls >=44px; theme tokens with visible focus; reduced-motion disables transitions. Verify zoom, text spacing, mobile viewport resize and Axe serious/critical issues.

## LAB targets and evidence

Five production-build samples per operation: warm open/local results median <200ms, first mixed results <1500ms under controlled fixtures, AI renderer availability <500ms, explicit contextual action <500ms. End-to-end AI response uses fixed fixture response and is a LAB proxy; it does not measure provider latency/field INP. Record first cold open separately. Initial search must not request AI renderer chunks until AI invocation. Responsive evidence at 360/390/768/1024/1280/1440/1920 across opening, mixed results, category detail, AI, empty/error and contextual action states. Light/Midnight, system preference and reduced motion covered. Actual soft-keyboard/AT and live assurance remain distinct.

## Delivery sequence

O0/O1 audit and this state model → O2/O3 search model + adapters + one surface → O4–O8 explicit text AI, navigation, privacy/race/revalidation → O9–O12 mobile/accessibility/security/LAB → O13 three-core regressions + fresh build/type/lint → evidence/report/vault update → STOP.
