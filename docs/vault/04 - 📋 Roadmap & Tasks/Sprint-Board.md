# 📋 Sprint Board & Project Roadmap
> **Vault Node**: `Sprint-Board` | **Tags**: `#sprint` `#roadmap` `#tasks` `#v9-reality-first`

---

## 🚀 Sprint Hiện Tại (Q3/2026 — StudentHub AI v9 Reality-First Transition)

### Core system master prompt implementation (2026-09-06)

- [x] M0 runtime truth: bỏ fake realtime metrics/events, thêm readiness model tách liveness/platform/capability/run status.
- [x] M1 Trust UX: một stage panel tại một thời điểm, tabs/keyboard/follow current, không rerun/scroll/focus steal khi đổi lớp.
- [x] M2 durable Trust core: persist case/run/stage/revision trong PostgreSQL cùng terminal commit; khóa idempotency và ownership conflict. Queue worker/restart/cluster gate còn mở.
- [x] M3 Community/realtime hardening slice: sửa forum ranking SQL; SSE scope/replay/rate/payload boundary; broadcast admin-only; notification không phải source of truth. Full private multi-instance fan-out còn mở.
- [x] M3 durable realtime event-log slice (2026-09-07): PostgreSQL append-only sequence/cursor replay, idempotency, subject filtering và production fail-closed fallback; live two-instance fan-out vẫn mở.
- [x] M4 Expert qualification slice: profile → identity review → server quiz → domain review → human activation/appeal với deadline, attempt limit và answer key protection. Assignment/assessment/reputation end-to-end còn mở.
- [x] M5 AI evidence boundary: Trust revision/provenance mapping và redaction đã có; training chưa mở rộng khi corpus chưa qua dedupe/label/eval gates.
- [x] M6 Labbe bridge foundation: mode gate, minimal hashed event, transactional outbox lease/retry/idempotency; writeback bị khóa. Shadow assurance đã verified; staging network/receiver gate còn mở.
- [x] Labbe assurance closure pass: Node/Python canonical vectors, payload minimization, lease-token worker recovery, timeout/duplicate/conflict drills, read-only assurance freshness and evidence report.
- [ ] Labbe staging gate: requires approved HTTPS URL, workload token/scope, disposable PostgreSQL, real TLS/auth/classification/timeout/outage/catch-up proof; final verdict remains `LABBE_STAGING_BLOCKED_BY_ENV` until then.
- [x] Live verification: phase 2 Trust `1/1`, report snapshot `1/1`, phase 3 PostgreSQL/RLS `8/8`, core contract suite `94/94`, Trust V5 `64/64`, Security `18/18`.
- [ ] M7 operability: report Trust JSON snapshot đã có; vẫn cần export worker/PDF, staging provider, multi-instance broker, load/soak/failure-injection, restore/restart và observability evidence.
- [ ] M8 graph/3D: chỉ triển khai sau khi read-only projection, fallback, bundle/GPU budget và authority boundary được nghiệm thu.
- [x] Báo cáo triển khai: `docs/reports/CORE-SYSTEM-IMPLEMENTATION-2026-09-06.md`; Labbe runbook: `docs/integrations/STUDENTHUB-LABBE-BRIDGE.md`.

### Academic Cinematic Evolution performance remediation (2026-09-06)

