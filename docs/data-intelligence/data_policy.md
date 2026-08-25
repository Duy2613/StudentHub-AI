# ⚖️ StudentHub AI — Data Governance & Privacy Policy

> **Document ID**: `DATA-POL-001` | **Status**: Active | **Compliance**: NIST AI RMF & Law on Protection of Personal Data (Decree 13/2023/NĐ-CP)

---

## 1. Nguyên Tắc Thu Thập & Xử Lý Dữ Liệu

1. **Không Thu Thập Dữ Liệu Tràn Lan**:
   - Chỉ thu thập các nguồn dữ liệu công khai hoặc được người dùng ủy quyền rõ ràng.
2. **Quy Tắc Tối Thiểu Hóa Thông Tin Cá Nhân (PII Minimization)**:
   - Các bản ghi công văn, bài viết cộng đồng hoặc hợp đồng tải lên phân tích phải được ẩn danh hóa (Redact) họ tên, số điện thoại, CMND/CCCD trước khi lưu vào kho tri thức chung.
3. **Phân Tách 8 Lớp Hồ Dữ Liệu (8-Layer Data Lake Architecture)**:
   - `L0_RAW`: Dữ liệu thô vừa tiếp nhận từ crawler / API.
   - `L1_CLEAN`: Dữ liệu đã làm sạch encoding, xóa bỏ thẻ HTML dư thừa.
   - `L2_NORMALIZED`: Dữ liệu chuẩn hóa schema ngày tháng, đơn vị tiền tệ, mã môn học.
   - `L3_DEDUPLICATED`: Dữ liệu đã loại trừ trùng lặp nội dung theo hàm băm `content_hash`.
   - `L4_LABELED`: Dữ liệu đã gắn nhãn loại hình (`FACT`, `OPINION`, `ALLEGATION`, `SCAM_TYPE`).
   - `L5_VERIFIED`: Dữ liệu đã qua đối soát chéo độc lập từ $\ge 2$ nguồn.
   - `L6_TRAINING`: Dữ liệu dùng để fine-tune adapter (PEFT/LoRA).
   - `L7_EVALUATION`: Dữ liệu chuẩn (Gold Benchmark) 100% Unseen Real Data để đánh giá mô hình.
   - `QUARANTINE_DATA`: Dữ liệu lỗi nhãn, mâu thuẫn hoặc nghi vấn bị cách ly.

---

## 2. Ngân Sách Dữ Liệu Nhân Tạo (Synthetic Data Budget)

| Danh Mục Ứng Dụng | Tỷ Lệ Dữ Liệu Thực Tế (Real Data) | Ngân Sách Dữ Liệu Nhân Tạo Tối Đa (Max Synthetic Ratio) | Mục Đích Dữ Liệu Nhân Tạo |
| :--- | :--- | :--- | :--- |
| **Học Vụ & Công Văn Trường ĐH** | $\ge 90\%$ | $\le 10\%$ | Bổ sung biến thể cách diễn đạt câu hỏi học tập |
| **Bóc Tách Hợp Đồng (Contract AI)** | $\ge 85\%$ | $\le 15\%$ | Tạo các biến thể lỗi định dạng văn bản |
| **Nhận Diện Lừa Đảo (Fraud AI)** | $\ge 80\%$ | $\le 20\%$ | Giả lập biến thể viết tắt tiếng lóng, sai chính tả có chủ đích |
| **OCR & Thị Giác Tài Liệu** | $\ge 70\%$ | $\le 30\%$ | Giả lập độ mờ (blur), góc nghiêng (rotation), nhiễu ảnh |
| **Tập Kiểm Chuẩn Cuối Cùng (Final Benchmark)** | **100% REAL** | **0% SYNTHETIC** | Tuyệt đối không dùng dữ liệu AI tự sinh để chấm điểm chính mình |

---

## 3. Chính Sách Xử Lý Khi Dữ Liệu Không Rõ Ràng (Non-Fabrication Policy)

Khi hệ thống gặp các trường hợp thiếu thông tin hoặc chưa thể kiểm chứng, AI **BẮT BUỘC** phải phản hồi theo các trạng thái chuẩn hóa sau:

* `UNKNOWN`: Chưa có thông tin trong cơ sở dữ liệu.
* `ACCESS_LIMITED`: Nguồn tin bị giới hạn quyền truy cập hợp pháp.
* `SOURCE_NOT_FOUND`: Không tìm thấy nguồn thông tin tham chiếu.
* `CONFLICT_UNRESOLVED`: Tồn tại mâu thuẫn giữa các nguồn công bố chưa thể giải quyết.
* `INSUFFICIENT_EVIDENCE`: Chưa đủ bằng chứng để đưa ra kết luận khẳng định.
