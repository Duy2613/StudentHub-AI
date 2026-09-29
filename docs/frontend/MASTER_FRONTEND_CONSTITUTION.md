# STUDENTHUB AI
# MASTER FRONTEND CONSTITUTION v3.0 — RATIFIED FOR IMPLEMENTATION

**Date:** 24/09/2026  
**Authority:** Highest frontend specification  
**Spec status:** FROZEN MASTER v3.0  
**Implementation status:** NOT CLAIMED — implementation must earn PASS through the gates in this document.  
**Supersedes:** Foundation 1A/1B, prior frontend master drafts, Creative Experience Engine v1, Creative Reference Layer v2 draft.  
**Change model:** Controlled amendment only (see C-34).  

> **Master thesis:** Academic Intelligence × Editorial Precision × Controlled Cinematic × Interactive Worldbuilding.

This document is the single source of truth for StudentHub AI frontend product architecture, UX, design system, app shell, motion, media, 3D/WebGL, accessibility, performance, testing, release governance, and creative-reference adoption.

If any older document conflicts with this master, this master wins.

---

# PART I — NON-NEGOTIABLES

## M-01 · Product definition

StudentHub AI is an **Academic Intelligence Platform** that helps learners:

- learn and practice;
- understand difficult material;
- verify claims and evidence;
- participate in evidence-aware discussion;
- consult qualified experts;
- use practical student tools;
- decide what to do next with better information.

It is **not** primarily:

- a generic SaaS dashboard;
- a social network;
- a game;
- an AI-chat wrapper;
- a sci-fi data dashboard;
- an Awwwards portfolio;
- a 3D demo.

Visual ambition must improve product understanding, never replace it.

## M-02 · Priority order

When requirements conflict, resolve them in this order:

1. Correctness and data honesty
2. User understanding
3. Safety and privacy
4. Accessibility
5. Core functionality
6. Information architecture
7. Performance and resilience
8. Responsive behavior
9. Visual consistency
10. Motion
11. Cinematic spectacle

A lower item never overrides a higher item.

## M-03 · Frontend truth boundary

Backend/domain data is authoritative. Frontend may summarize, group, visualize, filter, or explain data, but may not invent:

- verification results;
- confidence values;
- evidence relations;
- expert credentials;
- learning completion;
- risk levels;
- source quality;
- AI certainty.

If a backend field does not exist, the UI must not synthesize a domain score merely because a gauge, graph, or animation would look good.

## M-04 · Contract protection

Frontend redesign must not silently change:

- endpoints;
- API DTOs;
- database schema;
- authentication;
- authorization;
- Trust calculations;
- AI provider semantics;
- permissions;
- production data semantics.

A necessary contract change is a separate engineering migration with explicit approval.

## M-05 · Core app survives without creative runtime

Dashboard, Learning, Trust result, Community, Expert, Tools, Auth, Settings, Account, and all task-critical flows must remain fully usable if:

- WebGL is unavailable;
- JavaScript creative modules fail;
- cinematic media is not loaded;
- reduced motion is enabled;
- CAP-STATIC is selected.

Creative code is progressive enhancement.

---

# PART II — PRODUCT OS

## M-06 · Canonical information architecture

```text
StudentHub
│
├── Tổng quan
├── Học tập
├── Kiểm chứng
├── Cộng đồng
├── Chuyên gia
│
├── Tools
│   ├── Scholarship
│   ├── Tuition Radar
│   ├── Safety Map
│   └── SOS
│
├── StudentHub Omni
├── AI
└── Account
```

The five first-level product pillars are:

1. Tổng quan
2. Học tập
3. Kiểm chứng
4. Cộng đồng
5. Chuyên gia

**Tools** is a utility group, **AI** is a cross-product capability, **Omni** is a discovery layer, and **Account** is an identity layer.

## M-07 · Navigation source of truth

One canonical navigation schema must drive desktop and mobile renderers.

Minimum fields:

```ts
type NavigationItem = {
  id: string
  label: string
  route: string
  icon: string
  group: "core" | "tools" | "account"
  priority: number
  availability?: "public" | "authenticated" | "flagged"
  permissions?: string[]
  desktopVisibility?: boolean
  mobileVisibility?: boolean
  featureFlag?: string
}
```

No page may maintain its own competing global-navigation array.

## M-08 · Page clarity test

Every page must answer:

1. **Where am I?**
2. **What matters here?**
3. **What should I do next?**

A page that cannot answer these is not UX-complete.

## M-09 · Primary journey model

```text
Enter
→ Understand context
→ Perform task
→ Understand result
→ Decide next action
```

Features are designed around complete journeys, not isolated screenshots.

---

# PART III — CORE EXPERIENCES

## M-10 · Dashboard

Dashboard answers:

> **Điều gì quan trọng với tôi ngay bây giờ?**

Priority:

1. Today’s most important action
2. Upcoming schedule/deadline
3. Learning status
4. Items that need verification
5. Community / Expert signals

Use the correct information form:

- priority → hero action;
- schedule → timeline;
- progress → rows/meter;
- alerts → list;
- network activity → stream;
- structured comparison → table;
- card → only when containment adds meaning.

Dashboard must never degrade into a wall of same-weight cards.

## M-11 · Learning

Canonical flow:

```text
Course
→ Module
→ Lesson
→ Practice
→ Assessment
→ Review
→ Progress
```

Priority:

```text
Content > learner task > progress > contextual AI > decoration
```

Lesson surfaces are calm, readable, and low-motion.

### Focus Mode

Focus Mode may:

- reduce chrome;
- reduce notification visibility;
- suppress ambient motion;
- keep progress visible;
- keep notes accessible;
- keep AI contextual rather than dominant.

It must always provide a clear exit.

## M-12 · Trust Engine

Trust is a flagship Academic Intelligence experience.

Canonical flow:

```text
Input
→ Claim extraction
→ Evidence discovery
→ Source evaluation
→ Cross-source comparison
→ Assessment
→ Conclusion
→ Next action
```

Vietnamese UI flow:

```text
Nhập nội dung
→ Xác định nhận định
→ Tìm bằng chứng
→ Đánh giá nguồn
→ Đối chiếu
→ Kết luận
→ Bước tiếp theo
```

Trust result separates:

- Risk
- Evidence Strength
- Coverage
- Source Quality
- Agreement
- Unresolved questions
- Assessment, only if supported by backend semantics

Preferred language:

- “Bằng chứng hiện có ủng hộ…”
- “Bằng chứng còn hạn chế…”
- “Các nguồn đang mâu thuẫn…”
- “Chưa đủ thông tin để kết luận…”

Avoid unsupported certainty such as “100% đúng” or “AI xác nhận chắc chắn”.

## M-13 · TrustGraph

TrustGraph is **Advanced Evidence Explorer**, not the main answer.

Order:

```text
Conclusion
→ Reasoning summary
→ Evidence
→ Sources
→ Explore Evidence Graph
```

Graph edges and states must come from a documented data contract.

## M-14 · Community

Community optimizes for useful evidence-aware discussion, not virality.

Primary metadata may include:

- source attached;
- evidence status;
- counterarguments;
- context;
- update time.

Engagement metrics stay secondary.

Supported states may include:

- Unverified
- Evidence attached
- Reviewed
- Disputed
- Updated
- Context missing

Do not create a universal “trustworthiness score” for a person.

## M-15 · Expert

Expert profiles prioritize:

```text
Identity
→ Domain
→ Credentials
→ Scope
→ Publications / evidence
→ Assessments
→ Availability
```

Where relevant show both:

- **Can evaluate**
- **Outside stated scope**

No XP, reputation leaderboard, or gamified academic authority.

## M-16 · Tools

Tools use the common shell and design system.

Safety Map and SOS are safety-critical utility routes. They must minimize expressive code and prioritize fast, direct operation.

Functional map JavaScript is allowed; decorative/expressive creative runtime is not.

## M-17 · AI

AI is a cross-product capability used to:

- explain;
- summarize;
- tutor;
- compare;
- navigate;
- interpret evidence;
- suggest next steps.

AI is contextual and does not become the visual protagonist of every page.

AI visual semantics must never be confused with “verified”.

## M-18 · StudentHub Omni

Global search can find:

- Course
- Lesson
- Notes
- Trust results
- Sources
- Community
- Experts
- Tools
- AI conversations
- Commands

Desktop shortcut:

```text
⌘K / Ctrl K
```

Search begins simple; contextual filters appear as needed rather than loading the user with controls before a query exists.

---

