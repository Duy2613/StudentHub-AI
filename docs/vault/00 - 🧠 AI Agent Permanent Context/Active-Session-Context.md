# ⚡ Active Session Context & Working State
> **Vault Node**: `Active-Session-Context` | **Tags**: `#active-session` `#state` `#changelog`

---

## 1. Trạng Thái Hiện Tại (Current Working Snapshot)
- **Phiên bản**: StudentHub AI v2.9.0 (AI Trust Layer 1 — Fast & Deterministic Screening Suite).
- **Vừa triển khai & Kiểm thử thành công**:
  1. ✅ **Layer 1 Fast & Deterministic Screening Engine (`lib/ai-trust/layer1`)**:
     - 🛡️ **URL Screening**: Phân tích giao thức HTTP, IP thô, tên miền lừa đảo subdomain (`hcmute-login.verify-xxx.com`), homoglyph Cyrillic/Greek, file thực thi độc hại (`.exe`, `.apk`, `.ps1`), link rút gọn (`bit.ly`), whitelist giáo dục quốc gia (`.edu.vn`, `.gov.vn`).
     - 📝 **Text Screening**: Bắt chính xác bẫy lừa OTP/mật khẩu, giả danh trường học/ngân hàng, lừa nạp cọc CTV Shopee/Lazada, malware payload (`powershell -enc`, `curl | bash`). Bảo vệ AI Style Guard không đơn phương kích hoạt BLOCK.
     - 🖼️ **Image Screening**: Kiểm tra Magic Bytes nhị phân (PNG, JPEG, WebP, GIF), phát hiện tệp thực thi polyglot (`MZ`, `PK`) ngụy trang đuôi ảnh, cầu nối QR Code URL và OCR text screening.
     - ⚖️ **Hard Rules + Confidence Scoring**: Chuẩn hóa 3 trạng thái (`BLOCK` early-exit [0.95-0.99], `SUSPICIOUS` [0.45-0.85], `PASS` [0.90-0.99]).
  2. ✅ **Backend API Route (`POST /api/ai-trust/screen`)**:
     - Route Handler siêu tốc (Target Latency < 15ms) trả về chuẩn JSON `{ layer: 1, status, confidence, reasons, signals, details, metrics }`.
  3. ✅ **Frontend Telemetry Suite & Test Benchmark Studio**:
     - `Layer1TelemetryHUD.jsx`: Máy đọc HUD viền tóc chuẩn typography kép (Inter + JetBrains Mono), đồng hồ đo Confidence, ma trận tín hiệu có trọng số.
     - `Layer1LivePrechecker.jsx`: Trình quét tương tác 0ms client-side keystroke / dropzone inspection.
     - `Layer1BenchmarkStudio.jsx`: Bộ 8 kịch bản kiểm thử mẫu thực tế (URL lừa đảo, Task scam, Trojan image, Whitelist pass).
     - `scam-check/page.jsx`: Tích hợp toàn diện giao diện với pipeline 4 lớp.

---

## 2. Đường Dẫn File Quan Trọng
- **Đặc Tả Kỹ Thuật Layer 1**: `docs/vault/01 - 🏗️ System Architecture/AI-Trust-Layer1-Screening-Spec.md`
- **Layer 1 Core Scanner**: `frontend/src/lib/ai-trust/layer1/scanner.js`
- **Backend API Endpoint**: `frontend/src/app/api/ai-trust/screen/route.js`
- **Telemetry HUD**: `frontend/src/components/trust/Layer1TelemetryHUD.jsx`
- **Live Prechecker**: `frontend/src/components/trust/Layer1LivePrechecker.jsx`
- **Benchmark Studio**: `frontend/src/components/trust/Layer1BenchmarkStudio.jsx`
- **Trang Scam Check**: `frontend/src/app/scam-check/page.jsx`
- **Vault Hub**: `docs/vault/Index.md`
