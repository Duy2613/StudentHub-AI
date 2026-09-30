# Community V4 — Information Architecture

**State:** local implementation map; the seven-screen visual review is still pending.

## Product structure

| Route / surface | Purpose | Primary content | Owner-only actions |
|---|---|---|---|
| `/community` | Browse academic community signals | Search, contribution-type filters, source/staleness filters, canonical feed cards | Open Composer; request Expert review on a linked contribution when the viewer owns its Trust case |
| Composer dialog | Publish one scoped contribution | Private Trust case picker, contribution type, optional claim/evidence/source, public statement, server preview, explicit confirmation | Select only the viewer’s Trust cases/evidence; publish the confirmed redacted statement |
| Feed card | Inspect one public contribution | Statement, contribution type, source, Trust revision/freshness, persisted reaction counts | Helpful/evidence/challenge/insufficient-context/report reactions; comment/reply; Expert request when authorized |
| `/community/[postId]` | Inspect a contribution in context | Same canonical contribution projection and expanded thread | Same server-authorized actions as the feed card |
| Mobile Community | Browse at narrow width | Compact header, feed, collapsible filters, bottom navigation from the app shell | Same actions, with Composer presented as a bottom sheet |

## Seven review states

1. **Community Home** — feed header, search/sort, filters, Trust context rail.
2. **Composer open** — complete write state, private-case scope, source/evidence controls, media boundary, and preview action.
3. **Post thường** — public statement, source/evidence context, persisted reactions and thread entry.
4. **Post + Trust** — same post with the case revision and server-derived current/stale/unknown marker.
5. **Post + Expert** — Trust-case-owner view with the explicit Expert request panel and persisted request status.
6. **Thread sâu** — nested comments to the supported maximum depth of three, including reply affordances.
7. **Mobile 390** — responsive feed and mobile shell at 390 CSS pixels.

## Trust boundary and display order

The card hierarchy is public statement → verifiable source/evidence reference → Trust scope and freshness → community actions → discussion. Community reactions and volume are explicitly non-authoritative. No verdict is inferred from attachment count, reaction count, or missing evidence. Missing freshness remains UNKNOWN.

The composer links to a private Trust case owned by the signed-in author. It publishes only the PII-scanned statement and explicitly selected revision references after a digest-bound preview confirmation. The case’s raw content, conclusions, original media, and private object keys are not copied to the feed.

## Explicit scope limits

- **Media:** image/file upload is not available until Community has a verified public derivative pipeline. The composer explains this and does not expose a fake upload success state.
- **Spaces:** there is no durable Space/membership/query contract. Current filters reflect canonical contribution types and states; they are not presented as group membership.
- **Moderation:** ordinary members can submit REPORT_ABUSE. Staff hide/remove controls are omitted until an authorized moderation contract exists.
- **Expert visibility:** the contributor’s owner-only request status is visible to that case owner. Expert reasoning is not copied into a public Community reply.
