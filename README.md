# StudentHub AI — Kiểm chứng trước khi tin

> Giúp sinh viên kiểm tra thông tin qua nguồn, bối cảnh, trải nghiệm cộng đồng và nhận định chuyên gia đúng phạm vi.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0_Turbopack-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24.x-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Zero-Trust Security](https://img.shields.io/badge/Security-Zero--Trust_Fabric-emerald?style=flat&logo=shield)](https://github.com/Duy2613/StudentHub-AI)

---

## Hướng sản phẩm và trạng thái bằng chứng — 08/09/2026

Định hướng mới tập trung **Trust → Community → Expert → hồ sơ bằng chứng → bước tiếp theo**. Khóa học và các phần quảng bá catalog/lesson/practice được đưa vào kế hoạch loại khỏi sản phẩm đích. Đây là thay đổi trong đề án; code của các phần đó chưa được gỡ ở phiên viết tài liệu.

| Nội dung | Tài liệu có phạm vi/ngày kiểm chứng |
| --- | --- |
| Đề án frontend + backend + năng lực dự thi | [README đề án](docs/frontend/national-experience-2026-09-08/README.md) |
| Điểm /10, giới hạn dự báo giải Nhất | [REPORT](docs/frontend/national-experience-2026-09-08/REPORT.md) |
| Roadmap và cắt tính năng | [PLAN](docs/frontend/national-experience-2026-09-08/PLAN.md), [SCOPE-REDUCTION](docs/frontend/national-experience-2026-09-08/SCOPE-REDUCTION.md) |
| Yêu cầu và kiểm chứng | [SPEC](docs/frontend/national-experience-2026-09-08/SPEC.md), [ACCEPTANCE](docs/frontend/national-experience-2026-09-08/ACCEPTANCE.md) |
| Prompt thiết kế, asset, engineering | [PROMPTS](docs/frontend/national-experience-2026-09-08/PROMPTS.md) |
| Release assurance lịch sử 06/09 | [Báo cáo release](docs/reports/STUDENTHUB-AI-RELEASE-ASSURANCE-REPORT.md): `ACADEMIC_CINEMATIC_EVOLUTION_NOT_RELEASE_READY` |
| Auth/session local | [Auth closure](docs/reports/AUTH-SESSION-CLOSURE-2026-09-06.md) |
| Realtime local 07/09 | [Realtime closure](docs/reports/REALTIME-MULTI-INSTANCE-CLOSURE-2026-09-07.md) |
| Labbe shadow / staging chưa đủ môi trường | [Labbe closure](docs/reports/LABBE-STAGING-ASSURANCE-CLOSURE-2026-09-06.md) |

Mỗi PASS chỉ áp dụng cho candidate và điều kiện trong báo cáo gốc. Không có đợt test toàn hệ thống mới trong phiên lập đề án 08/09. Không dùng fixture, synthetic telemetry hoặc metric chưa gắn model/dataset để tuyên bố kết quả thực tế. Không có tuyên bố production readiness hay khả năng phục vụ toàn quốc đã được kiểm chứng.

---

## Kiến trúc và ranh giới trách nhiệm

```text
Browser → identity / authorization / input validation
        → Trust orchestration → nguồn và provider có giới hạn
        → repository / PostgreSQL: case, run, revision, outbox
        → read/report projection theo owner → UI

Community và Expert: bổ sung căn cứ đúng scope
Realtime: thông báo/projection, không là nguồn quyết định
Labbe: quan sát và assurance tùy mode, không writeback
```

Repository có nhiều module học vụ, planner và showcase từ các phiên trước. Chúng không tự động trở thành phạm vi sản phẩm dự thi. Việc cắt bề mặt, giữ dữ liệu và phân tích dependency được mô tả trong SCOPE-REDUCTION; mức độ kiểm chứng từng đường xử lý nằm trong các báo cáo có ngày ở trên.

## Trải nghiệm trọng tâm

| Surface | Vai trò | Ranh giới |
| --- | --- | --- |
| `/` | Lời hứa sản phẩm và điểm vào kiểm chứng | Không dùng số liệu hoặc đối tác giả để quảng bá |
| `/trust` | Nhập thông tin, xem nguồn, bối cảnh, điều chưa biết và next action | Verdict do pipeline/policy tạo; UI không tự gán an toàn |
| `/community` | Trải nghiệm và đối chiếu có xuất xứ | Số vote không là điểm sự thật |
| `/expert` | Nhận định theo domain, credential và COI | Presence/quiz không đủ để tự cấp quyền chuyên gia |
| `/cases` | Case mẫu để hiểu sản phẩm | Fixture phải có nhãn, không là dữ liệu live |
| Account / report / Passport | Quyền, case history và snapshot theo revision | Chỉ đọc/lưu/xuất khi được phép; không giả persisted state |

## Local development

### 1. Prerequisites
- Node.js 24.x (`>=24 <25`, theo `package.json`)
- npm 11.x (`>=11 <12`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Duy2613/StudentHub-AI.git
cd StudentHub-AI

# Install dependencies
npm ci
npm ci --prefix frontend
```

### 3. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

Tham khảo `frontend/.env.local.example` và các hướng dẫn môi trường trước khi bật provider/database. File ví dụ không chứa credential hoạt động; đưa secret vào môi trường local phù hợp. Không bật Labbe STAGING/CONTROLLED hoặc chạy live database gate chỉ để xem giao diện.

---

## 🧪 Comprehensive Automated Test Suites

StudentHub OS includes comprehensive automated test suites covering security attack simulations, durability, and multi-audience workflows:

```bash
# Run all master test suites
npm run test:all

# Run the complete discovered regression and final audit suites
npm run test:all-discovered
npm run test:final-audit

# Run specific domain suites
npm run test:security              # Zero-Trust attack simulations & BOLA checks
npm run test:p0-p1                 # BOLA/IDOR and state durability regression
npm run test:os-slices             # 4 Invariant E2E vertical slices
npm run test:db                    # Database repository persistence tests
npm run test:provip-reconstruction # Social intelligence & personalization
npm run test:intelligence-fabric   # T1–T4 Intelligence & Adversarial Matrix

# Run the primary local browser gate from frontend/
cd frontend && npx playwright test --project=chromium
```

---

## 📜 Permanent Knowledge Vault
To explore the Obsidian Permanent Knowledge Vault, run:
```bash
npm run vault
```

---

## 📄 License & Integrity
Developed for university academic intelligence and zero-trust student security. All rights reserved.