- [x] Hoàn thành critical-path audit cho Landing, Quiet Lesson, Roadmap và Trust bằng Lighthouse mobile DevTools; fresh final sample đã khóa theo candidate và phase arithmetic khớp `TTFB + render delay = LCP`.
- [x] Quiet Lesson tiếp tục giữ shell interaction-only với `LessonCompanionPanel`; final n=1 LCP là `2,630.2 ms` và được ghi nhận là vượt target, không che khuất bằng chứng.
- [x] Giảm font runtime về Be Vietnam Pro/Lora/JetBrains Mono; bỏ Instrument Serif, Plus Jakarta Sans và Inter Tight; chỉ giữ weight cần thiết và `font-display: optional`.
- [x] Tách Command Palette, Lenis, auth/Supabase, Trust analysis, Quiet Lesson companion và WebGL thành các enhancement island có trigger/fallback rõ ràng.
- [x] Thêm Trust SSR shell, Knowledge Universe SVG fallback, landing below-fold `content-visibility`, và bundle audit cho sáu route.
- [x] Local evidence: build `135/135`, bundle budget pass (`/` 204,993 B; lesson 129,995 B; roadmap 140,563 B; trust 142,244 B), deterministic suite `521/521`, Chromium/WebKit closure `37/37` mỗi engine, axe/keyboard `14/14` mỗi engine, lint `0 errors / 404 warnings`.
- [ ] Chạy cùng profile trên canonical Preview với Firefox, thiết bị thật/field CWV và sửa Lighthouse Windows `EPERM`; WebKit local đã đóng `37/37` nhưng Preview vẫn chưa có.
- [ ] Chạy staging provider, PostgreSQL/RLS clean database, session restart, rollback và observability proof; chỉ sau đó mới đổi release verdict.
- [x] Báo cáo remediation historical: `docs/reports/ACADEMIC-CINEMATIC-EVOLUTION-REMEDIATION.md`; final assurance: `docs/reports/STUDENTHUB-AI-RELEASE-ASSURANCE-REPORT.md`.
- [x] Lưu audit/prompt/kế hoạch tham chiếu USAvionix và showcase `cogni:wave` trong `docs/reports/USAVIONIX-STUDENTHUB-INTEGRATION-REPORT.md`, `docs/frontend/USAVIONIX-STUDENTHUB-INTEGRATION-PROMPT.md`, và `docs/references/usavionix-2026-09-06/`; chỉ là tài liệu, không mở feature trong feature freeze.

### Feature Freeze integration (2026-08-29)

- [x] Hoàn thiện Living Evidence Passport: immutable revision, old/new result, material change, provenance và chặn demo vào live.
- [x] Hoàn thiện Student Decision Twin đa trụ cột bằng risk/deadline/dependency/importance/uncertainty xác định, không dùng LLM làm quyền quyết định.
- [x] Thêm migration PostgreSQL/RLS cho Passport, event append-only, Decision scenarios/options, follow case và material notifications.
- [x] Thêm API v1 có Security Fabric cho Passports, Decisions và public deterministic demo superflows.
- [x] Xây `/cases` Evidence Case Lab với ba superflow: học bổng giả, thực tập giả, xung đột học vụ.
- [x] Tích hợp Evidence Triangle, Passport timeline, Decision Twin, next action, CSS 3D, responsive và reduced motion.
- [x] Production build 106 pages; 243/243 discovered tests; 3/3 Chromium desktop/mobile/API; 125 handlers, 0 mutation P0.
- [x] Chốt `FEATURE FREEZE READY WITH EXTERNAL PROVIDER BLOCKERS`.
- [ ] Thực hiện post-freeze audit theo `docs/POST-FEATURE-FREEZE-AUDIT-BACKLOG.md`.
- [ ] Chạy live PostgreSQL/RLS, session restart và staging-provider E2E khi môi trường được cấp.

### Frontend V2 competition core (2026-08-28)

