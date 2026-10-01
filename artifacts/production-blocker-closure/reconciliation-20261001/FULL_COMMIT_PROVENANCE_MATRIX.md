# Full commit provenance matrix

Snapshot: 2026-10-01 (Asia/Bangkok). Main `595a99110367aefb545b02dab4b9f9a5a6106ab6`; candidate `64634319fe0f744e37b1f0fa39fbe57262ae7798`. Read-only Git/content audit of 57 local/origin refs and retained worktrees. No refs, source, migration files, database, credentials, browser sessions or providers were changed by this audit.


Scope: branch heads and ancestry/path inventory are automated. Semantic review is limited to the candidate Trust/entity deltas, current migration effects/dependencies, historic migration consumers and the completed-result reload exception; this is not a claim that every historical commit has been reviewed line by line.

| Ref | SHA | Ahead / behind candidate | Candidate relation | Migration count | Historic migration exceptions | Decision |
|---|---|---|---|---|---|---|
| `refs/heads/backend/owner-promax-completion` | `9ceb5ba7b8993e63cbcc8a43f5c42c57b2530ca8` | 0 / 64 | ANCESTOR | 3 | None | ALREADY_REACHABLE |
| `refs/heads/backend/owner-supabase-foundation` | `2c8375bf4d01243ecc5bc533953969d2cc84c27b` | 0 / 78 | ANCESTOR | 3 | None | ALREADY_REACHABLE |
| `refs/heads/backup-develop-old` | `847cce014ffc345faa5d379160f7530f0f4043fd` | 1 / 297 | DIVERGED | 0 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/checkpoint/studenthub-v5-2026-09-29` | `8c474ee0634488410a8e8ecf33551642f9bcf3f5` | 1 / 7 | DIVERGED | 26 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/codex/community-max-preview-candidate` | `ffb78732a10f27ec71ca69536a8df6b7d253ed69` | 28 / 55 | DIVERGED | 14 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql<br>202609130001_community_max_waves.sql<br>202609130002_community_max_private_rls.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/codex/foundation-1a` | `80351be4a57111d6d1ac1f518827fd5b2e81d550` | 0 / 7 | ANCESTOR | 21 | None | ALREADY_REACHABLE |
| `refs/heads/codex/main-sync-gate-20260930` | `80351be4a57111d6d1ac1f518827fd5b2e81d550` | 0 / 7 | ANCESTOR | 21 | None | ALREADY_REACHABLE |
| `refs/heads/codex/studenthub-final-unified-20260930` | `64634319fe0f744e37b1f0fa39fbe57262ae7798` | 0 / 0 | SAME_HEAD | 26 | None | KEEP_CANONICAL |
| `refs/heads/codex/studenthub-master-integration-20260930` | `8c474ee0634488410a8e8ecf33551642f9bcf3f5` | 1 / 7 | DIVERGED | 26 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/codex/trust-engine-v5-sequential-assurance` | `958b99210b2e0f4ddb9ce6eb412e819d5549f4f3` | 0 / 85 | ANCESTOR | 3 | None | ALREADY_REACHABLE |
| `refs/heads/codex/trust-render-backend` | `80351be4a57111d6d1ac1f518827fd5b2e81d550` | 0 / 7 | ANCESTOR | 21 | None | ALREADY_REACHABLE |
| `refs/heads/design/academic-cinematic-product-evolution` | `3435dea2f594651fdb91a5695ca06aec7a9d965d` | 0 / 58 | ANCESTOR | 9 | None | ALREADY_REACHABLE |
| `refs/heads/design/khai-minh-visual-phase-a` | `61842309a5c97e1f1a3d10335f45c2b5860e8d2b` | 1 / 56 | DIVERGED | 10 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/develop` | `3fe5888cbeb7a42a3cfa3f466ed4409854832eba` | 0 / 176 | ANCESTOR | 2 | None | ALREADY_REACHABLE |
| `refs/heads/feature/expert-trust-network-v3` | `6e0b9a3e08164bd9f8c5da98828dabb3d1447371` | 17 / 55 | DIVERGED | 12 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/feature/profile-backend-mvp` | `6e0b9a3e08164bd9f8c5da98828dabb3d1447371` | 17 / 55 | DIVERGED | 12 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/feature/profile-frontend-mvp` | `6e0b9a3e08164bd9f8c5da98828dabb3d1447371` | 17 / 55 | DIVERGED | 12 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/fix/trust-expert-auth-ux-20260917` | `a5e0fac0bd1580034df2a9da53606a65ec2b6a05` | 0 / 40 | ANCESTOR | 15 | None | ALREADY_REACHABLE |
| `refs/heads/fix/trust-provider-assurance-20260917` | `072137106d7cdd16bf61fef9e293693df75b8fef` | 0 / 30 | ANCESTOR | 19 | None | ALREADY_REACHABLE |
| `refs/heads/frontend/v4-three-core-redesign` | `80351be4a57111d6d1ac1f518827fd5b2e81d550` | 0 / 7 | ANCESTOR | 21 | None | ALREADY_REACHABLE |
| `refs/heads/implementation/academic-cinematic-v1-f00` | `9c1ea1a6d2c66eb3c3b8eb467b9d914a64319a23` | 1 / 42 | DIVERGED | 15 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/implementation/community-v2-ui-only` | `a5e0fac0bd1580034df2a9da53606a65ec2b6a05` | 0 / 40 | ANCESTOR | 15 | None | ALREADY_REACHABLE |
| `refs/heads/integration/citadel-i1-outbox` | `66798ee43798c7f2f990648280f2bd0758b59797` | 1 / 64 | DIVERGED | 4 | 202609040001_security_outbox.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/integration/citadel-i4-readonly-assurance` | `305ee5a2186da33881d3df22b47b68722b682895` | 4 / 64 | DIVERGED | 5 | 202609040001_security_outbox.sql<br>202609040002_security_outbox_hardening.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/integration/citadel-staging-preflight` | `3084f9fa4fc188a7421fb0db03686d6d2749f791` | 6 / 64 | DIVERGED | 5 | 202609040001_security_outbox.sql<br>202609040002_security_outbox_hardening.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/integration/friend-backend-sequential-4layer` | `3005ab4022aaeef7edf26fa44060f05b47a64223` | 4 / 85 | DIVERGED | 3 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/integration/friend-trust-4layer-final` | `b77c994a9529d7a1d7da35bb4fd6f518117da2ad` | 0 / 26 | ANCESTOR | 20 | None | ALREADY_REACHABLE |
| `refs/heads/integration/khai-minh-visual-luna` | `eac926bf9a47648572abf9bbc6b00af7fababf7a` | 5 / 55 | DIVERGED | 10 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/integration/profile-expert-mvp` | `089b2780e3affa667a1ddfff50020bcb0b1e2935` | 18 / 55 | DIVERGED | 14 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql<br>202609130001_community_max_waves.sql<br>202609130002_community_max_private_rls.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/integration/trust-own-backend-final-predict` | `db5d28eadeabd173147261f418397cead9f72445` | 0 / 23 | ANCESTOR | 20 | None | ALREADY_REACHABLE |
| `refs/heads/luna/studenthub-owner-final-staging-hardening` | `4a2a19492aac00f5b583bdf4fbf442cc246e2653` | 11 / 64 | DIVERGED | 6 | 202609040001_security_outbox.sql<br>202609040002_security_outbox_hardening.sql<br>202609040003_profile_onboarding_fields.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/heads/main` | `56568f301c06dd018040e795e3f7db0c07db4b6e` | 3 / 27 | DIVERGED | 20 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/HEAD` | `595a99110367aefb545b02dab4b9f9a5a6106ab6` | 0 / 5 | ANCESTOR | 26 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/backend/owner-promax-completion` | `9ceb5ba7b8993e63cbcc8a43f5c42c57b2530ca8` | 0 / 64 | ANCESTOR | 3 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/backend/owner-supabase-foundation` | `2c8375bf4d01243ecc5bc533953969d2cc84c27b` | 0 / 78 | ANCESTOR | 3 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/backup-develop-old` | `847cce014ffc345faa5d379160f7530f0f4043fd` | 1 / 297 | DIVERGED | 0 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/checkpoint/studenthub-v5-2026-09-29` | `8c474ee0634488410a8e8ecf33551642f9bcf3f5` | 1 / 7 | DIVERGED | 26 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/codex/community-max-preview-candidate` | `ffb78732a10f27ec71ca69536a8df6b7d253ed69` | 28 / 55 | DIVERGED | 14 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql<br>202609130001_community_max_waves.sql<br>202609130002_community_max_private_rls.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/codex/sequential-production-ready` | `fa76447f610f69456ff3e15209c1b2a18a8f0b1d` | 9 / 298 | DIVERGED | 3 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/codex/studenthub-final-unified-20260930` | `64634319fe0f744e37b1f0fa39fbe57262ae7798` | 0 / 0 | SAME_HEAD | 26 | None | KEEP_CANONICAL |
| `refs/remotes/origin/codex/trust-engine-v5-sequential-assurance` | `f96291ec9fc6f1ded6c8b519574e53c48aaa63be` | 0 / 86 | ANCESTOR | 2 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/codex/trust-render-backend` | `45ef7b39621f3cf3fc6eb2ea5918f523791a5ab7` | 0 / 19 | ANCESTOR | 21 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/design/academic-cinematic-product-evolution` | `3435dea2f594651fdb91a5695ca06aec7a9d965d` | 0 / 58 | ANCESTOR | 9 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/develop` | `eac926bf9a47648572abf9bbc6b00af7fababf7a` | 5 / 55 | DIVERGED | 10 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/feature/expert-trust-network-v3` | `dc0777ad9e26ea423a3d77284a8ad81465375ba7` | 22 / 55 | DIVERGED | 14 | 202609110001_expert_trust_network_v3.sql<br>202609110002_expert_v3_integrity_closure.sql<br>202609130001_community_max_waves.sql<br>202609130002_community_max_private_rls.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/fix/trust-provider-assurance-20260917` | `072137106d7cdd16bf61fef9e293693df75b8fef` | 0 / 30 | ANCESTOR | 19 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/genspark_ai_developer` | `477857d83b666f862178472d2d86c859d00a6f2a` | 1 / 117 | DIVERGED | 0 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/implementation/academic-cinematic-v1-f00` | `0b49fd18d30c3e40769e347c4efe7f1dff18b0fa` | 0 / 42 | ANCESTOR | 15 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/integration/citadel-i1-outbox` | `66798ee43798c7f2f990648280f2bd0758b59797` | 1 / 64 | DIVERGED | 4 | 202609040001_security_outbox.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/integration/citadel-i4-readonly-assurance` | `305ee5a2186da33881d3df22b47b68722b682895` | 4 / 64 | DIVERGED | 5 | 202609040001_security_outbox.sql<br>202609040002_security_outbox_hardening.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/integration/citadel-staging-preflight` | `3084f9fa4fc188a7421fb0db03686d6d2749f791` | 6 / 64 | DIVERGED | 5 | 202609040001_security_outbox.sql<br>202609040002_security_outbox_hardening.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/integration/friend-backend-sequential-4layer` | `3005ab4022aaeef7edf26fa44060f05b47a64223` | 4 / 85 | DIVERGED | 3 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/integration/khai-minh-visual-luna` | `eac926bf9a47648572abf9bbc6b00af7fababf7a` | 5 / 55 | DIVERGED | 10 | None | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/integration/trust-own-backend-final-predict` | `db5d28eadeabd173147261f418397cead9f72445` | 0 / 23 | ANCESTOR | 20 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/luna/studenthub-owner-final-staging-hardening` | `4a2a19492aac00f5b583bdf4fbf442cc246e2653` | 11 / 64 | DIVERGED | 6 | 202609040001_security_outbox.sql<br>202609040002_security_outbox_hardening.sql<br>202609040003_profile_onboarding_fields.sql | REVIEW_UNIQUE_CHANGES_NO_BLANKET_MERGE |
| `refs/remotes/origin/main` | `595a99110367aefb545b02dab4b9f9a5a6106ab6` | 0 / 5 | ANCESTOR | 26 | None | ALREADY_REACHABLE |
| `refs/remotes/origin/production` | `45ef7b39621f3cf3fc6eb2ea5918f523791a5ab7` | 0 / 19 | ANCESTOR | 21 | None | ALREADY_REACHABLE |