# PART IV — DESIGN OS

## M-19 · Experience language

The visual system has four complementary ideas:

- **Academic Intelligence** — default product language;
- **Editorial Precision** — typography, reading, hierarchy;
- **Controlled Cinematic** — selective narrative motion/media;
- **Interactive Worldbuilding** — rare spatial/3D experiences.

The fourth layer is never a requirement for completing a core task.

## M-20 · Typography

Exactly three canonical font roles:

### Editorial / Display
**Lora Variable**

Use for:
- major H1;
- editorial titles;
- major Trust conclusion headings;
- selected academic statements;
- landing hero statements.

### Product / UI / Reading
**Be Vietnam Pro**

Use for:
- body;
- navigation;
- forms;
- buttons;
- lesson content;
- dashboards;
- tables;
- Community and Expert UI.

### Technical
**JetBrains Mono**

Use only for:
- source IDs;
- timestamps;
- code;
- keyboard shortcuts;
- technical Trust metadata;
- diagnostics.

Do not add a fourth primary font family.

## M-21 · Type scale

```text
Display XL       64–72
Display          48–56
H1               36–42
H2               28–32
H3               22–26
Title Large      20
Title            17–18
Body Large       17–18
Body             16
UI               14
Caption          12–13
Technical        12–13
```

Long-form reading target:

```text
font-size: 16–18px
line-height: 1.65–1.75
measure: 68–72ch
```

No decorative punctuation or long all-caps labels in product UI.

## M-22 · Grid

| Range | Columns | Outer margin | Gutter |
|---|---:|---:|---:|
| `<600` | 4 | 16px | 12px |
| `600–899` | 8 | 24px | 16px |
| `900–1199` | 12 | 32px | 20px |
| `1200–1599` | 12 | 40px | 24px |
| `1600+` | 12 | 48–64px | 24px |

Recommended widths:

- general app: max ~1440px;
- dashboard: ~1180–1360px;
- reading: ~680–760px;
- Trust/data workspace: may use available width.

## M-23 · Spacing

Canonical scale:

```text
4 8 12 16 20 24 32 40 48 64 80 96 128
```

Typical padding:

- compact: 16px;
- normal: 20px mobile / 24px desktop;
- feature: 28–32px;
- hero: 40–48px;
- major section separation: 72–112px.

Do not fix density by crushing padding. Remove redundant content first.

## M-24 · Density modes

- **Comfortable** — reading, lesson, notes;
- **Standard** — default product UI;
- **Dense** — tables, evidence, expert tooling.

Dense mode reduces spacing, not readability.

## M-25 · Color

### Light

```text
Canvas          #F7F9FD
Canvas Soft     #F2F5FB
Surface 1       #FFFFFF
Surface 2       #FBFCFF
Surface 3       #F4F7FC
Text Primary    #0B1424
Text Secondary  #586579
Text Tertiary   #8490A3
```

### Midnight Lab

```text
Canvas          #07101F
Canvas Soft     #0A1425
Surface 1       #0D182A
Surface 2       #111E33
Surface 3       #172640
Text Primary    #F4F8FF
Text Secondary  #A8B4C7
Text Tertiary   #748399
```

### Brand

```text
Violet          #795CFF
Cyan            #38E8FF
```

### Semantic

- Mint → verified/supporting/completed
- Amber → uncertainty/attention/caution
- Coral → risk/problem
- Red → critical/destructive
- Gold → achievement

Color never acts as the only state indicator.

Core product target balance:

```text
~85% neutral
~10% brand
~5% semantic/accent
```

## M-26 · Token architecture

Mandatory dependency direction:

```text
Primitive
→ Semantic
→ Component
```

Example:

```text
violet-500
→ action-primary
→ Button.Primary
```

Avoid hard-coded design values in feature components.

## M-27 · Surface system

Canonical surfaces:

1. Canvas
2. Paper
3. Soft
4. Elevated
5. Liquid

**Glass is a control material**, primarily for navigation, command/search chrome, media controls, floating AI controls, and temporary toolbars.

Glass is not the default material for lessons, evidence, feeds, quiz answers, or every dashboard card.

## M-28 · Metallic and glow

Liquid Metal is a rare premium accent.

Allowed:
- AI identity;
- meaningful achievement;
- premium credential;
- Knowledge Prism;
- selected Trust-processing moments.

Not allowed as the default material for:
- normal buttons;
- inputs;
- tabs;
- ordinary cards;
- tables.

Glow is reserved for state/event moments, not normal hover.

## M-29 · Radius

Canonical:

```text
8 12 16 22 28 999
```

22px is the primary Bento signature radius.

## M-30 · Borders and elevation

Border levels:

- Subtle
- Default
- Interactive
- Focus
- Critical

Elevation:

```text
0 Canvas
1 Content
2 Interactive
3 Floating
4 Modal
5 Critical overlay
```

Depth preference:

```text
contrast → border → position → shadow → glow
```

## M-31 · Bento

Bento is a hierarchy tool, not the default layout.

Use for:
- overview;
- priority blocks;
- landing;
- achievements.

Do not use as the primary structure for:
- long feeds;
- tables;
- evidence lists;
- lesson body.

## M-32 · UI noise law

Every visible object must do at least one:

1. communicate hierarchy;
2. communicate state;
3. enable action;
4. provide necessary context.

Otherwise remove it.

Forbidden by default:

- decorative slashes;
- repeated subtitles;
- random badges;
- meaningless numbering;
- orphan floating labels;
- text that repeats the same meaning in multiple places.

## M-33 · Microcopy

Prefer:

- Continue learning
- Progress
- Check evidence
- View source
- Ask AI
- Try again

Avoid product-UI marketing copy such as:

- “Embark on your journey”
- “Unlock infinite potential”
- “Discover the power of…”

---

# PART V — COMPONENT OS

## M-34 · Canonical primitives

```text
Button
IconButton
Input
Textarea
SearchInput
Select
Combobox
Checkbox
Radio
Switch
Tabs
SegmentedControl
Tooltip
Popover
DropdownMenu
Dialog
Sheet
Drawer
Badge
StatusIndicator
Tag
Avatar
Progress
Meter
Skeleton
Spinner
Toast
EmptyState
ErrorState
Table
DataTable
Pagination
```

## M-35 · StudentHub domain primitives

```text
EvidenceCard
EvidenceList
SourceCitation
SourcePreview
VerificationState
RiskIndicator
EvidenceStrength
EvidenceCoverage
SourceAgreement
TrustConclusion
LearningProgress
LessonState
AssessmentState
ExpertCredential
ExpertScope
ExpertEvidence
AIResponse
AIState
AIAction
CommunityEvidenceState
```

A domain primitive must be reusable across relevant features instead of being reimplemented under multiple names.

## M-36 · Component API

Prefer semantic, typed APIs:

```text
variant
size
state
tone
density
```

Avoid appearance-only props such as:

```text
isPurple
makeShiny
roundedBig
useCoolStyle
```

## M-37 · Interaction states

Every interactive primitive considers:

```text
Default
Hover
Pressed
Focus-visible
Selected
Loading
Success
Error
Disabled
Read-only
```

## M-38 · Form UX

Forms require:

- persistent label;
- helper only when useful;
- specific inline error;
- input preservation after error;
- clear submit/loading/success states.

Placeholder is not a replacement for a label.

## M-39 · State architecture

Every screen considers:

```text
Loading
Loaded
Empty
Partial
Error
Offline
Unauthorized
Forbidden
Stale
Refreshing
```

Do not design only the happy path.

## M-40 · Empty, error, loading

Empty state answers:

- What happened?
- Why?
- What can I do?

Errors distinguish user error, permission, network, server, unavailable service, empty result, and partial result.

Loading preference:

```text
stable shell → meaningful skeleton → progressive content
```

Avoid full-screen spinners unless truly necessary.

---

# PART VI — APP OS

## M-41 · App Shell

Desktop:

```text
Primary navigation
Top context
Main workspace
Optional contextual rail
Omni entry
AI entry
Account
```

Mobile:

```text
Top context
Main content
Bottom / floating primary navigation
Contextual sheet
```

The App Shell is functional chrome, not cinematic scenery.

## M-42 · Mobile navigation

Use approximately 4–5 primary destinations. Secondary destinations go to More/Tools/contextual sheets.

Mobile is not a compressed desktop sidebar.

## M-43 · Scrollbar and scrolling

Respect native scrolling.

Scrollbar styling, if any, remains subtle and platform-compatible.

Do not introduce global JS smooth-scroll or scroll hijacking.

