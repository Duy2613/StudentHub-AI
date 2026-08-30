# StudentHubAI Competition Roadmap

## Frozen narrative

`Enter → Question → Verify → Return → Apply → Adapt` is demonstrated through three end-to-end cases:

1. Fake scholarship: payment pressure + suspicious link/document → official mismatch → community cluster → scoped cyber expert → Passport change → verify-first Decision Twin.
2. Fake internship/recruiter: recruiter/domain/payment/credential signals → student observations → career/cyber scope → Passport evolution → safest next action.
3. Academic conflict: community claim → official versioned regulation → deterministic eligibility → scoped clarification if needed → consequences → next academic move.

## Demo contract

Demo Mode is explicit on `/cases` and `/api/v1/demo/superflows`. Fixtures are deterministic and visibly labeled `DEMO_FIXTURE`; they cover low-risk/supportive, high-risk, conflict, unknown, Academic rule, and Reality Gap states across the three flows. Demo data never enters live persistence.

## Freeze gate

Feature Freeze requires all five pillars, Decision Twin, Passport history, Evidence Triangle, all three flows, The Margin production migration, critical auth/data/API paths, and passing core tests. Missing live credentials, clean database/RLS proof, staging, or provider terms are external blockers and must remain explicit.
