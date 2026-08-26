# 📋 Sprint Board & Project Roadmap
> **Vault Node**: `Sprint-Board` | **Tags**: `#sprint` `#roadmap` `#tasks` `#v9-reality-first`

---

## 🚀 Sprint Hiện Tại (Q3/2026 — StudentHub AI v9 Reality-First Transition)

### ✅ Đã Hoàn Thành (Done — 100% v9 Reality-First Constitution & MLOps Infrastructure)
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
