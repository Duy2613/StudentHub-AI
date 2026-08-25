# 💎 StudentHub AI — Data Quality Gate & Provenance Standards

> **Document ID**: `DATA-QUAL-001` | **Version**: 1.0.0 | **Standard**: Evidence-Driven Architecture

---

## 1. Quy Trình Cổng Kiểm Định Chất Lượng (Data Quality Gate)

Mọi mẫu dữ liệu thu thập từ Internet trước khi được đưa vào Knowledge Graph hoặc phục vụ huấn luyện đều phải trải qua **9 Bước Kiểm Định Tự Động**:

```
[ RAW DATA RECORD ]
        │
        ▼
1. SCHEMA VALIDATION ────────→ Kiểm tra định dạng JSON, trường bắt buộc
        │
        ▼
2. DEDUPLICATION ────────────→ Băm nội dung SHA-256 đối soát trùng lặp
        │
        ▼
3. PII REDACTION ────────────→ Ẩn danh hóa thông tin định danh cá nhân nhạy cảm
        │
        ▼
4. PROVENANCE CHECK ─────────→ Xác thực 6 câu hỏi xuất xứ nguồn gốc
        │
        ▼
5. SOURCE TIER AUDIT ────────→ Phân loại Tier A, B, C, D
        │
        ▼
6. TEMPORAL CHECK ───────────→ Tính điểm Freshness và thời hạn hiệu lực
        │
        ▼
7. CONTRADICTION CHECK ──────→ Đối soát chéo với các nguồn đã có trong kho tri thức
        │
        ▼
8. LABEL INTEGRITY ──────────→ Kiểm tra tính nhất quán của nhãn (FACT vs OPINION)
        │
        ▼
9. PASS / QUARANTINE ────────→ [ GOLD DATA / QUARANTINE ]
```

---

## 2. Tiêu Chuẩn Xuất Xứ 6 Câu Hỏi (6-Question Provenance Model)

| STT | Câu Hỏi Thẩm Định | Trường Dữ Liệu Tương Ứng | Tiêu Chí Đạt (Passing Criteria) |
| :---: | :--- | :--- | :--- |
| **1** | *Ai cung cấp thông tin này?* | `publisher` | Phải là tên cơ quan, phòng ban hoặc định danh tác giả rõ ràng. |
| **2** | *Nguồn gốc dữ liệu lấy từ đâu?* | `source_url`, `source_domain` | URL cụ thể hoặc tên miền chính danh hợp lệ. |
| **3** | *Dữ liệu được thu thập vào thời điểm nào?* | `retrieved_at`, `published_at` | Định dạng chuẩn ISO-8601 UTC. |
| **4** | *Thông tin này còn thời hạn hiệu lực không?* | `valid_from`, `valid_to`, `freshness_status` | Phân loại `FRESH`, `AGING`, `STALE` hoặc `EXPIRED`. |
| **5** | *Có nguồn độc lập nào khác xác nhận không?* | `corroboration_sources` | Mảng chứa danh sách các URL đối soát chéo. |
| **6** | *Có mã băm nội dung gốc đối chiếu không?* | `content_hash`, `evidence_doc_id` | Chuỗi băm SHA-256 của văn bản gốc. |

---

## 3. Thang Điểm Bằng Chứng (Evidence Strength Scoring)

$$\text{Evidence Strength} = 0.35 \times \text{Authority} + 0.20 \times \text{Freshness} + 0.20 \times \text{Corroboration} + 0.15 \times \text{Completeness} + 0.10 \times \text{Consistency}$$

* $\ge 0.85$: **Mức Độ Tin Cậy Cao (HIGH CONFIDENCE)** — Đủ điều kiện hiển thị khẳng định.
* $0.60 - 0.84$: **Mức Độ Tin Cậy Trung Bình (MEDIUM CONFIDENCE)** — Cần hiển thị cảnh báo kèm trích dẫn nguồn.
* $< 0.60$: **Mức Độ Tin Cậy Thấp (LOW CONFIDENCE)** — Hệ thống từ chối xác nhận (`INSUFFICIENT_EVIDENCE`).