Reading progress is separate from the browser scrollbar.

## M-44 · Functional iconography

Use one functional icon family consistently: Lucide **or** Phosphor.

3D icons are expressive assets, not replacements for basic Save/Edit/Delete/Back/Filter controls.

---

# PART VII — CREATIVE REFERENCE LAYER v3

## C-00 · Authority

CRL governs only:

- Academic Cinematic;
- Interactive Worldbuilding;
- WebGL/3D;
- creative media treatment;
- advanced creative motion.

It may **tighten** the Master but may not relax:

- M-02 priorities;
- WCAG 2.2 AA baseline;
- M-03 data honesty;
- M-05 progressive enhancement;
- route isolation and performance requirements.

## C-01 · Definition

CRL is:

> **Radar + Grammar + Gate**

- **Radar:** discover techniques, not sites to copy.
- **Grammar:** translate techniques into StudentHub meaning.
- **Gate:** require evidence before production adoption.

**Reference ≠ endorsement.** Every reference card records both what StudentHub may learn and what it must reject.

## C-02 · Terminology lock

| Axis | Values | Meaning |
|---|---|---|
| Layer | L1 Academic Intelligence · L2 Academic Cinematic · L3 Interactive Worldbuilding | Visual/interaction layer |
| Scroll grade | SG0 Native · SG1 Reveal · SG2 Narrative · SG3 Spatial Camera | All still use native browser scrolling |
| Pointer grade | PG0 Native · PG1 Enhanced · PG2 Cinematic | Pointer behavior |
| Transition class | TC0 Instant · TC1 Contextual · TC2 Cinematic | Route/context transition |
| Capability | CAP-FULL · CAP-BALANCED · CAP-MINIMAL · CAP-STATIC | Experience budget |
| Render tier | R-WEBGPU · R-WEBGL2 · R-LITE · R-SEQUENCE · R-POSTER | Rendering implementation |
| Gate | G1–G10 | Creative adoption gate |
| Cost | XS · S · M · L · XL | Relative creative runtime cost |

Do not use “Level 3” or “Cinematic” without the locked prefix in specs/tickets.

## C-03 · Evidence model and Reference Registry

Use **two separate axes**.

### Source provenance

- **P1 Primary** — official site/docs, author/team case study, repository, direct StudentHub observation.
- **P2 Secondary** — reputable independent reporting or standards commentary.
- **P3 Unverified** — marketing claim, inaccessible observation, rumor, unsourced gallery claim.

### Claim confidence

- **Confirmed** — directly supported by P1 evidence.
- **Corroborated** — supported by multiple credible sources.
- **Provisional** — plausible but not yet verified.

P3/Provisional claims may be research leads but cannot create Constitution-level rules.

Reference Registry is versioned separately from the frozen Constitution and re-reviewed at least every 90 days or when a reference materially changes.

## C-04 · Adoption pipeline and Creative Gate

```text
Spot
→ Analyze
→ Gate
→ Lab
→ Measure
→ Charter
→ Ship behind flag
→ Review
```

### G1 Meaning
What StudentHub meaning does the technique communicate?

### G2 Orientation
Does it improve or at least preserve orientation?

### G3 Identity
Does it strengthen StudentHub rather than imitate a reference?

### G4 Performance
Has it passed the route budget on reference devices?

### G5 Degradation
Does every lower capability/render tier remain intentional and usable?

### G6 Accessibility
Does it pass C-28?

### G7 Product fit
Is the route eligible under C-05/C-06?

### G8 IP
Is implementation clean-room or appropriately licensed?

### G9 Data honesty
Does visual meaning map to real data/state?

### G10 Measurability
Are success and kill criteria defined?

A feature may not move to production when any MUST gate is FAIL.

### IP tiers

- **T1 Idea / interaction grammar:** may be studied and restated in StudentHub’s own words.
- **T2 Explicitly licensed code:** may be used according to that artifact’s exact license and must be recorded.
- **T3 Site code, shaders, assets, models, fonts, text, video without compatible license:** do not use.

Never assume an entire website or demo ecosystem shares a single license. Verify each artifact.

### Clean-room process for signature effects

1. Analyst writes a Technique Card in original StudentHub language.
2. Implementer builds from the Technique Card, not source-site code.
3. Similarity Review compares composition, type pairing, color, timing, materials, and motion.
4. Reviewer documents deliberate differences.

## C-05 · L3 eligibility

A route may use L3 only if all MUST conditions are met:

- core task works without L3;
- information has DOM/list/2D equivalent;
- a documented hypothesis explains why spatial/3D representation adds value;
- metric and fallback are defined;
- route is not safety-critical, assessment-critical, or time-pressure critical.

SHOULD signals:

- relational/spatial data;
- deliberate exploration;
- first-impression identity;
- meaningful reward;
- learning by discovery.

Frequency is a consideration, not an absolute blocker. A frequently visited L3 route remains allowed if its core path has a robust equivalent and repeated use does not impose unnecessary cost.

## C-06 · Route Creative Matrix

| Route | Max layer | Scroll | Pointer | Transition | WebGL | Rule |
|---|---|---|---|---|---|---|
| `/` | L3 | SG3 | PG2 optional | TC2 | Yes | DOM-first; poster may be LCP |
| `/onboarding` | L2 | SG1–SG2 | PG1 | TC1 | No | No mandatory extra step; skip visible |
| `/auth/*` | L1 | SG0 | PG0 | TC0 | No | Static Prism imagery allowed |
| `/dashboard` | L1 | SG0–SG1 | PG0–PG1 | TC0 | No | Achievement overlay may be L2 |
| `/learn/*` | L1 | SG0 | PG0 | TC0 | No | Focus Mode has zero ambient motion |
| `/trust` processing | L2 | SG0–SG1 | PG0 | TC1 | Optional 2D-first | Result returns to L1 calm |
| `/trust/explorer` | L2 | SG0 | PG0 | TC1 | Scale-dependent | Prefer SVG/Canvas2D before WebGL |
| `/knowledge` | L3 | user-controlled | PG1 | TC2 in / TC0 out | Yes | 2D + list fallback mandatory |
| `/community` | L1 | SG0 | PG0 | TC0 | No | — |
| `/expert` | L1 | SG0 | PG0 | TC0 | No | — |
| `/tools/*` | L1 | SG0 | PG0 | TC0 | No | — |
| `/tools/safety-map` | L1 minimal | Native map | PG0 | TC0 | No decorative WebGL | Functional map JS allowed |
| `/tools/sos` | L1 minimal | SG0 | PG0 | TC0 | No | No decorative creative runtime |
| `/settings`, `/account` | L1 | SG0 | PG0 | TC0 | No | — |

A new route must enter this matrix before production creative work.

## C-07 · Verb Contract

StudentHub interaction thesis:

> **Knowledge is something you explore, connect, reveal, verify, progress through, and master.**

| Verb | Meaning | Valid cause | Forbidden |
|---|---|---|---|
| EXPLORE | Move through knowledge space | explicit user intent | autonomous camera in core product |
| CONNECT | Show real relation | backend/data relation | decorative fake edges |
| REVEAL | Show information in sequence | user/scroll/story state | hiding necessary information behind theatrics |
| VERIFY | Change evidence state | backend/store event | timer-based fake verification |
| PROGRESS | Evolve learning state | backend-confirmed progress | optimistic completion as fact |
| MASTER | Recognize major completion | backend-confirmed event | random rewards / coercive streak loss |

Motion requires one of:

1. user intent;
2. real domain-state change;
3. non-blocking narrative rhythm on L2/L3.

Otherwise remove it.

## C-08 · Motion families

| Family | Purpose | Typical routes | Cost | Fallback |
|---|---|---|---|---|
| A Spatial Reveal | far → near → readable | Landing, Universe | S–M | opacity + 8–16px translate |
| B Material Transformation | material reflects real state | Trust processing, achievement | M | static tone/material + label |
| C Semantic Surface Treatment | representative surface expresses evidence state | Trust processing, Universe | S | static pattern + label + icon |
| D Connected Motion | selecting one item highlights related items | TrustGraph, Universe | XS–S | static highlight/dim |
| E Progressive World | world reflects confirmed progress | Universe / learning constellation | M | progress list/meter |
| F Cinematic Transition | major context change | TC2 routes only | M–L | short cross-fade |

Normal-size text must maintain at least AA text contrast (generally 4.5:1); 3:1 is reserved for qualifying large text. Dimmed labels must not become unreadable.

## C-09 · Semantic Collision Matrix

