# Community Max Entity Mapping

| Capability | Reuse | Additive extension | Authority |
| --- | --- | --- | --- |
| Evidence-first contribution | `community_contributions`, `community_contribution_revisions` | Max composer DTO/domain | Community publication/privacy boundary |
| Claim discussion | `claims`, contribution/revision | `community_claim_discussions` | Community signal only |
| Source independence | `community_source_clusters` | `community_source_references` | Source-family projection, never truth |
| Revision/freshness | contribution revisions, Trust case revisions | `community_verification_projections`, source events | Freshness projection only |
| Disagreement | reactions, perception, Expert read models | private review candidate queue | Queue only |
| Passport | `evidence_passports`, `evidence_passport_events` | no duplicate table | Trust-owned read-only |
| Expert request | Expert assignment/qualification schemas | private request queue | Expert workflow decides |
| Summary/rank | existing ranking domain | durable grounded summary projection | Explainability only |
| Campus intelligence | profiles/institutions as optional references | consented campus context | User-consented context |
| Risk clustering | moderation signals | hashed private cluster/member tables | Safety aggregate only |
| Correction culture | canonical contribution revisions | correction record | Integrity signal only |
| Data flywheel | private quality ledger | hard-false candidate table | No automatic training |

Forbidden duplicates: `PostsV2`, `CommunityPostsV2`, `NewVotes`,
`NewReactions`, a Community-owned Passport, or a second Trust verdict store.
