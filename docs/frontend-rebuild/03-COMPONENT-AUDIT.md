# 03 — Component Inventory and Consistency Audit

**Audit date:** 2026-09-01  
**Scope:** component directories, shells, primitives, feature surfaces, styling ownership, and state presentation.

## Inventory

The repository contains 171 files under frontend/src/components, of which 168 are JS/JSX/TS/TSX. There are 22 top-level component directories plus one root AvatarDisplay component.

| Directory | Code files | Role | Audit signal |
| --- | ---: | --- | --- |
| ui | 44 | shared primitives and visual blocks | largest primitive surface; variants need ownership |
| academic | 17 | Academic 360 feature components | valuable deferred domain; not current P0/P1 |
| ultra | 17 | showcase and experimental components | high feature-sprawl risk |
| trust | 16 | Trust layers, result panels, graph integration | strongest core foundation; multiple layer variants |
| landing | 13 | Atlas sections and product preview | distinctive visual system; separate token ownership |
| intelligence | 10 | expert/community/knowledge studio pieces | overlaps canonical pillar views |
| auth | 9 | Saffron auth and OTP pieces | separate shell and color system |
| visual | 6 | charts/visual effects | check whether data or decoration |
| layout | 5 | shell, sidebar, navbar, providers | shell duplication and responsive ownership |
| settings | 5 | account/settings UI | supporting platform |
| canvas | 4 | canvas and WebGL experiences | defer outside landing/selected story |
| expert | 3 | expert-specific store/view pieces | core, but seeded |
| community | 3 | community store/view pieces | core, but observation detail is missing |
| command | 3 | command/search UI | currently static navigation search |
| margin | 3 code files / 4 total | editorial rail and navigation | mobile strip causes canonical shell defect |
| providers | 2 | context/provider setup | boundary owner for auth/background/motion |
| home | 2 | home-specific blocks | possible legacy overlap with landing |
| fusion | 1 | fusion surface | candidate consolidation with intelligence |
| social | 1 | social feature | likely legacy/feature-sprawl |
| animations | 1 | motion helper | motion policy not centralized |
| ai | 1 | AI feature block | ownership overlaps Trust |
| competition | 1 code file / 2 total | demo case lab | explicit demo; hierarchy pending |

The exact number of files does not imply equal product importance. The more important finding is that the largest directories are split between shared primitives, deferred Academic, experimental Ultra, and multiple visual systems.

## Major component ownership

### Canonical shell

- UnifiedAppShell is the effective shell for Trust, Community, Expert, Cases, Dashboard, and Academic.
- GlobalAppShell and StudentHubOSShell are wrapper names that currently delegate to the unified shell.
- MarginRail owns desktop navigation and the mobile details strip.
- ModernNavbar and CollapsibleSidebar remain in legacy pages.
- Auth pages use the SaffronAcademicRadar/SaffronAuthDeck family rather than the canonical shell.

The result is three visual/runtime families: canonical Margin, legacy Saffron/legacy pages, and Atlas landing. A future design system can preserve personality differences, but the current boundary is not explicit enough to prevent drift.

### Trust

The Trust directory contains a layered collection: AiTrustStudioView, TrustGraph2D, pipeline/timeline pieces, verdict and telemetry panels, semantic/evidence HUDs, and benchmark/demo studios. This is useful domain depth, but it currently exposes many implementation layers to the page composition instead of one clear report hierarchy.

TrustGraph2D is a real interactive component with search, kind filtering, zoom, selected-node inspection, and a list fallback. Its node positioning is static, its filter set does not include the COMMUNITY/EXPERT tones represented by the renderer, and keyboard graph navigation is not present.

### Community and Expert

CommunityIntelligenceView owns feed filtering and card rendering; CommunityStore owns deterministic seed data. ExpertIntelligenceView owns the directory/dossier and assessment submission; ExpertStore owns deterministic seed data. Both are small and understandable, but the small component count also reflects missing detail, evidence, and contribution subflows rather than a finished system.

### Case Lab

CompetitionCaseStudio is a strong, explicit demo surface with tabs, deep-linkable fixture cases, Evidence Triangle, conflicts/unknowns, Passport events, and Decision Twin. It should become the reference for case semantics, but not be copied into Trust until ownership and state contracts are frozen.

## Duplicate primitives and variants