Visual semantics must remain separable.

| Meaning | Primary cue | Secondary cue | Material family | Must not impersonate |
|---|---|---|---|---|
| AI / generated assistance | Violet/Cyan | AI label/icon | Frosted Acrylic / spectral edge | Verified |
| Verified/supporting evidence | Mint | explicit state label/check | calm Paper/Soft/Crystal accent | AI |
| Uncertain / incomplete | Amber | “Chưa đủ bằng chứng” + icon/pattern | matte/translucent | False |
| Risk/problem | Coral | risk label/icon | restrained | Destructive action |
| Destructive/critical | Red | explicit action/state | no premium effect | Reward |
| Achievement | Gold | achievement label | Liquid Metal rare | Expert authority |
| Expert credential | Neutral + restrained accent | credential/source text | Paper/Metal detail | achievement XP |

**Knowledge Prism is not a Trust “Crystal”.** Its canonical material is Frosted Acrylic + restrained Liquid Metal edge, with Violet/Cyan brand light. Verified/evidence Crystal is reserved for evidence semantics.

## C-10 · Theme parity and Brand Object Light

L3 may use **Brand Object Light**, a controlled exception to the normal glow/light limits.

Rules:

- only on L3 route hero/identity objects;
- never behind body text at a level that reduces contrast;
- no more than one dominant brand-light system per viewport;
- one secondary rim/accent permitted;
- Light and Midnight must both preserve form and edge readability;
- reduced-motion and CAP-STATIC use a baked/static equivalent;
- brand light never communicates verification.

Starting heuristics (†, validate by spike):

- background bloom opacity: ~4–12%;
- active object rim/bloom: visually restrained, not full-screen;
- keep readable content outside the brightest spectral region.

## C-11 · Transition classes

### TC0 Instant
Core navigation.

Target visual duration: ~100–180ms†.

### TC1 Contextual
Meaningful context switch, sheet-to-workspace, Trust processing stage.

Target: ~180–350ms†.

### TC2 Cinematic
Only approved L3 or major expressive context transitions.

Target: ~400–900ms† perceived, with usable shell available as early as possible.

Rules:

- no loader solely to showcase animation;
- reduced motion collapses TC1/TC2 to short cross-fade or no decorative transition;
- route exit must never be slower than user intent requires;
- focus destination must remain predictable.

## C-12 · Scroll and scene orchestration

All SG grades retain native browser scrolling.

Forbidden:

- wheel interception as the default navigation mechanism;
- mandatory virtual scroll;
- hidden browser orientation;
- repeated scroll gestures to unlock simple content.

SG2/SG3 requirements:

- DOM content remains semantically ordered;
- pinned scenes may not trap the user;
- route remains usable with reduced motion;
- resize/orientation changes rebuild scene state without losing content;
- scene state derives from scroll position or explicit user actions rather than hidden timers.

For critical learning or Trust result content use SG0.

## C-13 · Media Plane / DOM-WebGL fusion

DOM is the source of truth for:

- text;
- links;
- buttons;
- SEO-relevant content;
- accessible labels.

A WebGL plane may mirror an image/video for:

- displacement;
- refraction;
- bend;
- ripple;
- grain;
- chromatic edge.

Rules:

- the DOM media remains the fallback;
- avoid putting essential readable text into the canvas;
- interaction hit targets remain DOM when practical;
- layout is measured from DOM, not duplicated manually;
- CAP-STATIC sees the original media with intentional static treatment.

## C-14 · Semantic Surface Treatment

This replaces “semantic distortion” as a Trust semantic pattern.

Rules:

- only representative/decorative surfaces may distort, refract, grain, dissolve, or change transparency;
- source text, citation text, evidence image content, and primary conclusion remain readable and stable;
- state is driven by documented backend/store enum;
- every visual state has a label/icon/pattern equivalent;
- “unverified” means insufficient verification state, not “false”;
- Trust result remains calm L1.

Example:

```text
evidenceState: "insufficient"
→ amber outline + sparse hatch + lower surface opacity
→ label: “Chưa đủ bằng chứng”
```

Not:

```text
unverified source
→ unreadable distorted source image
```

## C-15 · Vietnamese-safe Typography Engine

Creative typography must work with Vietnamese diacritics and user text scaling.

Rules:

- segment animated characters by grapheme cluster, not UTF-16 code unit;
- prefer word/line masks for product copy;
- character cascade is landing-only;
- mask boxes include vertical overscan so Ắ, Ấ, Ễ, Ự, Ỵ are not clipped;
- outline-only text cannot be the sole readable presentation of necessary information;
- text-stroke treatment is tested on Lora at target sizes;
- copy remains selectable/semantic DOM text;
- text spacing override must not clip or lose content;
- creative type collision is L2/L3 only.

Use Appendix A before approval.

## C-16 · Editorial composition

Inspired by editorial/portfolio rhythm, not copied composition.

Allowed on L2/L3:

- asymmetrical grid;
- full-bleed media;
- deliberate overlap;
- oversized type;
- outline/solid type contrast.

Requirements:

- reading order remains logical in DOM;
- mobile becomes simpler rather than merely scaled;
- overlap never hides essential controls/content;
- contrast remains compliant;
- source-site type pairing, exact proportions, and composition are not copied.

Core app L1 defaults to regular product layout.

## C-17 · Hero system

L3 landing hero is three-layered:

```text
DOM content
↑
3D / WebGL identity object
↑
atmospheric background
```

Requirements:

- H1, value proposition, and primary CTA are DOM-first;
- CTA is usable before WebGL scene is ready;
- poster/static identity image loads independently and may serve LCP;
- 3D enhances the poster after critical content;
- scene failure never blocks navigation;
- reduced motion uses a static or minimally animated hero.

## C-18 · Knowledge Prism

Knowledge Prism is StudentHub’s primary signature identity object.

### Concept
Frosted Acrylic outer body + restrained Liquid Metal edge + Violet/Cyan internal knowledge light.

### Semantics
Represents StudentHub knowledge/intelligence, **not** verification status.

### Allowed
- Landing hero
- Onboarding still/low-motion identity
- Knowledge Universe entry
- selected branded moments

### Not allowed
- as verified icon;
- on every card;
- on Trust result as a truth indicator.

### Acceptance
- recognizable in Light and Midnight;
- readable silhouette in R-POSTER;
- no dependency on motion to identify it;
- supports CAP-STATIC;
- maintains StudentHub identity when stripped of logo text.

## C-19 · Graph and Universe data contract

No graph relationship may be created for decoration.

Suggested canonical fields:

```ts
type KnowledgeNode = {
  id: string
  type: "subject" | "concept" | "lesson" | "note" | "source" | "community" | "expert"
  label: string
  state?: string
  route?: string
  clusterId?: string
  metadata?: Record<string, unknown>
}

type KnowledgeEdge = {
  id: string
  from: string
  to: string
  relation: string
  provenance?: string
  confidence?: number
}
```

Exact schema follows backend reality.

Graph visuals must document:

- node type;
- edge relation;
- provenance;
- unresolved/missing relation semantics;
- filtering behavior.

## C-20 · Scale, LOD, mental map

Graph renderer is selected by data scale and interaction need, not visual preference.

Starting bands (†, validate with real data/device tests):

- small graph: DOM/SVG preferred;
- medium graph: SVG/Canvas2D or optimized DOM;
- large graph: Canvas/WebGL if measured need exists.

Requirements:

- layout should be stable enough to preserve mental map;
- selected/focused node has DOM mirror/inspector;
- clustering and LOD reduce noise;
- labels are prioritized, not all permanently visible;
- search can jump to a node without manual orbit;
- list/2D equivalent remains available.

Do not expose 10k nodes merely because the renderer can draw them.

## C-21 · Progressive World and gamification guardrails

World state may **reveal** learning progress but must not **lock** essential learning behind visual progression.

Rules:

- progress is backend-confirmed;
- no optimistic “mastered” state as fact;
- no randomized reward loop;
- no punitive streak-loss presentation;
- no hidden academic content required to restore a visual streak;
- private learning progress is not publicly exposed by default;
- alternative list/progress UI conveys the same information;
- achievement does not imply expert authority.

## C-22 · Achievement Cinema

Achievement animation is a short, skippable recognition moment.

Rules:

- backend-confirmed achievement only;
- queue multiple events instead of stacking overlays;
- never interrupt timed assessment, Trust conclusion reading, SOS, or critical task;
- skip/dismiss available immediately;
- typical expressive duration ~1.5–3s†;
- reduced motion uses static/short fade;
- no seizure-risk flashing;
- record shown/dismissed state if repeated interruption would be harmful;
- rate-limit non-critical celebrations.

