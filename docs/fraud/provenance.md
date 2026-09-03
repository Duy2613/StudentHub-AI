# 🏷️ StudentHub AI — Data Provenance & Lineage Framework

> **Document ID**: `FRAUD-PROVENANCE-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. 6 Câu Hỏi Bắt Buộc Về Xuất Xứ Dữ Liệu (6-Question Provenance Model)

Mọi bản ghi thông tin và chỉ số an ninh trong hệ thống bắt buộc phải trả lời đầy đủ 6 câu hỏi:
1. **Ai là tác giả / cơ quan ban hành?** (`publisher`: NCSC, Bộ Công An, FTC, URLhaus, Trường ĐH)
2. **Xuất bản ở đâu và liên kết gốc là gì?** (`source_url`)
3. **Được ban hành vào thời điểm nào?** (`published_at`)
4. **Hệ thống StudentHub AI thu nhận vào thời điểm nào?** (`retrieved_at`)
5. **Mã băm toàn vẹn nội dung là gì?** (`content_hash`)
6. **Mức độ tin cậy được hiệu chuẩn là bao nhiêu?** (`confidence_score`)