## Main-to-candidate commits

| SHA | Timestamp | Subject | Relevant disposition |
|---|---|---|---|
| `af1953147ee5b89ea9d58acdfa67c7f1416ae469` | 2026-10-01T00:12:08+07:00 | feat(studenthub): consolidate canonical three-core candidate | Retain reviewed candidate source and reports; no migration delta vs main. |
| `11bfc70945113bbe0f8ac0f25b4ba9e7f02a4067` | 2026-10-01T01:33:11+07:00 | fix(studenthub): close final assurance findings | Retain reviewed candidate source and reports; no migration delta vs main. |
| `d4da171e45aa8cc53e69b26c363fc91f00371232` | 2026-10-01T01:34:01+07:00 | docs(release): record final integration candidate SHA | Retain provenance/report checkpoint. |
| `3f00484a0ad35b9665f8f07ba0e9e0cce368b74c` | 2026-10-01T02:00:26+07:00 | fix(trust): harden entity resolution and holdout scoring | Retain reviewed candidate source and reports; no migration delta vs main. |
| `64634319fe0f744e37b1f0fa39fbe57262ae7798` | 2026-10-01T02:01:05+07:00 | docs: record entity-scoring continuation | Retain provenance/report checkpoint. |

Candidate is five commits ahead, zero behind this pinned main. No main/candidate migration file delta exists. New worktree fixes remain uncommitted and are outside the pinned candidate SHA; the final release manifest must bind them to its resulting commit.

