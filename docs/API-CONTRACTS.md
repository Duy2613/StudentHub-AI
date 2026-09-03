# StudentHubAI API Contracts

All new domain handlers use versioned `/api/v1` contracts where practical and return a safe error shape:

```json
{ "success": false, "error": { "code": "...", "userMessage": "...", "requestId": "...", "retryable": false } }
```

Raw stacks, provider secrets, and internal SQL are server-only.

## Canonical surfaces

| Surface | Contract | Authority |
| --- | --- | --- |
| `POST /api/v1/trust` | `trust.v1`; screen/full Layer 1→4 pipeline | public input, server-composed evidence only |
| `GET|POST /api/v1/community` | `community.v1` query/read model | public read/query; provenance remains Community |
| `GET /api/v1/experts` | `experts.v1` discovery/public DTO | public scoped discovery; verified fields server-owned |
| `GET /api/v1/academic` | `academic.v1` command-center aggregate | authenticated owner; deterministic rules |
| `GET /api/v1/dashboard` | `dashboard.v1` cross-pillar priorities | authenticated owner; no browser-supplied subject |
| `GET /api/v1/search` | `search.v1` public product search | bounded public search over redacted records |
| `GET|POST /api/v1/notifications` | `notifications.v1` list/action state machine | authenticated owner; server-owned notification state |
| `GET /api/v1/demo/superflows` | deterministic labeled competition fixtures; optional `id` | public, never live evidence |
| `POST /api/v1/decisions` | validate/evaluate/persist a non-demo Decision Twin | authenticated owner |
| `GET|POST /api/v1/passports` | list/create owner Passport | authenticated owner |
| `GET|PATCH /api/v1/passports/:passportId` | read/append a Passport event | authenticated owner |
| `GET /api/v1/integrations/aidrive` | optional read-only integration status/list/usage (`DISABLED` by default) | authenticated, `INTEGRATION.READ`; never a core dependency |
| legacy `/api/ai-trust/*`, `/api/intelligence/*`, `/api/academic/*` | compatibility contracts | route-specific SecurityFabric policy |

## Domain response principles

Trust responses distinguish `SUPPORTED`, `SUSPICIOUS`, `HIGH_RISK`, `DANGEROUS`, `DISPUTED`, `UNKNOWN`, and `INSUFFICIENT_EVIDENCE`; provider `clean/findings/unknown/error/unavailable` states are not collapsed. Academic rules return source/version/provenance and deterministic eligibility. Decision responses expose every consequence basis. Demo responses include `demo: true`, `provenance: DEMO_FIXTURE`, and a warning.

## Long-running operations

When a request cannot finish inside its runtime budget, return `runId`, truthful state/progress, and a retrievable result. Never emit fabricated provider progress or silently switch live requests to fixtures.