## C-23 · Pointer, hover, touch, keyboard parity

### PG1
May include small magnetic shift (~2–6px†), responsive lighting, or hover preview.

### PG2
Custom cursor only:
- on pointer-capable expressive routes;
- optional;
- never required to understand interaction;
- disabled for core app.

Hover/focus content must be:
- dismissible where needed;
- hoverable if pointer-triggered;
- persistent while user interacts with it.

Dragging/orbit interaction must have a non-drag single-pointer alternative when it performs functionality, and keyboard-accessible navigation where applicable.

Touch may use tap controls, explicit arrows, search jump, or simplified 2D navigation.

## C-24 · Shader/effect library and effect budget

Approved effect families:

```text
grain
refraction
displacement
ripple
dissolve
chromatic edge
fresnel
soft glow
noise reveal
```

Each effect has an Effect Card with:

- purpose;
- allowed routes/layers;
- cost class;
- accessibility risks;
- fallback;
- render support;
- owner.

Effect budget:

### L1
0 expressive shaders.

### L2
Typically ≤1 dominant expressive treatment per viewport†.

### L3
1 dominant effect + 1 secondary supporting effect per viewport†.

Avoid simultaneous:
- heavy refraction;
- particles;
- parallax;
- video;
- cursor trail;
- text scramble;
- post-processing stack

unless an explicit measured charter proves it remains usable.

## C-25 · Performance Constitution for creative runtime

Core Web Vitals remain:

```text
LCP < 2.5s
INP < 200ms
CLS < 0.1
```

at p75 where field data exists.

### Creative performance principles

1. Poster/DOM shell becomes useful before 3D.
2. `<canvas>` is not relied on as the only meaningful initial visual.
3. Route code is isolated.
4. Offscreen scenes pause or reduce work.
5. Hidden tabs suspend continuous rendering.
6. Dispose GPU resources deliberately.
7. Texture upload and shader compilation are planned, not left to first interaction.
8. Context loss is recoverable.
9. One active heavy 3D scene per viewport is the default.
10. Mobile receives a conservative tier.

### Reference-device classes

Maintain at least:

- low/mid Android;
- modern Android;
- modern iPhone;
- integrated-GPU laptop;
- modern desktop GPU class.

Exact devices are recorded in the Performance Registry.

### Starting budgets († — ratify after P10.0 spike)

| Metric | L1 | L2 | L3 |
|---|---:|---:|---:|
| Creative JS on initial core route | 0 | route-lazy | route-lazy |
| Continuous decorative render loop | none | rare | allowed if measured |
| Target interactive frame time | ≤16.7ms preferred | ≤16.7–22ms | adaptive |
| Individual avoidable main-thread stall | <50ms preferred | <50ms preferred | measured / prewarmed |
| Initial L3 compressed 3D/media payload after critical shell | — | — | target ≤3MB† |
| Total first L3 experience creative payload | — | — | target ≤8–10MB† |
| Mobile critical hero poster | — | target ≤400KB† | target ≤400KB† |

These are hypotheses, not universal constants. The charter must record measured justification for exceptions.

### Glass ladder

Use the cheapest material that achieves the intent:

1. opaque/translucent PBR;
2. alpha + Fresnel fake glass;
3. limited screen-space refraction;
4. physical transmission only on validated high-capability scenes.

### Scene First Meaningful Frame

Track a StudentHub metric:

**SFMF** = time from route shell usable to the first meaningful, stable creative scene frame.

Candidate targets (†):
- modern laptop: ≤1.5s after usable shell;
- mid mobile: ≤2.5s after usable shell;
- fallback appears earlier.

### Context lifecycle

On WebGL context loss:

- stop rendering;
- keep DOM functionality;
- show static fallback if needed;
- restore/recreate GPU resources after context restored;
- record telemetry without exposing sensitive content.

## C-26 · Capability and render tiers

### Capability profiles

**CAP-FULL**
- full approved expressive layer.

**CAP-BALANCED**
- fewer particles;
- reduced blur/post-processing;
- reduced texture resolution;
- reduced render scale.

**CAP-MINIMAL**
- simple transform/opacity;
- no continuous ambient shader where unnecessary;
- lightweight 3D or sequence only.

**CAP-STATIC**
- poster/static DOM equivalent;
- no decorative WebGL.

User accessibility settings always override automatic quality selection.

### Quality preference

On L3 routes only:

- Auto
- High
- Balanced
- Low
- Effects Off

### Render tiers

**R-WEBGPU**  
Enhanced/experimental production tier only after route-specific validation.

**R-WEBGL2**  
Stable default for production 3D until WebGPU gate passes.

**R-LITE**  
Canvas2D/CSS/simple renderer.

**R-SEQUENCE**  
Pre-rendered image/video sequence.

**R-POSTER**  
Static fallback.

Three.js `WebGPURenderer` may automatically use a WebGL2 backend, but because the renderer is still documented as experimental, StudentHub does not treat it as unconditional production baseline.

### Capability selection

Do not infer “weak device” from user agent alone.

Signals may include:

- `prefers-reduced-motion`;
- user Effects preference;
- Save-Data where available;
- measured frame time;
- renderer support;
- route-specific performance probe.

No quality tier may remove core information or function.

## C-27 · Renderer and dependency decision gate

P10.0 must decide per feature:

- Three.js direct vs React Three Fiber;
- WebGLRenderer vs WebGPURenderer/TSL experiment;
- GLSL vs TSL;
- GSAP vs existing UI motion library;
- whether a heavy dependency is needed at all.

### Dependency Registry fields

```text
package
purpose
routes
version
license
bundle impact
SSR behavior
owner
fallback
approval status
```

Rules:

- one primary UI-motion solution;
- GSAP may be used for advanced timeline work when justified;
- do not install multiple animation libraries for the same role;
- physics engines require explicit functional reason;
- WASM-heavy packages require route isolation;
- raw GLSL that blocks a likely WebGPU path must be an intentional decision.

## C-28 · Creative accessibility matrix

Core baseline: **WCAG 2.2 AA**.

Creative features must explicitly test at least:

| Concern | Control |
|---|---|
| Text contrast | Normal text generally ≥4.5:1; qualifying large text ≥3:1 |
| Non-text contrast | Important controls/graphics remain perceivable |
| Text spacing | No clipping/loss when user overrides spacing |
| Hover/focus content | Dismissible, hoverable, persistent |
| Keyboard | All core functionality operable |
| Focus visible | Never remove without replacement |
| Focus not obscured | Sticky/creative overlays do not fully hide focused component |
| Moving content >5s | Pause/stop/hide mechanism unless essential |
| Flash | No seizure-risk flashing |
| Pointer gestures | Provide simple-pointer alternative where required |
| Dragging | Provide non-drag single-pointer alternative |
| Reduced motion | Remove parallax, continuous rotation, camera motion, excessive spring |
| 3D/graph | 2D/list alternative |
| Audio | User-initiated; visible controls |
| Timed achievement | Not required to read/operate; dismissible |

StudentHub internal target for important touch controls is ~44×44px where practical even when the formal minimum can be smaller.

### Ambient motion control

Any decorative motion that:
- starts automatically,
- lasts more than five seconds,
- and appears alongside other content

must expose a pause/stop/hide mechanism unless essential.

### Focus and overlays

Creative overlays must not hide keyboard focus. Use scroll padding, modal focus management, or layout changes rather than allowing focused controls to disappear behind sticky creative chrome.

## C-29 · Rendering and visual test strategy

Creative graphics require deterministic test modes.

### Deterministic mode

When test flag is enabled:

- fixed random seed;
- fixed time;
- fixed camera;
- fixed animation progress;
- fixed data fixture;
- adaptive quality disabled unless that tier is under test.

### Test layers

1. DOM semantics and function
2. static fallback screenshots
3. R-LITE screenshots
4. R-WEBGL2 representative screenshots
5. R-WEBGPU smoke/golden only where enabled
6. reduced-motion screenshots
7. Light/Midnight parity
8. mobile/desktop representative viewports

Golden comparisons use tolerances appropriate for GPU variance; do not demand byte-identical pixels.

### Required resilience tests

- WebGL unavailable;
- shader compile failure where injectable;
- `webglcontextlost`;
- context restore;
- route mount/unmount cycles;
- resize/orientation;
- background tab/resume;
- reduced motion;
- CAP-STATIC;
- Save-Data when supported;
- missing asset;
- slow texture delivery.

