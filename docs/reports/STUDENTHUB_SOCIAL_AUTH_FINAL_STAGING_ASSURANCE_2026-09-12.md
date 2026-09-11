# STUDENTHUB AI — FINAL STAGING ASSURANCE REPORT
**Date:** 2026-09-12  
**Target Branch:** `feature/expert-trust-network-v3`  
**Candidate Commit SHA:** `0004d336bb33659427b508f7dbf174aa4c66d21f`  
**Canonical Preview Alias:** [https://student-hub-ai-weje-git-feature-expert-trust-53a92e-vi-be-city.vercel.app](https://student-hub-ai-weje-git-feature-expert-trust-53a92e-vi-be-city.vercel.app)  
**Vercel Project:** `student-hub-ai-weje` (`prj_GCSn52siK8WftxefP5Lsbfn8ptkK`) under team `vi-be-city`  
**Staging Supabase Project:** `bniwtkjtramqaozrrtrk`  
**Main Supabase Project (OUT OF SCOPE):** `kytdomflmjytzyaabogi`  

---

## 1. Executive Summary & Final Verdict

| Scope | Result / Ground Truth Status | Invariant / Boundary Proof |
| :--- | :--- | :--- |
| **Final Verdict** | **`STUDENTHUB_STAGING_GOOGLE_BLOCKED`** | Google OAuth external setup required in Supabase |
| **Main Supabase Isolation** | **PASS (0 writes)** | `mainAuthWrites = 0`, `mainDbWrites = 0`, `mainStorageWrites = 0` |
| **Email/Password Auth** | **VERIFIED (API CONTRACT)** | Live signup, login, session exchange, hash storage, revocation, update verified; inbox rate-limited by SMTP |
| **Google OAuth** | **BLOCKED BY PROVIDER CONFIG** | `external.google = false` in Supabase; capability server probe disabled truthfully |
| **GitHub OAuth** | **LIVE VERIFIED CONTRACT** | `external.github = true` in Supabase; `NEXT_PUBLIC_SUPABASE_GITHUB_AUTH=true` in Preview; scope `read:user, user:email` (no repo scope); real browser redirect verified |
| **Expert Trust V3** | **VERIFIED** | Composite PK `(user_id, domain_code)`, RLS enabled on all 5 tables, direct insert blocked, server-derived expert flag |
| **Trust Hard Boundary** | **VERIFIED (100 BELIEVE)** | 100 perception votes produced **0** mutation in Trust Engine verdict (`INSUFFICIENT_EVIDENCE` -> `INSUFFICIENT_EVIDENCE`) |
| **Moderation Quorum** | **VERIFIED** | Independent quorum required for soft removal; author appeal rights strictly maintained; Trust verdict mutation = 0 |
| **Star Authority Invariant** | **VERIFIED** | `STARS != AUTHORITY`; 5-star mutation to authority = 0; minimum 20 adjudicated units required |
| **Live Web Retrieval** | **LIVE_VERIFIED** | 7/7 tests passed: SSRF gate, safe fetch SHA-256, multi-claim discovery, golden flow |
| **Discovered Regression** | **PASS (357/359)** | 357 executed passed, 0 failures, 2 external live suites passed independently |
| **Cross-Browser Matrix** | **PASS** | Chromium, Firefox, and WebKit all HTTP 200 on all 7 core routes and 390px mobile viewports |

---

## 2. Authentication & Session Security

### 2.1 Staging Supabase Provider Authority
Probing `https://bniwtkjtramqaozrrtrk.supabase.co/auth/v1/settings` using the staging publishable API key confirmed:
- `external.email = true`
- `external.github = true`
- `external.google = false`

### 2.2 Synchronized Preview Flags
- `NEXT_PUBLIC_SUPABASE_GITHUB_AUTH=true`
- `NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH=false` (per authoritative truth)
- `NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED=false`
- `DATABASE_SSL_REJECT_UNAUTHORIZED=false` (enables serverless Postgres connection to pooler)

### 2.3 Server-Authoritative Capabilities Gate (`GET /api/auth/capabilities`)
- `emailPassword`: `READY`
- `github`: `READY`
- `google`: `DISABLED` (`GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION`)
- `supabaseConfigured`: `true`
- `serverProbe.reachable`: `true`

### 2.4 Durable Opaque Session Pipeline
1. Disposable test user created in Staging Supabase.
2. Direct password authentication received valid JWT access token.
3. `POST /api/auth/session/exchange` issued opaque cookie:
   `Set-Cookie: studenthub_session=...; Path=/; HttpOnly; Secure; SameSite=Lax`
4. Direct staging DB inspection in `private.server_sessions` confirmed only the HMAC-SHA256 hash is persisted; raw session secret is never stored.
5. Tampered/forged cookies rejected with `401 (SESSION_REVOKED)`.
6. Logout cleanly purged active session in database and browser.
7. Multi-session revoke-all invalidated all active sessions upon password modification.

---

## 3. Expert V3, Community Perception & Moderation Hard Boundaries

1. **Multi-Domain Projections**: Verified composite primary key `PRIMARY KEY (user_id, domain_code)` in `expert_progression_projections`.
2. **Phase F Table RLS**: RLS verified enabled on:
   - `community_perception_events`
   - `community_perception_votes`
   - `moderation_cases`
   - `moderation_events`
   - `moderation_votes`
3. **Anti-Spoof Server Derivation**: Attempting to supply client `voter_is_expert_at_vote = true` was rejected or server-overridden to `false`. Direct authenticated inserts blocked with SQLSTATE 42501.
4. **100 BELIEVE Mutation Invariant**:
   - Trust Verdict Before: `INSUFFICIENT_EVIDENCE`
   - Injected 100 legitimate BELIEVE votes into staging DB.
   - Trust Verdict After: `INSUFFICIENT_EVIDENCE`
   - `COMMUNITY_PERCEPTION_TO_TRUST_MUTATION = 0`.
5. **Moderation Trust Boundary**:
   - Resolving moderation cases does not alter Trust Verdict: `MODERATION_TO_TRUST_MUTATION = 0`.
6. **Star Prohibition Invariant**:
   - 5-star rating never confers Expert authority or moderator privileges. Minimum 20 units required for sufficiency.

---

## 4. Static Quality, Performance & Bundle Budget

- **Typecheck (`npx tsc --noEmit`)**: 0 errors.
- **ESLint (`npm run lint`)**: 0 errors, 479 warnings.
- **Bundle Budget Audit (`PREINTERACTION_CLIENT_RSC_ENTRY_JS < 500,000 bytes`)**:
  - `/`: 272,831 B (Margin: +227,169 B)
  - `/trust`: 160,197 B (Margin: +339,803 B)
  - `/community`: 126,116 B (Margin: +373,884 B)
  - `/expert`: 126,110 B (Margin: +373,890 B)
  - `/cases`: 278,782 B (Margin: +221,218 B)
  - `/dashboard`: 158,725 B (Margin: +341,275 B)
  - `/settings`: 454,635 B (Margin: +45,365 B)
- **Secret Boundary**: Verified 0 server secrets (`DATABASE_URL`, `STUDENTHUB_SESSION_PEPPER`, Google/GitHub secrets, Service Role Key) in client bundle.

---

## 5. Cross-Browser Matrix & Accessibility

Playwright ran across all 3 rendering engines:
- **Chromium**: 7/7 core routes HTTP 200, 390px mobile viewport HTTP 200.
- **Firefox**: 7/7 core routes HTTP 200, 390px mobile viewport HTTP 200.
- **WebKit (Safari)**: 7/7 core routes HTTP 200, 390px mobile viewport HTTP 200.
- **Accessibility**: 0 critical / serious violations.

---

## 6. Discovered Hermetic Regression

Ran `node scripts/run-discovered-tests.mjs`:
- Discovered test files: **359**
- Executed: **357**
- Passed: **357**
- Failed: **0**
- Blocked by External Gate: **2** (`live_web_retrieval.test.mjs`, `real_world_live_search_golden_flow.test.mjs` — both verified 100% PASS with `STUDENTHUB_ALLOW_EXTERNAL_LIVE_TESTS=1`)
- Deterministic failures: **0**
