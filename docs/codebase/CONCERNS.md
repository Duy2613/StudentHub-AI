# Codebase Concerns

## 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|---|---|---|---|---|
| High | Live staging/provider and PostgreSQL RLS are not evidenced in this environment | staging/live test configs | Release cannot claim production integration proof | Run on approved staging/DB infrastructure |
| Medium | Remember-me persists auth material in Web Storage | `src/lib/supabase/client.js`, `auth/authService.js` | XSS would increase token theft impact | Complete server-issued HttpOnly cookie cutover |
| Medium | Academic fetch accepts a caller-supplied initial URL before redirect authority checks | `academicDocumentFetcher.js` | SSRF risk if exposed to untrusted server input | Validate protocol and allowlisted hostname before fetch |
| Medium | 359 lint warnings | lint baseline | Correctness debt can hide future regressions | Burn down by rule/domain without disabling rules |
| Medium | Very large trained-weight/data artefacts | `.codebase-scan.txt` metrics | checkout/build/cache cost | Move/version large artefacts via model storage strategy |

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|---|---|---|---|---|
| Duplicate/legacy product surfaces | Many historical vertical slices remain | `/intelligence*`, `/forum`, specialist routes | Confusing IA and maintenance load | Measure usage, converge post-RC |
| Distributed raw fetch/auth logic | Incremental growth | `src/lib/auth`, components and API callers | inconsistent error/auth behavior | migrate gradually to typed same-origin client |
| Large JS components/domain files | Feature accumulation | `src/components`, `src/lib/intelligence` | difficult reviews and state coupling | split only around measured responsibilities |
| Generated `.data` temp residue | file persistence tests/runtime | `.data/` | repository/workspace noise | ensure cleanup/ignore policy after ownership review |

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|---|---|---|---|---|
| Web Storage tokens | A07 | `authService.js`, Supabase dynamic storage | logout clears both stores; backend validates tokens | no HttpOnly-only browser session |
| Initial URL SSRF | A10 | `academicDocumentFetcher.js` | official registry and redirect validation | pre-fetch authority validation missing |
| Client-side navigation injection | A03 | `ActionCenter.jsx` | fixed with HTTP(S)/single-slash allowlist and regression test | none known in changed path |
| Production authorization | A01 | `src/lib/security`, API routes | server identity/capability services and BOLA tests | live RLS env proof pending |

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---|---|---|---|---|
| LCP 5.4–5.5 s locally | `.lighthouseci/*.report.json` | performance score 67–77 | weak first impression on slower devices | profile shared CSS/client JS and critical render path |
| Large model assets | scan metrics | tens of MB per artefact | transfer/build/memory pressure | server-load or lazy-load outside core route chunks |
| One-worker E2E | `playwright.config.ts` | slower suite, deterministic dev server | CI duration | test optimized production server or shard by isolated server |

## 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|---|---|---|---|
| `src/app/page.jsx`, `dashboard/page.jsx` | product entry surfaces | 22 / 15 recent commits | visual + navigation regression tests |
| `src/lib/auth/authService.js`, `AuthContext.jsx` | session state and two backends | 14 / 9 commits | contract tests before cookie migration |
| `src/app/globals.css` | cross-product styling | 11 recent commits | token-first, screenshot and viewport matrix |
| `package.json` / lockfile | unusually broad scripts/deps | 20 / 8 recent commits | no opportunistic upgrades; audit every change |

## 6) `[ASK USER]` Questions

1. [ASK USER] Which deployed staging URL and approved provider cases may be used for release evidence?
2. [ASK USER] Is the intended production auth endpoint a server-issued HttpOnly session cookie, Supabase persisted session, or a time-boxed hybrid migration?
3. [ASK USER] Which legacy/specialist routes have real users or judging value and therefore must survive post-RC convergence?
4. [ASK USER] Who owns secret rotation, production telemetry and PostgreSQL RLS verification?

## 7) Evidence

- `docs/codebase/.codebase-scan.txt` (scan metrics and churn; removed after documentation validation)
- `docs/frontend/RELEASE-HARDENING-BASELINE.md`
- `frontend/src/lib/auth/authService.js`
- `frontend/src/lib/intelligence/academic/academicDocumentFetcher.js`
- `frontend/playwright.config.ts`
