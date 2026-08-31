# 🌌 StudentHub OS — Personal Academic Operating System

> **A release-candidate, multi-audience, evidence-aware, zero-trust Personal Academic Operating System for university students, verified faculty, and academic moderators.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0_Turbopack-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24.x-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Zero-Trust Security](https://img.shields.io/badge/Security-Zero--Trust_Fabric-emerald?style=flat&logo=shield)](https://github.com/Duy2613/StudentHub-AI)
[![Tests Passing](https://img.shields.io/badge/Tests-250%2F250_Local-brightgreen?style=flat)](https://github.com/Duy2613/StudentHub-AI)

---

## Release candidate status

The current source base is frozen for competition release review. The local candidate is **`STUDENTHUBAI RC READY WITH EXTERNAL LIMITATIONS`** on `develop` at `5aeaf71870d63f3c8e06a7d8b95148ce109d3e72`.

- 250/250 discovered test files pass; final audit hardening is 6/6.
- Production build generates 115/115 routes; typecheck passes.
- Chromium, WebKit, mobile Chromium, and current visual baselines pass their documented local gates.
- Dependency audit reports 0 vulnerabilities; lint exits with 0 errors and 359 legacy warnings.
- Live PostgreSQL/RLS, staging, fresh provider credentials/terms, rollback rehearsal, and Firefox on this Windows host remain external blockers. See [`FINAL-AUDIT-REPORT.md`](FINAL-AUDIT-REPORT.md), [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md), and [`docs/KNOWN-LIMITATIONS.md`](docs/KNOWN-LIMITATIONS.md).

The worktree is intentionally preserved without a commit or push. Do not treat local fixture data or synthetic Observatory metrics as live production evidence.

---

## 🏛️ System Architecture

```text
                                STUDENTHUB OS
                                     │
                ┌────────────────────┴────────────────────┐
                │                                         │
          SECURITY FABRIC                         INTELLIGENCE FABRIC
                │                                         │
        Identity / Session                       Source Intelligence
        Authorization                            T1 Trust & Topic Reputation
        Capability                               T2 Verified Expert Network
        Purpose                                  T3 Community Claims & Consensus
        Risk & Step-up                           T4 Dual-Layer Evidence Fusion
        Durable Audit Log                        Provenance & Graph
                │                                         │
                └───────────────────┬─────────────────────┘
                                    ▼
                           DATABASE REPOSITORY LAYER
                                    │
                           PERSONAL DIGITAL TWIN
                                    │
                           PERSONALIZATION ENGINE
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
            ACADEMIC             PLANNER                 AI
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    ▼
                            PERSONAL COMMAND CENTER
                                    │
                      ┌─────────────┼─────────────┐
                      ▼             ▼             ▼
                     WEB          MOBILE        TABLET
```

---

## 🚀 Key Subsystems & Workspaces

1. **⚡ Personal Command Center (`/`)**:
   - Adaptive Academic Briefing ("What Changed Since Last Visit?").
   - Urgent operational early warnings banner.
   - Grounded Next Best Actions with 1-click explainability (`Why me?`, `Why now?`, `Căn cứ pháp lý`).

2. **🎓 Academic 360 Workspace (`/academic`)**:
   - Full authoritative transcript, GPA progression, and prerequisite mapping.
   - Graduation criteria reconciliation under university regulations (QĐ 1422/QĐ-ĐHSPKT).

3. **🧠 Connected Intelligence Fabric (`/intelligence`)**:
   - **T1**: Multidimensional Trust & Topic Reputation with half-life decay.
   - **T2**: Verified Faculty Network with PII-sanitized public DTOs.
   - **T3**: Student-reported claims, consensus metrics, and proposed corrections.
   - **T4**: Dual-layer evidence fusion resolving statutory rules against operational reality.

4. **✨ Grounded AI Studio (`/ai`)**:
   - Multi-mode AI research, planning, and explainability with explicit confidence bands and uncertainty boundaries.

5. **🛡️ Privacy, Security & Sources Center (`/settings`)**:
   - Multi-device management and remote session revocation.
   - AI Memory audit and personal data vault export controls.
   - Transparent source connector health status matrix.

---

## 🛠️ Quick Start & Local Development

### 1. Prerequisites
- Node.js >= 20.x (Recommended: Node.js 24.x)
- npm >= 10.x

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Duy2613/StudentHub-AI.git
cd StudentHub-AI

# Install dependencies
npm ci
```

### 3. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Comprehensive Automated Test Suites

StudentHub OS includes comprehensive automated test suites covering security attack simulations, durability, and multi-audience workflows:

```bash
# Run all master test suites
npm run test:all

# Run the complete discovered regression and final audit suites
npm run test:all-discovered
npm run test:final-audit

# Run specific domain suites
npm run test:security              # Zero-Trust attack simulations & BOLA checks
npm run test:p0-p1                 # BOLA/IDOR and state durability regression
npm run test:os-slices             # 4 Invariant E2E vertical slices
npm run test:db                    # Database repository persistence tests
npm run test:provip-reconstruction # Social intelligence & personalization
npm run test:intelligence-fabric   # T1–T4 Intelligence & Adversarial Matrix

# Run the primary local browser gate from frontend/
cd frontend && npx playwright test --project=chromium
```

---

## 📜 Permanent Knowledge Vault
To explore the Obsidian Permanent Knowledge Vault, run:
```bash
npm run vault
```

---

## 📄 License & Integrity
Developed for university academic intelligence and zero-trust student security. All rights reserved.
