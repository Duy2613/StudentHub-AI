# 02 — Corrected User Flow & Information Architecture Evidence

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Claim discipline:** Current paths are `VERIFIED` where stated. Target flows are `INFERRED` product decisions and are frozen in `docs/product/SUPERFLOWS.md`; unexecuted persistence/provider behavior is explicitly marked there.

## Verified current paths

- `/trust` provides URL/text/image input, staged Trust processing, result/action rendering, provider status, related cases, graph access, and handoff affordances in the inspected code/tests.
- `/community` provides seeded feed rendering, search/topic filters, and provenance-oriented content. A complete submit/corroborate lifecycle was not executed.
- `/expert` provides seeded expert discovery and typed evaluation behavior. A live case-linked review lifecycle was not executed.
- `/cases` provides deterministic, explicitly demo-labelled competition case flows with evidence/conflict/unknown/passport-style presentation. It is not proof of live Passport persistence.
- The canonical `UnifiedAppShell` command overlay filters static navigation groups. Unified entity search across cases, observations, and experts was not executed.

## Corrected IA observations

```text
[FLOW-01] [STATUS: VERIFIED]
The current surface has a Trust flagship and separate Community/Expert routes, but duplicated `/intelligence/*` and legacy tool routes create competing entry points.
Decision: one canonical route per pillar; compatibility routes merge into the named owner.
```

```text
[FLOW-02] [STATUS: INFERRED -> FROZEN]
Trust should own the case lifecycle: input -> investigation -> report -> action. Community and Expert are typed corroboration/escalation branches, not alternate verdict engines.
```

```text
[FLOW-03] [STATUS: NOT_EXECUTED]
Live search, contribution, moderation, expert assignment, Passport persistence, and external-provider completion were not executed.
```

## Boundary

Diagrams or target requirements in earlier recon are not implementation proof. The canonical state transitions, failure semantics, unknown handling, unavailable behavior, and exit actions are defined in `docs/product/SUPERFLOWS.md` and `docs/contracts/UI_STATE_MODEL.md`.
