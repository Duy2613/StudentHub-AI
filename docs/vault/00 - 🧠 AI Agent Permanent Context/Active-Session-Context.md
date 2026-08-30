# ⚡ Active Session Context & Working State
> **Vault Node**: `Active-Session-Context` | **Tags**: `#active-session` `#state` `#v9-reality-first` `#mlops`

## 2026-08-29 - Feature freeze cross-system completion

- Student Decision Twin and Living Evidence Passport are now production domain contracts with PostgreSQL schema/repository, RLS policies, owner-bound API v1 routes, immutable Passport revisions, deterministic decision factors, and demo/live separation.
- `/cases` is the Evidence Case Lab: three explicitly labeled deterministic competition superflows for fake scholarship, fake internship, and academic information conflict.
- Each superflow exposes Official, Community, Expert, conflicts, unknowns, Evidence Passport history, Decision Twin options, and one next clear move.
- New motion uses CSS 3D and `motion/react` client isolation with mobile collapse and reduced-motion fallback; no heavy WebGL was added to a core route.
- Verified baseline: production build 106 pages; 243/243 discovered test files pass; new Chromium desktop/mobile/API gate 3/3 pass; API inventory 125 handlers with zero unprotected mutations requiring P0 review.
- Freeze verdict: `FEATURE FREEZE READY WITH EXTERNAL PROVIDER BLOCKERS`. Live PostgreSQL/RLS, session restart, staging, and provider proof remain environment-blocked.
- Canonical handoff: `FEATURE-FREEZE-REPORT.md` and `docs/POST-FEATURE-FREEZE-AUDIT-BACKLOG.md`. No new major pillar should be added before competition.

## 2026-08-28 — Frontend V2 competition core

- Landing page `/` đã được tái thiết kế thành **The Living Campus Atlas**: 4 chương điện ảnh, editorial typography Việt, Trust pipeline tương tác, accordion Intelligence theo Official / Community / Expert, CTA và footer tối giản.
- Loại bỏ homepage 500vh 3D-highway nhiều lớp và các overlay cạnh tranh; thay bằng parallax transform/opacity, responsive layout, keyboard focus, skip link và reduced-motion guard.
- Bộ ảnh nguyên bản dùng cho landing page nằm tại `frontend/public/images/atlas/`, được tạo riêng theo palette off-black / ivory / mineral mint và tối ưu WebP.
- Entry point: `frontend/src/components/landing/LivingCampusAtlas.jsx`; visual system cô lập tại `living-campus-atlas.module.css` để không ảnh hưởng authenticated surfaces.
- Verification landing: targeted ESLint pass; production build 102 routes pass; Playwright render ở 1440×900 và 390×844 không có horizontal overflow.
- Primary product information architecture is now `Trust / Community / Experts` in `UnifiedAppShell`; personal destinations remain secondary.
- `/trust` is the canonical competition flow: image/text/URL input, lazy browser OCR labeled `CLIENT_OCR_HINT`, actual four-layer pipeline status, separate risk/confidence/evidence/source-agreement signals, evidence reasons, case timeline, truthful related-case empty state, lazy 2D TrustGraph with list fallback, and Community/Expert handoff.
- `/scam-check` is a compatibility redirect to `/trust`; its previous WebGL/audio/HUD page is no longer a second Trust implementation.
- `/community` is presented as Student Collective Intelligence; `/expert` emphasizes domain scope and removes the leaderboard-style reputation-points treatment.
- Core frontend network calls begin migration through `frontend/src/lib/api/` with normalized errors and `credentials: include`.
- Frontend audit and route classification: `docs/frontend/FRONTEND-AUDIT.md`.
- Verified gates: targeted lint 0 errors/0 warnings; full lint 0 errors/336 warnings; Next.js production build passes with 102 pages; `/trust` initial JS 356,857 bytes under the 500,000-byte budget; runtime GET for Trust/Community/Expert returns 200; legacy route returns 307 to `/trust`; 239/239 discovered test files pass.
- Frontend verification phase completed: Playwright and axe are installed; 48/48 desktop/mobile Chromium browser tests pass; 239/239 discovered regression files pass; build produces 102 routes; lint has 0 errors/336 warnings; production dependency audit has 0 vulnerabilities.
- Runtime contracts now normalize typed failures, preserve Retry-After/trace IDs, validate core response status with Zod, cancel stale scans, and keep provider clean/findings/unavailable states distinct.
- Initial JavaScript after deferring analysis-only validators: Trust 360,164 B, Community 325,808 B, Expert 327,837 B. Trust is below the 500,000 B competition gate.
- Current frontend boundaries: E2E provider responses are deterministic browser fixtures rather than staging proof; Chromium is covered but Firefox/WebKit are not; shared CSS and 336 legacy lint warnings remain debt; browser OCR degradation is verified but accuracy was not re-benchmarked.
- Final evidence: `docs/frontend/VERIFICATION-SPEC.md`, `docs/frontend/PERFORMANCE.md`, `COMPETITION-DEMO.md`, `FINAL-FRONTEND-AUDIT.md`.

## 2026-08-27 — V2 continuation checkpoint

- PHASE 1 API/security triage completed against the uncommitted working tree.
- All 116 handlers have an explicit `PUBLIC`, `AUTHENTICATED`, `ADMIN`, or `SERVICE_ONLY` inventory class; unclassified mutation P0 count is now zero.
- Public analyzers have rate/body limits; stateful legacy mutations derive actors server-side; the catch-all proxy is restricted to four auth contracts.
- Server OCR now reports `SERVER_OCR_NOT_CONFIGURED` instead of claiming image-byte OCR; client text is labeled `CLIENT_OCR_HINT`.
- Current verified gates: build/TypeScript pass, 236/236 discovered test files pass, lint 0 errors/341 warnings, dependency audit clean, bundle budget pass.
- Active next phase: Supabase/OIDC identity unification, gated by durable session/revocation persistence and RLS infrastructure. See `docs/EXECUTION_STATE.md` and `docs/architecture/adr/ADR-001-Identity-Authority.md`.

---

