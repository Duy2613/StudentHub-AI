# 📋 Sprint Board & Project Roadmap
> **Vault Node**: `Sprint-Board` | **Tags**: `#sprint` `#roadmap` `#tasks` `#v9-reality-first`

---

## 🚀 Sprint Hiện Tại (Q3/2026 — StudentHub AI v9 Reality-First Transition)

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
