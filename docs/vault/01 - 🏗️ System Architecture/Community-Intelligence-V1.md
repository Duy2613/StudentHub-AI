# 👥 Community & Forum Intelligence V1 (Phase T3)

## 1. Executive Overview

**Community Intelligence V1** is the third standalone intelligence subsystem of the **StudentHub Intelligence OS**, providing the **Real-World Experience Layer**.

```text
STUDENT COMMUNITY POST / COMMENT
  │
  ▼
CONTENT CLASSIFICATION
(First-Hand Experience • Guide • Second-Hand Report • Question • Opinion • Speculation)
  │
  ▼
CONTENT HASH & FINGERPRINTING
(Collapses identical texts/links into single provenance clusters)
  │
  ▼
ASTROTURFING & SYBIL DEFENSE
(Detects coordinated copy-paste & commercial spam links -> SUSPECTED_COORDINATION)
  │
  ▼
EXPERIENCE CONSENSUS ENGINE
(>= 3 independent accounts with unique phrasing -> STRONG_EXPERIENCE_CONSENSUS)
  │
  ▼
REAL-WORLD PROCEDURE DURATION & EDGE-CASE MINING
(Calculates median procedure completion days across actual cohorts)
```

---

## 2. Core Invariant: `COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY`

1. **Real-World Experience vs Academic Authority**:
   Ý kiến hoặc chia sẻ của sinh viên trên diễn đàn đóng vai trò là **lớp dữ liệu thực tế** (thời gian xử lý thực tế, kinh nghiệm nộp hồ sơ, edge cases), nhưng **tuyệt đối không bao giờ được phép tự biến thành quy chế học vụ chính thức**.
2. **Experience Consensus thay vì Upvote Vanity**:
   1000 lượt upvote vào 1 bài viết tin đồn hoặc bot spam **không tạo ra đồng thuận kinh nghiệm**.
   Đồng thuận kinh nghiệm mạnh (`STRONG_EXPERIENCE_CONSENSUS`) bắt buộc phải có **tối thiểu 3 sinh viên độc lập**, với **nội dung diễn đạt độc lập**, trong cùng một khung thời gian quy trình.
3. **Phòng Thủ Thao Túng & Astroturfing (Suspected Coordination)**:
   Khi nhiều tài khoản đăng nội dung giống hệt nhau hoặc spam cùng một liên kết thương mại, hệ thống gom lại thành **1 Cụm Xuất Xứ (Provenance Cluster)** và gắn cờ `SUSPECTED_COORDINATION`.

---

## 3. Subsystem Architecture

| Module | File | Role & Invariants |
| :--- | :--- | :--- |
| **Domain Model** | [communityIntelligenceModel.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityIntelligenceModel.js) | Canonical models, enums (`CONTENT_TYPE`, `CONSENSUS_SIGNAL`, `MANIPULATION_RISK`), and entities. |
| **Experience Engine** | [communityExperienceEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityExperienceEngine.js) | Content fingerprinting, consensus calculation, median procedure duration, astroturfing defense. |
| **Community Store** | [communityStore.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityStore.js) | Persistent store for student experiences across topics. |
| **Server API Routes** | [route.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/app/api/community/experience/evaluate/route.js) | Server-authoritative endpoint (`POST /api/community/experience/evaluate`, `GET /api/community/experiences`). |
| **UI Studio** | [CommunityIntelligenceView.jsx](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/community/CommunityIntelligenceView.jsx) | Real-World Experience Explorer, Consensus Signal Matrix, and Procedure Duration insights (`/community`). |

---

## 4. REST API

### `POST /api/community/experience/evaluate`
- **Request**:
  ```json
  {
    "topic": "TOEIC_SUBMISSION"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "topic": "TOEIC_SUBMISSION",
    "postsCount": 3,
    "evaluation": {
      "consensusSignal": "STRONG_EXPERIENCE_CONSENSUS",
      "manipulationRisk": "NONE",
      "independentAccountsCount": 3,
      "provenanceClustersCount": 3,
      "medianProcedureDays": 7,
      "summary": "Đồng thuận trải nghiệm thực tế mạnh (3 sinh viên độc lập xác nhận cùng mốc quy trình). Thời gian xử lý trung vị thực tế: 7 ngày."
    }
  }
  ```