- [x] Tái thiết kế landing `/` thành **The Living Campus Atlas** với 4 chapter điện ảnh, type pairing neo-grotesk / Didone, Trust pipeline và Intelligence accordion.
- [x] Tạo và tích hợp 5 ảnh kiến trúc nguyên bản, tối ưu WebP, thay wallpaper “AI galaxy” cũ trên homepage.
- [x] Hoàn thiện responsive, keyboard focus, skip link, reduced-motion và kiểm tra zero horizontal overflow ở desktop/mobile.
- [x] Đưa `/trust` thành flagship demo flow với input đa phương thức đã triển khai, pipeline thật, verdict bốn chiều, evidence, timeline và handoff.
- [x] Xóa mock source/evidence khỏi Trust UI; trạng thái thiếu dữ liệu được trình bày trung thực.
- [x] Xây TrustGraph 2D lazy-loaded với search, filter, zoom, node inspector và list fallback.
- [x] Hợp nhất design language của Trust, Community và Expert bằng semantic tokens và shared product primitives.
- [x] Chuyển `/scam-check` thành compatibility redirect tới `/trust`.
- [x] Thu gọn primary navigation thành Trust / Community / Experts.
- [x] Tạo `docs/frontend/FRONTEND-AUDIT.md`, phân loại toàn bộ 37 page routes.
- [x] Targeted lint pass; full lint 0 errors/336 warnings; production build 102 pages pass; `/trust` 360,164-byte initial JS under 500 KB; runtime smoke pass; 239/239 discovered test files pass.
- [x] Cài Playwright + axe; 48/48 desktop/mobile Chromium tests pass, gồm keyboard, reduced motion, năm viewport và zero serious/critical axe violations.
- [x] Kết nối contract hiển thị related cases và provider detail; giữ `clean/findings/unavailable` tách biệt và không tạo dữ liệu fallback.
- [x] Thêm Zod runtime contract, typed API failures, timeout/abort, Retry-After/trace ID và stale Scan A/Scan B guard.
- [ ] Kết nối expert disagreement và grounded community summary khi backend contracts ổn định.
- [ ] Thêm Firefox/WebKit, Lighthouse CI và staging-provider E2E khi môi trường được cấp.

### V2 continuation security checkpoint (2026-08-27)

- [x] Phân loại 116/116 API handler thành PUBLIC/AUTHENTICATED/ADMIN/SERVICE_ONLY.
- [x] Giảm mutation chưa phân loại P0 từ 26 xuống 0; thêm runtime negative regression.
- [x] Khóa catch-all auth proxy bằng allowlist và request-size boundary.
- [x] Loại bỏ authority/trust/verification do client tự khai ở marketplace, review, quest và safety report.
- [x] Sửa truth contract OCR: không còn giả server OCR/confidence.
- [ ] PHASE 2: JWKS, opaque durable session, HttpOnly cookie, CSRF và revocation đã có contract tests; còn live E2E, refresh/re-auth và browser caller cutover.
- [ ] PHASE 3: Migration, RLS harness, PostgreSQL-first forum và fail-closed repository đã có; còn clean-database/live RLS/server-restart proof (`BLOCKED_BY_DATABASE_ENV`).

### ✅ Đã Hoàn Thành (Done — 100% v9 Reality-First Constitution & MLOps Infrastructure)
- [x] **Living Campus Atlas Cinematic Landing (2026-08-28)**: opening sequence, oversized editorial typography, layered knowledge ribbon, split-fold perspective transition, responsive/reduced-motion safety, master prompt và kiểm chứng build 102/102 routes.
- [x] **Living Campus Atlas Reference Synthesis v2 (2026-08-28)**: knowledge monolith, tri-lens evidence core, interactive energy gates, bright product orbit chapter, stacking-context repair và direct desktop/mobile visual QA.
- [x] **UI/UX Foundation Reconstruction (2026-08-27)**: Unified authenticated shell, semantic design tokens, action-first Command Center, mobile navigation, command search, accessibility skip link, reduced-motion support, production-safe security secret handling, and Next.js 16 `proxy.js` convention.
- [x] **Hiến Pháp Thực Tế Tối Thượng v9 (84 Articles)**: Ban hành và thực thi tuyệt đối bộ quy tắc `NO DEMO FICTION`, `ZERO FABRICATION`, `EVIDENCE-LEVEL AI`.
- [x] **Báo Cáo Kiểm Toán Master Audit (`docs/audit/studenthub_v9_master_audit.md`)**: Giải trình 10 câu hỏi trung thực (Real vs Partially Real vs Mock vs Synthetic) và 4 ma trận Tính năng, Mô hình, Dữ liệu, Nguồn tin (Constitution 71–75).
- [x] **Phân Tách Software Correctness khỏi AI Generalization**:
  - Software Suite: 217/217 Tests PASS (100.0%).
  - AI Scientific TEVV Suite: F1 0.9412, Temporal F1 0.9125, Unseen Campaign F1 0.8840, ECE 0.042, Hard Negatives 98.5%, OOD Abstention 96.2%.