WebGL context-loss testing may use the `WEBGL_lose_context` extension in controlled tests.

### Leak test

Repeatedly mount/unmount creative routes and verify:

- canvases removed;
- event listeners removed;
- RAF/animation loops stopped;
- GPU resources disposed;
- object/texture counts return near baseline.

## C-30 · Telemetry, ROI, and kill criteria

Creative telemetry measures product value and cost, not vanity.

Possible events:

```text
creative_scene_requested
creative_scene_ready
creative_scene_fallback
creative_quality_selected
creative_quality_downgraded
creative_context_lost
creative_effects_disabled
knowledge_node_opened
knowledge_list_fallback_opened
```

Never include sensitive academic text, Trust input, or private conversation content in creative telemetry.

### Success metrics

Depending on feature:

- task completion;
- comprehension/wayfinding;
- Knowledge exploration success;
- first-interaction rate;
- route abandonment;
- repeated-use satisfaction;
- SFMF;
- CWV delta;
- error/fallback rate.

### Candidate kill criteria (†)

Review/disable or downgrade a creative feature when one or more persist after remediation:

- material task-completion decline;
- meaningful accessibility regression;
- p75 CWV regression outside product budget;
- context-loss/failure rate above agreed threshold;
- route abandonment clearly worsens;
- majority of eligible users immediately disable effects.

Thresholds are set per Charter; do not hard-code universal product thresholds without field evidence.

Holdout/A-B evaluation is allowed when privacy and product context make it appropriate.

## C-31 · Creative Feature Charter

No L2/L3 feature ships without a Charter.

Required fields:

```text
Feature
Owner
Route
Layer
Scroll grade
Pointer grade
Transition class
Verb
User goal
Meaning hypothesis
Backend/data contract
Reference cards
IP path
Renderer
Capability profiles
Assets
Cost class
Performance budget
Accessibility risks
Fallbacks
Reduced-motion behavior
Test plan
Telemetry
Success metric
Kill criteria
Feature flag
Approvers
Review date
```

Required approvals:

- Creative/Product Design
- Frontend/Creative Engineering
- Accessibility when C-28 risk exists
- Product/Domain owner for data semantics

## C-32 · Signature Effect Cards

### EFX-01 Knowledge Prism

**Meaning:** StudentHub knowledge/intelligence identity.  
**Layer:** L3 primary; L2 static only.  
**Allowed:** Landing, Knowledge entry, select onboarding still.  
**Fallback:** R-POSTER static Prism.  
**Reject if:** looks like generic chrome sphere or verified badge.  
**Acceptance:** recognizable silhouette, Light/Midnight parity, CAP-STATIC, CTA independent.

### EFX-02 Evidence Crystallization

**Meaning:** evidence structure becomes clearer as real processing states arrive.  
**Layer:** Trust processing L2 only.  
**Trigger:** actual processing state/events.  
**Fallback:** progress steps + calm semantic state.  
**Reject if:** implies truth before evidence is evaluated.  
**Result screen:** effect ends; result returns to L1.

### EFX-03 Learning Constellation

**Meaning:** confirmed learning relationships/progress.  
**Layer:** L2/L3 in optional exploration surfaces.  
**Fallback:** progress/list map.  
**Reject if:** locks content or publishes private progress.

### EFX-04 Semantic Surface Treatment

**Meaning:** evidence state on representative surface.  
**Layer:** L2.  
**Fallback:** pattern + label + icon.  
**Reject if:** primary evidence/source content becomes difficult to read.

### EFX-05 Academic Type Collision

**Meaning:** editorial identity and contrast of ideas.  
**Layer:** Landing L2/L3.  
**Implementation:** Lora editorial outline/solid pairing with Be Vietnam Pro product display where appropriate.  
**Fallback:** normal typographic hierarchy.  
**Reject if:** Vietnamese diacritics clip, text becomes outline-only, or composition resembles a reference too closely.

### EFX-06 Aurora Ink

**Meaning:** subtle StudentHub atmosphere.  
**Layer:** L2/L3, select L1 background only if near-static and extremely restrained.  
**Fallback:** neutral canvas.  
**Reject if:** becomes obvious gradient blob, reduces contrast, or runs expensive continuous animation in reading routes.

## C-33 · Phase mapping

The Master keeps exactly P0–P13.

```text
P0  Audit
P1  Foundation
P2  Component OS
P3  App OS
P4  Dashboard
P5  Learning
P6  Trust
P7  Community
P8  Expert
P9  Tools
P10 Expressive Layer
P11 Performance
P12 Assurance
P13 Release
```

P10 is subdivided:

```text
P10.0 Creative Lab + renderer/capability spikes
P10.1 Landing core narrative
P10.2 Motion language implementation
P10.3 Knowledge Prism
P10.4 Approved media-plane/shader effects
P10.5 Knowledge Universe
P10.6 Achievement / AI expressive moments
P10.7 Creative telemetry + cleanup
```

Accessibility, performance, responsive behavior, and regression are continuous gates from P1 onward. P11/P12 deepen and close them; they do not begin them.

## C-34 · Ratification and change control

Specification lifecycle:

```text
DRAFT
→ REVIEW
→ RATIFIED
→ AMENDED
→ DEPRECATED
```

This Master v3.0 is **RATIFIED FOR IMPLEMENTATION**.

A change to a frozen principle requires an RFC containing:

- proposed change;
- problem/evidence;
- affected sections;
- accessibility impact;
- performance impact;
- migration plan;
- rollback;
- reviewers.

Approval:
- Product/Design owner;
- Frontend/Engineering owner;
- Accessibility reviewer if relevant;
- Domain owner for Trust/Learning/Expert semantics.

Reference Registry can update without a Master version bump when it changes no canonical rule.

## C-35 · Enforcement and compliance

The goal is **Constitution as enforceable architecture**, not documentation only.

Recommended implementation artifacts:

```text
src/config/navigation.ts
src/config/creativePolicy.ts
src/styles/tokens/*
src/styles/foundation/*
src/styles/motion/*
docs/frontend/MASTER_FRONTEND_CONSTITUTION.md
docs/frontend/creative/reference-registry.md
docs/frontend/creative/third-party-creative.md
docs/frontend/creative/charters/*
docs/frontend/creative/effects/*
```

Recommended automated controls:

- lint/dependency rule preventing Three/R3F imports from L1-only route bundles;
- token lint preventing arbitrary brand/status hex values in components;
- bundle budget checks by route;
- visual regression by key route/theme/viewport;
- accessibility automation plus manual keyboard script;
- test fixture for CAP-STATIC/reduced-motion;
- WebGL context-loss test for L3 routes;
- media-registry validation;
- orphan asset check;
- navigation-schema validation.

Release checks must surface:

```text
PASS
PARTIAL
BLOCKED
DO_NOT_RELEASE
```

A visual PASS never overrides a functional/accessibility/performance blocker.

---

# PART VIII — MOTION, 3D, MEDIA

## M-45 · Motion system

Three layers:

### Functional
Buttons, tabs, focus, toggles.

Typical: ~100–200ms†.

### Structural
Sheets, dialogs, navigation/context changes.

Typical: ~180–350ms†.

### Expressive
Landing, achievement, AI moments, Trust processing, Universe.

Only on approved routes.

Preferred properties:
- opacity;
- transform;
- small scale;
- controlled clip/reveal.

Avoid:
- continuous blur;
- large parallax in product UI;
- excessive springs;
- whole-dashboard hover motion.

## M-46 · 3D subject identity

Optional “Academic Objects” may represent:

- Math → geometry/topology;
- Physics → field/orbit/vector;
- Chemistry → molecules/crystal structures;
- Biology → cell/organic structures;
- Literature → type/page forms;
- History → artifacts/timeline;
- Computing → data lattice/logic blocks.

Canonical material families:

- Soft Clay
- Frosted Acrylic
- Academic Paper
- Evidence Crystal
- Liquid Metal
- rare Holographic Film

Material meaning remains consistent with C-09.

## M-47 · Media Registry

Every major image/video/3D asset records:

```text
assetId
feature
route
purpose
source
desktopVariant
mobileVariant
poster
fallback
aspectRatio
loading
priority
alt
caption
license
owner
performanceBudget
```

No anonymous `final2-new.webp` asset culture.

## M-48 · Images

Image roles:

- instructional;
- editorial;
- subject identity;
- human/context;
- reward;
- decorative.

Decorative images use empty alternative text where appropriate.

