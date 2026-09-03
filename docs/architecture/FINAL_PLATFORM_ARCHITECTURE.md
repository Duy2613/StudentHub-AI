# StudentHub AI Final Platform Architecture

Status: `TARGET_ARCHITECTURE_REPOSITORY_READY_ENVIRONMENT_UNVERIFIED`

## Control plane and provider plane

```text
                         STUDENTHUB AI
                              |
                       Lucid Aether UI
                              |
                       Canonical Trust API
                              |
                        TrustOrchestrator
                  _________/             \_________
                 /                                  \
        CONTROL PLANE                         PROVIDER PLANE
  Trust v5 / Supabase / Auth             ProviderGateway
  Passport / TrustGraph / RLS             L2 / L3 / L4 / AI
  Community / Expert                      native + legacy
                 \                                  /
                  \________ Evidence OS __________/
                              |
             normalization + provenance + deterministic policy
                              |
                 Report / TrustGraph / Passport
```

## Ownership

StudentHub-owned Supabase is the canonical data plane for Auth, profiles, Trust
cases, inputs, source documents, observations, provider observations, verdict
revisions, Passport, Community, Expert, sessions, audit, and private screenshot
metadata/storage. The friend database is not migrated or treated as canonical.

The control plane owns identity, authorization, RLS, persistence, deterministic
policy, provenance, and user-visible state. The provider plane supplies bounded
observations and health; it cannot write final Trust truth directly.

## Evidence OS model

The canonical evidence path is:

`claim -> source document -> retrieval run -> evidence observation -> provider observation -> claim link -> decision revision`.

Source-document identity is not evidence identity. Layer 3 and Layer 4 can
observe one canonical document independently, producing separate observation
and retrieval provenance. Content fingerprints support deduplication analysis
but are not identity and do not prove that two URLs contain different content.

## Deterministic policy dimensions

The policy keeps Claim Truth, Security Risk, Assessment Confidence, Decision
Confidence, Evidence Coverage, Evidence Independence, Source Agreement, Source
Quality, and Unresolved Signals separate. There is no universal TrustScore.
Community is contextual intelligence; Expert authority is scoped by domain,
credentials, verification, conflicts, reviewed evidence, and limitations.

## Operational status

The repository has the provider gateway, adapter boundary, provenance model,
Passport idempotency helper, investigation budget, and documentation. Live
Supabase/RLS/storage, credential rotation, approved provider credentials,
staging deployment, rollback rehearsal, and live assurance remain external
gates. This document is not a production certification.