## Historical feature provenance

| Area | Historic commit(s) | Current disposition |
|---|---|---|
| Citadel security outbox | `66798ee43798c7f2f990648280f2bd0758b59797`, `b49338bae2ce9f761614201fd73023e3f9ac0b79` | Archived optional old integration; current runtime private.integration_outbox is canonical. |
| Luna onboarding | `89d956f811078da4a347c8ff4481884ff09ccc0e` | Superseded through canonical auth + presentation migrations with a different university field model and tighter grants. |
| Expert Trust Network V3 | `bbabf87514e9201f963896cb97999e73c5c8afc6`, `af5a9817` | Old perception/progression/moderation feature model has no current schema/code consumer. Preserve history, do not reintroduce stale authority model. |
| Community Max | `089b2780e3affa667a1ddfff50020bcb0b1e2935`, `0ad110d2fda97ac4c5bba0d73aa69475a6438bc0` | Branch feature alternative; current V4.2 social/Promax repository and review bridge do not consume Max tables. |
| Completed-result Trust reload | `9c1ea1a6` | Targeted current-contract recovery requirement; old mapper/UI must not overwrite current four-layer/rich output. |

## Retained worktrees

| Worktree | HEAD | Source/database/script status count | Migration status | Decision |
|---|---|---|---|---|
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI` | `8c474ee0634488410a8e8ecf33551642f9bcf3f5` | 30 | No modified migration files | Content inventory only; preserve dirty state |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI/.worktrees/community-max-preview-candidate` | `ffb78732a10f27ec71ca69536a8df6b7d253ed69` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI/.worktrees/foundation-1a` | `80351be4a57111d6d1ac1f518827fd5b2e81d550` | 39 | No modified migration files | Content inventory only; preserve dirty state |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI/.worktrees/integration-profile-expert-mvp` | `089b2780e3affa667a1ddfff50020bcb0b1e2935` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI/.worktrees/release-main-20260916-0b49` | `0b49fd18d30c3e40769e347c4efe7f1dff18b0fa` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-ai-router-full-suite` | `2819373b8325ec5864f883ce816783461ea81637` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-candidate-56568f3` | `56568f301c06dd018040e795e3f7db0c07db4b6e` | 0 | No modified migration files | Content inventory only; preserve dirty state |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-candidate-7cb9ddf` | `7cb9ddfb7292a47724fbba74b69e7ba9828f0a5d` | 0 | No modified migration files | Content inventory only; preserve dirty state |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-candidate-ef9884a` | `d780b4293eb454f36159e124f23893d68ca5242e` | 0 | No modified migration files | Content inventory only; preserve dirty state |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-community-v2` | `a5e0fac0bd1580034df2a9da53606a65ec2b6a05` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-Expert-Test` | `eac926bf9a47648572abf9bbc6b00af7fababf7a` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-Expert-V3` | `6e0b9a3e08164bd9f8c5da98828dabb3d1447371` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-Expert-V3-F2` | `48d381375c45f6d387d8c7afea66e3ae16c978b9` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-Expert-V3-F2-VERIFY` | `48d381375c45f6d387d8c7afea66e3ae16c978b9` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-Expert-V3-F3` | `d8fc5e09e634e183936821b60d00aac763dd39ad` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-KhaiMinh-Integration` | `eac926bf9a47648572abf9bbc6b00af7fababf7a` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-KhaiMinh-Visual` | `61842309a5c97e1f1a3d10335f45c2b5860e8d2b` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-2f1ecff` | `2f1ecffa8a37c65d4eeeee2e02370e4ad484f2b2` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-487e70a` | `487e70ab81c4fa7395be8791c262f5d435ef1871` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-5fa2281` | `5fa2281d1d1a2fd467dff433beefc93b295682c8` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-77c88dd` | `77c88ddb3fa7cce0784f4c5d8a833fb975dd8283` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-9f54c8c` | `9f54c8cbdfa383b5ed19993146520ecd978803e7` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-c3e1be7` | `c3e1be7d9a3222f968d1f235891485adf6906353` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-cc42956` | `cc42956d68e4a2827827163384f38f520d06506d` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-d6d768e4` | `ee6e211b718759b723cec771405cb847509f24e8` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-final-099520f` | `099520fb577c288585cb2f4358428223f43aa3fd` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-final-39c4` | `39c4ef3b9f48e73c2b301f3e0d9856e871c04418` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-final-6adf` | `6adf5891431ad435b66d59d26bca5f85437206c6` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `C:/Users/Duy/Projects/MyProj/StudentHub-AI-release-final-otp` | `92c2669e321972b78402ad195318bbc9373d9f6b` | PATH_ABSENT | Not accessible | Prunable metadata retained; no cleanup performed |
| `D:/StudentHub-AI-main-sync-gate-20260930` | `80351be4a57111d6d1ac1f518827fd5b2e81d550` | 200 | A  database/migrations/20260926111838_community_nested_comments.sql<br>A  database/migrations/20260926112754_community_expert_request_linkage.sql<br>A  database/migrations/20260927032100_trust_four_layer_stage_constraint.sql<br>A  database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql<br>A  database/migrations/20260929135553_expert_v5_trigger_path_and_fk_indexes.sql | Content inventory only; preserve dirty state |
| `D:/StudentHub-CodexRuns/FULL_SCHEMA_SYNC_20261001/release-worktree` | `64634319fe0f744e37b1f0fa39fbe57262ae7798` | 21 | ?? database/migrations/202610010001_integration_outbox_forward_reconciliation.sql<br>?? database/migrations/202610010002_profile_presentation_check_reconciliation.sql<br>?? database/migrations/202610010003_expert_v5_event_sequence_permissions.sql | Content inventory only; preserve dirty state |
| `D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree` | `64634319fe0f744e37b1f0fa39fbe57262ae7798` | 17 | No modified migration files | Content inventory only; preserve dirty state |