Avoid generic stock decoration.

## M-49 · Video

Hero/LCP:
- optimized poster;
- deliberate poster priority;
- video enhancement after critical shell where appropriate.

Below fold:
- lazy.

User-initiated:
- `preload="none"` or metadata as appropriate.

Ambient:
- muted;
- optional;
- conditional;
- pausable.

No autoplay audio.

## M-50 · Audio

Audio requires user initiation and visible mute/stop state. No automatic website soundtrack.

---

# PART IX — ACCESSIBILITY, PRIVACY, SECURITY, I18N

## M-51 · Accessibility baseline

Target **WCAG 2.2 AA** across core product and creative layers.

Accessibility begins at Foundation, not at polish.

Core requirements:

- semantic HTML;
- keyboard operation;
- visible focus;
- focus not obscured;
- text contrast;
- non-text contrast;
- text-spacing resilience;
- reduced motion;
- no color-only state;
- simple alternatives for dragging/path gestures;
- accessible dialogs/sheets;
- 2D/list equivalents for spatial views;
- meaningful alt text.

## M-52 · Vietnamese and i18n

User-facing copy should be localization-ready for at least Vietnamese and English.

Use locale-aware:
- dates;
- time;
- numbers;
- pluralization where applicable.

Do not concatenate sentences from UI fragments when localization would break grammar.

Maintain a product glossary for:
- evidence;
- source;
- verification;
- risk;
- assessment;
- credential;
- lesson;
- progress.

## M-53 · Frontend privacy

Do not:
- expose secrets in client bundles;
- log raw sensitive user content without necessity;
- send Trust input or private academic text into creative analytics;
- retain debug payloads in production DOM.

## M-54 · Security hygiene

Review:
- XSS;
- markdown sanitization;
- URL sanitization;
- iframe policy;
- external link behavior;
- file-upload rendering;
- CSP compatibility;
- unsafe HTML.

`dangerouslySetInnerHTML` requires explicit sanitization rationale.

---

# PART X — PERFORMANCE AND ENGINEERING

## M-55 · Performance targets

Field targets:

```text
LCP < 2.5s
INP < 200ms
CLS < 0.1
```

at p75 where data exists.

Lab tools are evidence, not substitutes for field metrics.

## M-56 · Fonts

Maximum three canonical families.

Prefer variable fonts where beneficial; load only necessary subsets/weights.

Do not preload every font resource.

## M-57 · JS isolation

Heavy packages are route-based:

- 3D;
- advanced graph;
- editors;
- charts;
- cinematic media.

Dashboard/Lesson/Community must not download Three.js merely because Landing uses it.

## M-58 · CSS architecture

Target:

```text
styles/
├── tokens/
│   ├── primitive.css
│   ├── semantic.css
│   ├── light.css
│   └── midnight.css
├── foundation/
│   ├── reset.css
│   ├── typography.css
│   └── layout.css
│   └── accessibility.css
├── motion/
│   ├── tokens.css
│   ├── primitives.css
│   └── reduced-motion.css
├── utilities/
│   ├── surfaces.css
│   ├── containers.css
│   └── states.css
└── features/
```

Adapt names to a strong existing architecture rather than rewriting solely to match folders.

Global CSS contains only true global foundations.

## M-59 · Arbitrary-value control

Review design-only arbitrary values such as:

```text
mt-[37px]
rounded-[19px]
text-[#728196]
```

Move reusable visual decisions to tokens.

Technical geometry/aspect/math exceptions remain allowed.

## M-60 · Error isolation

Large feature failures must be contained.

Examples:
- TrustGraph failure does not blank Trust conclusion;
- 3D failure does not blank Landing;
- AI panel failure does not blank Lesson.

---

# PART XI — ANALYTICS AND PRODUCT EVIDENCE

## M-61 · Analytics

Measure useful outcomes such as:

- lesson continuation/completion;
- Trust flow completion;
- source-open rate;
- failed searches;
- empty-state frequency;
- form-error rate;
- latency;
- creative fallback rate.

Avoid analytics whose only purpose is vanity.

## M-62 · Privacy-safe events

Event taxonomy is documented and versioned.

Never send private text payloads merely to understand whether an animation was viewed.

---

# PART XII — IMPLEMENTATION PHASES

## P0 — AUDIT

Inspect:

- routes;
- layouts;
- CSS;
- tokens;
- fonts;
- navigation;
- components;
- duplicate patterns;
- creative effects;
- media;
- bundles;
- accessibility;
- performance.

Outputs:

```text
Current State Map
Migration Map
Risk Map
Baseline Metrics
```

## P1 — FOUNDATION

Implement:

- tokens;
- typography;
- color;
- grid;
- spacing;
- surfaces;
- radius;
- elevation;
- Light/Midnight;
- accessibility foundations;
- motion foundations.

## P2 — COMPONENT OS

Normalize primitives and StudentHub domain primitives.

Do not redesign all core pages before primitives are stable enough to support them.

## P3 — APP OS

Implement:

- canonical navigation;
- desktop shell;
- mobile shell;
- Omni;
- account;
- AI entry;
- Tools access;
- auth shell.

## P4 — DASHBOARD

Rebuild information hierarchy, not just styling.

## P5 — LEARNING

Unify Course, Lesson, Practice, Assessment, Notes, Progress, AI Tutor.

## P6 — TRUST

Rebuild flagship flow first. TrustGraph follows only after conclusion/evidence UX is stable.

## P7 — COMMUNITY

Evidence-aware feed, provenance, filters, states.

## P8 — EXPERT

Credential/scope-driven profiles and assessments.

## P9 — TOOLS

Migrate utilities into common Product OS and shell.

## P10 — EXPRESSIVE LAYER

Follow C-33 subphases and Creative Charters.

No L3 production work before P10.0 spikes resolve renderer, capability, budgets, fallback, and a11y strategy.

## P11 — PERFORMANCE CLOSURE

Deep route/bundle/media/GPU optimization.

## P12 — ASSURANCE

Cross-browser, cross-device, keyboard, screen-reader smoke, visual regression, authenticated flows, network/error paths, field instrumentation.

## P13 — RELEASE

Require release report, rollback path, known issues, evidence matrix, and explicit verdict.

---

# PART XIII — QUALITY GATES

## Q-01 · Every phase

Run where available:

```text
Build
Typecheck
Lint
Unit
Integration
Functional smoke
Responsive
Accessibility
Visual regression
Performance sanity
```

Unavailable gates are reported as unavailable, never silently assumed PASS.

## Q-02 · Browser matrix

At least:

- Chrome
- Firefox
- Safari/WebKit

## Q-03 · Viewport matrix

At least:

```text
360
390
768
1024
1280
1440
1920
```

plus representative real mobile devices.

## Q-04 · Definition of Ready

Before a major redesign feature:

- user goal known;
- data/API contract known;
- state model known;
- mobile behavior known;
- a11y behavior known;
- success metric known.

## Q-05 · Definition of Done

A feature is done only when:

```text
UX
+ Visual
+ Functional
+ Responsive
+ Accessibility
+ Error/empty/loading states
+ Performance
+ Regression
```

meet the required gate.

## Q-06 · Release verdicts

Allowed:

```text
PASS
PARTIAL
BLOCKED
DO_NOT_RELEASE
```

Do not claim “perfect”, “100%”, “world-class”, or “production ready” without evidence.

---

# PART XIV — GOVERNANCE

## G-01 · Design review order

Review in this sequence:

```text
Purpose
→ Information architecture
→ Hierarchy
→ Content
→ Interaction
→ Responsive
→ Accessibility
→ Visual polish
→ Motion
→ Cinematic
```

Do not begin a feature review with animation.

## G-02 · Token governance

A new token requires:
- reuse;
- semantic meaning;
- stability.

Do not create `--purple-dashboard-card-3`.

## G-03 · Component governance

Before creating a component answer:

- Does an existing component solve this?
- Is this product-wide or feature-only?
- What states exist?
- How does it behave on mobile?
- How does it behave in Midnight?
- How does keyboard interaction work?
- Does it need a new token?

## G-04 · Feature flags

Large shell/Trust/Learning/L3 changes should use a feature flag when infrastructure supports it.

Flags must have an owner and removal condition.

---

# APPENDIX A — VIETNAMESE TYPOGRAPHY TEST SET

Use these strings for clipping, mask, line-height, letter-spacing, outline, responsive, and grapheme animation tests.

## A1 · Uppercase diacritics

