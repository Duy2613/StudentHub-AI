# 🎓 Expert Intelligence V1 (Phase T2)

## 1. Executive Overview

**Expert Intelligence V1** is the second standalone intelligence subsystem of the **StudentHub Intelligence OS**.

```text
EXPERT
  │
  ▼
IDENTITY & CREDENTIALS
(Verified academic titles, PhD degrees, MoET registries)
  │
  ▼
EXPERT SCOPE GRAPH
(Strong: AI/ML, Robotics • Moderate: EdTech • Not Established: Tuition Policy)
  │
  ▼
DISCIPLINARY & ADMINISTRATIVE JURISDICTION
(Technical Domain vs Institutional Registrar Authority)
  │
  ▼
CONFLICT OF INTEREST DETECTION
(Flags commercial endorsements & sponsored bias)
  │
  ▼
EXPERT OPINION EVALUATION
(Qualified Expert Opinion / Interpretation Only / Out of Scope / Authority Mismatch)
```

---

## 2. Core Invariant: `EXPERTISE ≠ INSTITUTIONAL AUTHORITY`

1. **Academic Expertise vs Administrative Authority**:
   Một giáo sư AI hàng đầu có học hàm GS.TS và hàng chục bài báo quốc tế (Expertise: AI/ML) sở hữu **năng lực chuyên môn cao**, nhưng **không có thẩm quyền hành chính** (`INSTITUTIONAL_ADMIN`) để ban hành hay thay đổi quy chế điểm chuẩn TOEIC hay học phí của HCMUTE.
   - Thẩm quyền quy chế đào tạo thuộc về **Phòng Đào Tạo / Ban Giám Hiệu** (`hasRegistrarAuthority: true`).
   - Mọi khẳng định của giảng viên về quy chế hành chính chỉ được xếp hạng `AUTHORITY_MISMATCH` (nhận định cá nhân, không cấu thành quy chế chính thức).

2. **Đồ Thị Phạm Vi Chuyên Môn (Expert Scope Graph)**:
   Mỗi chuyên gia có đồ thị năng lực phân cấp:
   - `STRONG`: Lĩnh vực chuyên sâu đã có công trình nghiên cứu được bình duyệt.
   - `MODERATE`: Lĩnh vực liên ngành / giáo dục bổ trợ.
   - `NOT_ESTABLISHED`: Lĩnh vực chưa có bằng chứng chuyên môn (ngoài chuyên môn).
   - `DISQUALIFIED`: Bị thu hồi hoặc vi phạm xung đột lợi ích.

3. **Phát Hiện Xung Đột Lợi Ích (Conflict of Interest)**:
   Các phát ngôn quảng bá thương mại, tài trợ mở thẻ hoặc tiếp thị trung tâm đào tạo ngoài trường bị gán cờ `CONFLICT_OF_INTEREST` và loại khỏi nhóm ý kiến chuyên gia độc lập.

4. **Bảo Tồn Lịch Sử & Thu Hồi (Retraction Tracking)**:
   Các phát ngôn hoặc bài báo đã bị tác giả hoặc hội đồng rút bài / đính chính sẽ tự động chuyển sang `RETRACTED`.

---

## 3. Subsystem Architecture

| Module | File | Role & Invariants |
| :--- | :--- | :--- |
| **Domain Model** | [expertIntelligenceModel.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertIntelligenceModel.js) | Canonical models, enums (`EXPERTISE_LEVEL`, `AFFILIATION_STATUS`, `JURISDICTION_TYPE`, `EXPERT_CLAIM_STATUS`), and entities. |
| **Scope & Jurisdiction Engine** | [expertScopeEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertScopeEngine.js) | Scope graph matching, jurisdiction boundary checks, and conflict of interest filtering. |
| **Expert Store** | [expertStore.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertStore.js) | Persistent storage of verified experts, credentials, and claim evaluation records. |
| **Server API Routes** | [route.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/expert/evaluate/route.js) | Server-authoritative endpoint (`POST /api/expert/evaluate`, `GET /api/expert/graph`). |
| **UI Studio** | [ExpertIntelligenceView.jsx](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/expert/ExpertIntelligenceView.jsx) | Interactive Expert Profiles, Scope Radar, and Claim Verification Sandbox (`/expert`). |

---

## 4. REST API

### `POST /api/expert/evaluate`
- **Request**:
  ```json
  {
    "expertId": "EXP_DR_MINH_AI",
    "claim": {
      "text": "Mô hình Transformer phù hợp cho bài toán dịch máy.",
      "domain": "AI_ML",
      "claimJurisdiction": "TECHNICAL_DOMAIN"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "evaluation": {
      "evaluationId": "EXP_EVAL_...",
      "claimStatus": "QUALIFIED_EXPERT_OPINION",
      "isWithinExpertise": true,
      "isWithinJurisdiction": true,
      "hasConflictOfInterest": false,
      "explanation": "Đúng chuyên môn chuyên sâu: Khẳng định thuộc lĩnh vực AI_ML..."
    }
  }
  ```
