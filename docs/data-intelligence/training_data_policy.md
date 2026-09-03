# 🧠 StudentHub AI — Training Data Governance & Hard-Negative Policy

> **Document ID**: `TRAIN-POL-001` | **Version**: 1.0.0 | **Model Architecture**: PEFT / LoRA Specialist Adapters

---

## 1. Nguyên Tắc Huấn Luyện Mô Hình Chuyên Biệt (Specialist Training Principles)

1. **Không Fine-Tune Toàn Bộ Weights Cho Mọi Nhiệm Vụ**:
   - Sử dụng **Shared Foundation Model** kết hợp với các **Adapter PEFT/LoRA chuyên biệt** (Ví dụ: `HCMUTE-Academic-Adapter`, `Contract-Intelligence-Adapter`, `Fraud-NLP-Adapter`).
2. **Không Train Facts Vĩnh Viễn Vào Weights**:
   - Các thông tin thường xuyên biến động (Hạn chót học phí, lịch thi, phòng học) được lưu trữ tại **Knowledge Graph & RAG Vector Index**, tuyệt đối không phụ thuộc vào bộ nhớ tĩnh của weights.
3. **Phân Tách Dữ Liệu Huấn Luyện (Data Contamination Guard)**:
   - Dữ liệu chia theo thời gian (Temporal Split): Train trên tập dữ liệu quá khứ ($2024 - 2025$), Benchmark đánh giá trên tập dữ liệu hoàn toàn mới ($2026$).
   - Tập Test Benchmark **100% là dữ liệu đời thực (Unseen Real Data)**, không pha trộn dữ liệu AI tự sinh (0% Synthetic).

---

## 2. Chiến Lược Dữ Liệu Hard Negatives (Chống Học Vẹt Từ Khóa)

Để tránh mô hình bị bẫy "thấy từ khóa là phán lừa đảo", dataset bắt buộc phải chứa các cặp **Hard Negative** thực tế:

| Cặp Tình Huống | Mẫu Câu Huấn Luyện | Nhãn Thẩm Định | Giải Thích Bản Chất Ngữ Cảnh |
| :--- | :--- | :--- | :--- |
| **Cặp 1: Ngân Hàng & OTP** | *"Ngân hàng cảnh báo: Tuyệt đối không cung cấp mã OTP cho bất kỳ ai."* | **`LEGITIMATE` (Chính thống)** | Thông báo nâng cao cảnh giác từ ngân hàng. |
| | *"Chuyên viên ngân hàng yêu cầu bạn đọc mã OTP để hủy lệnh trừ tiền."* | **`CRITICAL_SCAM` (Lừa đảo)** | Ý đồ chiếm đoạt quyền kiểm soát tài khoản. |
| **Cặp 2: Học Bổng & Phí** | *"Chúc mừng bạn nhận học bổng Samsung, sinh viên nộp hồ sơ tại Phòng CTSV."* | **`LEGITIMATE` (Chính thống)** | Học bổng chính danh, tiếp nhận qua trường. |
| | *"Bạn đã trúng học bổng quốc tế, vui lòng chuyển 500k phí giữ chỗ qua Zalo."* | **`CRITICAL_SCAM` (Lừa đảo)** | Bẫy thu phí cọc học bổng ảo. |
| **Cặp 3: Học Tập & Đề Thi** | *"Bài tập lớn môn C++ yêu cầu nộp file mã nguồn qua hệ thống nộp bài."* | **`LEGITIMATE` (Học vụ)** | Hoạt động học tập chính quy. |
| | *"Nhận bao đậu môn Giải tích 2 cam kết điểm A giá 2 triệu nộp trước 50%."* | **`ACADEMIC_FRAUD` (Gian lận)** | Dịch vụ thi hộ / lừa đảo học vụ. |

---

## 3. Vòng Lặp Cải Tiến Liên Tục (Continuous Research Lab Loop)

```
[ PRODUCTION ENVIRONMENT ]
            │
            ▼
    [ HARD EDGE CASES ] (Các ca phán đoán bất định)
            │
            ▼
     [ HUMAN REVIEW ]   (Chuyên gia & Sinh viên thẩm định)
            │
            ▼
      [ GOLD DATA ]     (Dữ liệu vàng đã chuẩn hóa)
            │
            ▼
     [ ADAPTER TRAIN ]  (Huấn luyện lại LoRA Adapter)
            │
            ▼
    [ EVAL BENCHMARK ] ─→ [ PASS: DEPLOY ] / [ FAIL: RETUNE ]
```
