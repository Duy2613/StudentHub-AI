// frontend/src/app/api/chat/route.js
// Next.js API route for StudentHub AI Mentor Assistant

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { messages, subject = "general", reasoningMode = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lower = lastUserMessage.toLowerCase();

    // Khởi tạo phản hồi học thuật chuyên sâu chuẩn StudentHub AI Socratic 2.0
    let reply = "";

    if (lower.includes("độ phức tạp") || lower.includes("big o") || lower.includes("thuật toán") || lower.includes("master theorem")) {
      reply = `### 🧠 Phân Tích Độ Phức Tạp Thuật Toán (Big-O & Master Theorem)

Chào bạn! Dưới đây là các bước suy luận giải trình học thuật chuẩn mực:

#### 1. Phương Trình Đệ Quy Tổng Quát
$$T(n) = a \\cdot T\\left(\\frac{n}{b}\\right) + f(n)$$
Trong đó:
* $a \\ge 1$: Số lượng bài toán con được sinh ra.
* $b > 1$: Tỷ lệ chia nhỏ kích thước bài toán.
* $f(n) = O(n^d)$: Chi phí phân rã và kết hợp kết quả.

#### 2. Các Trường Hợp Định Lý Thợ (Master Theorem)
1. **Trường hợp 1:** Nếu $\\log_b a > d \\implies T(n) = \\Theta(n^{\\log_b a})$
2. **Trường hợp 2:** Nếu $\\log_b a = d \\implies T(n) = \\Theta(n^d \\log n)$
3. **Trường hợp 3:** Nếu $\\log_b a < d$ và thỏa điều kiện chính quy $\\implies T(n) = \\Theta(f(n))$

#### 3. Ví Dụ Cụ Thể (Merge Sort):
$$T(n) = 2T(n/2) + O(n)$$
Có $a = 2, b = 2, d = 1 \\implies \\log_2 2 = 1 = d$. Áp dụng **Trường hợp 2**:
$$\\mathbf{T(n) = \\Theta(n \\log n)}$$

💡 **Lời khuyên từ Mentor**: Hãy tối ưu hóa việc cấp phát bộ nhớ phụ $O(n)$ bằng kỹ thuật *In-place Merge* khi triển khai thực tế.`;
    } else if (lower.includes("lộ trình") || lower.includes("ai") || lower.includes("machine learning") || lower.includes("career")) {
      reply = `### 🚀 Lộ Trình 6 Tháng Trở Thành Kỹ Sư AI / Machine Learning (2026 Edition)

Chào bạn! Để chinh phục vị trí AI Engineer tại các công ty công nghệ hàng đầu, đây là khung lộ trình chuẩn mực:

\`\`\`mermaid
graph TD
    A[Toán Tối Ưu & Python Nâng Cao] --> B[Deep Learning & PyTorch]
    B --> C[LLMs, RAG Architecture & Fine-tuning]
    C --> D[MLOps & Triển Khai Production]
\`\`\`

#### 📌 Chi Tiết Từng Giai Đoạn:
1. **Tháng 1-2 (Nền tảng Toán & Core ML):**
   * Đại số tuyến tính (SVD, Eigenvalues), Giải tích ma trận, Xác suất Bayes.
   * Numpy, Pandas, Scikit-Learn, Tối ưu Gradient Descent.
2. **Tháng 3-4 (Deep Learning & Transformers):**
   * Xây dựng CNNs, RNNs/LSTMs và Kiến trúc Attention từ đầu với **PyTorch**.
   * Nghiên cứu bài báo *"Attention Is All You Need"* và triển khai Transformer Decoder-only.
3. **Tháng 5-6 (GenAI & MLOps Production):**
   * Triển khai hệ thống **RAG nâng cao** (Hybrid Search, Re-ranking với Cohere/BGE).
   * Tinh chỉnh mô hình bằng LoRA/QLoRA trên thư viện Unsloth.
   * Đóng gói Microservices với FastAPI, Docker và vLLM inference server.

⭐ **Tài nguyên khuyến nghị:** *Deep Learning with PyTorch (Manning)* và khóa học *CS229 Stanford*.`;
    } else {
      reply = `### 🎓 Trợ Lý Học Thuật AI - StudentHub Mentor

Chào bạn! Tôi là **StudentHub AI Copilot**, trợ lý học thuật chuyên sâu hỗ trợ sinh viên Việt Nam:

* 📚 **Giải trình đa bước (Socratic Method):** Hướng dẫn bạn tự tư duy từng bước thay vì chỉ đưa ra đáp án thô.
* 📐 **Toán học & Khoa học:** Hiển thị công thức chuẩn LaTeX, phân tích hàm số và đạo hàm.
* 💻 **Kỹ thuật & Code:** Review code, tối ưu giải thuật, kiểm tra bộ nhớ và bảo mật.
* 🔬 **Nghiên cứu khoa học:** Hỗ trợ trích dẫn nguồn APA/IEEE và tổng hợp tài liệu chuyên ngành.

---
**Câu hỏi của bạn:** *"${lastUserMessage}"*

**Phân tích & Hướng dẫn:**
1. **Xác định bài toán cốt lõi:** Phân rã câu hỏi thành các mệnh đề điều kiện và mục tiêu đầu ra.
2. **Áp dụng nguyên lý cơ bản:** Liên kết với kiến thức giáo trình đại học chuẩn hóa.
3. **Thực hành vận dụng:** Bạn có thể thử biến đổi hoặc cung cấp thêm giả thiết cụ thể để tôi giải chi tiết từng bước!

💡 *Gợi ý: Bạn có thể chọn chuyển đổi giữa các chuyên ngành CNTT, Kinh Tế, Y Dược ở thanh công cụ phía trên!*`;
    }

    // Trả về JSON streaming/standard response
    return NextResponse.json({
      role: "assistant",
      content: reply,
      subject: subject,
      reasoningMode: reasoningMode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý tin nhắn của Trợ lý AI." },
      { status: 500 }
    );
  }
}
