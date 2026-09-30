# Release SHA Manifest

| Ref | SHA / status |
|---|---|
| Candidate base | `af1953147ee5b89ea9d58acdfa67c7f1416ae469` |
| Integration branch | `codex/studenthub-final-unified-20260930` |
| Current integration remote SHA before this closure commit | `af1953147ee5b89ea9d58acdfa67c7f1416ae469` |
| Final integration source/audit commit | `11bfc70945113bbe0f8ac0f25b4ba9e7f02a4067` |
| Integration push | PASS to `origin/codex/studenthub-final-unified-20260930` (fast-forward) |
| `origin/main` observed before campaign | `595a99110367aefb545b02dab4b9f9a5a6106ab6` |
| `origin/main` after fresh fetch | `595a99110367aefb545b02dab4b9f9a5a6106ab6` (unchanged; candidate branch is one commit ahead before closure changes) |
| Final integration branch tip after manifest-only follow-up | Returned in the closure response; follow-up changes release metadata only |
| Deployment SHA | None for this candidate |
| Production deployment | Not requested before critical gates; no canary run |

The commit is eligible for the integration remote only. Main promotion is blocked by failed retrieval thresholds and missing staging DB credential rotation/invalidation proof. Do not interpret the base SHA's prior preview deployment as deployment of the final candidate.