```text
Ă Â Đ Ê Ô Ơ Ư
Ắ Ằ Ẳ Ẵ Ặ
Ấ Ầ Ẩ Ẫ Ậ
Ế Ề Ể Ễ Ệ
Ố Ồ Ổ Ỗ Ộ
Ớ Ờ Ở Ỡ Ợ
Ứ Ừ Ử Ữ Ự
Ý Ỳ Ỷ Ỹ Ỵ
```

## A2 · Lowercase diacritics

```text
ă â đ ê ô ơ ư
ắ ằ ẳ ẵ ặ
ấ ầ ẩ ẫ ậ
ế ề ể ễ ệ
ố ồ ổ ỗ ộ
ớ ờ ở ỡ ợ
ứ ừ ử ữ ự
ý ỳ ỷ ỹ ỵ
```

## A3 · Product strings

```text
Điều gì chưa thể kết luận?
Bằng chứng hiện có chưa đủ mạnh.
Các nguồn đang đưa ra nhận định khác nhau.
Tôi muốn kiểm chứng thông tin này.
Ứng dụng trí tuệ nhân tạo trong học tập.
Tiếp tục bài học về dao động điều hòa.
Chuyên gia có thể đánh giá trong phạm vi nào?
Nguồn này đã được cập nhật lúc 18:45.
```

## A4 · Stress strings

```text
Ấm áp giữa chiều thu — người học vẫn cần hiểu rõ điều gì đáng tin.
Ứng dụng “AI” không đồng nghĩa với nội dung đã được kiểm chứng.
Từ “đúng” và “chưa đủ bằng chứng” không phải là cùng một trạng thái.
Một tiêu đề dài hơn bình thường cần xuống dòng mà không cắt dấu tiếng Việt.
```

Test with:
- default spacing;
- WCAG text-spacing overrides;
- 200% zoom;
- 320–360px narrow layout;
- Light/Midnight;
- Lora outline treatment;
- mask reveal;
- grapheme cascade where permitted.

---

# APPENDIX B — CREATIVE FEATURE CHARTER TEMPLATE

```md
# Creative Feature Charter

Feature:
Owner:
Route:
Version:
Feature flag:

## Product
User goal:
Problem:
Meaning hypothesis:
StudentHub verb:

## Policy
Layer:
Scroll grade:
Pointer grade:
Transition class:
Cost class:

## Data
Backend/store contract:
States:
What frontend MUST NOT infer:

## Reference
Reference Cards:
Technique Cards:
Similarity-review notes:

## IP
Implementation path:
Dependencies/licenses:
Third-party registry entries:

## Rendering
Renderer:
Capability profiles:
Fallback chain:
R-POSTER:
Reduced motion:

## Assets
Asset IDs:
Initial payload:
Total payload:
Texture/model notes:

## Performance
CWV risk:
SFMF target:
Frame-time target:
Reference devices:
Measured results:

## Accessibility
Keyboard:
Simple-pointer alternative:
Pause/stop/hide:
Hover/focus:
Focus obscuring:
Contrast:
Text spacing:
List/2D alternative:
Screen-reader behavior:

## Testing
Deterministic mode:
Golden tiers:
Context-loss:
Leak:
Responsive:
Theme parity:

## Telemetry
Events:
Success metric:
Kill criteria:
Review date:

## Approval
Creative/Product:
Engineering:
Accessibility:
Domain owner:
```

---

# APPENDIX C — MACHINE-READABLE CREATIVE POLICY EXAMPLE

```ts
export const creativePolicy = {
  "/": {
    maxLayer: "L3",
    scroll: "SG3",
    pointer: "PG2",
    transition: "TC2",
    webgl: true,
  },
  "/dashboard": {
    maxLayer: "L1",
    scroll: "SG1",
    pointer: "PG1",
    transition: "TC0",
    webgl: false,
  },
  "/learn/*": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
  },
  "/knowledge": {
    maxLayer: "L3",
    scroll: "SG3",
    pointer: "PG1",
    transition: "TC2",
    webgl: true,
    fallback: ["R-LITE", "R-POSTER"],
  },
} as const
```

Production implementation adapts this shape to the actual routing system.

---

# APPENDIX D — REFERENCE CARD TEMPLATE

```md
# Reference Card

ID:
Name:
Review date:
Reviewer:

## Source provenance
P1 / P2 / P3

## Claim confidence
Confirmed / Corroborated / Provisional

## Directly observed / supported
-

## What StudentHub may learn
-

## What StudentHub rejects
-

## Technique mapping
-

## Accessibility concerns
-

## Performance concerns
-

## IP notes
-

## Promotion decision
Lead / Lab / Canonical / Rejected
```

---

# APPENDIX E — THIRD-PARTY CREATIVE REGISTER TEMPLATE

```md
| Package / asset | Purpose | Source | Exact license | Version/commit | Modified? | Routes | Owner | Notice required | Status |
|---|---|---|---|---|---|---|---|---|---|
```

No dependency or creative asset reaches production without a known license path.

---

# APPENDIX F — EFFECT / PERFORMANCE REPORT TEMPLATE

```md
# Effect Report

Effect:
Charter:
Route:
Version:

## Render
Tier tested:
Capability:
Device/browser:
Viewport:
Theme:

## Payload
JS:
Model:
Texture:
Video/image:
Total:

## Timing
Shell usable:
LCP:
SFMF:
INP lab proxy:
Longest task:
Median/95p frame time:

## GPU/runtime
Draw calls:
Triangles:
Texture memory estimate:
Context losses:
Quality downgrades:

## Accessibility
Keyboard:
Reduced motion:
Pause:
Contrast:
Simple pointer:
Fallback:

## Result
PASS / PARTIAL / BLOCKED

## Follow-up
-
```

---

# APPENDIX G — REFERENCE AND STANDARDS LOG

This appendix records the evidence basis used to form CRL rules. The Registry is reviewable independently from the frozen Master.

## G1 · Why Zero / Zero University

Use as a reference for:
- interaction model as message;
- segment lifecycle;
- asset discipline;
- adaptive quality;
- real-device profiling.

Reject as default StudentHub pattern:
- mandatory virtual scroll;
- gesture gate before core content;
- text-in-canvas for primary content;
- game-like gating of ordinary product tasks.

## G2 · Robin Payot

Use as a reference for:
- DOM/WebGL experimentation;
- shader-based media treatment;
- pointer-responsive creative scenes;
- material and realtime-3D exploration;
- quality selection.

Do not copy:
- portfolio composition;
- shader source without compatible license;
- third-party game IP/assets.

## G3 · Hobro Digital

Keep as a provisional creative-reference hypothesis for:
- typography as composition;
- asymmetrical editorial rhythm;
- full-bleed media;
- minimal copy.

Do not promote unverified site-analysis claims into canonical rules without a dated StudentHub observation note.

## G4 · Awwwards / Codrops ecosystem

Use as a **radar**, not an authority on product fitness.

For any candidate site:
- inspect accessibility/semantics/performance signals;
- record what should not be inherited;
- verify each downloaded artifact’s license independently.

## G5 · W3C WCAG 2.2

Creative layer specifically applies requirements and guidance around:
- pause/stop/hide for automatic motion;
- text contrast;
- text-spacing resilience;
- content on hover/focus;
- focus not obscured;
- pointer gestures;
- dragging alternatives.

## G6 · three.js

As of the v3.0 ratification date, official three.js guidance describes `WebGPURenderer` as a next-generation renderer with WebGL2 fallback while still noting experimental status and migration limitations. StudentHub therefore keeps route-specific validation before adopting it as production baseline.

## G7 · MDN WebGL lifecycle

StudentHub tests WebGL context loss/restoration and recreates invalidated GPU resources after restoration. `WEBGL_lose_context` can be used in controlled tests.

---

# FINAL MASTER STATEMENT

StudentHub AI does not pursue Awwwards-style creativity as an end in itself.

It uses creative engineering at an international level to make learning, verification, exploration, and understanding better.

When the user needs to read a lesson at 1 AM, StudentHub becomes quiet.

When the user needs to verify a claim, StudentHub becomes precise.

When the user needs evidence, StudentHub becomes transparent.

When the user enters the Knowledge Universe, StudentHub may become spatial and cinematic.

When the user’s device, preference, accessibility setting, or network cannot support that experience, StudentHub remains complete.

The final standard is:

> **Clarity first. Evidence before spectacle. Meaning before motion. Product before portfolio.**

And the final identity is:

> **Academic Intelligence × Editorial Precision × Controlled Cinematic × Interactive Worldbuilding.**
