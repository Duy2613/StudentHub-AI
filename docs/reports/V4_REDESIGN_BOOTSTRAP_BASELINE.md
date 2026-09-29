# V4 Redesign Bootstrap Baseline

- Captured: 2026-09-26T17:55:35.8131784+07:00
- Original branch: codex/trust-render-backend
- Original HEAD / rollback ref: 80351be4a57111d6d1ac1f518827fd5b2e81d550
- .git/index.lock exists: False
- Git processes at capture: 0
- git status --porcelain entries (untracked directories collapsed): 234
- git status --porcelain -uall exhaustive file entries: 283
- Target redesign branch existed locally/remotely: no (checked before bootstrap)

## Scope and authority

- Master: StudentHub AI Master Frontend Constitution v4.0 Three-Core; highest authority.
- Compatible extension: Creative Reference Layer v2.0 Amendment A-01.
- Community execution instrument: Maximum Hardened Edition v3.0.
- Community reference instruction from the user: initial visual review limited to seven screen groups (Community Home, expanded Composer, normal Post, Post + Trust, Post + Expert, deep Thread, mobile 390). This is the first review set; the runbook still requires its full responsive evidence set for final release.

## P0 evidence at bootstrap

- Previous scoped P0 verdict: PASS, recorded in the active task history; freshness verification is pending in this bootstrap.
- Repository artifacts present: tmp/p0-remediation-build-final2.log, tmp/p0-remediation-lint-final.log, tmp/p0-remediation-root-test-final2.log, tmp/p0-browser-smoke.mjs, and P0 screenshots.
- Limitation: the final full root test log exits on the missing artifacts/visual/STUDENTHUB_KHAI_MINH_ASSET_INVENTORY_2026-09-10.json; that historical visual-registry failure is outside the scoped P0 gate and is not treated as a P0 pass/fail signal.

## Classification summary

| Category | Count |
|---|---:|
| A | 24 |
| B | 32 |
| D | 37 |
| E | 19 |
| F | 35 |
| G | 136 |

- A: P0 scope/decommission/gateway/runtime candidates.
- B: v4 Foundation/App Shell and frontend governance material.
- C: Community code/tests already present in the original worktree (none found at capture).
- D: active Trust/Expert runtime, integration, tests, and demo evidence.
- E: unrelated CAD/PDF user work.
- F: generated test/build/evaluation evidence.
- G: historical deletions or unknown paths; preserve without staging.

## File-level worktree inventory

