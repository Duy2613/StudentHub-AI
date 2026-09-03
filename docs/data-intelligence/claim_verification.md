# 🔍 StudentHub AI — Claim Verification & Entailment Standards

> **Document ID**: `CLAIM-VERIF-001` | **Version**: 1.0.0 | **Policy**: Zero AI Hallucination Guarantee

---

## 1. Quy Trình 6 Bước Thẩm Định Tuyên Bố Factual (Claim Verification Pipeline)

Mọi câu trả lời chứa thông tin số liệu, ngày tháng hoặc quy chế học vụ do AI phản hồi cho sinh viên đều phải tuân theo quy trình kiểm chứng:

```
[ INPUT CLAIM / USER QUERY ]
             │
             ▼
1. RETRIEVE AUTHORITATIVE EVIDENCE ──→ Truy xuất văn bản gốc từ Tier A / Tier B
             │
             ▼
2. SEMANTIC ENTAILMENT CHECK ────────→ Kiểm tra xem bằng chứng có suy dẫn ra kết luận không
             │
             ▼
3. CONTRADICTION & TEMPORAL AUDIT ───→ Rà soát văn bản đính chính, mâu thuẫn thời gian
             │
             ▼
4. SOURCE AUTHORITY RANKING ─────────→ Xếp hạng trọng số độ uy tín nguồn (0.0 - 1.0)
             │
             ▼
5. DETERMINE VERIFICATION STATUS ────→ Phán quyết: CONFIRMED / CONTRADICTED / UNVERIFIED
             │
             ▼
6. GROUNDED ANSWER + CITATION ───────→ Xuất phản hồi kèm Trích Dẫn URL & Ngày Ban Hành
```

---

## 2. Các Trạng Thái Phán Quyết (Verification Verdicts)

| Trạng Thái (Verdict) | Ý Nghĩa Kỹ Thuật | Hành Động Phản Hồi Cho Sinh Viên |
| :--- | :--- | :--- |
| **`CONFIRMED`** | Trùng khớp $100\%$ với công văn chính thức Tier A còn hiệu lực. | Khẳng định thông tin, trích dẫn số hiệu công văn và link tải. |
| **`SUPPORTED`** | Được hỗ trợ bởi $\ge 2$ nguồn tin cậy Tier B độc lập. | Cung cấp thông tin kèm ghi chú nguồn tham khảo. |
| **`PARTIALLY_SUPPORTED`** | Thông tin có căn cứ nhưng bị phóng đại phạm vi hoặc điều kiện áp dụng. | Làm rõ điều kiện chi tiết (Ví dụ: Chỉ áp dụng cho K23 CLC). |
| **`CONTRADICTED`** | Bị bác bỏ hoàn toàn bởi văn bản điều chỉnh mới nhất. | Cảnh báo sai lệch, hiển thị văn bản đính chính thay thế. |
| **`UNVERIFIED / ABSTAIN`** | Chưa tìm thấy bằng chứng chính thống đối soát. | **Từ chối khẳng định**, yêu cầu sinh viên liên hệ trực tiếp PĐT/CTSV. |
| **`CONFLICT_UNRESOLVED`** | Hai cổng thông tin đưa ra hai mốc thời gian khác nhau. | Hiển thị cả 2 nguồn kèm ngày cập nhật của từng cổng. |

---

## 3. Ví Dụ Thẩm Định Thực Tế (HCMUTE Case Studies)

### Case 1: Hạn Đóng Học Phí
* **Tuyên Bố**: *"Hạn nộp học phí Học kỳ 2 là ngày 15/03/2026."*
* **Bằng Chứng Đối Soát**: Thông báo số 142/TB-ĐHSPKT ngày 20/02/2026 trên `online.hcmute.edu.vn`.
* **Kết Luận**: `CONFIRMED` (Độ tin cậy: `0.99`, Nguồn: Phòng KHTC HCMUTE).

### Case 2: Tin Đồn Miễn Học Phí Toàn Bộ
* **Tuyên Bố**: *"Trường miễn 100% học phí cho toàn thể sinh viên năm 2026."*
* **Bằng Chứng Đối Soát**: Không có văn bản nào từ Bộ GD&ĐT hay Ban Giám hiệu HCMUTE.
* **Kết Luận**: `INSUFFICIENT_EVIDENCE / UNVERIFIED` (AI không bịa đặt xác nhận tin đồn).
