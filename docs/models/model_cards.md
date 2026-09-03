# 🗃️ STUDENTHUB AI — MASTER MODEL CARDS
> **Document ID**: `MOD-CARD-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Model Card: Multi-Head Multi-Label Neural Trust Engine (`MOD_MULTIHEAD_NEURAL`)

* **Phiên bản**: v2.1.0 | **Framework**: Node.js Math Kernels
* **Nhiệm vụ**: Phân tích văn bản tin nhắn, email, bài đăng tuyển dụng để phát hiện đồng thời 5 khía cạnh:
  1. Xác suất lừa đảo $P(\text{Scam}) \in [0.0, 1.0]$
  2. 38 loại hình lừa đảo chuyên biệt (Mạo danh Công an, Lừa cọc phòng trọ, Bẫy việc làm Shopee...)
  3. 24 chiến thuật thao túng tâm lý (Sợ hãi, Cấp bách, Cô lập, Đóng dấu Mật...)
  4. 6 giai đoạn tấn công (Tiếp cận $\rightarrow$ Tạo niềm tin $\rightarrow$ Ép chuyển tiền...)
  5. Hành động bị yêu cầu (Chuyển khoản, Đọc OTP, Tải tệp APK, Cài app lạ...)
* **Độ trễ trung bình**: $1.8\text{ms}$ trên CPU thông thường.
* **Cơ chế từ chối an toàn (Abstention)**: Tự động trả về `INSUFFICIENT_EVIDENCE` khi văn bản quá ngắn hoặc không đủ bằng chứng đối soát.

---

## 2. Model Card: Academic CSP Timetable Engine (`MOD_CSP_SCHEDULER`)

* **Phiên bản**: v1.5.0 | **Thuật toán**: Constraint Satisfaction Problem with Backtracking
* **Ràng buộc cứng (Hard Constraints)**:
  - Hai lớp học phần trong cùng một phương án không được trùng bất kỳ tiết học nào ($s_1 \cap s_2 = \emptyset$).
* **Hàm mục tiêu mềm (Soft Optimization Goals)**:
  - `MORNING_FOCUS`: Ưu tiên học các tiết 1-5 buổi sáng.
  - `AFTERNOON_FOCUS`: Ưu tiên học các tiết 7-12 buổi chiều.
  - `FREE_FRIDAY`: Tối đa hóa khả năng trống lịch học ngày Thứ Sáu.
  - `BALANCED`: Phân bổ số tiết đều giữa các ngày trong tuần.
