# 🧠 Intelligence Pipeline & Graph Matrix

> **Core Metric**: Are the intelligence layers (T1, T2, T3, T4, Social, Personalization) genuinely interconnected, or do they operate as isolated silos?

---

## 1. Pipeline Connectivity Trace

```text
[External Data Source / Community Post]
       │ (1. Raw Text)
       ▼
[ContentItemNormalizer] (Slang expansion + Canonical entity resolution)
       │ (2. Normalized ContentItem)
       ▼
[SocialClaimExtractor] (11-category classification + Evidential weighting)
       │ (3. Claim Candidate)
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[SocialDuplicationDetector]    [CoordinationDetector]      [SocialContentFirewall]
(Shingle clustering 1/sqrt(N))  (Tight window campaign)    (Passive data wrapper)
       │                               │                               │
       └───────────────────────────────┴───────────────────────────────┘
                                       │ (4. Deduplicated & Isolated Signal)
                                       ▼
                             [EarlyWarningEngine]
                         (Lifecycle: UNVERIFIED -> CONFIRMED)
                                       │
                                       ▼
                           [SocialToOfficialPipeline]
                    (Official Regulation + Operational Reality)
                                       │
                                       ▼
                            [T4 ContradictionEngine]
                    (Detects Direct, Temporal, Scope Conflicts)
                                       │
                                       ▼
                       [T4 ConfidenceCalibrationEngine]
                         (Brier Score Scoring Metric)
                                       │
                                       ▼
                            [AcademicBriefingEngine]
                     (Compiles Hyper-Personalized Briefing)
                                       │
                                       ▼
                           [PersonalAcademicBriefing UI]
```

---

## 2. Layer Interconnection Evaluation

| Pipeline Stage | Inputs Consumed | Outputs Generated | Interconnected Upstream? | Interconnected Downstream? | Audit Verdict |
|---|---|---|---|---|---|
| **Social Normalizer** | Raw external text | `ContentItem` with canonical entities | Yes (Connectors) | Yes (Claim Extractor) | **CONNECTED** |
| **Claim Extractor** | `ContentItem` | `ClaimCandidate` with initial weight | Yes (Normalizer) | Yes (Quality / Early Warning) | **CONNECTED** |
| **Early Warning** | Extracted warnings / incidents | Incident Lifecycle Records | Yes (Claim Extractor) | Yes (Briefing Engine) | **CONNECTED** |
| **Social-to-Official Bridge** | Social claim + Official rule | Dual-layer statutory advisory | Yes (Social + Official Store) | Yes (Contradiction Engine) | **CONNECTED** |
| **T4 Contradiction** | Statement A vs Statement B | `ContradictionPayload` | Yes (Official + Social claims) | Yes (Confidence / Briefing) | **CONNECTED** |
| **T4 Calibration** | Predictions vs Historical Outcomes | Brier Score & Overconfidence delta | Yes (Claim snapshots) | Yes (Trust profiling) | **CONNECTED** |
| **T1 Trust Engine** | Verified identity, flags, evidence | 10-dimension trust score | Yes (Profile360 + Evidence) | Yes (Digital Twin) | **CONNECTED** |
| **T2 Expert Engine** | Topic query, student faculty | Ranked verified faculty | Yes (Expert store + Provenance) | Yes (Briefing Engine) | **CONNECTED** |
| **Academic Briefing** | Twin, Deadlines, Warnings, Experts | "My Academic Briefing" JSON | Yes (T1-T4 + Twin + Goals) | Yes (Home UI Component) | **CONNECTED** |
