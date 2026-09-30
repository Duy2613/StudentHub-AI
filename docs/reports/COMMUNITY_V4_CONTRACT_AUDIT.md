# Community V4 Contract Audit — C0

**Status:** Historical C0 evidence captured; post-C0 implementation and remaining gate findings are tracked in COMMUNITY_V4_DOMAIN_GAP_LOG.md.
**Authority:** Master Frontend Constitution v4.0 Three-Core, compatible CRL v2.0 A-01, Community V4 Maximum Hardened Runbook v3.0.
**Review scope:** Existing route, DTO, API, persistence, authorization, privacy, Trust, Expert, realtime, and interaction contracts. No endpoint or state was inferred from presentation copy.

## Active route and render path

At C0, /community rendered CommunityWorkspaceClient → CommunitySocialWorkspace inside UnifiedAppShell, but the feed read /api/community/social and silently fell back to /api/forum/posts. The richer CommunityRepository contribution model was not used by the active route.

### Post-C0 execution update — 2026-09-26

The active /community feed and /community/[postId] detail now use the canonical /api/intelligence/community/posts contribution contract. Search uses /api/intelligence/community/search; there is no legacy-store fallback. The rebuilt composer reads only owner-visible Trust cases and evidence, requests a server privacy preview, and requires digest-bound explicit confirmation before publishing a redacted Community statement. Private Trust cases remain private.

The canonical post card now renders server-derived Trust freshness, source references, Community reactions, nested comments, and an owner-only Expert request action. The new comment/review-request schema changes are local migration files only; they have not been applied to any database. Media upload remains intentionally unavailable because the existing Trust intake stores private originals and does not produce a valid public image derivative. See the current gate disposition in COMMUNITY_V4_DOMAIN_GAP_LOG.md.

The legacy social surface reads public.posts, flat public.comments, and public.votes. Its interactions are like, perception vote, and root comment. The schema has no comment parent reference. The active card's Trust and Expert decorations are not supported by the social DTO.

## Contract matrix

| Concern | Existing authoritative contract | What it proves | Active UI mismatch |
|---|---|---|---|
| Canonical Community contribution | POST /api/intelligence/community/posts, CommunityRepository.createContribution, community_contributions | Trust caseId + immutable caseRevision, optional claim, evidence revision IDs, PII preview/digest confirmation, idempotency, append-only revisions and outbox | Main feed bypasses it and writes legacy posts |
| Community read | GET /api/intelligence/community/posts, CommunityRepository.listContributions | Public statement and non-authoritative contribution projection | Main feed currently reads public.posts instead |
| Privacy preview | CommunityRepository.previewContribution / createPreview | Server scan, redacted preview, digest-bound explicit publish confirmation | Composer displays a fixed sample-redaction paragraph; it does not preview its current input |
| Trust bridge | GET /api/v1/trust/cases/[caseId]/community-signals | Owner-authenticated, immutable revision scope, non-authoritative, no author identity | Existing Trust UI calls this bridge, but private Trust cases are excluded in repository queries |
| Trust case access | GET /api/v1/trust/cases and GET /api/v1/trust/cases/[caseId] | Owner-only case list/detail | Newly persisted Trust cases default to PRIVATE; no public-share endpoint exists |
| Staleness | assertCaseScope rejects writes whose revision is not current | Prevents publishing against an already-stale case revision | Feed DTO does not compare linked case revision or latest Trust run with Community updates |
| Expert request | POST/GET /api/expert/review-requests | Owner-scoped Trust case/revision/claim, PII scan, idempotency; expert selection and assignment remain coordinator-controlled | Composer and post card do not submit or read these requests |
| Expert evidence | GET /api/expert/assessments?caseId=… | Trust UI reads persisted assessments filtered to case revision and claim | Community feed has no public adjudication projection; do not synthesize an Expert reply |
| Reactions | CommunityRepository.setReaction | Allowed kinds: HELPFUL, ADD_EVIDENCE, CHALLENGE, INSUFFICIENT_INFORMATION, REPORT_ABUSE; contribution/revision scope, self-reaction guard, idempotency | Active UI uses legacy “đáng tin/chưa tin” votes and generic likes |
| Search | GET /api/intelligence/community/search?q=… | Search over durable public contributions; no authoritative result | Active feed filters a different legacy DTO client-side |
| Realtime | Durable event log + SSE /api/realtime/stream; Trust writes trust:revision; Community publish writes community:contribution after commit | Authorized channel replay, cursor, subject scoping; payloads can be metadata-only | RealtimeContext installs handlers only for system/audit events; Community/Trust/Expert subscribers do not receive their events |
| Media | Private community_file_objects schema plus Trust MediaArtifactService | Private storage table exists; Trust media ingest has server checks | No Community upload route/derivative-serving contract was found; URL entry is not an upload |

## Trust and privacy boundary

- A canonical Community contribution is a public, redacted statement attached to a Trust case revision. It is a non-authoritative signal.
- Trust case visibility is PRIVATE by default. The existing contribution write currently asks assertCaseScope(... publicOnly: true), which makes a newly created private case unusable from Community despite owner access.
- The safe correction is to authorize contribution creation against the authenticated owner’s private case while keeping the Trust case private. Only the separately privacy-scanned, digest-confirmed Community statement and explicitly selected references may appear in the public Community DTO. No Trust input, full case detail, private media key, or private evidence content may be copied into the public post.
- The Trust signal endpoint already checks case ownership before calling the repository. Its query can safely return that owner’s Community signals for a private case, still marked NON_AUTHORITATIVE.
- Expert review requests stay owner initiated and Trust scoped. A Community post must not be injected into the Expert queue or expose its content merely to create queue visibility. The user must explicitly request review; assignment remains server/coordinator controlled.

## Display claims rejected during audit

- CommunityDetailWorkspace currently renders a fixed “CHƯA ĐỦ BẰNG CHỨNG” label for every post, without a Trust verdict DTO.
- CommunityQuickPostDialog shows a disabled Trust link with “đang trong lộ trình”.
- The privacy card says “REDACTION PREVIEW · BẢN MẪU” and static advice, not a scan result.
- CommunityPostCard infers “chưa đủ bằng chứng” when a post has no attachments; absence of attachments is not a Trust state.
- Expert response and author expertise are accepted from optional fields that legacy social DTOs do not emit.
- The moderation callback only changes a local notice; it does not moderate anything.
- The fallback from /api/community/social to /api/forum/posts silently changes persistence and DTO contract.

These display claims are removed or replaced with sourced states in Community V4.

## C0 decision

The active Community surface will use the canonical Trust-bound contribution contract and CommunityRepository reactions. The legacy social endpoints remain compatibility surfaces only and will not be used as an invisible fallback. Gaps requiring contract/schema work are tracked with tests and explicit environment blockers in the Domain Gap Log.