| Concern | Current forms | Risk |
| --- | --- | --- |
| Buttons | ui/button, TactileButton, shimmer-button, feature-local Tailwind buttons | inconsistent radius, gradient, focus, loading, and risk semantics |
| Badges | signal/status/filter chips and feature-local badges | demo, unknown, unavailable, and risk labels can acquire different colors |
| Dialogs | command dialog, Expert dossier dialog, Ultra dialogs, feature-local overlays | focus trap, close behavior, and mobile sheet behavior are not one policy |
| Tabs | Trust input mode tabs, Case Lab tabs, feature-local tab styles | role semantics and keyboard behavior differ |
| Cards | canonical app cards, Saffron cards, Atlas slabs, HUD panels, Ultra cards | visual language can become a collection of unrelated products |
| Backgrounds | Atlas image layers, Aurora, fluid, constellation, Stardust, Hero3D, shader, forcefield/canvas effects | performance and motion budget are hard to predict |
| Loading | pipeline steps, spinners, skeleton-like blocks, animate-in utilities | no single mapping from real state to UI |
| Error | typed API errors, feature-local error blocks, legacy inline errors | severity and recovery actions are inconsistent |

The recommendation is not to delete primitives now. It is to nominate one canonical primitive for each semantic job during the design-system phase and mark the others as legacy or feature-specific.

## Drift matrix

| Axis | Verified current condition | Design-system implication |
| --- | --- | --- |
| Typography | root loads four font families; Atlas also names Bodoni/Didot fallbacks; legacy/auth components use font-human and local overrides | choose one body family and one editorial/display family, then make exceptions intentional |
| Color | mineral mint, space dark, cyber indigo, saffron/amber, burnt brown, rose/red, and several semantic token families coexist | semantic status colors must be separated from page themes |
| Spacing | canonical CSS, Tailwind utilities, Atlas module spacing, and legacy layout-safe containers coexist | define a shared grid and density scale before polishing individual pages |
| Radius/border | rounded Tailwind cards, editorial slabs, HUD borders, and Saffron glass cards coexist | reduce to semantic surface families |
| Motion | Motion/Framer, GSAP, CSS transitions, animate-in utilities, and canvas motion all exist | create atmospheric/editorial/mechanical motion budgets and reduced-motion fallbacks |
| Data states | Trust has typed/partial/unknown handling; Community/Expert are mainly seeded feed/dossier states | all pillars need the same state taxonomy and provenance language |
| Icons | lucide icons are common, but some custom glyphs/visual marks are decorative | icon meaning and accessible labels need one rule |
| Shell | canonical Margin, legacy sidebar/navbar, auth shell, and Atlas landing | make shell selection a product decision rather than an import accident |

## Code-level observations relevant to the next phase

- The canonical command dialog uses autofocus but does not visibly implement focus trap or focus restoration.
- Trust input tabs use role=tab and aria-selected, but source inspection found no aria-controls or arrow-key tab navigation.
- AiTrustStudioView installs a clipboard listener in an effect without a dependency array; it cleans up, but the lifecycle is noisier than necessary and should be reviewed under the React best-practices pass.
- The mobile Margin strip is structurally rendered beside main as a flex child, so this is a layout ownership bug, not merely a card-width problem.
- The global CSS file contains later legacy sections that redefine or add tokens and components after the canonical shell rules. This makes cascade ownership difficult to reason about.

## Recommended component ownership for the design phase

    Core system
    ├── semantic tokens and state taxonomy
    ├── Button, Input, Tabs, Accordion, Dialog, Drawer/Sheet
    ├── Card, Badge, Skeleton, Empty, Error, Status
    ├── EvidenceBadge, RiskIndicator, Provenance, Metric
    └── focus, reduced-motion, and responsive primitives

    Trust domain
    ├── multimodal input and image annotation
    ├── staged processing timeline
    ├── decision / explanation / technical report
    ├── TrustGraph and list fallback
    └── Passport / revision / action

    Community domain
    ├── observation card and detail
    ├── evidence attachment and corroboration
    └── conflict / timestamp / source state

    Expert domain
    ├── directory card
    ├── authority dossier
    └── scoped assessment and review event

Everything else should be mapped to one of these owners, deferred, or clearly marked as legacy before a broad component rewrite is authorized.
