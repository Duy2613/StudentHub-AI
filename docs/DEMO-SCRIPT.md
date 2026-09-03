# StudentHubAI Competition Demo Script

Target duration: 5–7 minutes
Mode: explicit Demo Mode with labeled deterministic fixtures
Opening line: “StudentHubAI does not turn a confident answer into truth; it shows what is known, who can vouch for it, and what I should do next.”

## 0:00–0:40 — Start with the proof surface

Open `/cases`. Select the prepared case with the clearest cross-system chain. Point to the `DEMO_FIXTURE` and synthetic-data notice before clicking anything. Say that the demo is deterministic and offline-safe; live provider status is never implied.

## 0:40–1:45 — Trust: abstention is a feature

Open the Trust step from the case or navigate to `/trust`. Submit the prepared URL. Highlight:

- the verdict and confidence as separate concepts;
- the four evidence layers and their source/provenance labels;
- source independence, temporal conflict, and related cases;
- the insufficient-evidence state if the case is deliberately ambiguous.

Say: “The browser supplies a claim. The server decides what evidence is admissible. If the evidence is not enough, the product says `UNKNOWN` instead of inventing `SAFE`.”

## 1:45–2:35 — Community: reality without false authority

Navigate to `/community`. Search or filter the case topic, open one report, and show moderation/provenance and recency. Say: “This tells us what students are experiencing. It does not become official policy because it is popular.”

## 2:35–3:20 — Expert: scope before confidence

Navigate to `/expert`. Open a scoped expert profile and one claim/evidence view. Point out domain scope, credential provenance, and disagreement handling. Say: “An expert can be authoritative in one domain without becoming a universal truth oracle.”

## 3:20–4:25 — Academic 360: deterministic next action

Open `/academic` or `/academic/command-center`. Show source status, cohort/version, freshness, deterministic eligibility or planner output, deadline, and the action center. Explain that the recommendation has an inspectable basis and a source state, not an opaque model score.

## 4:25–5:20 — Passport and Decision Twin

Open the linked Evidence Passport packet. Show the official, community, and expert evidence as separate entries. Open the Decision Twin scenario and change one assumption. Point to the factor basis and the `REVIEW_REQUIRED` state. Say: “A student assumption can change a scenario; it cannot rewrite official evidence or claim a deterministic consequence.”

## 5:20–6:10 — Command Center: one clear move

Open `/dashboard`. If signed out, show the explicit authentication state. If signed in, show the personalized Next Clear Move and notification state. If using Demo Mode, point to the explicit mode indicator. Connect the move back to the Trust/Community/Expert/Academic evidence rather than presenting it as a generic to-do list.

## 6:10–7:00 — Prove a failure path

Trigger one safe failure: invalid URL, insufficient evidence, or simulated provider outage. Show the typed error, retry guidance, and correlation reference. Close with: “The system is trustworthy because its failure state is inspectable too.”

## Operator notes

- Do not quote fixture percentages, timestamps, counts, or provider health as live facts.
- Do not paste credentials or use archived configuration bundles.
- If a provider is unavailable, keep the degraded label visible and continue with the deterministic path.
- If the judge asks for live database/RLS or staging proof, open the release checklist and state that those gates are environment-blocked rather than claiming they passed.
