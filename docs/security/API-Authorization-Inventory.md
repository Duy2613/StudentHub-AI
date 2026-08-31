# API Authorization Inventory

Generated from source by `npm run audit:api-auth` on 2026-08-31T01:48:39.031Z. This is a triage inventory, not a security certification. Dynamic ownership and data sensitivity still require human review.

- Route files: 109
- HTTP handlers: 136
- Authentication required by Security Fabric: 70
- Explicit anonymous access: 60
- No visible Security Fabric wrapper: 6
- Unprotected mutations requiring P0 review: 0

| Route | Method | Access class | Authentication | Action | Permission | Resource owner | Rate limit | Request size | Schema | Sensitive output/state | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /api/[...path] | GET | SERVICE_ONLY | none visible | — | — | public or domain-defined | none visible | 65536 bytes | manual/none | public/read-only candidate | allowlisted auth service proxy |
| /api/[...path] | POST | SERVICE_ONLY | none visible | — | — | public or domain-defined | none visible | 65536 bytes | manual/none | state mutation | allowlisted auth service proxy |
| /api/[...path] | PUT | SERVICE_ONLY | none visible | — | — | public or domain-defined | none visible | 65536 bytes | manual/none | state mutation | allowlisted auth service proxy |
| /api/[...path] | DELETE | SERVICE_ONLY | none visible | — | — | public or domain-defined | none visible | 65536 bytes | manual/none | state mutation | allowlisted auth service proxy |
| /api/[...path] | PATCH | SERVICE_ONLY | none visible | — | — | public or domain-defined | none visible | 65536 bytes | manual/none | state mutation | allowlisted auth service proxy |
| /api/[...path] | OPTIONS | SERVICE_ONLY | none visible | — | — | public or domain-defined | none visible | 65536 bytes | manual/none | public/read-only candidate | allowlisted auth service proxy |
| /api/academic/command-center | GET | AUTHENTICATED | required | READ_ACADEMIC_COMMAND_CENTER | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/decision-studio/adopt | POST | AUTHENTICATED | required | ADOPT_ACADEMIC_PLAN | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/decision-studio | POST | AUTHENTICATED | required | EVALUATE_ACADEMIC_DECISION | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/discrepancy-report | POST | AUTHENTICATED | required | REPORT_ACADEMIC_DISCREPANCY | ACADEMIC.DISCREPANCY_REPORT | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/execution/reconcile | POST | AUTHENTICATED | required | RECONCILE_ACADEMIC_EXECUTION | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/execution | GET | AUTHENTICATED | required | READ_ACADEMIC_EXECUTION | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/planner | POST | AUTHENTICATED | required | PLAN_ACADEMIC_SEMESTER | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/profile-360 | GET | AUTHENTICATED | required | READ_TRANSCRIPT | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/roadmap | GET | AUTHENTICATED | required | READ_ACADEMIC_ROADMAP | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/me/simulate | POST | AUTHENTICATED | required | SIMULATE_ACADEMIC_SCENARIO | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/notifications | GET | AUTHENTICATED | required | READ_ACADEMIC_NOTIFICATIONS | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/notifications | POST | AUTHENTICATED | required | UPDATE_ACADEMIC_NOTIFICATION | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/tasks/[taskId] | GET | AUTHENTICATED | required | READ_TASK | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/academic/tasks/[taskId] | POST | AUTHENTICATED | required | MUTATE_TASK | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/ai-trust/evidence | POST | PUBLIC | anonymous allowed | ANALYZE_TRUST_EVIDENCE | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai-trust/observatory | GET | ADMIN | required | READ_AI_OBSERVATORY | ADMIN.SECURITY | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/ai-trust/ocr | POST | PUBLIC | anonymous allowed | ANALYZE_OCR_HINTS | — | public or domain-defined | default/configured | 512 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai-trust/reasoning | POST | PUBLIC | anonymous allowed | REJECT_CLIENT_COMPOSED_TRUST_REASONING | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai-trust/reputation | POST | PUBLIC | anonymous allowed | LOOKUP_TRUST_URL_REPUTATION | — | public or domain-defined | default/configured | 32 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai-trust/screen | POST | PUBLIC | anonymous allowed | SCREEN_TRUST_INPUT | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai-trust/semantic | POST | PUBLIC | anonymous allowed | ANALYZE_TRUST_SEMANTICS | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai/trust/audit/[answerId] | GET | AUTHENTICATED | required | READ_TRUST_AUDIT | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/ai/trust/claims/[claimId] | GET | AUTHENTICATED | required | READ_TRUST_CLAIM | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/ai/trust/evaluate | POST | AUTHENTICATED | required | CREATE_TRUST_EVALUATION | TRUST.ANALYZE | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/ai/trust/evaluations/[evaluationId] | GET | AUTHENTICATED | required | READ_TRUST_EVALUATION | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/ai/trust/evidence/[evidenceId] | GET | AUTHENTICATED | required | READ_TRUST_EVIDENCE | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/ai/trust/verify-claim | POST | PUBLIC | anonymous allowed | VERIFY_TRUST_CLAIM | — | public or domain-defined | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/auth/session/exchange | POST | AUTHENTICATED | required | UPSTREAM_OIDC_EXCHANGE | — | public or domain-defined | 20/minute declared | 65536 bytes | manual/none | state mutation | explicit bootstrap/session contract |
| /api/auth/session/logout | POST | AUTHENTICATED | required | SESSION_LOGOUT | — | public or domain-defined | 60/minute declared | 0 bytes | manual/none | state mutation | explicit bootstrap/session contract |
| /api/auth/session | GET | AUTHENTICATED | required | SESSION_READ | — | authenticated principal | 120/minute declared | 0 bytes | manual/none | public/read-only candidate | explicit bootstrap/session contract |
| /api/chat | POST | AUTHENTICATED | required | CREATE_AI_CHAT_RESPONSE | — | public or domain-defined | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/community/experience/evaluate | POST | PUBLIC | anonymous allowed | ANALYZE_COMMUNITY_EXPERIENCE | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/community/experiences | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_EXPERIENCES | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/contract-check/analyze | POST | PUBLIC | anonymous allowed | ANALYZE_CONTRACT | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/expert/evaluate | POST | PUBLIC | anonymous allowed | ANALYZE_EXPERT_SCOPE | — | public or domain-defined | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/expert/graph | GET | PUBLIC | anonymous allowed | READ_EXPERT_GRAPH | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/expert/profile/[expertId] | GET | PUBLIC | anonymous allowed | READ_EXPERT_PROFILE | EXPERT.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | private/user data | contract conflict |
| /api/forum/posts | GET | PUBLIC | anonymous allowed | READ_FORUM_POSTS | — | authenticated principal | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/forum/posts | PATCH | AUTHENTICATED | required | INTERACT_WITH_COMMUNITY_POST | COMMUNITY.POST | authenticated principal | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/forum/posts | POST | AUTHENTICATED | required | CREATE_COMMUNITY_POST | COMMUNITY.POST | authenticated principal | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/forum/vote | POST | AUTHENTICATED | required | VOTE_ON_COMMUNITY_POST | COMMUNITY.POST | authenticated principal | default/configured | 16 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/claims/[claimId] | GET | PUBLIC | anonymous allowed | READ_CLAIM_DETAIL | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/intelligence/community/consensus | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_CONSENSUS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/community/evaluate | POST | PUBLIC | anonymous allowed | ANALYZE_COMMUNITY_POSTS | — | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/community/experiences/[experienceId] | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_EXPERIENCE | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/community/feedback | POST | AUTHENTICATED | required | CREATE_COMMUNITY_FEEDBACK | COMMUNITY.POST | authenticated principal | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/community/friction | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_FRICTION | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/community/posts | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_INTELLIGENCE_POSTS | — | authenticated principal | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/community/posts | POST | AUTHENTICATED | required | CREATE_COMMUNITY_INTELLIGENCE_POST | COMMUNITY.POST | authenticated principal | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/community/query | POST | PUBLIC | anonymous allowed | QUERY_COMMUNITY_KNOWLEDGE | — | public or domain-defined | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/community/reality-gaps | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_REALITY_GAPS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/community/search | GET | PUBLIC | anonymous allowed | SEARCH_COMMUNITY_POSTS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/community/topics/[topicId] | GET | PUBLIC | anonymous allowed | READ_COMMUNITY_TOPIC | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/contradictions/[claimId] | GET | PUBLIC | anonymous allowed | READ_CONTRADICTION_ANALYSIS | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/intelligence/experts/[expertId]/claims | GET | PUBLIC | anonymous allowed | READ_EXPERT_CLAIMS | — | authenticated principal | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/experts/[expertId]/claims | POST | AUTHENTICATED | required | SUBMIT_EXPERT_CLAIM_ASSESSMENT | EXPERT.EVALUATE | authenticated principal | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/experts/[expertId]/evidence | GET | PUBLIC | anonymous allowed | READ_EXPERT_EVIDENCE | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/experts/[expertId] | GET | PUBLIC | anonymous allowed | READ_EXPERT_DETAIL | EXPERT.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | potential sensitive data | contract conflict |
| /api/intelligence/experts/disagreements | GET | PUBLIC | anonymous allowed | READ_EXPERT_DISAGREEMENTS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/experts/resolve | POST | AUTHENTICATED | required | RESOLVE_EXPERT_ENTITY | EXPERT.MANAGE_GRAPH | client field / review required | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/experts | GET | PUBLIC | anonymous allowed | DISCOVER_EXPERTS | EXPERT.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/intelligence/experts/verify-claim | POST | PUBLIC | anonymous allowed | VERIFY_EXPERT_CLAIM_SCOPE | — | public or domain-defined | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/fusion/evaluate | POST | SERVICE_ONLY | required | EVALUATE_KNOWLEDGE_OBJECT | TRUST.EVALUATE | public or domain-defined | default/configured | 256 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/fusion/objects/[knowledgeObjectId]/conflicts | GET | PUBLIC | anonymous allowed | READ_KNOWLEDGE_CONFLICTS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/fusion/objects/[knowledgeObjectId]/evidence | GET | PUBLIC | anonymous allowed | READ_KNOWLEDGE_EVIDENCE | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/fusion/objects/[knowledgeObjectId]/history | GET | PUBLIC | anonymous allowed | READ_KNOWLEDGE_HISTORY | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/fusion/objects/[knowledgeObjectId] | GET | PUBLIC | anonymous allowed | READ_KNOWLEDGE_OBJECT | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/fusion/objects/[knowledgeObjectId]/unknowns | GET | PUBLIC | anonymous allowed | READ_KNOWLEDGE_UNKNOWNS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/health | GET | PUBLIC | anonymous allowed | READ_INTELLIGENCE_HEALTH | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/intelligence/recommendations | GET | AUTHENTICATED | required | READ_RECOMMENDATIONS | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/reputation/[subjectId] | GET | PUBLIC | anonymous allowed | READ_REPUTATION_PROFILE | TRUST.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/intelligence/social/early-warnings | GET | PUBLIC | anonymous allowed | READ_EARLY_WARNINGS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/social/signals | GET | PUBLIC | anonymous allowed | READ_SOCIAL_SIGNALS | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/social/signals | POST | AUTHENTICATED | required | INGEST_SOCIAL_SIGNAL | COMMUNITY.POST | public or domain-defined | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/social/sources | GET | PUBLIC | anonymous allowed | READ_SOCIAL_SOURCES | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/intelligence/social/sync | POST | ADMIN | required | EXECUTE_SOURCE_SYNC | ADMIN.SECURITY | public or domain-defined | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/intelligence/trust/[subjectId] | GET | PUBLIC | anonymous allowed | READ_TRUST_PROFILE | TRUST.READ | client field / review required | default/configured | 262144 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/marketplace/items | GET | PUBLIC | anonymous allowed | READ_MARKETPLACE_ITEMS | — | authenticated principal | default/configured | 262144 bytes | manual/none | potential sensitive data | policy declared |
| /api/marketplace/items | POST | AUTHENTICATED | required | CREATE_MARKETPLACE_ITEM | COMMUNITY.POST | authenticated principal | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/personalization/briefing | GET | AUTHENTICATED | required | READ_ACADEMIC_BRIEFING | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/command-center | GET | AUTHENTICATED | required | READ_COMMAND_CENTER | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/devices/revoke | POST | AUTHENTICATED | required | REVOKE_DEVICE | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/devices | GET | AUTHENTICATED | required | READ_DEVICES | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/devices | POST | AUTHENTICATED | required | REGISTER_DEVICE | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/digital-twin | GET | AUTHENTICATED | required | READ_DIGITAL_TWIN | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/goals | GET | AUTHENTICATED | required | READ_USER_GOALS | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/goals | POST | AUTHENTICATED | required | CREATE_USER_GOAL | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/memory | GET | AUTHENTICATED | required | READ_AI_MEMORY | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/memory | POST | AUTHENTICATED | required | PROPOSE_AI_MEMORY | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/preferences | GET | AUTHENTICATED | required | READ_PREFERENCES | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/preferences | POST | AUTHENTICATED | required | UPDATE_PREFERENCES | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/reset | POST | AUTHENTICATED | required | RESET_PERSONALIZATION | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/personalization/search | GET | AUTHENTICATED | required | UNIVERSAL_SEARCH | ACADEMIC.PLAN_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/prof-rating/professors | GET | PUBLIC | anonymous allowed | READ_PROFESSOR_REGISTRY | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/prof-rating/reviews | GET | PUBLIC | anonymous allowed | READ_PROFESSOR_REVIEWS | — | authenticated principal | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/prof-rating/reviews | POST | AUTHENTICATED | required | CREATE_PROFESSOR_REVIEW | COMMUNITY.POST | authenticated principal | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/quests/daily | GET | PUBLIC | anonymous allowed | READ_DAILY_QUESTS | — | authenticated principal | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/quests/daily | POST | AUTHENTICATED | required | SUBMIT_QUEST_COMPLETION | COMMUNITY.POST | authenticated principal | default/configured | 16 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/safety-map/reports | GET | PUBLIC | anonymous allowed | READ_SAFETY_REPORTS | — | authenticated principal | default/configured | 262144 bytes | manual/none | potential sensitive data | policy declared |
| /api/safety-map/reports | POST | AUTHENTICATED | required | CREATE_SAFETY_REPORT | COMMUNITY.POST | authenticated principal | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/scheduler/optimize | GET | PUBLIC | anonymous allowed | READ_SCHEDULE_BUNDLES | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/scheduler/optimize | POST | PUBLIC | anonymous allowed | OPTIMIZE_SCHEDULE | — | public or domain-defined | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/scholarships/list | GET | PUBLIC | anonymous allowed | READ_SCHOLARSHIP_REGISTRY | — | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/scholarships/match-profile | POST | AUTHENTICATED | required | MATCH_SCHOLARSHIP_PROFILE | — | public or domain-defined | default/configured | 32 * 1024 bytes | manual/none | private/user data | policy declared |
| /api/sos/bank-hotlines | GET | PUBLIC | anonymous allowed | READ_BANK_HOTLINES | — | public or domain-defined | default/configured | 262144 bytes | manual/none | potential sensitive data | policy declared |
| /api/sos/generate-complaint | POST | AUTHENTICATED | required | GENERATE_PRIVATE_COMPLAINT_DRAFT | — | public or domain-defined | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/student/identity | GET | AUTHENTICATED | required | READ_IDENTITY | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/student/records | GET | AUTHENTICATED | required | READ_TRANSCRIPT | ACADEMIC.READ_OWN | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/tuition-radar/verify | GET | PUBLIC | anonymous allowed | READ_TUITION_REGISTRY | — | public or domain-defined | default/configured | 262144 bytes | manual/none | potential sensitive data | policy declared |
| /api/tuition-radar/verify | POST | PUBLIC | anonymous allowed | VERIFY_TUITION_DESTINATION | — | public or domain-defined | default/configured | 32 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/users/leaderboard | GET | PUBLIC | anonymous allowed | READ_LEADERBOARD | — | client field / review required | default/configured | 262144 bytes | manual/none | potential sensitive data | policy declared |
| /api/users/profile | GET | AUTHENTICATED | required | READ_OWN_PROFILE | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/users/profile | PUT | AUTHENTICATED | required | UPDATE_OWN_PROFILE | — | authenticated principal | default/configured | 262144 bytes | manual/none | private/user data | policy declared |
| /api/users/verify-edu | POST | AUTHENTICATED | required | VERIFY_INSTITUTIONAL_EMAIL | — | client field / review required | default/configured | 262144 bytes | manual/none | state mutation | policy declared |
| /api/v1/academic | GET | AUTHENTICATED | required | READ_CANONICAL_ACADEMIC | ACADEMIC.READ_OWN | client field / review required | default/configured | 0 bytes | manual/none | private/user data | policy declared |
| /api/v1/community | GET | PUBLIC | anonymous allowed | READ_CANONICAL_COMMUNITY | — | public or domain-defined | default/configured | 0 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/community | POST | PUBLIC | anonymous allowed | QUERY_CANONICAL_COMMUNITY | — | public or domain-defined | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/v1/dashboard | GET | AUTHENTICATED | required | READ_CANONICAL_DASHBOARD | ACADEMIC.PLAN_OWN | client field / review required | default/configured | 0 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/decisions | POST | AUTHENTICATED | required | EVALUATE_STUDENT_DECISION | DECISION.EVALUATE | public or domain-defined | default/configured | 128 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/v1/demo/superflows | GET | PUBLIC | anonymous allowed | READ_COMPETITION_DEMO_SUPERFLOWS | — | public or domain-defined | default/configured | 0 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/experts | GET | PUBLIC | anonymous allowed | DISCOVER_CANONICAL_EXPERTS | EXPERT.READ | public or domain-defined | default/configured | 0 bytes | manual/none | public/read-only candidate | contract conflict |
| /api/v1/integrations/aidrive | GET | AUTHENTICATED | required | READ_AIDRIVE_SOURCE | INTEGRATION.READ | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/notifications | GET | AUTHENTICATED | required | READ_CANONICAL_NOTIFICATIONS | ACADEMIC.READ_OWN | client field / review required | default/configured | 0 bytes | manual/none | private/user data | policy declared |
| /api/v1/notifications | POST | AUTHENTICATED | required | UPDATE_CANONICAL_NOTIFICATION | ACADEMIC.PLAN_OWN | client field / review required | default/configured | 64 * 1024 bytes | manual/none | private/user data | policy declared |
| /api/v1/passports/[passportId] | GET | AUTHENTICATED | required | READ_OWN_EVIDENCE_PASSPORT | PASSPORT.READ_OWN | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/passports/[passportId] | PATCH | AUTHENTICATED | required | APPEND_OWN_EVIDENCE_PASSPORT | PASSPORT.WRITE_OWN | public or domain-defined | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/v1/passports | GET | AUTHENTICATED | required | READ_OWN_EVIDENCE_PASSPORTS | PASSPORT.READ_OWN | public or domain-defined | default/configured | 262144 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/passports | POST | AUTHENTICATED | required | CREATE_OWN_EVIDENCE_PASSPORT | PASSPORT.WRITE_OWN | public or domain-defined | default/configured | 64 * 1024 bytes | manual/none | state mutation | policy declared |
| /api/v1/search | GET | PUBLIC | anonymous allowed | SEARCH_CANONICAL_PRODUCT | — | public or domain-defined | default/configured | 0 bytes | manual/none | public/read-only candidate | policy declared |
| /api/v1/trust | POST | PUBLIC | anonymous allowed | RUN_CANONICAL_TRUST_PIPELINE | — | public or domain-defined | default/configured | 512 * 1024 bytes | manual/none | state mutation | policy declared |

## Interpretation

- `none visible` means the route itself has no Security Fabric wrapper; protection elsewhere was not assumed.
- `Access class` assigns every handler exactly one external contract: `PUBLIC`, `AUTHENTICATED`, `ADMIN`, or `SERVICE_ONLY`.
- The catch-all route is `SERVICE_ONLY`: only the four allowlisted authentication contracts may be forwarded and all other path/method pairs fail closed.
- `contract conflict` means anonymous access is enabled while a permission is declared, so the permission does not protect anonymous callers.
- `client field / review required` identifies a possible BOLA/authority boundary; it is not proof of exploitation.
- Every private or mutating handler must ultimately have schema validation, authenticated server-derived ownership, a policy decision, rate limiting, and runtime negative tests.
