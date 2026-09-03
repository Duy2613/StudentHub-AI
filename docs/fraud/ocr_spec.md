# 👁️ StudentHub AI — High-Speed Multimodal OCR & Vision Specification

> **Document ID**: `FRAUD-OCR-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Kiến Trúc Xử Lý Quang Học Tối Ưu

```
[Ảnh chụp / Tệp tải lên / Camera]
       │
       ▼
[Preprocess Canvas Engine (15ms)] ──> Scale max 1024-1200px + Grayscale / Contrast
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[jsQR Fast Scanner (5-15ms)]   [Bounded OCR Engine (3.5s Timeout)]
       │                                 │
       ▼                                 ▼
[Mã QR giải mã tức thì]         [Trích xuất văn bản Tiếng Việt có dấu]
       │                                 │
       └────────────────┬────────────────┘
                        ▼
       [Entity & Document Forensics Engine]
                        │
                        ▼
       [Khởi Chạy 4 Lớp Thẩm Định AI Trust]
```

* **Hiệu Năng**:
  - Bóc tách QR Code: $< 20\text{ ms}$.
  - Trích xuất văn bản ảnh tối ưu: $0.8\text{s} - 1.8\text{s}$.
  - Cơ chế phòng ngừa treo mạng: Tự động ngắt Tesseract sau 3.5s và dùng endpoint `/api/ai-trust/ocr`.
