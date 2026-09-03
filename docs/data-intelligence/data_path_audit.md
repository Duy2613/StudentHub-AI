# 🛰️ StudentHub AI — Data Path & UI Tracing Audit

> **Document ID**: `DATA-PATH-AUDIT-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Bản Đồ Truy Vết Từ Giao Diện Đến Nguồn Dữ Liệu (UI $\rightarrow$ Source Tracing)

| Màn Hình Giao Diện (UI Screen) | Component Hiển Thị | API Endpoint / Hook | Service / Engine Xử Lý | Kho Dữ Liệu Thực Tế | Đánh Giá Đường Dẫn Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bóc Tách Hợp Đồng & Công Văn** (`/contract-check`) | `ContractAnalysisResults.jsx` / `VersionDiffView.jsx` | `POST /api/contract-check/analyze` | `contractIntelligenceEngine.js` & `documentVersionDiffEngine.js` | Người dùng dán văn bản trực tiếp hoặc tải tệp | ✅ **VERIFIED_DATA_PATH** (User Input $\rightarrow$ Ingest Engine $\rightarrow$ Output) |
| **Phòng Cấp Cứu SOS** (`/sos`) | `Hold2sButton`, `EmergencyHotlineGrid` | Client-side Native Trigger | `emergencySystemEngine.js` | Danh bạ đầu số 112, 113, 114, 115 trong `emergencySystemEngine.js` | ✅ **VERIFIED_DATA_PATH** (Native Phone Protocol `tel:`) |
| **Bản Đồ Tuyến Đường An Toàn** (`/safety-map`) | `SafetyRouteSelector.jsx` | Client-side State + Deep-link | `safetyRoutingEngine.js` & `geospatialSafetyEngine.js` | Tọa độ chốt Công An Thủ Đức, Google Maps URL | ✅ **VERIFIED_DATA_PATH** (Heuristic Model + Google Maps Client-side) |
| **AI Review Giảng Viên** (`/prof-rating`) | `ProfessorCardGrid.jsx` | `GET /api/prof-rating/professors` | `profReviewRegistry.js` | Mảng dữ liệu mẫu 4 thầy cô (`PROFESSOR_REGISTRY`) | ⚠️ **PARTIAL_DATA_PATH** (Dữ liệu tĩnh tuyển chọn, chưa crawl từ mạng xã hội) |
| **Kiểm Tra Lừa Đảo** (`/scam-check`) | `RiskMeterSplitVerdict.jsx` | `POST /api/ai-trust/screen` & `POST /api/ai-trust/reasoning` | Layer 1-4 AI Trust Engine & `threatIntelligenceFeed.js` | 70+ Brand Catalog + IOCs Danh sách đen | ✅ **VERIFIED_DATA_PATH** (Deterministic Hybrid Multi-Layer Pipeline) |

---

## 2. Các Đường Dẫn Dữ Liệu Chưa Kiểm Chứng (Unverified Data Paths)

1. **Cổng Đào Tạo HCMUTE Trực Tiếp**:
   - `UI (/credit-scheduler)` $\rightarrow$ `Chưa có API đăng nhập cổng online.hcmute.edu.vn` $\rightarrow$ Đang sử dụng dữ liệu nhập liệu từ người dùng.
2. **Cập Nhật Điểm Đen Giao Thông Thời Gian Thực**:
   - `UI (/safety-map)` $\rightarrow$ Chưa có API webhook từ Sở GTVT $\rightarrow$ Đang sử dụng cơ sở dữ liệu tọa độ chốt Công An cố định.