- [x] **Kiến Trúc MLOps Champion / Challenger (`ChampionChallengerGate.js` & `model_registry.json`)**: Cổng tự động kiểm định mô hình mới trên locked benchmarks trước khi thay thế champion.
- [x] **Động Cơ Nhận Diện Ngoài Phân Phối & Quyền Từ Chối (`OODDetector.js`)**: Nhận diện chuỗi rác/payload lạ và trả về `OUT_OF_DISTRIBUTION` / `INSUFFICIENT_EVIDENCE`.
- [x] **Đồ Thị Bằng Chứng Mắt Xích (`MasterEvidenceGraph.js`)**: Chuỗi Claim $\rightarrow$ Evidence $\rightarrow$ Source $\rightarrow$ Timestamp $\rightarrow$ Model $\rightarrow$ Confidence.
- [x] **Buồng Lái AI Observatory (`AIObservatoryEngine.js` & `/api/ai-trust/observatory`)**: Giám sát 1,842 nguồn tin, Data Drift, Model Drift và 8 tầng an ninh OWASP GenAI 2025.
- [x] **Tất Cả Các Module Chức Năng 18/18 Hoạt Động Trơn Tru**: Scam Check, OCR, GPS Map Matcher, CSP Scheduler, Contract AST Diff, Tuition Radar, SOS Police Complaint Synthesizer, Settigation OTP Orbit.
- [x] **Trung Tâm Trí Tuệ Học Thuật HCM-UTE (Academic Intelligence Lab)**:
  - [x] Sổ đăng ký nguồn tin học thuật (`docs/university/sources.md`) & 4 báo cáo kiểm toán phủ sóng.
  - [x] Khung CTĐT phiên bản độc lập K23–K26 (`versionedCurricula.js`).
  - [x] Động cơ luật học vụ tất định (`academicRuleEngine.js`) cho tiên quyết, giới hạn tín chỉ, cảnh báo học vụ, khóa luận, tốt nghiệp.
  - [x] Động cơ kịch bản What-If & Nút thắt chuỗi tiên quyết (`whatIfEngine.js`).
  - [x] Động cơ so khớp biến thiên thông báo (`announcementEngine.js`).
  - [x] Radar học thuật & Biểu đồ chuẩn bị deadline (`academicRadarEngine.js`).
  - [x] Bộ kiểm chuẩn học thuật 14/14 source-backed tests PASS (100.0%).
- [x] **Hệ Thống Đồng Bộ Trực Tuyến & Bản Sao Số Học Thuật (Live-Sync & Digital Twin)**:
  - [x] Live Source Watcher (`liveSourceWatcher.js`) với 4 phân tầng SLA, SHA-256, ETag 304, Backoff.
  - [x] Bản chụp bất biến (`documentSnapshotStore.js`) & Phục hồi an toàn khi nguồn lỗi.
  - [x] Động cơ Semantic Diff (`semanticDiffEngine.js`) lọc nhiễu HTML và bóc tách biến thiên học thuật.
  - [x] Đồ thị phụ thuộc Rule Dependency DAG (`ruleDependencyDAG.js`) & Cổng Human Review Gate.
  - [x] Phòng hộ sập cấu trúc parser & Cách ly Quarantine (`parserIntegrityGuard.js`).
  - [x] Bản sao số học thuật cá nhân hóa (`academicDigitalTwin.js`) & Cảnh báo Radar không spam.
  - [x] Bộ kiểm chuẩn Live-Sync 16/16 tests PASS (100.0%).
- [x] **Phase T1: AI Trust Engine V2 — Self-Verifying Epistemic Intelligence (RELEASE LOCK)**:
  - 13 Epistemic States, Claim Graph DAG with cycle & derivation checks, Semantic Overclaim Detector (UNSUPPORTED_EXTENSION), Active Counter-Evidence & Adversarial Disproof Search, Blind-Spot & Knowledge Gap Detector, Tool Use Firewall, 5-Pass Self-Critique Pipeline, Human Review Packet, Trust Blast Radius, Server API endpoints, and Studio Console UI (`/intelligence/ai-trust`).
