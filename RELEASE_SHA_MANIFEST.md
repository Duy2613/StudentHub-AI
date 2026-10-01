# Release SHA Manifest

| Ref | SHA / status |
|---|---|
| Candidate base | `af1953147ee5b89ea9d58acdfa67c7f1416ae469` |
| Integration branch | `codex/studenthub-final-unified-20260930` |
| Integration remote SHA before prior 2026-09-30 source/audit commit | `af1953147ee5b89ea9d58acdfa67c7f1416ae469` |
| Final integration source/audit commit | `11bfc70945113bbe0f8ac0f25b4ba9e7f02a4067` |
| Integration push | PASS to `origin/codex/studenthub-final-unified-20260930` (fast-forward) |
| `origin/main` observed before campaign | `595a99110367aefb545b02dab4b9f9a5a6106ab6` |
| `origin/main` after fresh fetch | `595a99110367aefb545b02dab4b9f9a5a6106ab6` (unchanged; candidate branch is one commit ahead before closure changes) |
| Final integration branch tip after manifest-only follow-up | Returned in the closure response; follow-up changes release metadata only |
| Deployment SHA | None for this candidate |
| Production deployment | Not requested before critical gates; no canary run |

The commit is eligible for the integration remote only. Main promotion is blocked by failed retrieval thresholds and missing staging DB credential rotation/invalidation proof. Do not interpret the base SHA's prior preview deployment as deployment of the final candidate.

## 2026-10-01 Entity-scoring continuation

| Ref | SHA / status |
|---|---|
| Integration branch head before this continuation | `d4da171e45aa8cc53e69b26c363fc91f00371232` |
| Entity-resolution and evaluator remediation commit | `3f00484` (`fix(trust): harden entity resolution and holdout scoring`) |
| Remediation push | PASS to `origin/codex/studenthub-final-unified-20260930` (fast-forward) |
| `origin/main` after fresh fetch | `595a99110367aefb545b02dab4b9f9a5a6106ab6` (unchanged) |
| Main promotion / deployment | Not run; release blockers remain open |
| Final integration branch tip after this manifest follow-up | Returned in the closure response |

## 2026-10-01 production-only full closure

| Ref | SHA / status |
|---|---|
| Release branch | `release/studenthub-full-sync-20261001` |
| Release branch base | `origin/main` at `595a99110367aefb545b02dab4b9f9a5a6106ab6` |
| Integrated source head before closure follow-up | `64634319fe0f744e37b1f0fa39fbe57262ae7798` |
| Production deployment | `dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7`, `READY`, SHA `595a99110367aefb545b02dab4b9f9a5a6106ab6` |
| Production schema / recovery | MISMATCH: 22 tables and 6 existing-table columns missing; backup/PITR recovery evidence UNKNOWN |
| Production migration / main promotion / canary | BLOCKED; not run |
| Release branch final tip | Recorded by the pushed branch ref and closure response |
| Closure code/schema/report commit | `1d02394aabb135f8c25f58eb447751a242f4a610` |
| Release branch push | PASS; `git ls-remote` matched this source commit at push time |
| Vercel preview for closure source commit | QUEUED (`target=null`); not production deployment evidence |
| GitHub Actions for release branch | No run returned at check time; not a CI pass |
