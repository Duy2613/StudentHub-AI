# Cleanup Inventory

| Data / artifact class | Created or changed by this campaign | Cleanup action | Readback |
|---|---|---|---|
| Staging/production database rows | None | No DB cleanup performed or required. | No mutation occurred. |
| Auth users / roles | None | No account cleanup performed or required. | No account mutation occurred. |
| Community posts / replies / requests | Deterministic isolated browser fixtures only | Confined to disposable copied app/browser run. | No remote persistence path configured. |
| Expert rooms / answers / missions / reputation | None live | No cleanup performed; no fake state was written. | No remote persistence path configured. |
| Tavily requests | None | Not applicable; mode OFF, zero calls. | Ledger records zero. |
| Test benchmark JSON under `artifacts/` | Runner-generated modifications | Restored exact tracked artifact paths to `HEAD`; excluded from commit. | `git status` clean for those paths. |
| `frontend/next-env.d.ts`, `frontend/tsconfig.json` | Build/tool generated modifications | Restored exact tracked files to `HEAD`. | `git status` clean for those paths. |
| `.next-hermetic-*` caches | Generated local build artifacts | Left in place and ignored by a narrow generated-only `.gitignore` rule. | Not staged. |
| Isolated browser build/screenshots | Run-owned artifacts outside repository | Retained under `D:\StudentHub-CodexRuns\MASTER_INTEGRATION_20260930\run-artifacts\full-web-v4\`; not committed unless copied as a curated evidence attachment. | Run manifest identifies isolated workspace and no env files. |
| 2026-10-01 three-core browser run | 1 isolated copied build, 239 feature screenshots, Playwright result JSON/traces | Retained under `D:\StudentHub-CodexRuns\FULL_V4_THREE_CORE_20261001\2026-10-01T06-59-17-209Z-36960\`; outside the worktree; not staged. | Run manifest: PASS, scrubbed environment, no live DB/provider assurance. |
| 2026-10-01 local test suite | Test process only; no database or Auth rows | No cleanup needed. Test process had Tavily OFF/budget 0 and listed provider/database credentials unset. | `npm run test:all` passed. One synthetic URLhaus offline/timeout protocol test ran; Tavily call ledger remains zero. |

No `TRUNCATE`, database reset, broad deletion, or production mutation was performed.
