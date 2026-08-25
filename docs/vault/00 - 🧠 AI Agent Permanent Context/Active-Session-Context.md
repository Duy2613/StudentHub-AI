# ⚡ Active Session Context & Working State
> **Vault Node**: `Active-Session-Context` | **Tags**: `#active-session` `#state` `#changelog`

---

## 1. Trạng Thái Hiện Tại (Current Working Snapshot)
- **Phiên bản**: StudentHub AI v3.2.0 (AI Trust Layer 1 + Layer 2 + Layer 3 Comprehensive Pipeline).
- **Vừa triển khai & Kiểm thử thành công**:
  1. ✅ **Layer 1 Ultra-Precise Screening Engine (`lib/ai-trust/layer1`)**:
     - 🏛️ 70+ Brand Catalog, Token-Boundary Precision Matcher (0% FP), Damerau-Levenshtein Typosquatting, SSRF Obfuscation Defense, Magic Byte Binary & Polyglot inspection.
     - 151/151 Test Suites PASS (100.0% Accuracy, 0.15ms latency).
  2. ✅ **Layer 2 Semantic & Contextual Verification Engine (`lib/ai-trust/layer2`)**:
     - 🧠 IntentAnalyzer, EntityExtractor, ClaimExtractor, ContextAnalyzer, ConsistencyAnalyzer, CrossModalAnalyzer, VerificationPlanner.
     - 14/14 Test Suites PASS (100.0% Accuracy, 0.40ms latency).
  3. ✅ **Layer 3 External Evidence & Source Verification Engine (`lib/ai-trust/layer3`)**:
     - 🔍 **QueryGenerator**: 6 chiến lược truy vấn (Exact, Entity+Action, Entity+Date, Site filter, Anti-Confirmation-Bias Contradiction, Source Claim).
     - 🏛️ **SourceAuthorityRegistry**: Mô hình phân cấp thẩm quyền nguồn tin đặc thù theo lĩnh vực (Tier 1 -> Tier 5).
     - 🌐 **Retrieval & Safety**: `KnowledgeBaseRetriever` + `WebSearchRetriever` (SSRF Guard chặn 127.0.0.1, 169.254.169.254).
     - 📑 **EvidenceExtractor & TemporalEvaluator**: Trích đoạn bằng chứng tinh gọn, kiểm định mốc thời gian và cờ `OUTDATED`.
     - 🔄 **SourceIndependenceAnalyzer**: Phân cụm bài báo sao chép (`lineage clustering`), triệt tiêu đồng thuận giả tạo.
     - ⚖️ **SourceConflictDetector**: Bắt và đóng gói mâu thuẫn giữa các nguồn tin chính thống cho Layer 4.
     - 🎯 **Test Suite 8/8 PASS (100.0%)**: Vượt qua tuyệt đối 8 kịch bản từ bằng chứng chính thống, không có bằng chứng (`UNVERIFIED`, không gán nhãn `FALSE`), tranh chấp nguồn tin, bài báo sao chép đến phòng thủ SSRF và fallback lỗi.
  4. ✅ **Full Pipeline Integration & UI Studios**:
     - `POST /api/ai-trust/evidence`: API endpoint Layer 3 hoàn chỉnh.
     - `Layer3EvidenceHUD.jsx`: Telemetry HUD hiển thị Claim-Evidence Matrix, Cụm Lineage & Tranh chấp nguồn tin.
     - `Layer3BenchmarkStudio.jsx`: Trình kiểm thử tương tác Layer 3 trên web studio.
     - `scam-check/page.jsx`: Tích hợp luồng quét 4 lớp liên tục với 3 tab Benchmark Studio.

---

## 2. Đường Dẫn File Quan Trọng
- **Đặc Tả Kỹ Thuật Layer 1**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Layer1-Screening-Spec.md`
- **Đặc Tả Kỹ Thuật Layer 2**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Layer2-Semantic-Spec.md`
- **Đặc Tả Kỹ Thuật Layer 3**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Layer3-Evidence-Spec.md`
- **Layer 3 Core Service**: `frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js`
- **Layer 3 Test Suite**: `frontend/tests/layer3/layer3.test.mjs`
- **Backend API Layer 3**: `frontend/src/app/api/ai-trust/evidence/route.js`
- **Telemetry HUD L1, L2, L3**: `Layer1TelemetryHUD.jsx`, `Layer2SemanticHUD.jsx`, `Layer3EvidenceHUD.jsx`
- **Benchmark Studio L1, L2, L3**: `Layer1BenchmarkStudio.jsx`, `Layer2BenchmarkStudio.jsx`, `Layer3BenchmarkStudio.jsx`
- **Trang Scam Check**: `frontend/src/app/scam-check/page.jsx`
- **Vault Hub**: `docs/vault/Index.md`
