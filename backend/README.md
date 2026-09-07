# Backend boundary and runbook

This sequential checkout does not contain a second Express, ASP.NET or Python server. The application backend/BFF is the Next.js Route Handler at:

`frontend/src/app/api/v1/trust/route.js`

It owns request validation, Security Fabric, SSE, layer ordering, hard-stop policy, provider-error mapping and the public `trust.v5` response. The external Friend Backend is an upstream dependency consumed only by the server-side `FriendBackendAdapter`.

## Friend Backend contract

Configure the frontend with:

```dotenv
FRIEND_BACKEND_API_URL=https://studenthub-api-8fqp.onrender.com
FRIEND_BACKEND_API_KEY=
```

The URL is a deployment example from the integration brief. Verify the current owner/deployment before changing it. The adapter appends these paths:

- `POST /api/verify/layer2` — body `{ "type": "url", "content": "https://..." }`.
- `POST /api/verify/layer3` — body `{ "type": "text"|"url", "content": "..." }`.
- `POST /api/verify/layer4` — body `{ "type": "text"|"url", "content": "...", "mode": "user"|"pro"|"expert", "layer3": { ... } }`.

The expected wire fields are:

```text
Layer 2: verdict, confidence, reason, providers
Layer 3: verdict, confidence, stop, canContinueToLayer4, reason, evidence, sources
Layer 4: verdict, confidence, evidenceAgreement, sourceQuality, stop,
         canContinueToLayer4, mode, geminiModel, groqModel, reason,
         contradictoryEvidence, sources
```

Responses are schema-validated and normalized before entering the pipeline. A malformed response, timeout, 401/403, 429 or network failure is reported as `UNKNOWN/PARTIAL`; it is never treated as a positive result. L4 receives the normalized L3 evidence package and the public UI keeps L3 source origin separate from L4 independent-research sources.

## If you operate the upstream service

The upstream service needs its own secret store, separate from the frontend deployment. Depending on its implementation, that normally includes:

```dotenv
GOOGLE_SAFE_BROWSING_API_KEY=
TAVILY_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
```

Do not put these provider secrets in `NEXT_PUBLIC_*` variables or in this repository. The frontend only needs the Friend Backend base URL and, when enabled by the service, its API key.

## Local checks

Start the Next.js app from `frontend/` and check:

```powershell
Invoke-WebRequest http://localhost:3000/api/health/live
Invoke-WebRequest http://localhost:3000/api/health/ready
```

`/api/health/live` should be `200 LIVE`. `/api/health/ready` is `200 READY` only when the configured readiness requirements are available; a local environment without database/session secrets is expected to return `503 NOT_READY`.

With no `FRIEND_BACKEND_API_URL`, `POST /api/v1/trust` returns `503 FRIEND_BACKEND_NOT_CONFIGURED`. This is intentional and prevents a hidden mock or a fabricated `SAFE` result.