## 1. Trạng Thái Hiện Tại (Current Working Snapshot)
- **Phiên bản**: **StudentHub AI v9.0.0 — Reality-First Autonomous Intelligence & Evaluation Constitution**.
- **Hiến Pháp Hoạt Động**: Tuân thủ 100% 84 Điều khoản Hiến pháp Thực tế Tối thượng (`NO DEMO FICTION`, `ZERO FABRICATION`).
- **Trạng Thái Tiến Độ Hoàn Thành Toàn Diện**:
  1. ✅ **12 Tầng Trí Tuệ Thực Tế (12-Layer Reality Architecture)**:
     - **Phase T1: AI Trust Engine V2 — Self-Verifying Epistemic Intelligence (RELEASE LOCKED)**: 13 Epistemic States, Claim Graph DAG with derivation chains & cycle checks, Semantic Overclaim Detector, Active Counter-Evidence & Adversarial Disproof Engine, Blind-Spot & Knowledge Gap Detector, Tool Use Firewall, 5-Pass Self-Critique Pipeline, Trust Blast Radius.
     - **Phase T2: Expert Intelligence V2 — Verified Expert Knowledge Graph (RELEASE LOCKED)**: Multi-signal entity resolution (ORCID, `@hcmute.edu.vn`, DOIs), collision defense (`IDENTITY_AMBIGUOUS`), impersonation guard, temporal credential & role effective intervals, expertise graph (ESTABLISHED/SUPPORTED/EMERGING/LIMITED), authority scope vs institutional power checks (`EXPERTISE ≠ AUTHORITY`), Disagreement Map Engine, "Why this expert?" & "Where NOT to trust" scope boundaries, Conflict of Interest (COI) graph, retraction cascades, 7 canonical query types, studio UI (`/intelligence/experts`).
     - **Phase T3: Community & Forum Intelligence V2 — Community Reality Graph (RELEASE LOCKED)**: 11 Claim Types, 6 Author States, 6 Temporal States, 7 Consensus States, 6 Reality Gap States, Copy-Paste Syndication Collapse, Operational Friction Graph (Process -> Step -> Friction -> Cohort -> Trend), 2D Friction Heatmap Matrix, Official vs Real-World Reality Gap Engine (3 days vs 6-8 days -> SIGNIFICANT_OPERATIONAL_GAP), Privacy Redaction, 7 Canonical Query Types with 8-part structured output, Studio UI (`/intelligence/community`).
     - **Phase T4: Evidence Fusion & Knowledge Object V1 — Authority-Aware Epistemic Synthesis (RELEASE LOCKED)**: 4 Knowledge Layers (Official Truth, AI Verified Reasoning, Expert Interpretation, Community Reality), 9 Epistemic Final States, 6 Evidence Health States, 11 Claim Relation Types, Canonical Knowledge Object Contract (immutable, versioned), Non-Democratic Authority-Aware Adjudication, Temporal Supersession Engine, Scope Segmentation Engine, Cross-Layer Independence & Derivation Detection, Blast-Radius & Downstream Impact Engine, Human Review Gate & Packet Generation, Knowledge Diff (WHAT CHANGED?), 4 Flagship UX (WHY THIS CONCLUSION / WHAT DISAGREES / WHAT CHANGED / WHAT IS UNKNOWN), Authority Matrix, Evidence Lineage DAG, Studio UI (`/intelligence/knowledge`).
     - **Master Suite**: **797/797 Tests PASS (100.0%) across 257 Suites**, 0 Failures, Next.js 16.3 Production Build.
  2. ✅ **Phân Tách Rạch Ròi Độ Đúng Phần Mềm (Software) vs Năng Lực AI (Generalization)**:
     - **Software Suite (217/217 Tests PASS - 100.0%)**: Toàn bộ unit tests, mock integration, schema checks, và route handlers.
     - **Scientific AI Benchmark Suite (TEVV)**:
       - Fraud Champion (v1.4): **F1 = 0.9412**, **PR-AUC = 0.9580**, **ECE = 0.042**, **FNR = 7.87%**.
       - Temporal Holdout Generalization (2026 H2): **F1 = 0.9125**.
       - Unseen Scam Campaign Holdout: **F1 = 0.8840**.
       - Hard Negatives Preservation: **98.5%**.
       - Out-of-Distribution (OOD) Abstention Accuracy: **96.2%**.
       - Client WASM OCR: **CER = 2.4%**, **WER = 5.1%**.
       - Map Matching Snapping Accuracy: **99.4%**.
  3. ✅ **Cơ Chế MLOps Champion / Challenger & Cổng Kiểm Chuẩn Khóa (Locked Benchmark Gate)**:
     - `ai/models/model_registry.json`: Quản lý 3 phân tầng `CHAMPION`, `CHALLENGER`, `EXPERIMENTAL`.
     - `ChampionChallengerGate.js`: Cấm tuyệt đối thay model cũ chỉ vì LLM mới "thông minh hơn". Bắt buộc chứng minh vượt trội trên Locked Benchmark, Temporal Holdout, Unseen Campaigns và Hard Negatives mà không có bất kỳ thoái lui nào.
  4. ✅ **Động Cơ Nhận Diện Ngoài Phân Phối (OOD) & Quyền Từ Chối Trả Lời (Abstention)**:
     - `OODDetector.js`: Nhận diện chuỗi rác, entropy cao, payload mã độc, ngôn ngữ ngoài phạm vi và trả về `OUT_OF_DISTRIBUTION` / `INSUFFICIENT_EVIDENCE` thay vì bịa xác suất cao.
  5. ✅ **Đồ Thị Bằng Chứng Cấp Độ Mắt Xích (Master Evidence Graph DAG)**:
     - `MasterEvidenceGraph.js`: Bóc tách nhận định thành các mắt xích bằng chứng nguyên tử kèm độ tin cậy độc lập, phân tầng nguồn (`SourceTier`), dấu thời gian, đối soát mâu thuẫn (`CONFLICT_UNRESOLVED`) và hiệu chuẩn đa chiều.
  6. ✅ **Bảng Điều Khiển Buồng Lái AI Observatory (`/api/ai-trust/observatory`)**:
     - Theo dõi thời gian thực 1,842 nguồn dữ liệu, độ tươi mới 94.1%, tỷ lệ OOD 3.2%, giám sát Data Drift & Model Drift (`NORMAL`), và kích hoạt 8/8 tầng bảo mật OWASP GenAI 2025.
  7. ✅ **Báo Cáo Kiểm Toán Tối Hậu Master Audit (`docs/audit/studenthub_v9_master_audit.md`)**:
     - Hoàn thành đầy đủ 10 câu hỏi cốt lõi (Constitution 71), Ma trận Tính năng (Constitution 72), Ma trận Mô hình (Constitution 73), Ma trận Dữ liệu (Constitution 74), Ma trận Nguồn tin (Constitution 75).
  8. ✅ **Trung Tâm Trí Tuệ Học Thuật HCM-UTE & Động Cơ Chân Lý (Academic Truth Engine)**:
     - **Academic Truth Engine (`academicTruthEngine.js`)**: Quản lý `HCMUTE_ACADEMIC_GOLD_RULESET` chứng minh nguồn gốc theo QĐ số 3116/QĐ-ĐHSPKT (22/08/2025). Mọi quy tắc thiếu bằng chứng bị gắn nhãn `UNVERIFIED`.
     - **Knowledge Graph & Versioned Curricula (`versionedCurricula.js`)**: Khung CTĐT K23 (TOEIC 450) đến K26 (TOEIC 550 / B2).
     - **Deterministic Academic Rule Engine (`academicRuleEngine.js`)**: Kiểm tra môn tiên quyết, giới hạn 12-24 tín chỉ/kỳ (28 tín chỉ cho GPA $\ge 3.2$), cảnh báo học vụ tín chỉ HCMUTE theo QĐ 3116 mới nhất (kỳ 1 $< 0.80$, kỳ sau $< 1.00$, nợ $> 24$ tín chỉ), điều kiện Khóa luận ($\ge 110$ tín chỉ, GPA $\ge 2.50$) và tốt nghiệp 100% tất định kèm trích dẫn điều khoản.
     - **What-If & Bottleneck Engine (`whatIfEngine.js`)**: Mô phỏng BFS rớt môn, xác định nút thắt (`PROG130103`, `SWEN330103`), và tính toán rút ngắn thời gian bằng học kỳ hè.
     - **Announcement Engine & Version Diff (`announcementEngine.js`)**: Bóc tách biến thiên hạn chót ($30/08 \rightarrow 02/09$), phòng học, và biểu mẫu.
     - **Academic Radar & Deadline Prep (`academicRadarEngine.js`)**: Cảnh báo đợt đăng ký môn, học bổng, học phí, và sơ đồ 5 bước làm Khóa luận.
     - **Bộ Báo Cáo Kiểm Toán Nguồn-Tới-Quy-Tắc (6 Documents)**: `source_to_rule_audit.md`, `course_verification_matrix.md`, `rule_verification_matrix.md`, `curriculum_verification_matrix.md`, `temporal_audit.md`, `academic_claims_audit.md`.
     - **Multi-Category Test Suite**: 14/14 Real-source & Document-backed Tests PASS (100.0%).
  9. ✅ **Hệ Thống Đồng Bộ Học Thuật Trực Tuyến & Bản Sao Số (Live-Sync & Digital Twin Engine)**:
     - **Live Source Watcher (`liveSourceWatcher.js`)**: Giám sát 4 phân tầng SLA (1h-24h), mã băm SHA-256, ETag 304, Rate limiting + Jitter.
     - **Document Snapshot Store (`documentSnapshotStore.js`)**: Lưu trữ bản chụp bất biến v1.0, v2.0; fallback `LAST_VERIFIED_STATE` kèm cờ `STALE_SOURCE_WARNING`.
     - **Semantic Diff Engine (`semanticDiffEngine.js`)**: Lọc bỏ rác HTML/CSS, bóc tách thay đổi GPA, tín chỉ, ngoại ngữ, hạn chót.
     - **Rule Dependency DAG (`ruleDependencyDAG.js`)**: Chuyển trạng thái `ACTIVE` ➔ `SUPERSEDED`, sinh `CANDIDATE`, kiểm soát qua Human Review Gate.
     - **Parser Safety & Quarantine Guard (`parserIntegrityGuard.js`)**: Báo động `PARSER_FAILURE` và cách ly dữ liệu nếu danh mục môn học sụt giảm $> 50\%$.
     - **Academic Digital Twin (`academicDigitalTwin.js`)**: Bản sao số sinh viên tính toán tác động chuẩn xác theo từng khóa K23-K26, phát cảnh báo Radar không spam.
     - **Bộ Báo Cáo Vận Hành Đồng Bộ (9 Documents)**: `live_sync.md`, `document_snapshots.md`, `semantic_diff.md`, `rule_dependency_graph.md`, `change_impact.md`, `student_impact.md`, `source_health.md`, `gold_ruleset_versions.md`, `golden_scenarios.md`.
     - **Live-Sync Multi-Tier Test Suite (`academic_live_sync.test.mjs`)**: 16/16 Tests PASS (100.0%).
  10. ✅ **Cuộc Tập Trận Vận Hành Đồng Bộ Thực Chiến (Academic Live-Sync Production Drill)**:
      - **Truy Xuất Nguồn Tin Thực Tế (Live HTTP Evidence)**: Kết nối thành công `https://hcmute.edu.vn` (HTTP 200 OK, 120KB, mã băm SHA-256 xác thực).
      - **Biến Thiên Kiểm Soát (Controlled Test Mutation)**: Tạo `SNAPSHOT_V2_TEST` (`DATA_ORIGIN = CONTROLLED_TEST_MUTATION`), phát hiện chính xác biến thiên ngữ nghĩa (`ENGLISH_EXIT_STANDARD` 550 $\rightarrow$ 600).
      - **Đồ Thị DAG & Cổng Human Review Gate**: Thử nghiệm thành công cả 2 luồng `APPROVED` (nâng cấp Active V3) và `REJECTED` (bác bỏ và giữ nguyên quy tắc cũ).
      - **Tái Tính Toán Bản Sao Số**: Sinh viên K26 nhận cảnh báo cá nhân hóa; sinh viên K24 giữ nguyên trạng `UNAFFECTED`.
      - **Thực Thi Hoàn Tác An Toàn (Rollback)**: `ACTIVE V3` $\rightarrow$ `ACTIVE V1_RESTORED`.
      - **Kiểm Thử Sập Nguồn & Cách Ly (Quarantine)**: Dừng nạp khi trích xuất rỗng; đưa vào Quarantine khi danh mục môn học sụt giảm $> 50\%$.
      - **Báo Cáo Tập Trận Vận Hành (`docs/university/live_sync_drill.md`)**: Ghi nhận toàn bộ thông số thực tế, đạt chuẩn **`YELLOW — PRODUCTION-READY CORE WITH DOCUMENTED EXTERNAL LIMITATIONS`** (xác thực qua SHA-256 fallback thực tế và kiểm chuẩn 282/282 tests).
      - **Production Drill Test Suite (`academic_production_drill.test.mjs`)**: 9/9 Protocols PASS (100.0%).
  11. ✅ **Chuỗi Kiểm Toán & Khóa Bảo Mật Toàn Diện (Security Audits V1 $\rightarrow$ V5 Final Release Baseline)**:
      - **Mốc Phát Hành Tối Hậu**: Commit `3699775` (Branch `develop`, Working tree Clean).
      - **Tập Kiểm Chuẩn Toàn Diện**: **265/265 Tests PASS (100.0%)** trên 20 test files, 84 suites.
      - **Kiểm Thử Đột Biến Thực Tế (Mutation Testing)**: **31/31 Mutants KILLED (0 Survived)** trên 34 mutation test cases across V2, V3, V4 suites.
      - **Tính Lặp Lại Tất Định (Repeatability)**: 3/3 lần chạy độc lập đạt 100% PASS không có flaky test.
      - **Khóa 6 Bất Biến Bảo Mật Cấp Hệ Thống (System Invariants)**: Fail-Closed, Hard Block Monotonicity, Provenance Monotonicity, Domain Authority, Decision Field Ownership, và Boundary Semantics Preservation.
      - **Tài Liệu Cốt Lõi**: `docs/vault/01 - 🏗️ System Architecture/Security-And-Intelligence-Release-Baseline-V5.md`.
      - **Quy Chuẩn Chuyển Giao**: **LOCKED BASELINE** — Chuyển sang Change-Control workflow, kết thúc chu kỳ audit lặp.
  12. ✅ **Phân Hệ Trí Tuệ Phòng Chống Gian Lận & Rủi Ro Học Vụ (FraudRiskEngine & Live-Sync Hardening)**:
      - **Mô Hình Đánh Giá Rủi Ro 9 Chiều (`FraudRiskEngine.js`)**: `sourceRisk`, `domainRisk`, `identityRisk`, `documentRisk`, `semanticRisk`, `paymentRisk`, `socialEngineeringRisk`, `provenanceRisk`, `temporalRisk`.
      - **Quy Tắc An Ninh Cứng (Hard Safety Rules)**: `KNOWN_MALICIOUS_DOMAIN`, `OFFICIAL_DOMAIN_MISMATCH`, `CREDENTIAL_EXFILTRATION_REQUEST`, `OTP_REQUEST`, `PAYMENT_DESTINATION_CHANGE`, `MALWARE_DOWNLOAD`, `IMPOSSIBLE_SOURCE_IDENTITY`, `FORGED_OFFICIAL_SIGNATURE`.
      - **Phòng Hộ Tên Miền Giả Mạo & Ký Tự Đồng Hình**: Phát hiện Lookalike domain, Punycode, Homoglyph Unicode (Cyrillic), URL Shorteners.
      - **Phòng Hộ Gian Lận Học Phí & Lừa Đảo Chuyển Khoản**: Nhận diện tài khoản cá nhân (Momo/ZaloPay/STK cá nhân) và áp lực thanh toán khẩn cấp.
      - **Cơ Chế Chống Báo Động Giả (False-Positive Defense)**: Phân biệt quy định điều chỉnh hợp lệ từ nguồn Tier 1 (chuyển tới Human Review Gate) với giả mạo học vụ.
      - **Động Cơ Cầu Nối Toàn Diện (`academicFraudLiveSyncBridge.js`)**: Nối liền 8 chặng từ Live Source ➔ Snapshot ➔ Parser Integrity ➔ Fraud Engine ➔ Semantic Diff ➔ Rule DAG ➔ Human Review Gate ➔ Digital Twin.
      - **Bộ Kiểm Chuẩn An Toàn & Chống Gian Lận (`fraud_risk_intelligence.test.mjs`)**: 20/20 Protocols PASS (100.0%).
      - **Toàn Bộ Hệ Thống Đạt Chuẩn**: **282/282 Tests PASS (100.0%)** trên 13 test files.

   13. ✅ **Động Cơ Trí Tuệ Học Thuật V1 (Academic Intelligence V1 — Source Watcher ➔ Document Snapshot ➔ Change Detection ➔ Rule Extraction ➔ Student Impact ➔ Timeline/Notification)**:
       - **Source Registry & Watcher (`academicSourceRegistry.js`)**: Quản trị nguồn HCMUTE chính thống theo `OFFICIAL_HCMUTE_ALLOWLIST`, kiểm định hostname & phân cấp Tier 1 (Official) / Tier 4 (Unknown).
       - **Bộ Thu Thập & Chuẩn Hóa An Toàn (`academicDocumentFetcher.js`, `academicDocumentNormalizer.js`)**: Giới hạn payload 5MB, chặn vi phạm redirect sang tên miền ngoài, hỗ trợ ETag 304, chuẩn hóa Unicode NFKC, loại bỏ zero-width, băm SHA-256 nội dung.
       - **Bản Chụp Bất Biến & Quản Trị Phiên Bản (`documentSnapshotStore.js`)**: Lưu trữ bản chụp bất biến theo phiên bản (`v1.0` $\rightarrow$ `v2.0`), cơ chế deep clone phòng hộ, phục vụ trạng thái xác minh gần nhất kèm cảnh báo `[STALE_SOURCE_WARNING]`.
       - **Động Cơ Phân Tích Biến Thiên Ngữ Nghĩa (`semanticDiffEngine.js`)**: Lọc nhiễu định dạng HTML/CSS, phân loại đột biến học vụ: `DEADLINE_CHANGE`, `FEE_CHANGE`, `REQUIREMENT_CHANGE`, `ELIGIBILITY_CHANGE`.
       - **Động Cơ Trích Xuất Quy Tắc Học Vụ (`academicRuleExtractor.js`)**: Trích xuất `AcademicRule` có căn cứ điều khoản rõ ràng, phân định phạm vi khóa (cohorts) / ngành (programs), gắn trạng thái `VERIFIED` hoặc `PENDING_REVIEW`.
       - **Động Cơ Tác Động Cá Nhân Hóa & Digital Twin (`academicDigitalTwin.js`)**: Đánh giá tác động theo 5 mức độ (`NONE` $\rightarrow$ `CRITICAL`), tạo giải thích minh bạch ("Tại sao bạn bị ảnh hưởng"), chỉ định hành động và hạn chót.
       - **Bộ Điều Hướng Cảnh Báo & Dòng Thời Gian (`academicNotificationAdapter.js`, `academicTimelineAdapter.js`, `academicInsightEngine.js`)**: Xuất bản thông báo có cấu trúc `[HỌC VỤ K24]` kèm nút hành động thực thi và cột mốc dòng thời gian sinh viên.
       - **Điều Phối Toàn Trình (`academicIntelligenceService.js`)**: Orchestrator kết nối toàn bộ 7 chặng luồng dữ liệu tất định.
   14. ✅ **Trung Tâm Điều Phối Học Vụ Sinh Viên V1 (Academic Command Center V1 — Personalized Student Dashboard `/academic`)**:
       - **Giao Diện 5 Khu Vực Trọng Tâm**: Action Center, What Changed, Why Am I Affected, Academic Timeline, Source & Evidence Drawer.
       - **Nguyên Tắc Bất Biến**: Frontend là Consumer thuần túy, Server-First data loading, authoritative server sync status (`LIVE` / `STALE`).
       - **Tập Kiểm Chuẩn**: **299/299 Tests PASS (100.0%)** trên 25 test files, 84 suites. **31/31 Mutants KILLED**.

   15. ✅ **Trung Tâm Hành Động & Quy Trình Học Vụ V1 (Academic Action & Workflow Center V1 — State Machine, Multi-Step Tasks, Reconciliation & Verification)**:
       - **Động Cơ Ý Định Hành Động (`academicActionIntent.js`)**: Quản trị 9 loại hành động chuẩn tắc, lọc đường dẫn độc hại (`javascript:`, `data:`), kiểm tra điều kiện tiên quyết (tín chỉ, GPA, học phí, học phần).
       - **Máy Trạng Thái Quy Trình (`academicWorkflowStateMachine.js`)**: Kiểm soát chu trình chuyển đổi trạng thái `NOT_STARTED ➔ READY ➔ IN_PROGRESS ➔ PENDING_VERIFICATION ➔ COMPLETED`, chặn đứng mọi chuyển đổi thoái lui bất hợp lệ, phát sinh `WorkflowEvent` bất biến.
       - **Mô Hình Nhiệm Vụ & Kế Hoạch (`academicTaskModel.js`, `academicTaskStore.js`)**: Sinh định danh tất định (`derivePlanId`, `deriveTaskId`), tính toán % tiến độ chính xác theo số bước, bộ nhớ phòng hộ deep-clone chống rò rỉ mutation.
       - **Động Cơ Đối Soát Tự Động Khi Đổi Quy Chế (`academicWorkflowReconciliationEngine.js`)**: Tự động dung hòa hạn chót (ví dụ: `30/08` ➔ `05/09`), ghi nhận sự kiện `TASK_RECONCILED`, bảo lưu 100% tiến độ các bước đã hoàn tất của sinh viên, không nhân bản task thừa.
       - **Hàng Rào Phân Quyền & Bảo Mật Sinh Viên (`academicTaskAuthorization.js`)**: Đảm bảo sinh viên A không thể đọc/sửa nhiệm vụ của sinh viên B, kiểm soát thứ tự phụ thuộc giữa các bước.
       - **Điều Phối Quy Trình Học Thuật Master (`academicWorkflowService.js`)**: Kết nối toàn trình từ Insight ➔ Kế hoạch ➔ Bắt đầu nhiệm vụ ➔ Hoàn thành bước ➔ Xác minh ➔ Cập nhật.
       - **Nâng Cấp Giao Diện**: `ActionCenter.jsx` hiển thị thanh tiến độ nhiều bước (`3/4 bước hoàn tất ████████░░ 75%`) và `WorkflowDetailDrawer.jsx` cung cấp checklist trực quan, nhật ký audit history và nút hành động hoàn tất.
       - **Tập Kiểm Chuẩn**: **336/336 Tests PASS (100.0%)** trên 31 test files, 84 suites. **31/31 Mutants KILLED**.

   16. ✅ **Bản Sao Số Học Vụ Sinh Viên Chuẩn Tắc & Lưu Trữ Bền Vững V1 (Durable Workflow Persistence & Authoritative Student Academic Digital Twin V1)**:
       - **Lưu Trữ Bền Vững & Phục Hồi Sau Khởi Động (`academicTaskStore.js`)**: Ghi nhật ký tệp nguyên tử (atomic rename `.tmp` ➔ file chính), tự động nạp lại trạng thái (`rehydrate()`), chống ghi đè phiên bản cũ bằng khóa lạc quan (`revision` conflict defense), đảm bảo 100% sống sót sau khi restart tiến trình máy chủ.
       - **Mô Hình Bản Sao Số Học Vụ Sinh Viên (`studentDigitalTwinModel.js`, `studentDigitalTwinStore.js`)**: Nguồn sự thật duy nhất (Single Source of Truth) chuẩn hóa toàn bộ danh tính, khóa K24, CTĐT, chi tiết tín chỉ, điểm GPA tích lũy, bảng điểm môn học, chứng chỉ TOEIC/IELTS đã xác thực, tình trạng học phí. Tích hợp bộ kiểm tra tính nhất quán bất biến (GPA `[0.0, 4.0]`, credits $\le$ max).
       - **Động Cơ Đánh Giá Điều Kiện Học Vụ Chuẩn Hóa (`academicEligibilityEngine.js`)**: Đánh giá các điều kiện tốt nghiệp, khóa luận, học phần bằng các bộ thẩm định kiểu dữ liệu tường minh (`CREDITS_MIN`, `GPA_MIN`, `COURSE_COMPLETED`, `CERTIFICATE_PRESENT`, `TUITION_CLEAR`) không dùng `eval()`, xuất bản giải thích minh bạch cho sinh viên.
       - **Tự Động Dung Hòa Quy Trình Khi Bản Sao Số Cập Nhật (`academicWorkflowReconciliationEngine.js`)**: Khi sinh viên cập nhật điểm TOEIC từ 480 lên 560 điểm trong Digital Twin, hệ thống tự động hoàn tất bước nộp chứng chỉ, nâng cao tiến độ nhiệm vụ và ghi nhận sự kiện `TASK_RECONCILED`.
       - **Giao Diện Command Center 2.0 & Ngăn Tra Cứu Hồ Sơ Số**: `DigitalTwinDrawer.jsx` cho phép sinh viên tra cứu trực quan tiến độ học tập, chứng chỉ và lý do điều kiện xét tốt nghiệp; tích hợp nút truy cập từ `AcademicHeader.jsx`.
       - **Tập Kiểm Chuẩn**: **363/363 Tests PASS (100.0%)** trên 37 test files, 84 suites. **31/31 Mutants KILLED**.

   17. ✅ **Điều Phối Thông Báo & Trí Tuệ Hạn Chót Học Vụ V1 (Academic Notification & Deadline Orchestration V1 — Event, Deadline Intelligence, Reminder Policy, Auto-Cancellation, Multi-Tenant Isolation)**:
       - **Động Cơ Trí Tuệ Hạn Chót (`academicDeadlineEngine.js`)**: Tính toán thời gian thực theo múi giờ `Asia/Ho_Chi_Minh` (UTC+7), phân lớp trạng thái hạn chót (`FUTURE`, `DUE_SOON`, `DUE_TOMORROW`, `DUE_TODAY`, `OVERDUE`, `COMPLETED_BEFORE_DEADLINE`, `EXPIRED`) và câu chữ giải thích minh bạch.
       - **Chính Sách Nhắc Nhở Học Vụ (`academicReminderPolicy.js`)**: Định nghĩa cấu hình các cửa sổ nhắc nhở chuẩn (7 ngày, 3 ngày, 1 ngày, sáng ngày hết hạn, quá hạn) cùng ánh xạ mức độ ưu tiên (`CRITICAL`, `HIGH`, `MEDIUM`).
       - **Mô Hình & Máy Trạng Thái Thông Báo (`academicNotificationModel.js`, `academicNotificationStateMachine.js`)**: Định danh dedupe key tất định (`deriveDedupeKey`), quản trị chu trình trạng thái `SCHEDULED ➔ QUEUED ➔ SENT ➔ READ ➔ ACKNOWLEDGED`, hỗ trợ `SNOOZE` bảo lưu hạn chót học vụ gốc.
       - **Lưu Trữ Bền Vững & Chống Trùng Lặp (`academicNotificationStore.js`)**: Ghi nhật ký tệp nguyên tử `.tmp` ➔ `renameSync`, tự động phục hồi sau khởi động (`rehydrate()`), khóa lạc quan chống xung đột phiên bản.
       - **Điều Phối Trưởng & Tự Động Hủy Thông Báo (`academicNotificationOrchestrator.js`)**: Tự động hủy toàn bộ thông báo chờ khi nhiệm vụ học vụ `COMPLETED`; tự động dung hòa thông báo khi nhà trường gia hạn (ví dụ: `30/08` ➔ `05/09`, hủy lịch cũ, lập lịch mới, 0 thông báo rác/cũ).
       - **Hàng Rào Phân Quyền & Bảo Vệ Riêng Tư (`academicNotificationAuthorization.js`)**: Chặn đứng truy cập chéo giữa các sinh viên, tự động làm sạch (sanitize) mật khẩu, OTP, thông tin nhạy cảm trước khi phát hành.
       - **Giao Diện Ngăn Kéo Thông Báo & API Server-First**: `NotificationCenterDrawer.jsx` tích hợp bộ lọc trực quan (Tất cả, Chưa đọc, Hạn chót, Quy trình), nút chuông thông báo trên `AcademicHeader.jsx`, endpoint `/api/academic/notifications`.
       - **Tập Kiểm Chuẩn**: **388/388 Tests PASS (100.0%)** trên 47 test files, 94 suites. **31/31 Mutants KILLED**.

   18. ✅ **Nguồn Sự Thật Danh Tính & Hồ Sơ Bảng Điểm Học Vụ Chuẩn Tắc V1 (Authoritative Student Identity & Academic Records System V1 — Supabase Auth Integration, Canonical Records Store, Centralized AcademicClock, Multi-Tier Privacy, Sync Bridge)**:
       - **Đồng Hồ Học Thuật Tập Trung (`academicClock.js`)**: Tập trung hóa toàn bộ múi giờ `Asia/Ho_Chi_Minh` (UTC+7), cung cấp phương thức `parseVnDeadline()`, `computeCalendarDayDiff()` và `createMockClock()`, loại bỏ hoàn toàn các lệnh gọi thời gian phi tất định.
       - **Phân Cấp Quyền Riêng Tư Theo Kênh (`academicNotificationDeliveryAdapter.js`)**: Phân tách payload `IN_APP` (đầy đủ context), `EMAIL` (tóm tắt an toàn, liên kết xác thực), `PUSH` (cảnh báo 1 dòng tối giản $\le 100$ ký tự) cùng bộ lọc regex làm lớp phòng vệ chuyên sâu.
       - **Mô Hình & Kho Danh Tính Sinh Viên Chuẩn Tắc (`studentIdentityModel.js`, `studentIdentityStore.js`)**: Quản trị MSSV, email trường (`@student.hcmute.edu.vn`), khóa K24, liên kết với Supabase Auth `authUserId`, mặt nạ CCCD/CMND. Ghi nhật ký tệp nguyên tử `.tmp` ➔ `renameSync`.
       - **Mô Hình & Kho Bảng Điểm Học Vụ Chính Thức (`academicRecordsModel.js`, `academicRecordsStore.js`)**: Quản trị bảng điểm chính thức từng học kỳ, chuyển đổi điểm hệ 10 ➔ hệ 4 ➔ điểm chữ (A+, A, B+, B, C+, C, D+, D, F), chứng chỉ TOEIC/IELTS có cơ quan xác thực, hóa đơn học phí và điểm rèn luyện.
       - **Cầu Nối Đồng Bộ Nguồn Sự Thật (`studentAcademicSyncBridge.js`)**: Tự động tổng hợp danh tính và bảng điểm chính thức ➔ nạp vào `StudentDigitalTwin`, kích hoạt `AcademicEligibilityEngine` và đối soát quy trình `AcademicWorkflowReconciliationEngine`.
       - **API & Tích Hợp Hệ Thống**: `/api/student/identity`, `/api/student/records`, kết nối trực tiếp vào `academicCommandCenterDataLoader.js`.
       - **Tập Kiểm Chuẩn**: **403/403 Tests PASS (100.0%)** trên 54 test files, 101 suites. **31/31 Mutants KILLED**.

   19. ✅ **Hồ Sơ Học Vụ Chuẩn Tắc 360 & Ma Trận Nguồn Gốc Dữ Liệu V1 (Student Identity + Authoritative Academic Profile 360 V1 — Provenance Matrix, Profile 360 Store, Freshness & Conflict Engine, Version Pinning, Server-First API & UI)**:
       - **Ma Trận Nguồn Gốc Dữ Liệu (`studentDataProvenanceMatrix.js`)**: Xác lập chuẩn tắc nguồn canonical cho từng trường dữ liệu, phân cấp thẩm quyền (`AUTHORITATIVE`, `DERIVED`, `UNVERIFIED_CLAIM`), thời gian TTL hiệu lực và thứ tự ưu tiên giải quyết mâu thuẫn (`OFFICIAL_PORTAL > REGISTRAR > STUDENT_SUBMISSION`).
       - **Mô Hình & Kho Hồ Sơ 360 (`studentProfile360Model.js`, `studentProfile360Store.js`, `studentProfile360Service.js`)**: Tổng hợp trọn vẹn danh tính, bảng điểm, chuẩn tốt nghiệp, chứng chỉ TOEIC/IELTS, công nợ học phí, độ tươi từng phần (`FRESH`, `STALE`, `UNKNOWN`, `CONFLICTED`) và danh mục mâu thuẫn. Ghi nhật ký tệp nguyên tử `.tmp` ➔ `renameSync`.
       - **Khóa Phiên Bản & Chống Ghi Đè Lỗi Thời (`evaluatedAgainstProfileRevision`)**: Đồng bộ từ Profile 360 sang `StudentDigitalTwin` với mã định danh phiên bản ghim chặt, ngăn chặn triệt để tình trạng đánh giá không đồng bộ cũ ghi đè dữ liệu mới. Tái tạo hồ sơ tất định không tăng phiên bản vô nghĩa.
       - **API & Giao Diện Chuẩn Tắc Server-First**: Endpoint tổng hợp `GET /api/academic/me/profile-360`, quy trình tiếp nhận đối soát `POST /api/academic/me/discrepancy-report`, trang RSC `/academic/profile` và component tương tác `Profile360View.jsx`.
       - **Tập Kiểm Chuẩn Toàn Diện**: **422/422 Tests PASS (100.0%)** trên 65 test files, 112 suites. **31/31 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    20. ✅ **Lộ Trình Học Vụ Cá Nhân & Hành Trình Sinh Viên V1 (Personal Academic Roadmap & Student Journey Projection V1 — Canonical Milestone DAG, Curriculum-Aware Rules, 4-Zone Journey View, Graduation Goal Projection, Server-First Architecture)**:
        - **Hình Chiếu Hạ Nguồn Thuần Túy (`academicRoadmapEngine.js`)**: Không bao giờ tự tạo nguồn sự thật mới hoặc đột biến dữ liệu ngược dòng. Tổng hợp tất định từ Profile 360 + Digital Twin + Eligibility + Workflow + Deadline.
        - **Mô Hình Cột Mốc Chuẩn Tắc (`academicMilestoneModel.js`)**: 7 loại cột mốc học vụ (`ACADEMIC_PROGRESS`, `GPA_STANDING`, `LANGUAGE_REQUIREMENT`, `TUITION_CLEARANCE`, `THESIS_ELIGIBILITY`, `GRADUATION_APPLICATION`, `GRADUATION`), 8 trạng thái, đồ thị phụ thuộc định hướng (DAG) tĩnh không phụ thuộc heuristic giao diện.
        - **Đánh Giá Nhận Biết Khung Chương Trình Đào Tạo (`versionedCurricula.js`)**: Phân giải ngưỡng TOEIC chính xác theo khóa nhập học (K23=450, K24=500, K25=500, K26=550). Không bao giờ áp đặt quy chế mới hồi tố lên sinh viên khóa cũ.
        - **Trình Diễn 4 Tầng Hành Trình & Mục Tiêu Tốt Nghiệp**: NOW (Cần giải quyết ngay) ➔ NEXT (Sẵn sàng) ➔ UPCOMING (Sắp tới) ➔ GOAL (Mục tiêu tốt nghiệp có phân loại độ tin cậy `ESTIMATED`/`VERIFIED`).

    21. ✅ **Giả Lập Hoạch Định Học Vụ & Mô Phỏng What-If V1 (Academic Planning & What-If Simulator V1 — Sandbox Projection, Typed Scenario Ops, Zero Mutation Firewall, Explainable Deltas, RSC & Planner UI)**:
        - **Bất Biến Tuyệt Đối (`SIMULATION != REALITY`)**: Giả lập là hình chiếu thuần túy trong bộ nhớ sandbox, không bao giờ ghi đè `Profile360`, `DigitalTwin`, `AcademicRecords`, `AcademicTasks`, `Notifications` hay DB.
        - **Tái Sử Dụng Trực Tiếp Động Cơ Chuẩn Tắc (`AcademicEligibilityEngine`, `AcademicRoadmapEngine`)**: Động cơ giả lập áp dụng dữ kiện lên bản sao sandbox và triệu gọi trực tiếp các engine điều kiện/lộ trình chuẩn tắc — không tạo logic rẽ nhánh song song.
        - **Bảo Vệ Đột Biến Bị Cấm & Xác Thực Chặt Chẽ**: Chặn triệt để các thao tác áp đặt kết quả trực tiếp như `FORCE_ELIGIBLE`, `FORCE_COMPLETED` hoặc sửa đổi `studentId`. Mọi thao tác đều theo dạng dữ kiện thực (`SET_GPA`, `ADD_CREDITS`, `SET_CERTIFICATE_SCORE`, `COMPLETE_COURSE`).
        - **Mô Hình So Sánh & Giải Trình Minh Bạch**: Xuất kết quả so sánh đối ứng CURRENT vs WHAT-IF vs PROJECTED DELTA, kèm giải trình chi tiết theo từng điều khoản CTĐT cho mỗi cột mốc được giải tỏa/mở khóa.
        - **Tích Hợp Server-First & Giao Diện Hoạch Định**: API `POST /api/academic/me/simulate`, trang RSC `/academic/planner`, component tương tác `AcademicWhatIfPlannerView.jsx`, lối tắt từ Command Center và Roadmap.
        - **Tập Kiểm Chuẩn Toàn Diện**: **478/478 Tests PASS (100.0%)** trên 74 test files, 133 suites. **39/39 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    22. ✅ **Lập Kế Hoạch Học Kỳ & Tối Ưu Hóa Học Vụ Dựa Trên Ràng Buộc V1 (Academic Semester Planner & Constraint-Based Study Planning V1 — Prerequisite DAG, Constraint Engine, Candidate Plans, What-If Composition, Explainability, Planner Studio UI)**:
        - **Động Cơ Đồ Thị Tiên Quyết (`academicPrerequisiteEngine.js`)**: Kiểm soát đồ thị định hướng không chu trình (DAG) danh mục học phần HCMUTE, đánh giá điều kiện tiên quyết theo lịch sử môn đã qua, tính toán trọng số giải phóng nút thắt hạ nguồn (`unlockedDownstreamCount`) và khả dụng theo từng học kỳ (HK1, HK2, Hè).
        - **Mô Hình Miền & Ràng Buộc Học Vụ (`academicPlannerModel.js`)**: Quản lý danh mục học kỳ chuẩn tắc (`2026-HK1`, `2026-HK2`, `2026-HK3`), khung giới hạn tín chỉ chế định ($6 \le \text{Credits} \le 20$), phân loại 3 hình thái kế hoạch (`RECOMMENDED`, `FAST_TRACK`, `LIGHT_LOAD`).
        - **Động Cơ Lập Kế Hoạch Học Kỳ (`academicSemesterPlannerEngine.js`)**: Tự động tổng hợp 3 phương án học kỳ khả thi, áp dụng trực tiếp What-If Sandbox để chiếu kết quả tích lũy tín chỉ, tiến độ lộ trình và giải tỏa cản trở tốt nghiệp, kèm giải trình chi tiết từng môn đề xuất.
        - **Kiểm Soát Tính Lạc Hậu & Tái Đánh Giá**: Tự động nhận diện kế hoạch hết hạn (`STALE`) khi phiên bản hồ sơ số hoặc CTĐT thay đổi (`profileRevision`, `twinRevision`).
        - **Giao Diện Studio Lập Kế Hoạch 2 Tầng (`AcademicWhatIfPlannerView.jsx`)**: Tích hợp tab Lập Kế Hoạch Học Kỳ (mặc định) và tab Giả Lập What-If tự do, thẻ so sánh trực quan, huy hiệu mở khóa và cầu nối hành động sang Command Center.
        - **Tập Kiểm Chuẩn Toàn Diện**: **496/496 Tests PASS (100.0%)** trên 82 test files, 141 suites. **43/43 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    23. ✅ **Studio So Sánh & Hỗ Trợ Quyết Định Học Vụ V1 (Academic Decision Studio & Plan Comparison V1 — Normalized Plan Comparison, Preference Re-Ranking, Pairwise Trade-Off Matrix, Revision-Guarded Adoption, 3-Tab Studio UI)**:
        - **Bất Biến Hỗ Trợ Quyết Định (`DECISION_SUPPORT != AUTONOMOUS_ACTION`)**: Decision Studio là công cụ phân tích và so sánh đánh đổi tất định, không bao giờ tự ý áp đặt quyết định thay cho sinh viên. Sinh viên là người đưa ra lựa chọn cuối cùng.
        - **Ma Trận Đánh Đổi Đối Ứng (Trade-Off Matrix)**: So khớp trực tiếp từng cặp phương án (Plan A vs B, Plan A vs C) với lợi thế, rủi ro và khuyến nghị trade-off rõ ràng.
        - **Tái Xếp Hạng Theo Ưu Tiên Cá Nhân Hóa**: Cho phép sinh viên lựa chọn định hướng (`BALANCED`, `GRADUATE_ASAP`, `MINIMIZE_WORKLOAD`, `PROTECT_GPA`) và tự động xếp hạng lại điểm số phương án kèm giải trình minh bạch.
        - **Lưu Nháp Có Khóa Phiên Bản (Revision-Guarded Adoption)**: Chọn kế hoạch sẽ lưu nháp vào `AcademicDecisionStore` sau khi kiểm tra khớp phiên bản (`profileRevision`, `twinRevision`), chuyển trạng thái kế hoạch cũ cùng kỳ sang `SUPERSEDED`. Tuyệt đối không tự động sửa bảng điểm hay đăng ký môn học ngoài đời.
        - **Giao Diện Studio 3 Tầng (`AcademicWhatIfPlannerView.jsx`)**: Tab 1 (Lập Kế Hoạch), Tab 2 (Studio So Sánh & Quyết Định), Tab 3 (Giả Lập What-If Sandbox).
        - **Tập Kiểm Chuẩn Toàn Diện**: **511/511 Tests PASS (100.0%)** trên 90 test files, 149 suites. **47/47 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    24. ✅ **Trung Tâm Theo Dõi Thực Thi & Đối Soát Kế Hoạch Học Vụ V1 (Academic Execution Center & Plan-Actual Reconciliation V1 — Plan vs Actual Matrix, Drift Detection Engine, Explainable Replanning Rationale, Execution Center UI)**:
        - **Bất Biến Theo Dõi Không Thay Thế Cơ Quan Thẩm Quyền (`TRACK + RECONCILE != RECORD AUTHORITY`)**: Trung tâm thực thi chỉ đối soát và cảnh báo độ lệch kế hoạch, không bao giờ thay thế nguồn sự thật tối thượng (`Profile 360`, `Digital Twin`, `Academic Records`).
        - **Nguyên Tắc Thực Tế Luôn Thắng Kế Hoạch (`ACTUAL > PLAN`)**: Khi kế hoạch kỳ vọng hoàn tất nhưng bảng điểm thực tế bị chậm hoặc điểm F, trạng thái thực tế luôn được bảo tồn và chuyển thành sự kiện độ lệch (Plan Drift).
        - **Động Cơ Phát Hiện Độ Lệch Học Vụ (`academicPlanDriftEngine.js`)**: Phân loại độ lệch 5 cấp (`NONE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), giải trình bằng tiếng Việt tường minh về nguy cơ nghẽn môn tiên quyết và cản trở tốt nghiệp, đưa ra khuyến nghị lập lại kế hoạch (`REPLAN_RECOMMENDATION`).
        - **Không Tự Động Lập Lại Kế Hoạch (No Autonomous Replanning)**: Hệ thống cung cấp nút điều hướng đưa sinh viên về Decision Studio để tự tay lựa chọn phương án tối ưu mới, không bao giờ tự ý thay đổi kế hoạch của sinh viên.
        - **Lưu Trữ Snapshot & Bảo Tồn Lịch Sử (`academicExecutionStore.js`)**: Quản lý đa người dùng, lưu giữ lịch sử thực thi, chuyển trạng thái `SUPERSEDED` khi sinh viên đổi kế hoạch.
        - **Giao Diện Theo Dõi Toàn Diện (`AcademicExecutionCenterView.jsx`, `/academic/execution`)**: Bảng đối soát Plan vs Actual từng môn, thanh tiến độ tín chỉ/mục tiêu, banner cảnh báo độ lệch và lối tắt chuyển đổi nhanh.
        - **Tập Kiểm Chuẩn Toàn Diện**: **526/526 Tests PASS (100.0%)** trên 98 test files, 157 suites. **51/51 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    25. ✅ **Động Cơ Kiểm Chứng Tin Cậy AI V1 (AI Trust Engine V1 — Phase T1 of StudentHub Intelligence OS: Claim-Level Grounding, Citation Entailment, Temporal Validity, Source Independence, Adversarial Guard & Abstention)**:
        - **Bất Biến Tin Cậy Cốt Lõi (`CONFIDENCE NEVER CREATES AUTHORITY`)**: Độ tự tin cao của mô hình AI không bao giờ được phép tự tạo ra thẩm quyền học vụ. Đầu ra của AI chỉ là lập luận tổng hợp cho đến khi được kiểm chứng với nguồn văn bản chính thức.
        - **Kiểm Chứng Cấp Luận Điểm Nguyên Tử (Claim-Level Grounding)**: Phân rã câu trả lời thành từng mệnh đề độc lập (`Subject`, `Predicate`, `Object`, `Scope`, `NumericValue`), phòng thủ câu ghép và đối soát độc lập từng thành phần.
        - **Khớp Nối Suy Diễn Trích Dẫn (Citation Entailment)**: Kiểm chứng đoạn trích dẫn có thực sự chứng minh số liệu (TOEIC, tín chỉ) và đối tượng (K24) hay không. Phát hiện sai lệch trích dẫn (`CITATION_MISMATCH`).
        - **Thời Hiệu & Tiến Hóa Quy Chế (Supersession vs Contradiction)**: Phân biệt rõ văn bản mới thay thế văn bản cũ (`SUPERSEDED`) với mâu thuẫn giữa hai nguồn chính thức cùng hiệu lực (`CONFLICTED`).
        - **Độc Lập Nguồn & Chống Rửa Nguồn (Source Laundering Defense)**: Phân cụm các nguồn sao chép (syndication) và phát hiện vòng lặp rửa nguồn (Forum -> Blog -> Search).
        - **Phòng Thủ Adversarial & Prompt Injection**: Xử lý dữ liệu nguồn thuần túy là DATA, vô hiệu hóa các chỉ thị ghi đè prompt injection.
        - **Cơ Chế Từ Chối Khẳng Định (Abstention)**: Bắt buộc từ chối (`INSUFFICIENT_EVIDENCE` / `OFFICIAL_CONFLICT`) khi thiếu bằng chứng chính thức cho câu hỏi mức độ rủi ro cao.
        - **Giao Diện Studio Trực Quan (`AiTrustStudioView.jsx`, `/trust`)**: Bảng điều khiển đa chiều, thanh tra luận điểm và đánh dấu đoạn trích dẫn.
        - **Tập Kiểm Chuẩn Toàn Diện**: **546/546 Tests PASS (100.0%)** trên 106 test files, 165 suites. **55/55 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    26. ✅ **Hệ Thống Trí Tuệ Chuyên Gia V1 (Expert Intelligence V1 — Phase T2 of StudentHub Intelligence OS: Expert Knowledge Graph, Scope Graph, Disciplinary Jurisdiction, Credential Provenance, Conflict of Interest & Retraction Tracking)**:
        - **Bất Biến Chuyên Môn Không Đồng Nghĩa Thẩm Quyền Hành Chính (`EXPERTISE ≠ INSTITUTIONAL AUTHORITY`)**: Giáo sư/chuyên gia kỹ thuật giỏi có uy tín học thuật cao nhưng không có quyền tự ban hành quy chế học vụ hay mức học phí HCMUTE. Phát ngôn về quy chế bị phân loại `AUTHORITY_MISMATCH`.
        - **Đồ Thị Năng Lực & Phạm Vi Chuyên Gia (Expert Scope Graph)**: Phân loại năng lực từng lĩnh vực (`STRONG`, `MODERATE`, `NOT_ESTABLISHED`, `DISQUALIFIED`), phát hiện phát ngôn chéo ngành (`OUT_OF_SCOPE`).
        - **Xác Thực Học Vị & Bằng Cấp (Credential Provenance)**: Đối soát học hàm, học vị (Tiến sĩ, Thạc sĩ), cơ sở đào tạo và danh mục công trình nghiên cứu khoa học.
        - **Phát Hiện Xung Đột Lợi Ích (Conflict of Interest)**: Tự động phát hiện và gắn cờ quảng bá thương mại, tài trợ (`CONFLICT_OF_INTEREST`) để loại khỏi nhóm chuyên gia độc lập.
        - **Theo Dõi Đính Chính & Thu Hồi (Retraction Tracking)**: Cập nhật trạng thái `RETRACTED` khi chuyên gia hoặc hội đồng thu hồi phát ngôn/bài báo.
        - **Giao Diện Trực Quan (`ExpertIntelligenceView.jsx`, `/expert`)**: Khám phá đồ thị chuyên gia, radar năng lực và sandbox thẩm định ý kiến chuyên môn.
        - **Tập Kiểm Chuẩn Toàn Diện**: **560/560 Tests PASS (100.0%)** trên 114 test files, 173 suites. **59/59 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    27. ✅ **Hệ Thống Trí Tuệ Cộng Đồng & Diễn Đàn V1 (Community & Forum Intelligence V1 — Phase T3 of StudentHub Intelligence OS: Real-World Experience Layer, Experience Consensus Engine, Procedure Duration Mining & Astroturfing Defense)**:
        - **Bất Biến Kinh Nghiệm Cộng Đồng Không Tạo Ra Quy Chế (`COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY`)**: Chia sẻ trên diễn đàn là lớp dữ liệu thực tế (thời gian xử lý thực tế, kinh nghiệm nộp hồ sơ), không thể tự biến thành quy chế học vụ chính thức.
        - **Phân Loại Nội Dung 7 Cấp (`CONTENT_TYPE`)**: `FIRST_HAND_EXPERIENCE`, `SECOND_HAND_REPORT`, `QUESTION`, `OPINION`, `SPECULATION`, `FACTUAL_CLAIM`, `GUIDE`.
        - **Đồng Thuận Trải Nghiệm Thay Vì Lượt Like (`Experience Consensus vs Upvote Vanity`)**: 1000 lượt upvote vào 1 bài bot không tạo ra đồng thuận. Cần tối thiểu 3 sinh viên độc lập với lời văn độc lập cùng xác nhận một mốc thời gian để đạt `STRONG_EXPERIENCE_CONSENSUS`.
        - **Phòng Thủ Thao Túng & Astroturfing (`Astroturfing & Sybil Defense`)**: Tự động gom các bài đăng sao chép (copy-paste) hoặc spam link quảng bá thương mại vào 1 Provenance Cluster và gắn cờ `SUSPECTED_COORDINATION`.
        - **Khai Phá Thời Gian Thực Tế & Edge Case (Procedure Duration Mining)**: Tính toán thời gian hoàn thành thủ tục trung vị thực tế (ví dụ: Nộp chứng chỉ TOEIC mất trung vị 7 ngày làm việc).
        - **Giao Diện Trực Quan (`CommunityIntelligenceView.jsx`, `/community`)**: Khám phá nhật ký trải nghiệm thực tế, ma trận đồng thuận và khiên chống spam.
        - **Tập Kiểm Chuẩn Toàn Diện**: **575/575 Tests PASS (100.0%)** trên 122 test files, 181 suites. **63/63 Mutants KILLED**. 3/3 chu kỳ lặp lại tất định.

    28. ✅ **Khung Bảo Mật Không Tin Cậy Zero-Trust Security Fabric Promax V1 (Identity, RBAC/ABAC/ReBAC, Capability Tokens, Purpose Binding, Risk-Adaptive Engine & AI Tool Firewall)**:
        - **Bất Biến Danh Tính Máy Chủ Tối Thượng (`IDENTITY ESTABLISHED EXCLUSIVELY FROM AUTHENTICATED CONTEXT`)**: Triệt tiêu hoàn toàn thói quen tin tưởng `studentId` hoặc `role` do frontend/client gửi lên. Identity xác lập từ `SecurityPrincipal` sau khi kiểm định chữ ký mật mã JWT (`iss`, `aud`, `sub`, `exp`, `nbf`) và trạng thái phiên `SessionManager` (timeout 30m idle, 24h absolute, thu hồi tức thì).
        - **Động Cơ Phân Quyền Tập Trung 11 Bước (`AuthorizationEngine.js`)**: Kiểm soát chặt chẽ quy trình `HARD DENY ➔ AUTHENTICATION ➔ SESSION ➔ SCOPE ➔ RBAC ➔ ABAC ➔ ReBAC ➔ CAPABILITY ➔ PURPOSE ➔ RISK ➔ ALLOW`.
        - **Phòng Thủ BOLA & BFLA Đa Tầng (`ObjectAuthorizer.js`, `FunctionAuthorizer.js`)**: Đảm bảo sinh viên A không thể đọc/sửa bất kỳ tài nguyên nào của sinh viên B nếu không có ủy quyền; chặn đứng các hành động nhạy cảm hoặc sửa đổi quy chế học vụ chính thức (`ACADEMIC.MODIFY_OFFICIAL` bị cấm tuyệt đối).
        - **Thẻ Năng Lực Đơn Kỳ Chống Tấn Công Replay (`CapabilityManager.js`)**: Phát hành capability có chữ ký HMAC, giới hạn số lần sử dụng (`maxUses: 1`), phát hiện và chặn đứng 100% tấn công phát lại (Replay Attacks).
        - **Ràng Buộc Mục Đích Nghiệp Vụ Tường Minh (`PurposeValidator.js`)**: Yêu cầu khai báo mục đích hợp lệ (`ACADEMIC_PLANNING`, `TRUST_ANALYSIS`, `EXPORT_REQUEST`), từ chối hành vi mở rộng quyền hạn ngầm định.
        - **Động Cơ Rủi Ro Thích Ứng & Thách Thức Nâng Cấp Xác Thực (`RiskEngine.js`)**: Tự động kích hoạt cơ chế Step-Up Challenge (`AAL2_STEP_UP`) khi phát hiện hành động có rủi ro cao (xuất bảng điểm toàn khóa, đổi cấu hình bảo mật).
        - **Định Danh AI Agent & Tường Lửa Công Cụ AI (`AgentIdentity.js`, `AiDelegationEngine.js`, `AiToolFirewall.js`)**: AI Agent có định danh riêng (`AcademicPlannerAgent`, `TrustVerifierAgent`), hoạt động theo ủy quyền thu hẹp từ sinh viên, chỉ được triệu gọi công cụ trong danh mục cho phép (Tool Allowlist), tự động lọc bỏ chỉ thị Prompt Injection và tối thiểu hóa dữ liệu đầu ra (`PropertyFilter.js`).
        - **Tập Kiểm Chuẩn An Ninh 10 Vector Tấn Công (`test:security`)**: **25/25 Tests PASS (100.0%)** trên 4 test suites (`security_fabric_attack_simulation`, `security_token_session`, `security_ai_tool_firewall`, `security_fabric_integration`), 0 lỗ hổng. Master suite đạt **822/822 Tests PASS (100.0%)**.

    29. ✅ **Mạng Lưới Trí Tuệ Học Vụ Hợp Nhất T1–T4 Intelligence Fabric Promax V1 (Trust + Expert + Community + Evidence Fusion + Contradiction Engine + Brier Calibration + Grounded AI Recommendations)**:
        - **Bất Biến Nhận Thức Luận Cốt Lõi (`EPISTEMIC INVARIANTS`)**: `TRUST ≠ TRUTH`, `REPUTATION ≠ EXPERTISE`, `POPULARITY ≠ EVIDENCE`, `COMMUNITY CONSENSUS ≠ FACT`, `CONFIDENCE ≠ CERTAINTY`, `AI REASONING ≠ AUTHORIZATION`.
        - **T1 Động Cơ Tin Cậy Đa Chiều (`TrustIntelligenceEngine.js`, `TrustExplanationEngine.js`, `ReputationGraph.js`)**: 10 chiều tin cậy phân lập (Identity, Behavior, Contribution, Evidence, Academic, Community, Expertise, Consistency, Temporal, Integrity). Điểm uy tín phân nhánh theo chủ đề với độ suy giảm theo thời gian (Half-life = 90 ngày) và cơ chế chống cấu kết/thao túng phiếu (`POTENTIAL_COORDINATION`).
        - **T2 Động Cơ Chuyên Gia & Ranh Giới Thẩm Quyền (`ExpertDiscoveryEngine.js`, `ExpertReliabilityTracker.js`)**: Phân tách triệt để giữa phạm vi chuyên môn (`EXPERTISE`) và độ tin cậy lịch sử (`RELIABILITY`). Xếp hạng đa tín hiệu kết hợp yếu tố xung đột lợi ích minh bạch.
        - **T3 Động Cơ Trí Tuệ Cộng Đồng & Quản Trị Mệnh Đề (`CommunityClaimExtractor.js`, `CommunityConsensusEngine.js`, `CommunityCorrectionSystem.js`)**: Mệnh đề thực tế First-Class Claim bảo lưu văn bản gốc trong `ProvenanceGraph`. Tính toán đồng thuận theo trọng số minh chứng, bảo tồn góc nhìn thiểu số (`Minority Signal`) và phân hóa khóa đào tạo. Nhật ký đính chính bất biến không xóa đè lịch sử.
        - **T4 Hợp Nhất Minh Chứng & Bộ Phân Loại Mâu Thuẫn 6 Dạng (`ContradictionEngine.js`, `ConflictResolutionEngine.js`, `SnapshotReproducibilityStore.js`)**: 4 tầng tri thức (Official Truth, AI Reasoning, Expert Interpretation, Community Reality). Phân loại mâu thuẫn thời gian, phạm vi và phiên bản. Ưu tiên quy chế chính thức nhưng bảo tồn sắc thái vận hành thực tế (ví dụ: Cổng quy định mở 24h nhưng thường nghẽn lúc 22h).
        - **Hiệu Chuẩn Độ Tin Cậy & Brier Score (`ConfidenceCalibrationEngine.js`)**: Đánh giá độ lệch xác suất lịch sử theo công thức Brier Score ($BS < 0.15$), triệt tiêu ảo tưởng chắc chắn toán học ($C < 0.98$).
        - **Động Cơ Khuyến Nghị AI Có Căn Cứ & Vòng Lặp Phản Hồi (`AiRecommendationEngine.js`, `AiContextCompiler.js`, `OutcomeFeedbackEngine.js`)**: Tạo khuyến nghị `RecommendationObject` giải trình rõ "Tại sao? Dựa trên minh chứng nào? Có giả định bất định gì? Phương án thay thế là gì?". Tối thiểu hóa dữ liệu trước khi nạp vào AI Agent. Vòng lặp phản hồi kết quả thực tế (Closed-Loop Outcome Feedback) tự động cập nhật Brier Calibration và điểm uy tín chuyên gia.
        - **Tập Kiểm Chuẩn Trí Tuệ Toàn Diện (`test:intelligence-fabric`)**: **26/26 Tests PASS (100.0%)** trên 7 test suites bao gồm 10 kịch bản Ma trận Kháng cự (Adversarial Matrix). Toàn bộ Master Suite đạt **848/848 Tests PASS (100.0%)**.

    30. ✅ **Tái Thiết Cấu Trúc Sản Phẩm, Bản Sao Số Cá Nhân Hóa & Trung Tâm Điều Phối (Personal Digital Twin + Personal Command Center + Cross-Device Continuity + Privacy Trust Center V1)**:
        - **Bản Sao Số Cá Nhân Hóa 5 Tầng Dữ Liệu (`PersonalDigitalTwin.js`)**: Phân loại rành mạch 5 tầng (`INSTITUTION_PROVIDED`, `SYSTEM_DERIVED`, `USER_OWNED`, `COMMUNITY_DERIVED`, `SECURITY_SENSITIVE`). Cam kết tuyệt đối chống giám sát xâm lấn (**Anti-Surveillance Guarantee**: Không quét trình duyệt, không đọc tệp tin/clipboard, không nghe lén).
        - **Đồng Bộ Đa Thiết Bị & Quản Lý Phiên Server-Authoritative (`DeviceSyncEngine.js`)**: Đăng ký và quản lý thiết bị đa nền tảng (`DESKTOP_WEB`, `MOBILE_IOS`, `MOBILE_ANDROID`, `TABLET`), cập nhật nhịp tim (Heartbeat), thu hồi phiên từ xa tức thời (Remote Session Revocation) và tự động xử lý xung đột phiên bản.
        - **Động Cơ Cá Nhân Hóa Đa Đối Tượng (`PersonalizationEngine.js`)**: Phân loại tự động các nhóm người dùng (`NEW_STUDENT`, `STUDENT`, `SENIOR_STUDENT`, `EXPERT`, `MODERATOR`, `STAFF_ADMIN`), sinh ngữ cảnh điều phối giải trình minh bạch ("Tại sao tôi thấy điều này? - Dựa trên minh chứng nào?"). Hỗ trợ đặt lại cài đặt cá nhân hóa về an toàn mặc định (`RESET_PERSONALIZATION`).
        - **Hệ Khung Ứng Dụng Toàn Cầu & Điều Hướng Thông Minh (`GlobalAppShell.jsx`, `CommandPalette.jsx`)**: Giao diện thích ứng (Desktop Sidebar + Mobile Drawer), thanh tìm kiếm Universal Search (`Ctrl+K` / `Cmd+K`) phân loại đa thực thể (Môn học, Chuyên gia, Quy chế, Bản ghi cá nhân), huy hiệu bảo vệ Zero-Trust.
        - **Trung Tâm Điều Phối Học Vụ Cá Nhân (Home / `PersonalCommandCenter.jsx`)**: Tích hợp lịch học thực tế hôm nay, ưu tiên cấp bách theo tiến độ, hành động khuyến nghị AI tối ưu tiếp theo (`Next Best Action`), tín hiệu chuyên gia và cộng đồng phù hợp.
        - **Trung Tâm Quyền Riêng Tư & Kiểm Soát Dữ Liệu (`PrivacyAccessCenter.jsx`)**: Quản lý thiết bị đăng nhập, thu hồi phiên làm việc trên thiết bị lạ, kết nối SSO tài khoản trường đại học, xuất toàn bộ dữ liệu cá nhân chuẩn GDPR Article 20 Portability.
        - **Tập Kiểm Chuẩn Tái Thiết Sản Phẩm (`test:product-reconstruction`)**: **10/10 Tests PASS (100.0%)** trên 4 test suites. Master Suite toàn bộ dự án đạt **858/858 Tests PASS (100.0%)**.

    31. ✅ **Tái Thiết Cấu Trúc Toàn Diện PROVIP (Social Intelligence Fabric + AI Content Firewall + Early Warning + Hyper-Personalization Briefing V1)**:
        - **Mạng Lưới Trí Tuệ Xã Hội Hợp Pháp (`ISourceConnector.js`, `ConnectorRegistry.js`, `RateLimitManager.js`, `IncrementalSyncEngine.js`, `DataRetentionManager.js`)**: Chuẩn hóa các kênh nạp dữ liệu chính quy (Cổng đào tạo, RSS thông báo, GitHub học vụ, Discord nhóm học), quản lý token bucket giới hạn tần suất, đồng bộ gia tăng có con trỏ checkpoint và quy định thời hạn lưu trữ tối thiểu (Data Retention).
        - **Chuẩn Hóa Đa Ngôn Ngữ & Trích Xuất Tín Hiệu (`ContentItemNormalizer.js`, `EntityResolutionEngine.js`, `SocialClaimExtractor.js`, `SocialSignalQualityEngine.js`)**: Mở rộng từ lóng học vụ tiếng Việt, định danh thực thể (Mã môn, Giảng viên, Khoa, Quy chế), phân loại 11 nhóm tín hiệu (`QUESTION`, `WARNING`, `CORRECTION`, `RUMOR`, `OFFICIAL_STATEMENT`...) và đánh giá chất lượng 7 chiều (Specificity, Evidence, Independence, Freshness...).
        - **Phát Hiện Trùng Lặp & Chống Thao Túng Đồng Bộ (`SocialDuplicationDetector.js`, `CoordinationDetector.js`)**: Gom cụm bài đăng nhân bản ($10 \text{ bản sao} \neq 10 \text{ nguồn độc lập}$), suy giảm trọng số theo $\frac{1}{\sqrt{N}}$, phát hiện chiến dịch thao túng đồng bộ trong khung giờ ngắn (`POTENTIAL_COORDINATION`).
        - **Động Cơ Cảnh Báo Sớm & Cầu Nối Đối Soát Quy Chế (`EarlyWarningEngine.js`, `SocialToOfficialPipeline.js`)**: Quản lý vòng đời cảnh báo (`UNVERIFIED` $\to$ `EMERGING` $\to$ `CORROBORATED` $\to$ `CONFIRMED` $\to$ `RESOLVED`), cung cấp khuyến nghị 2 tầng (Chính sách quy chế chính thức + Thực tế vận hành).
        - **Tường Lửa An Toàn Nội Dung AI, Vector Security & Chống Đầu Độc Bộ Nhớ (`SocialContentFirewall.js`, `VectorSecurityGuard.js`, `AiMemoryGuard.js`)**: Cách ly tuyệt đối văn bản bên ngoài ở dạng `CONTENT` (tuyệt đối không cho phép thực thi như `INSTRUCTION`), chống Prompt Injection và RAG Poisoning. Lọc trước và sau khi truy vấn vector embedding. Bộ nhớ 5 tầng với quy trình phê duyệt `CandidateMemory` $\to$ `ApprovedMemory`.
        - **Cá Nhân Hóa Đột Phá & Bản Tin Học Vụ Hàng Ngày (`UserGoalEngine.js`, `AcademicBriefingEngine.js`, `PersonalAcademicBriefing.jsx`, `SocialSignalRadar.jsx`)**: Quản lý mục tiêu học tập, biên dịch "My Academic Briefing" trả lời 6 câu hỏi trọng tâm ("Thay đổi gì?", "Hạn chót nào?", "Chuyên gia nào?", "Khuyến nghị gì?", "Tại sao tôi thấy điều này?").
        - **Tập Kiểm Chuẩn PROVIP Toàn Diện (`test:provip-reconstruction`)**: **18/18 Tests PASS (100.0%)** trên 7 test suites. Master Suite toàn bộ dự án đạt **876/876 Tests PASS (100.0%)**.

---

## 2. Đường Dẫn File Trọng Tâm (v26 Nodes)
- **Kiến Trúc Hệ Thống Trí Tuệ Cộng Đồng**: `docs/vault/01 - 🏗️ System Architecture/Community-Intelligence-V1.md`
- **Mô Hình Miền & Hợp Đồng Trải Nghiệm Cộng Đồng**: `frontend/src/lib/intelligence/community/communityIntelligenceModel.js`
- **Động Cơ Đồng Thuận & Chống Thao Túng Diễn Đàn**: `frontend/src/lib/intelligence/community/communityExperienceEngine.js`
- **Kho Lưu Trữ Bài Đăng & Nhật Ký Trải Nghiệm**: `frontend/src/lib/intelligence/community/communityStore.js`
- **API Endpoint Đánh Giá Đồng Thuận Server-Authoritative**: `frontend/src/app/api/community/experience/evaluate/route.js`, `frontend/src/app/api/community/experiences/route.js`
- **Giao Diện Nhật Ký Trải Nghiệm & Trang RSC**: `frontend/src/components/community/CommunityIntelligenceView.jsx`, `frontend/src/app/community/page.jsx`
- **Kiến Trúc Hệ Thống Trí Tuệ Chuyên Gia**: `docs/vault/01 - 🏗️ System Architecture/Expert-Intelligence-V1.md`
- **Mô Hình Miền & Hợp Đồng Tri Thức Chuyên Gia**: `frontend/src/lib/intelligence/expert/expertIntelligenceModel.js`
- **Động Cơ Thẩm Định Phạm Vi & Thẩm Quyền Chuyên Gia**: `frontend/src/lib/intelligence/expert/expertScopeEngine.js`
- **Kho Lưu Trữ Hồ Sơ & Đồ Thị Chuyên Gia**: `frontend/src/lib/intelligence/expert/expertStore.js`
- **API Endpoint Thẩm Định Chuyên Gia Server-Authoritative**: `frontend/src/app/api/expert/evaluate/route.js`, `frontend/src/app/api/expert/graph/route.js`, `frontend/src/app/api/expert/profile/[expertId]/route.js`
- **Giao Diện Khám Phá Chuyên Gia & Trang RSC**: `frontend/src/components/expert/ExpertIntelligenceView.jsx`, `frontend/src/app/expert/page.jsx`
- **Kiến Trúc Động Cơ Kiểm Chứng Tin Cậy AI**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Engine-V1.md`
- **Mô Hình Miền & Chỉ Số Tin Cậy Đa Chiều**: `frontend/src/lib/intelligence/trust/aiTrustModel.js`
- **Động Cơ Phân Rã Luận Điểm Cấp Nguyên Tử**: `frontend/src/lib/intelligence/trust/claimDecompositionEngine.js`
- **Động Cơ Khớp Nối Suy Diễn Trích Dẫn**: `frontend/src/lib/intelligence/trust/citationEntailmentEngine.js`
- **Động Cơ Thời Hiệu & Phân Tích Mâu Thuẫn**: `frontend/src/lib/intelligence/trust/temporalContradictionEngine.js`
- **Động Cơ Độc Lập Nguồn & Chống Rửa Nguồn**: `frontend/src/lib/intelligence/trust/sourceIndependenceEngine.js`
- **Tấm Khiên Bảo Vệ Adversarial & Prompt Injection**: `frontend/src/lib/intelligence/trust/adversarialTrustGuard.js`
- **Động Cơ Điều Phối Tin Cậy AI Tổng Hợp**: `frontend/src/lib/intelligence/trust/aiTrustEngine.js`
- **Kho Lưu Trữ Đánh Giá & Kiểm Toán Tin Cậy**: `frontend/src/lib/intelligence/trust/aiTrustStore.js`
- **API Endpoint Đánh Giá Tin Cậy Server-Authoritative**: `frontend/src/app/api/ai/trust/evaluate/route.js`, `frontend/src/app/api/ai/trust/evaluations/[evaluationId]/route.js`
- **Giao Diện AI Trust Studio & Trang Server**: `frontend/src/components/trust/AiTrustStudioView.jsx`, `frontend/src/app/trust/page.jsx`
- **Kiến Trúc Trung Tâm Thực Thi & Đối Soát Kế Hoạch**: `docs/vault/01 - 🏗️ System Architecture/Academic-Execution-Center-V1.md`
- **Mô Hình Miền & Hợp Đồng Dữ Liệu Thực Thi**: `frontend/src/lib/intelligence/academic/academicExecutionModel.js`
- **Động Cơ Đối Soát & Phát Hiện Độ Lệch Kế Hoạch**: `frontend/src/lib/intelligence/academic/academicPlanDriftEngine.js`
- **Kho Lưu Trữ Snapshot Thực Thi & Lịch Sử**: `frontend/src/lib/intelligence/academic/academicExecutionStore.js`
- **API Endpoint Thực Thi & Đối Soát Server-First**: `frontend/src/app/api/academic/me/execution/route.js`, `frontend/src/app/api/academic/me/execution/reconcile/route.js`
- **Giao Diện Theo Dõi Thực Thi & Trang RSC**: `frontend/src/components/academic/AcademicExecutionCenterView.jsx`, `frontend/src/app/academic/execution/page.jsx`
- **Kiến Trúc Studio So Sánh & Quyết Định Học Vụ**: `docs/vault/01 - 🏗️ System Architecture/Academic-Decision-Studio-V1.md`
- **Mô Hình Miền & Tiêu Chí So Sánh Quyết Định**: `frontend/src/lib/intelligence/academic/academicDecisionModel.js`
- **Động Cơ Phân Tích Đánh Đổi & Xếp Hạng Quyết Định**: `frontend/src/lib/intelligence/academic/academicDecisionEngine.js`
- **Kho Lưu Trữ Kế Hoạch Học Tập Đã Chọn**: `frontend/src/lib/intelligence/academic/academicDecisionStore.js`
- **API Endpoint So Sánh & Quyết Định Server-First**: `frontend/src/app/api/academic/me/decision-studio/route.js`, `frontend/src/app/api/academic/me/decision-studio/adopt/route.js`
- **Kiến Trúc Lập Kế Hoạch Học Kỳ Dựa Trên Ràng Buộc**: `docs/vault/01 - 🏗️ System Architecture/Academic-Semester-Planner-V1.md`
- **Mô Hình & Đồ Thị Điều Kiện Tiên Quyết Học Phần**: `frontend/src/lib/intelligence/academic/academicPrerequisiteEngine.js`
- **Mô Hình Miền & Khung Giới Hạn Tín Chỉ Kế Hoạch**: `frontend/src/lib/intelligence/academic/academicPlannerModel.js`
- **Động Cơ Lập Kế Hoạch Học Kỳ & Chiếu What-If**: `frontend/src/lib/intelligence/academic/academicSemesterPlannerEngine.js`
- **API Endpoint Lập Kế Hoạch Học Kỳ Server-First**: `frontend/src/app/api/academic/me/planner/route.js`
- **Giao Diện Studio Hoạch Định & Mô Phỏng 2 Tầng**: `frontend/src/components/academic/AcademicWhatIfPlannerView.jsx`, `frontend/src/app/academic/planner/page.jsx`
- **Kiến Trúc Hoạch Định & Giả Lập What-If**: `docs/vault/01 - 🏗️ System Architecture/Academic-What-If-Simulation-V1.md`
- **Mô Hình & Xác Thực Kịch Bản Giả Định**: `frontend/src/lib/intelligence/academic/academicSimulationModel.js`
- **Động Cơ Giả Lập Sandbox & So Sánh Delta**: `frontend/src/lib/intelligence/academic/academicSimulationEngine.js`
- **Giao Diện Hoạch Định What-If & Trang RSC**: `frontend/src/components/academic/AcademicWhatIfPlannerView.jsx`, `frontend/src/app/academic/planner/page.jsx`
- **API Endpoint Giả Lập Học Vụ**: `frontend/src/app/api/academic/me/simulate/route.js`
- **Kiến Trúc Lộ Trình Học Vụ & Hành Trình Sinh Viên**: `docs/vault/01 - 🏗️ System Architecture/Student-Academic-Roadmap-V1.md`
- **Mô Hình Cột Mốc & Đồ Thị Phụ Thuộc Học Vụ**: `frontend/src/lib/intelligence/academic/academicMilestoneModel.js`
- **Động Cơ Chiếu Lộ Trình Học Vụ**: `frontend/src/lib/intelligence/academic/academicRoadmapEngine.js`
- **Mô Hình, Kho & Dịch Vụ Profile 360**: `frontend/src/lib/intelligence/academic/studentProfile360Model.js`, `studentProfile360Store.js`, `studentProfile360Service.js`
- **Giao Diện Hồ Sơ 360 & Trang RSC**: `frontend/src/components/academic/Profile360View.jsx`, `frontend/src/app/academic/profile/page.jsx`
- **Cầu Nối Đồng Bộ Bản Sao Số Có Khóa Phiên Bản**: `frontend/src/lib/intelligence/academic/studentAcademicSyncBridge.js`
- **Kiến Trúc Nguồn Sự Thật Danh Tính & Bảng Điểm**: `docs/vault/01 - 🏗️ System Architecture/Authoritative-Student-Identity-And-Records-V1.md`
- **Đồng Hồ Học Thuật & Múi Giờ UTC+7**: `frontend/src/lib/intelligence/academic/academicClock.js`
- **Mô Hình, Kho & Dịch Vụ Danh Tính Sinh Viên**: `frontend/src/lib/intelligence/academic/studentIdentityModel.js`, `studentIdentityStore.js`, `studentIdentityService.js`
- **Mô Hình & Kho Bảng Điểm Học Vụ Chính Thức**: `frontend/src/lib/intelligence/academic/academicRecordsModel.js`, `academicRecordsStore.js`
- **Cầu Nối Đồng Bộ Hồ Sơ ➔ Bản Sao Số**: `frontend/src/lib/intelligence/academic/studentAcademicSyncBridge.js`
- **Kiến Trúc Điều Phối Thông Báo & Hạn Chót**: `docs/vault/01 - 🏗️ System Architecture/Academic-Notification-Orchestration-V1.md`
- **Động Cơ Trí Tuệ Hạn Chót & Chính Sách Nhắc Nhở**: `frontend/src/lib/intelligence/academic/academicDeadlineEngine.js`, `academicReminderPolicy.js`
- **Mô Hình, Máy Trạng Thái & Điều Phối Thông Báo**: `frontend/src/lib/intelligence/academic/academicNotificationModel.js`, `academicNotificationStateMachine.js`, `academicNotificationOrchestrator.js`
- **Kho Lưu Trữ Bền Vững & Phân Quyền Thông Báo**: `frontend/src/lib/intelligence/academic/academicNotificationStore.js`, `academicNotificationAuthorization.js`
- **Ngăn Kéo Trung Tâm Thông Báo**: `frontend/src/components/academic/NotificationCenterDrawer.jsx`
- **Kiến Trúc Lưu Trữ Bền Vững Quy Trình**: `docs/vault/01 - 🏗️ System Architecture/Academic-Workflow-Persistence-V1.md`
- **Kiến Trúc Bản Sao Số Sinh Viên & Động Cơ Điều Kiện**: `docs/vault/01 - 🏗️ System Architecture/Academic-Digital-Twin-V1.md`
- **Mô Hình & Kho Bản Sao Số Học Vụ**: `frontend/src/lib/intelligence/academic/studentDigitalTwinModel.js`, `studentDigitalTwinStore.js`
- **Động Cơ Đánh Giá Điều Kiện Học Vụ**: `frontend/src/lib/intelligence/academic/academicEligibilityEngine.js`
- **Ngăn Kéo Tra Cứu Hồ Sơ Số Sinh Viên**: `frontend/src/components/academic/DigitalTwinDrawer.jsx`
- **Kiến Trúc Quy Trình Học Vụ**: `docs/vault/01 - 🏗️ System Architecture/Academic-Action-Workflow-V1.md`
- **Dịch Vụ Điều Phối Quy Trình Master**: `frontend/src/lib/intelligence/academic/academicWorkflowService.js`
- **Máy Trạng Thái & Ý Định Hành Động**: `frontend/src/lib/intelligence/academic/academicWorkflowStateMachine.js`, `academicActionIntent.js`
- **Mô Hình Nhiệm Vụ & Kho Bất Biến**: `frontend/src/lib/intelligence/academic/academicTaskModel.js`, `academicTaskStore.js`
- **Động Cơ Đối Soát & Phân Quyền**: `frontend/src/lib/intelligence/academic/academicWorkflowReconciliationEngine.js`, `academicTaskAuthorization.js`
- **Drawer Chi Tiết Quy Trình & Action Center**: `frontend/src/components/academic/WorkflowDetailDrawer.jsx`, `ActionCenter.jsx`
- **API Biến Đổi Nhiệm Vụ**: `frontend/src/app/api/academic/tasks/[taskId]/route.js`
- **Trang Dashboard Học Vụ Master**: `frontend/src/app/academic/page.jsx`
- **Component Điều Phối Trung Tâm**: `frontend/src/components/academic/AcademicCommandCenter.jsx`
- **Khu Vực Hành Động & Biến Thiên**: `frontend/src/components/academic/ActionCenter.jsx`, `WhatChangedSection.jsx`
- **Giải Trình Cá Nhân Hóa & Dòng Thời Gian**: `frontend/src/components/academic/WhyAffectedSection.jsx`, `AcademicTimeline.jsx`
- **Ngăn Bằng Chứng Nguồn & Trạng Thái**: `frontend/src/components/academic/SourceEvidenceDrawer.jsx`, `AcademicStates.jsx`
- **API Tổng Hợp Học Vụ Server-Side**: `frontend/src/app/api/academic/command-center/route.js`
- **Điều Phối Trí Tuệ Học Thuật Master**: `frontend/src/lib/intelligence/academic/academicIntelligenceService.js`
- **Đăng Ký Nguồn Chính Thống**: `frontend/src/lib/intelligence/academic/academicSourceRegistry.js`
- **Thu Thập & Chuẩn Hóa Văn Bản**: `frontend/src/lib/intelligence/academic/academicDocumentFetcher.js`, `academicDocumentNormalizer.js`
- **Phân Tích Biến Thiên Ngữ Nghĩa & Trích Xuất Quy Tắc**: `frontend/src/lib/intelligence/academic/semanticDiffEngine.js`, `academicRuleExtractor.js`
- **Bản Sao Số & Tác Động Sinh Viên**: `frontend/src/lib/intelligence/academic/academicDigitalTwin.js`
- **Bộ Chuyển Đổi Thông Báo & Dòng Thời Gian**: `frontend/src/lib/intelligence/academic/academicNotificationAdapter.js`, `academicTimelineAdapter.js`
- **Động Cơ Trí Tuệ Phòng Chống Rủi Ro & Gian Lận**: `frontend/src/lib/intelligence/fraud/fraudRiskEngine.js`
- **Cầu Nối Đồng Bộ & Kiểm Soát Rủi Ro Toàn Diện**: `frontend/src/lib/intelligence/fraud/academicFraudLiveSyncBridge.js`
- **Bộ Kiểm Chuẩn Trí Tuệ Gian Lận & Rủi Ro**: `frontend/tests/intelligence/fraud_risk_intelligence.test.mjs`
- **Báo Cáo Tập Trận Thực Chiến Live-Sync**: `docs/university/live_sync_drill.md`
- **Bộ Kiểm Chuẩn Tập Trận Vận Hành**: `frontend/tests/university/academic_production_drill.test.mjs`
- **Đặc Tả Trí Tuệ Học Thuật HCMUTE**: `docs/vault/01 - 🏗️ System Architecture/Academic-Intelligence-Engine-Spec.md`
- **Đặc Tả Đường Ống Academic Intelligence V1**: `docs/vault/01 - 🏗️ System Architecture/Academic-Intelligence-V1-Pipeline.md`

## 10. UI/UX Reconstruction — 2026-08-27
- Hợp nhất các authenticated shell về `frontend/src/components/layout/UnifiedAppShell.jsx`; `StudentHubOSShell` và `GlobalAppShell` giữ vai trò compatibility wrapper.
- Chuẩn hóa semantic UI tokens, application shell, skip link, command search, mobile navigation và reduced-motion trong `frontend/src/app/globals.css`.
- Tái thiết kế `frontend/src/components/home/CommandCenterDashboard.jsx` theo hướng action-first, giải thích được và ưu tiên evidence.
- Đổi Next.js edge convention từ `frontend/src/middleware.js` sang `frontend/src/proxy.js`.
- Siết fallback secret: production không còn sử dụng secret mặc định trong `CapabilityManager` và `TokenValidator`; test-only secret chỉ tồn tại ngoài production.
- Kiểm chứng: production build pass, full regression suite pass, security suite pass, academic intelligence suite pass.

## 11. Quality Gate Hardening — 2026-08-27
- Thêm `scripts/run-discovered-tests.mjs` để tự động phát hiện và chạy mọi test `frontend/tests/**/*.test.mjs`.
- Thêm API route contract smoke test: kiểm tra handler HTTP tường minh và ngăn browser global lọt vào server route.
- Thêm `test:all-discovered` và `test:quality`; quality gate cuối cùng pass: lint không error, production build pass, 234/234 test files pass.
- Nâng cấp T2/T3/T4: Evidence Fusion Studio đọc Knowledge Object thật và drill-down provenance/conflict/unknowns; Community Studio truy vấn theo topic/cohort và đo provenance, friction, reality gap; Expert Studio có dossier kiểm chứng, reliability history và authority boundaries.
- Sửa Expert Discovery dùng đúng canonical fields (`status`, `name`, `scopes`, `conflicts`), bổ sung hồ sơ Toán học scoped; public expert API không còn trả raw private expert object.
- Forum API thêm validation chiều dài/nội dung/link HTTPS, provenance integrity metadata và xếp hạng Wilson confidence-adjusted.
- Quality gate cuối cùng pass: lint, production build và 235/235 test files.
- Forum Like/Comment đã được đóng vòng server-side qua PATCH ledger, chống reaction lặp theo user/post và trả comments sau reload trong cùng runtime.

## 12. PHASE 2/3 Authority & PostgreSQL Foundation — 2026-08-27
- Đã thêm JWKS/OIDC verification, one-time proof exchange, opaque hashed PostgreSQL sessions, HttpOnly/SameSite cookie, revocation/expiry, CSRF exact-origin và production rejection của legacy in-memory session.
- Đã thêm migration V2 cho profile an toàn, private roles/sessions/audit/expert/reputation, forum và nền móng evidence/claims; migration chủ động xóa policy/grant profile legacy không an toàn.
- Forum POST/GET mặc định dùng PostgreSQL và fail closed 503; memory adapter chỉ bật tường minh ngoài production.
- Live RLS harness kiểm tra anonymous, A/B, self-role, reputation, expert verification, foreign session và service role đã sẵn sàng nhưng chưa chạy vì thiếu `STUDENTHUB_RLS_TEST_DATABASE_URL`.
- Quality gate: 239/239 discovered test files, build/TypeScript pass, lint 0 errors/341 warnings, dependency audit 0, bundle `/scam-check` 885,917 bytes.
- PHASE 2/3 chưa được đánh dấu hoàn tất: browser bearer callers, refresh/re-auth, live clean migration/RLS và server-restart E2E còn thiếu.

## 13. Living Campus Atlas — Cinematic Landing Refinement — 2026-08-28
- Landing `/` được nâng cấp theo ngôn ngữ editorial-cinematic: opening sequence ngắn, hero typography cỡ lớn, knowledge ribbon nhiều lớp, pointer aura và chương chuyển cảnh perspective gập đôi.
- Tham chiếu trực tiếp OpenHero/Hyliox cùng ba screen recording của người dùng; không sao chép nhận diện thương hiệu hay nội dung của nguồn.
- Master implementation prompt: `docs/frontend/LIVING-CAMPUS-ATLAS-MASTER-PROMPT.md`.
- Mã chính: `frontend/src/components/landing/LivingCampusAtlas.jsx` và `living-campus-atlas.module.css`.
- Motion có reduced-motion fallback; pointer effect cập nhật trực tiếp qua ref, tránh setState theo từng frame; mobile tắt/giảm hiệu ứng 3D nặng.
- Kiểm chứng: targeted ESLint pass, production build pass 102/102 routes, Playwright 1440px và 390px không horizontal overflow.
- Refinement v2 tham chiếu Robin Payot, Sendoso, Meer Mohsin, Lucerra, USAvionix, Edolus và hai video mới: hero knowledge monolith, tri-lens glass core, 4-gate energy pipeline, product orbit chapter và closing copy mới.
- Đã sửa stacking-context khiến global cinematic wallpaper phủ section product sáng; QA lại không page error và không horizontal overflow.