| Status | Class | Path | Reason | Safe to stage? | Safe to modify? |
|---|---|---|---|---|---|
|  M | F | artifacts/ai-eval/tevv_evaluation_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  D | G | artifacts/candidate/STUDENTHUB_EXPERT_HYBRID_RC_MANIFEST.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/CANONICAL_SCHEMA_INSPECTION.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/DISCOVERY_SUMMARY.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/FULL_API_SURFACE_QA.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/FULL_INTERACTION_CATALOG.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/FULL_ROUTE_CATALOG.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/LIVE_EXTERNAL_CASE_MANIFEST.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/LIVE_PROVENANCE_REPORT.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/PRODUCTION_RELEASE_REPORT.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/REALITY_AUDIT_REPORT.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/00_baseline_e0_5star.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/00_baseline_e3_4star.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/00_baseline_u0_active.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/03_academic_tasks_view.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/03_academic_timetable_view.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/04_community_feed.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/04_community_interaction.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/07_qr_interface.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/07_qr_url.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/08_image_deepfake.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/08_image_forensics_ui.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/08_image_genai.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/09_gemini_live_smoke.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/10_gemini_fast_failover.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/11_gemini_all_down.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/12_provider_graceful_degrade.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/13_blind_ai_hidden.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/13_blind_submitted_locked.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/13_blind_widget_floating.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/13_post_l5_reveal.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/13_post_reveal_edit_denied.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/14_trust_unblocked_expert.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/15_offline_expert_recovered.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/16_review_desk_assigned.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/16_review_desk_empty.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/17_reputation_ledger_v1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/18_calibration_v2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/19_e3_after_promotion.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/19_e3_before_promotion.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/20_16_pairing_matrix.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/21_privacy_bola_denied.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/22_ssrf_blocked.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/23_client_tamper_denied.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/24_concurrency_idempotent.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/25_trust_refresh_recovered.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/26_zero_rerun_delta_zero.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/27_realtime_connected.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/28_error_ux_readable.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/29_responsive_desktop_1440.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/29_responsive_mobile_390.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/29_responsive_tablet_768.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/30_a11y_keyboard_focus.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/31_returning_accounts_verified.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/32_final_summary_dashboard.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-AI-IMAGE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L1-EVIDENCE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L2-DOMAIN-RISK.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L2-FORENSICS.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L2-SEMANTIC.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L2-THREAT.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L3-SOURCES-MORE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L3-SOURCES-TOP.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L4-ADVISORY.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L4-EVIDENCE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L4-UNCERTAINTY.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L5-DECISION.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-L5-KEY-EVIDENCE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-QR-MULTI.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-QR-ROTATED.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-QR-UNSAFE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-REAL-IMAGE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/V3-TRANSFORMED-IMAGE.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l1_complete_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l4_terminal_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/l5_final_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/login_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/mid_pipeline_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/profile_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_E0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_E1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_E2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_E3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_U0.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_U1.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_U2.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/full-web-v4/screenshots/trust_input_U3.png | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/manifests/GENERATED-ART-LEDGER.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/manifests/route-inventory-2026-09-10.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  M | F | artifacts/privacy/pii_benchmark_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  M | F | artifacts/retrieval/fresh_retrieval_holdout_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  M | F | artifacts/retrieval/retrieval_benchmark_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  M | F | artifacts/retrieval/source_independence_benchmark_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  M | F | artifacts/security/expanded_security_redteam_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  M | F | artifacts/security/security_redteam_results.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  D | G | artifacts/visual/STUDENTHUB_KHAI_MINH_ASSET_INVENTORY_2026-09-10.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/visual/STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10.zip | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/visual/STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_ASSET_USAGE_POLICY.md | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/visual/STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_PROVENANCE.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/visual/STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_README.md | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  D | G | artifacts/visual/STUDENTHUB_KHAI_MINH_MASTER_VISUAL_PACK_2026-09-10_ROUTE_MAP.json | Historical artifact deletion; intent/source not established | No - unknown or historical deletion | No - preserve until intent is established |
|  M | F | frontend/next-env.d.ts | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
|  M | B | frontend/next.config.ts | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | D | frontend/src/app/api/v1/trust/route.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/app/api/verify/[...path]/route.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | A | frontend/src/app/dashboard/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/intelligence/knowledge/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | B | frontend/src/app/layout.tsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | A | frontend/src/app/learn/[courseId]/[lessonId]/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/learn/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | B | frontend/src/app/page.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | A | frontend/src/app/practice/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/quests/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/roadmap/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/safety-map/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/scholarships/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/sos/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/src/app/tuition-radar/page.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | B | frontend/src/components/auth/AuthUI.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | D | frontend/src/components/expert/ExpertBlindReviewWidget.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/components/expert/ExpertReviewDeskModal.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | A | frontend/src/components/home/CommandCenterDashboard.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | B | frontend/src/components/layout/AcademicNavbar.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | B | frontend/src/components/layout/UnifiedAppShell.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | B | frontend/src/components/layout/navigationConfig.js | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | B | frontend/src/components/layout/referenceRouteConfig.js | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | B | frontend/src/components/margin/MarginRail.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | D | frontend/src/components/media/SmartVideo.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | B | frontend/src/components/navigation/MobileNavRail.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | B | frontend/src/components/navigation/PrimaryNavbar.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
|  M | A | frontend/src/components/providers/RealtimeContext.jsx | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | D | frontend/src/components/trust/AiTrustStudioView.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/components/trust/OwnTrustJourney.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/components/trust/TrustMasterUltraJourney.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/components/trust/TrustWorkspaceClient.jsx | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/OwnBackendTrustOrchestrator.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/TrustOrchestrator.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/integrations/canonicalTrustProjection.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/integrations/legacyVerification/config.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/layer2a/RenderLayer2AProvider.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/layer3/retrieval/TavilyRetriever.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/legacy/LegacyResponseProjector.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/v5/MasterUltraTrustModel.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/v5/contracts.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/v5/stageAdapters.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/ai-trust/vision/OcrService.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/src/lib/backend/adapters/ApiProviderAdapter.ts | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | A | frontend/src/lib/search/searchProviders.js | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/tests/ai-gateway/ai_gateway_router.test.mjs | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/tests/ai-gateway/extended_qa_fallback_chain.test.mjs | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | A | frontend/tests/gateway/provider_failure_cost_latency.test.mjs | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | D | frontend/tests/integration/legacy_verification_adapter.test.mjs | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/tests/platform/canonical_api_runtime.test.mjs | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/tests/platform/canonical_v1_api_contract.test.mjs | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | A | frontend/tests/platform/test_runner_contract.test.mjs | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
|  M | D | frontend/tests/trust/layer2a_reputation_boundary.test.mjs | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | D | frontend/tests/trust/trust_engine_v5_sequential.test.mjs | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
|  M | A | scripts/run-discovered-tests.mjs | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
| ?? | D | DEMO_ACCOUNT_INVENTORY.json | Trust/Expert demo evidence or harness; preserve, outside P0 checkpoint | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | D | TRUST_8_ACCOUNT_ASSESSMENT_IDENTITY.json | Trust/Expert demo evidence or harness; preserve, outside P0 checkpoint | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | D | TRUST_8_ACCOUNT_SECURITY_ISOLATION.json | Trust/Expert demo evidence or harness; preserve, outside P0 checkpoint | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | D | TRUST_8_DEMO_ACCOUNT_MATRIX.md | Trust/Expert demo evidence or harness; preserve, outside P0 checkpoint | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | F | artifacts/trust-auth-repro-login.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-case-01-scam-text.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-case-02-ai-image.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-case-03-qr-image-annotated.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-case-03-qr-image.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-case-04-url-render-backend.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-local-anonymous-before.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-local-before.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | artifacts/trust-test-text-scam-v1.txt | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | B | docs/frontend/FRONTEND-UI-UX-INVENTORY.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | docs/frontend/MASTER_FRONTEND_CONSTITUTION.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | docs/frontend/creative/charters/CHARTER_EFX01_KNOWLEDGE_PRISM.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | docs/frontend/creative/effects/SIGNATURE_EFFECT_CARDS.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | docs/frontend/creative/reference-registry.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | docs/frontend/creative/third-party-creative.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | docs/reports/FRONTEND_CONSTITUTION_V3_IMPLEMENTATION_REPORT.md | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | F | docs/reports/gemini_multi_model_router_probe_2026-09-19.json | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | frontend/artifacts/trust-case-01-text-friend-backend.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | frontend/artifacts/trust-case-02-ai-image-friend-backend.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | frontend/artifacts/trust-case-03-qr-friend-backend.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | frontend/artifacts/trust-case-04-url-friend-backend.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | B | frontend/src/components/domain/index.tsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/components/ui/input.jsx | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/config/creativePolicy.ts | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | A | frontend/src/config/navigation.ts | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
| ?? | A | frontend/src/config/productScopeRegistry.js | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
| ?? | D | frontend/src/lib/ai-trust/FriendBackendTrustOrchestrator.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | D | frontend/src/lib/ai-trust/integrations/legacyVerification/FriendBackendTavilyFallback.js | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | B | frontend/src/styles/foundation/accessibility.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/foundation/layout.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/foundation/typography.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/index.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/motion/reduced-motion.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/motion/tokens.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/tokens/light.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/tokens/midnight.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/tokens/primitive.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/tokens/semantic.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | B | frontend/src/styles/utilities/surfaces.css | v4 Foundation/App Shell or frontend governance material | No - outside P0 checkpoint | Only after foundation/shell gap verification |
| ?? | D | frontend/tests/integration/friend_backend_authoritative.test.mjs | Active Trust/Expert runtime, adapter, media or regression coverage | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | A | frontend/tests/platform/product_scope_registry.test.mjs | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
| ?? | A | frontend/tests/test-scope-classification.json | P0 scope/decommission, Omni, realtime or gateway/test-runner candidate | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
| ?? | E | output/cad/Part23.9_Ngo_Phan_Bao_Duy.dxf | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | output/pdf/Part23.9_Ngo_Phan_Bao_Duy.pdf | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | D | scripts/build-8-demo-master-video.py | Trust/Expert demo evidence or harness; preserve, outside P0 checkpoint | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | D | scripts/run-8-demo-accounts-e2e.mjs | Trust/Expert demo evidence or harness; preserve, outside P0 checkpoint | No - preserve; only integrate in its approved phase | Compatibility-only if Community integration requires it |
| ?? | A | tmp/p0-browser-smoke.mjs | P0 browser smoke harness; preserve, not yet checkpointed | No - P0 provenance/file-level diff not yet isolated | Only for a verified P0 regression |
| ?? | F | tmp/p0-home-desktop.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-omni-default.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-build-final.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-build-final2.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-build.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-lint-final.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-lint.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-root-test-after-contract.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-root-test-final.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-root-test-final2.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-root-test-retry.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-remediation-root-test.log | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | F | tmp/p0-trust-desktop.png | Generated test/evaluation/build evidence; retain, do not checkpoint | No - generated evidence/output | Regenerate only through an authorized verification step |
| ?? | E | tmp/pdfs/123-upper-right-crop.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/Part23.9_Ngo_Phan_Bao_Duy-preview.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/atudent/page-1.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/atudent/page-2.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/atudent/page-3.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/atudent/page-4.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/author-name.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/build_part23_9.py | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/side-view-caption.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/source-hires/123.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/source-hires/5_2(1).png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/source-hires/Part23.9.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/source-previews/123-1.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/source-previews/5_2(1)-1.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/source-previews/Part23.9-1.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/vietnamese-font-check.pdf | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | E | tmp/pdfs/vietnamese-font-check.png | Unrelated CAD/PDF user outputs | No - unrelated user work | No - preserve |
| ?? | B | docs/reports/V4_REDESIGN_BOOTSTRAP_BASELINE.md | Bootstrap audit artifact created after inventory capture | No - not part of P0 checkpoint | Read-only after capture |

