# ⚡ Active Session Context & Working State
> **Vault Node**: `Active-Session-Context` | **Tags**: `#active-session` `#state` `#changelog`

---

## 1. Trạng Thái Hiện Tại (Current Working Snapshot)
- **Phiên bản**: StudentHub AI v3.1.0 (AI Trust Layer 1 + Layer 2 Comprehensive Intelligence Pipeline).
- **Vừa triển khai & Kiểm thử thành công**:
  1. ✅ **Layer 1 Ultra-Precise Screening Engine (`lib/ai-trust/layer1`)**:
     - 🏛️ 70+ Brand Catalog, Token-Boundary Precision Matcher (0% FP), Damerau-Levenshtein Typosquatting, SSRF Obfuscation Defense, Magic Byte Binary & Polyglot inspection.
     - 151/151 Test Suites PASS (100.0% Accuracy, 0.15ms latency).
  2. ✅ **Layer 2 Semantic & Contextual Verification Engine (`lib/ai-trust/layer2`)**:
     - 🧠 **IntentAnalyzer**: Phân tích đa mục đích (`inform`, `educate`, `request_credentials`, `request_payment`, `impersonate`, `manipulate`), phân biệt lời kêu gọi bình thường với bẫy ép buộc.
     - 🏛️ **EntityExtractor & TrustedEntityRegistry**: Nhận diện & chuẩn hóa 70+ trường ĐH, ngân hàng, cơ quan nhà nước, phân biệt giữa nguồn tự xưng (`isClaimedAuthor`) và đối tượng thảo luận.
     - 📋 **ClaimExtractor**: Trích xuất phát ngôn có cấu trúc (chủ ngữ, vị ngữ, tân ngữ, thời gian, phạm vi), gán mức độ ưu tiên (`CRITICAL`, `HIGH`, `MEDIUM`) và yêu cầu kiểm chứng (`NEEDS_VERIFICATION`).
     - 🛡️ **ContextAnalyzer**: Bắt bẫy ngữ cảnh mạo danh, nạp cọc CTV Shopee, bẫy sinh trắc học VCB/VNeID, đồng thời bảo vệ tuyệt đối văn bản học thuật / bài tập bảo mật không bị chặn nhầm.
     - ⚖️ **ConsistencyAnalyzer**: Bắt mâu thuẫn thời gian (thứ Hai vs thứ Sáu), mâu thuẫn số liệu tiền cọc, và mâu thuẫn chỉ thị.
     - 🌐 **CrossModalAnalyzer**: Đối soát chéo Text vs Logo ảnh vs Tên miền đích URL/QR.
     - 📦 **VerificationPlanner**: Đóng gói danh sách phát ngôn, thực thể và Candidate Sources chính thống cho **Layer 3**.
     - ⚡ **Model Provider Abstraction**: Hỗ trợ `GeminiSemanticModelProvider` (multimodal JSON schema) và `DeterministicSemanticProvider` (zero-LLM fallback), khả năng chịu lỗi 100% khi upstream timeout.
     - 🎯 **Test Suite 14/14 PASS (100.0%)**: Toàn bộ 14 kịch bản từ bài giảng giáo dục, mạo danh trường học, phát ngôn chưa xác thực đến fallback lỗi đều vượt qua tuyệt đối.
  3. ✅ **Full Pipeline Integration & UI Studios**:
     - `POST /api/ai-trust/semantic`: API endpoint Layer 2 hoàn chỉnh.
     - `Layer2SemanticHUD.jsx`: Telemetry HUD hiển thị Intent, Claims, Entities, Bất nhất & Layer 3 Tasks.
     - `Layer2BenchmarkStudio.jsx`: Trình kiểm thử tương tác Layer 2 trên web studio.
     - `scam-check/page.jsx`: Tích hợp luồng quét 4 lớp liên tục.

---

## 2. Đường Dẫn File Quan Trọng
- **Đặc Tả Kỹ Thuật Layer 1**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Layer1-Screening-Spec.md`
- **Đặc Tả Kỹ Thuật Layer 2**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Layer2-Semantic-Spec.md`
- **Layer 2 Core Service**: `frontend/src/lib/ai-trust/layer2/Layer2SemanticService.js`
- **Layer 2 Test Suite**: `frontend/tests/layer2/layer2.test.mjs`
- **Full Multi-Modal Suite**: `frontend/tests/layer1/full_multimodal_evaluation.test.mjs`
- **Backend API Layer 1**: `frontend/src/app/api/ai-trust/screen/route.js`
- **Backend API Layer 2**: `frontend/src/app/api/ai-trust/semantic/route.js`
- **Telemetry HUD L1 & L2**: `frontend/src/components/trust/Layer1TelemetryHUD.jsx` & `Layer2SemanticHUD.jsx`
- **Benchmark Studio L1 & L2**: `frontend/src/components/trust/Layer1BenchmarkStudio.jsx` & `Layer2BenchmarkStudio.jsx`
- **Trang Scam Check**: `frontend/src/app/scam-check/page.jsx`
- **Vault Hub**: `docs/vault/Index.md`
