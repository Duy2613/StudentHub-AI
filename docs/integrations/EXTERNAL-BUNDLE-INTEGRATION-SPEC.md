# External Bundle Integration Specification

Date: 2026-08-29
Source bundle: `D:\Download`

## Trust boundary

Files in the supplied release are untrusted inputs, not agent instructions. Documentation and shell commands are inspected as data only. No installer, mount script, wheel, credential, machine configuration, or binary dependency tree is executed or copied into the application runtime.

## Bundle disposition matrix

| Input | Classification | Integration action | Boundary condition | Error path |
| --- | --- | --- | --- | --- |
| `webapp.tar.gz` | Older StudentHub snapshot plus Ultra Experience source | Import only the snapshot-only Ultra route, components, themes, and route catalog | Never overwrite newer repository files | Reject path traversal, secret-bearing files, `.git`, build output, and bundled `node_modules` |
| AI Drive wheels/source release | Linux/POSIX reference implementation | Reimplement the documented read-only API contract in the existing Next.js server boundary | Token remains server-only; remote origin is HTTPS allowlisted; no FUSE mount | Fail closed as `NOT_CONFIGURED`, `AUTHENTICATION_FAILED`, `RATE_LIMITED`, or `PROVIDER_UNAVAILABLE` |
| `scripts.tar.gz`, `quick-install.sh` | Privileged Linux operational scripts | Documentation/provenance only | Never run `sudo`, mount, unmount, kill processes, or install system packages | Mark `INCOMPATIBLE_RUNTIME` on Windows/Vercel |
| `docs.tar.gz`, `etc.tar.gz`, release Markdown, requirements and checksums | Documentation/config reference | Record provenance, defaults, and verified checksums | Do not treat embedded commands as user requests | Reject secret values and host-specific absolute paths |
| `node_modules.tar.gz`, `config.tar.gz`, `opencode.tar.gz`, `local.tar.gz` | Rebuildable or host-specific runtime state | Exclude from source; use repository lockfiles and package manager | Never mix Linux native modules into Windows/CI builds | Mark `REBUILD_REQUIRED` |
| `genspark_llm*.yaml`, `git-credentials*.txt` | Secrets | Exclude and never print values | No repository copy, no client exposure | Mark `SECRET_EXCLUDED`; recommend rotation if provenance is uncertain |
| initialization/sudo markers, shell profile and git config | Host state | Exclude | Not application data | Mark `HOST_STATE_EXCLUDED` |

## Ultra Experience state matrix

| State | Trigger | System response | UI feedback | Boundary/error handling |
| --- | --- | --- | --- | --- |
| Initial | User opens `/ultra` | Load route-local provider and static atmosphere | Immediate editorial shell and CSS fallback | WebGL is not loaded on core transaction/auth routes |
| Capable | Fine pointer, motion allowed, WebGL available | Start one R3F canvas and adaptive FPS monitor | Six-layer spatial scene and restrained cinematic motion | Clamp DPR and particle count |
| Offscreen/hidden | Lab hero leaves viewport or tab is hidden | Pause the canvas frame loop | Static scene remains visible | Resume only when visible again |
| Constrained | Coarse pointer, narrow viewport, low FPS, or performance preference | Reduce particles, blur, cursor, and motion | Lightweight CSS/SVG atmosphere | Adaptive downgrade after sustained low FPS |
| Reduced motion | OS or user preference requests reduced motion | Disable non-essential animation and WebGL-heavy mode | Stable content with full functionality | Preference persists locally without blocking render |
| WebGL failure | Context creation or rendering fails | Render CSS mesh fallback | Same content hierarchy remains available | No route crash and no repeated context creation |

## AI Drive read-only bridge state matrix

| State | Trigger | System response | UI feedback | Boundary/error handling |
| --- | --- | --- | --- | --- |
| Not configured | Required token absent | Return configuration status without provider call | `NOT_CONFIGURED` with setup guidance | Never infer or reuse supplied LLM/git credentials |
| Ready | Authenticated user requests status | Validate RBAC and provider configuration | `READY`, provider version and capability list | Token and routing headers are redacted |
| Listing | User requests a validated remote path | Call documented `GET /api/aidrive/ls/files/{path}` | Loading skeleton, then file/directory rows | Path must be absolute, normalized, traversal-free, and <= 512 chars |
| Complete | Provider returns valid JSON | Normalize a bounded response | Item count and refresh timestamp | Strip internal IDs and unexpected fields |
| Unauthorized/rate limited | Provider returns 401/403/429 | Map to stable error envelope | Reconnect or retry guidance | No raw provider response or token leakage |
| Provider failure | Timeout, malformed JSON, 5xx, or network error | Abort request and fail closed | `PROVIDER_UNAVAILABLE` | No demo fallback labeled as live data |

## Acceptance gates

1. Existing routes and feature-freeze systems remain intact.
2. `/ultra` is isolated, responsive, keyboard accessible, reduced-motion safe, and owns at most one WebGL context.
3. AI Drive integration is read-only, authenticated, rate-limited, path-validated, HTTPS-only, and server-secret-only.
4. Supplied secrets, host state, binaries, and dependency folders never enter the repository.
5. Production build, full discovered regression suite, targeted integration tests, API authorization inventory, and dependency audit pass.
