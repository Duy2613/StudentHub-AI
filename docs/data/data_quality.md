# 🛡️ STUDENTHUB AI — DATA QUALITY GATES & QUARANTINE SPECIFICATION
> **Document ID**: `DATA-QUAL-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Cổng Kiểm Soát Chất Lượng Dữ Liệu 8 Bước (The 8-Step Quality Gate)

Mọi bản ghi dữ liệu trước khi được nạp vào hệ sinh thái đều phải vượt qua:

```
[Dữ liệu thô (Raw Data)]
         │
         ▼
[1. SCHEMA VALIDATION] ──> Kiểm tra đúng định dạng JSON Schema / TypeScript Interface
         │
         ▼
[2. DEDUPLICATION] ──────> Khử trùng lặp bằng mã băm nội dung SHA-256
         │
         ▼
[3. PII MASKING] ────────> Tự động che số CCCD, số thẻ, địa chỉ nhà riêng
         │
         ▼
[4. PROVENANCE CHECK] ───> Xác minh đủ 6 câu hỏi xuất xứ (Nguồn, Ngày, Hash, URL)
         │
         ▼
[5. SOURCE TIERING] ─────> Phân loại cấp độ nguồn (Tier A đến S)
         │
         ▼
[6. TEMPORAL GATE] ──────> Kiểm tra tính hiệu lực theo thời gian (Valid From / Valid To)
         │
         ▼
[7. CONTRADICTION GATE] ─> Đối soát mâu thuẫn chéo với Đồ thị thực thể
         │
         ▼
[8. LICENSE & ETHICS] ───> Kiểm tra bản quyền dữ liệu mở & quy chuẩn đạo đức
         │
   ┌─────┴─────┐
   ▼           ▼
[PASS]    [FAIL ──> QUARANTINE ISOLATION]
```