## Checkpoint decision

CHECKPOINT_PARTIAL_WORKTREE - no P0-only staged diff can be proven to exclude pre-existing file content from this checkout. Nothing was staged. Creating a same-HEAD branch preserves the entire dirty worktree; no cleanup or reset is authorized.

## Known unrelated / unknown work to preserve

- Category E: output/cad/**, output/pdf/**, tmp/pdfs/**.
- Category G: deletions under artifacts/candidate/**, artifacts/full-web-v4/**, artifacts/manifests/**, and artifacts/visual/**; deletion intent is not established.
- Category F: evaluation results, P0 logs/screenshots, and trust test captures; retain as evidence.

## Resume verification

- `.git/index.lock` absent at resume verification.
- Current branch: `frontend/v4-three-core-redesign`.
- Current HEAD and rollback reference: `80351be4a57111d6d1ac1f518827fd5b2e81d550`.
- Current worktree status: 235 collapsed entries; 284 exhaustive entries including this report.

## Continuation inventory — 2026-09-26

The stale index lock is absent; the active branch remains `frontend/v4-three-core-redesign` at rollback ref `80351be4a57111d6d1ac1f518827fd5b2e81d550`. No files are staged. Before the seven-screen preview, status was 260 collapsed entries / 313 exhaustive file entries. The original 284-entry inventory remains intact above; subsequent paths are classified below.

| Category | Current count | Change since baseline |
|---|---:|---:|
| A — P0 remediation | 24 | 0 |
| B — v4 Foundation / App Shell | 34 | +2, including this baseline report |
| C — Community | 19 | +3 |
| D — Trust / Expert shared active infrastructure | 46 | +9 |
| E — unrelated user work | 19 | 0 |
| F — generated/build/temp | 46 | +11 |
| G — unknown / historical deletions | 136 | 0 |

The 29 post-inventory paths are: **C** — `database/migrations/20260926111838_community_nested_comments.sql`, `database/migrations/20260926112754_community_expert_request_linkage.sql`, both `docs/reports/COMMUNITY_V4_*.md` reports, the five canonical Community API route files under `frontend/src/app/api/intelligence/community/`, `frontend/src/components/community/community-v4.module.css`, the four rebuilt Community UI components, `frontend/src/lib/communityExpert/promaxDomain.js`, and `frontend/src/lib/server/database/CommunityRepository.js`; **B** — `frontend/src/app/globals.css`; **D** — the Expert review/assessment and realtime API routes, Durable Trust/Expert repositories and services, Expert dispatcher/review service, and durable realtime repository; **F** — the three Supabase CLI seed artifacts under `tmp/community-v4-migration-seed/`. Existing unrelated E and unknown/deleted G paths remain untouched. No stage, commit, stash, reset, clean, or restore was performed.
- Redesign branch was created at the original HEAD while preserving all tracked and untracked work.
- No P0 selective commit was made; checkpoint remains `CHECKPOINT_PARTIAL_WORKTREE`.

## Seven-screen preview inventory — 2026-09-26

The requested visual evidence adds eight generated files under `artifacts/community-v4-review-20260926/` (seven PNG screenshots and `verification.json`), classified F. The review report `docs/reports/COMMUNITY_V4_VISUAL_REVIEW.md` is Community documentation, classified C. Current status after those additions: **264 collapsed entries / 324 exhaustive file entries**. Updated category counts are A 24, B 34, C 19, D 46, E 19, F 46, G 136. The temporary Playwright runner was removed after use. Nothing was staged or committed.
