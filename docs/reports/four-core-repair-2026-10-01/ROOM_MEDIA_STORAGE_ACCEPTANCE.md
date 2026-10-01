# Expert Room media storage acceptance — 2026-10-01

## Verdict

```ini
CANDIDATE_SOURCE_SHA = eea55564ebaef4dc2edc7af14586fe8f04324114
BRANCH = codex/studenthub-four-core-repair-20261001
STAGING_PROJECT_REF = bniwtkjtramqaozrrtrk
LIVE_STAGING_MUTATION = NOT_RUN
FIRST_CONFIRMED_FAILURE = R05 durable Storage object at Room upload
ROOM_MEDIA_STORAGE = FAIL
```

This is a code-path acceptance audit, not a live room canary. No room, storage object, Trust case, or cleanup operation was created in this run. The project assurance report still records staging password rotation and old-password invalidation as unverified, so authenticated staging mutations were not started.

## R01–R17 result

| Check | Result | Evidence / reason |
| --- | --- | --- |
| R01 Host authenticated | NOT_RUN | No staging login was attempted. |
| R02 Create real verification room | NOT_RUN | No staging write was attempted. |
| R03 Select IMAGE through Room UI | NOT_RUN | The client code path was inspected only. |
| R04 Upload succeeds | NOT_RUN | No live upload was attempted. |
| R05 Durable storage object exists | **FAIL_STATIC** | Room creation stores the normalized challenge JSON in `private.expert_verification_rooms.challenge_payload`; it does not call a durable Storage upload. `MediaArtifactService.ingestImage` keeps bytes in an in-process cache and optionally writes metadata, but does not upload the object. |
| R06 Room stores canonical asset reference | **FAIL_STATIC** | Current Room challenge carries `metadata.bytes`; it does not persist a canonical `mediaArtifactId`/digest produced by a durable upload. |
| R07 Trust consumes the same asset | BLOCKED_BY_R05_R06 | After answer lock, the room passes the stored challenge bytes to Trust. This path does not hand off a previously persisted Room asset reference. |
| R08 Trust L1–L4 completes | NOT_RUN_THROUGH_ROOM | Separate direct Trust image/QR staging checks do not prove a Room-originated handoff. |
| R09 Evidence Package references same provenance | **FAIL_STATIC** | `dataPackageFromTrust` stores Trust case/revision, evidence and sources, but no Room media artifact ID or media digest. |
| R10 Reload room | NOT_RUN | No room was created. The current read path returns the database challenge payload, not a Storage-backed asset reference. |
| R11 IMAGE resolves for authorized participant | FAIL_ACCEPTANCE | No canonical durable object/reference exists in the current Room creation path; authorized room reads return the challenge payload. |
| R12 Outsider access denied | NOT_RUN_LIVE | `getRoom` calls `memberFor` before returning room data, but this has not been exercised for media in a live acceptance run. |
| R13 Repeat IMAGE checks with QR | NOT_RUN | The same storage/reference gap applies to QR; no live QR room was created. |
| R14 Disconnect/reconnect participant | NOT_RUN_FOR_MEDIA | Earlier staging room replay evidence does not bind IMAGE/QR media provenance. |
| R15 Canonical state still resolves media/evidence | BLOCKED_BY_R05_R06_R09 | The current Room/Evidence Package contract lacks the shared durable media reference required to prove convergence. |
| R16 Cleanup only run-owned media | NOT_RUN | No media was created by this run, so there is no run-owned path to delete. |
| R17 Verify cleanup | NOT_RUN | No cleanup was attempted. |

## Required status fields

```ini
ROOM_IMAGE_UPLOAD = NOT_RUN
ROOM_IMAGE_READBACK = FAIL_STATIC
ROOM_IMAGE_TRUST_HANDOFF = BLOCKED_BY_MISSING_CANONICAL_ASSET_REFERENCE

ROOM_QR_UPLOAD = NOT_RUN
ROOM_QR_READBACK = FAIL_STATIC
ROOM_QR_TRUST_HANDOFF = BLOCKED_BY_MISSING_CANONICAL_ASSET_REFERENCE

ROOM_MEDIA_AUTHORIZATION = NOT_RUN_LIVE; ROOM_MEMBERSHIP_CHECK_PRESENT_IN_CODE
ROOM_MEDIA_RELOAD = FAIL_ACCEPTANCE
ROOM_MEDIA_RECONNECT = NOT_RUN_FOR_MEDIA
ROOM_MEDIA_CLEANUP = NOT_RUN

ROOM_MEDIA_STORAGE = FAIL
```

No field is marked PASS. The direct Trust IMAGE/QR Storage result in `staging-storage.json` remains valid for that separate flow only.

## Source-path findings

- `frontend/src/components/expert/ExpertVerificationRooms.jsx` converts the selected image to a data URL and posts `metadata.bytes` to `/api/expert/rooms`.
- `frontend/src/lib/server/expert/ExpertVerificationRoomService.js` accepts `metadata.bytes`, serializes the challenge into the room row, returns that payload to members, and later passes the challenge to canonical Trust. Its evidence package projection omits the media artifact reference/digest.
- `frontend/src/lib/server/media/MediaArtifactService.js` stores a buffer in `ephemeralArtifactStore`; the authenticated database insert is optional and errors are swallowed. `getArtifact` and `getArtifactBytes` read only that in-process cache. The service does not upload/download the object from Supabase Storage or restore it after a cold start.

## Minimum repair before a new candidate can pass

1. Use the existing private `trust-screenshots-private` bucket for IMAGE and QR upload during Room creation; fail closed if durable upload or its metadata row fails.
2. Persist only the canonical `mediaArtifactId`, content digest, and bounded media metadata in `challenge_payload`; never return raw image bytes in the Room DTO.
3. Resolve the exact stored object from durable Storage after reload/cold start, verify its digest, and pass that same artifact ID to canonical Trust without re-ingesting a second copy.
4. Include the same artifact ID/digest in the immutable Evidence Package.
5. Expose media only after checking current Room membership; verify outsider denial, participant reload/reconnect, and exact run-owned cleanup.
6. Re-run R01–R17 with dedicated synthetic staging identities only after the staging credential rotation/invalidation gate is verified. Keep Tavily OFF.

This report does not change the frozen application source SHA.