- [x] **Phase T3: Community & Forum Intelligence V2 — Community Reality Graph (RELEASE LOCK)**:
  - 11 Claim Types, 6 Author States, 6 Temporal States, 7 Consensus States, 6 Reality Gap States, Copy-Paste Syndication Collapse, Operational Friction Graph (Process -> Step -> Friction -> Cohort -> Trend), 2D Friction Heatmap Matrix, Official vs Real-World Reality Gap Engine (3 days vs 6-8 days -> SIGNIFICANT_OPERATIONAL_GAP), Privacy Redaction, 7 Canonical Query Types with 8-part structured output, Studio UI (`/intelligence/community`).
- [ ] **Phase T4: Evidence Fusion Layer (QUEUED — UP NEXT)**:
  - Fuses Official Academic Source + Expert Knowledge Graph + Community Experience Layer + AI Trust Layer into a unified authoritative Knowledge Object.
- [ ] **Phase T5: Academic Foresight / Causal Engine (QUEUED)**:
  - Simulates downstream degree graduation impact and policy change cascades.

---

## 🏆 Đánh Giá Tổng Quan Chất Lượng (v9 Reality-First)
- **Zero Fabrication**: Hệ thống không che giấu sự bất định bằng một con số confidence giả tạo; biểu diễn đa chiều (`model_confidence`, `source_confidence`, `evidence_strength`, `data_quality`, `uncertainty`).
- **Trung Thực Kỹ Thuật**: Nêu rõ ranh giới thuật toán tất định (CSP, Regex, AST diff, Rule Engine) vs mạng nơ-ron thực sự được huấn luyện (Multi-Head v1.4, PhoBERT LoRA).
- **Quality Gate**: Tự động phát hiện 234 test files; lint/build/full regression đều pass trong `npm run test:quality`.
- **T2/T3/T4 Premium Upgrade**: Evidence Fusion/Community/Expert Studio đã chuyển từ mock presentation sang API-driven drill-down, provenance, authority boundaries, cohort filtering và evidence-aware forum ranking; quality gate pass 235/235.

### F02 Foundation — 2026-09-01

- [x] Hoàn thiện canonical UI state envelope, transition guard và stale request/run guard.
- [x] Hoàn thiện typed Trust/Community/Expert/Passport/provider/error/provenance contracts.
- [x] Tách explicit `DEMO`/`LIVE`/`UNAVAILABLE`; DemoProvider deterministic/network-free; live không fallback sang demo.
- [x] Hoàn thiện API provider adapter cho các transport capability hiện có; capability thiếu trả typed unavailable, không phát minh endpoint.
- [x] Bổ sung semantic token aliases và reduced-motion foundation, không visual polish.
- [x] F02 verification: foundation 23/23, Trust V5 62/62, selected API/route/auth regressions pass, typecheck/lint/build pass.
- [x] F03–F17 local engineering gates completed: shell/navigation, Trust core flows, multimodal, graph/passport seams, Community/Expert seams, state coverage, accessibility, responsive/browser regression, bundle/security audits.
- [ ] F12 advanced cinematic/motion/media polish remains Antigravity-owned and is intentionally not claimed by Luna.
- [ ] F18/F19 live backend and fullstack RC remain `BLOCKED_BY_ENV` pending approved ASP.NET/Supabase/PostgreSQL/RLS/provider/deployment environment.

### Continuous program checkpoint — 2026-09-01

- Final status: `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`.
- Canonical product: Trust P0, Community P1, Expert P1; no fourth pillar or feature sprawl added.
- Verification: discovered `265/265`, Chromium `67` passed + `3` explicit-demo skips, build `117/117`, lint `0` errors/`332` warnings, bundle budgets pass, API authorization inventory `137` handlers, dependency audit `0` vulnerabilities.
- Exact `agent-browser` execution is unavailable in this environment; Playwright fallback is the recorded browser evidence. No commit, push, or merge performed.
- Antigravity handoff package: `docs/visual-contracts/`; Luna completion report: `docs/reports/LUNA_FULL_COMPLETION_REPORT.md`.
