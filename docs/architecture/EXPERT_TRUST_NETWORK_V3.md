# StudentHub AI — Expert Trust Network V3 Architecture

## 1. Core Architectural Directives & Binding Invariants

The Expert Trust Network V3 reconciles peer community observations, certified domain expertise, and automated evidentiary synthesis under four non-negotiable architectural invariants:

1. **$\text{EXPERT} \neq \text{TRUST VERDICT}$**
   An expert opinion is an independent layer of human evidence. It is evaluated alongside primary registrar documentation, syllabi, official faculty announcements, and student lived experiences. It does not dictate or short-circuit the Trust Engine's objective evidence graph.

2. **$\text{STARS} \neq \text{TRUTH}$ (Authority Isolation)**
   Reputation stars (1★–5★) are purely display projections derived from historical adjudication consistency stored in `private.expert_quality_events`. A 5-star rating confers zero administrative authority and cannot bypass domain verification requirements in `private.expert_verifications`.

3. **$\text{COMMUNITY PERCEPTION} \neq \text{TRUST EVIDENCE}$**
   Community perception voting (`BELIEVE` / `DOUBT`) measures subjective student sentiment and peer alignment. Even 100 or 1,000 unanimous `BELIEVE` votes cannot alter an `UNVERIFIED` or `CONTRADICTED` Trust Engine verdict.

4. **$\text{COMMUNITY-SCOPED MODERATION}$**
   Phase-F human moderation is strictly scoped to Community content (`COMMUNITY_CONTRIBUTION`, `COMMUNITY_REACTION`, `COMMUNITY_PROFILE`). The moderation system is programmatically forbidden from targeting or mutating Trust cases, claims, or Trust runs.

---

## 2. Evidence-Based Expert Authority Pipeline

```
                                  [ Registrars / Faculty ]
                                             │
                                             ▼
                             private.expert_verifications
                             (Domain, Qualification, Dates)
                                             │
                                             ▼
                              private.expert_assignments
                                 (Assigned Case & Rev)
                                             │
                                             ▼
                               public.expert_assessments
                               (Structured Decision & Scope)
                                             │
                                             ▼
                               private.expert_quality_events
                            (Adjudication Outcome & Weight)
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
       public.expert_progression_projections         private.case_appeals
            (1★–5★ Stars, Quality Score)            (Transparent Human Review)
```

### 2.1 Adjudication Sufficiency Threshold (minSample = 20)
In accordance with Binding Amendment 2, statistical sufficiency requires at least **20 independent adjudicated units** (`sampleSize >= 20`) to exit the `INSUFFICIENT_DATA` provisional state. Any expert profile with fewer than 20 reviews remains capped at 1★ with an explicit `TẬP MẪU TẠM THỜI` disclosure.

### 2.2 Bayesian Quality Scoring
Quality scores are computed with a Bayesian Laplace beta prior ($\alpha = 2, \beta = 2$):
$$\text{Score} = \frac{\alpha + \sum \text{weight}_{\text{upheld}}}{\alpha + \beta + \sum \text{weight}_{\text{total}}}$$

---

## 3. Community Perception Signal System

Community perception votes provide a transparent reflection of student peer sentiment:
- **Revision-Aware Uniqueness**: Enforces `UNIQUE(user_id, case_id, case_revision, claim_id, contribution_id, target_type)`. If a case or claim revision is updated, community members can cast a new perception vote on the new revision.
- **Server-Derived Expert Flag**: The `voter_is_expert_at_vote` attribute is resolved strictly on the server by checking `private.expert_verifications`. Client claims of expert status are ignored.
- **Immutable Audit Trail**: All vote transitions are logged to `private.community_perception_events`.

---

## 4. Human Moderation & Transparent Appeals

Phase-F Community Moderation protects academic discourse through non-destructive remediation:
- **Target Safety Boundary**: Rejects any report targeting non-community entities with `MODERATION_TARGET_DISALLOWED`.
- **Non-Destructive Actions**:
  - `KEEP`: Content remains visible.
  - `LIMIT`: Distribution restricted.
  - `REMOVE_FROM_PUBLIC_PROJECTION`: Content hidden from public lists (`publication_state = 'MODERATED'`), preserving database rows for audit and appeals.
  - `ESCALATE`: Forwarded to faculty coordinator.
- **Transparent Appeals**: Appellants can track the status of their appeals (`public.moderation_appeals`) with clear rationale and resolution notes.

---

## 5. Security & Durable Session Revocation

Upon password update (`/reset-password`), the server-side revocation endpoint `POST /api/auth/session/revoke-all` immediately revokes all durable application sessions in `private.server_sessions` for that user across all devices, neutralizing stolen or stale session tokens.
