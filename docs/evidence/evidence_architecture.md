# 🔗 STUDENTHUB AI — MASTER EVIDENCE GRAPH ARCHITECTURE
> **Document ID**: `EVID-ARCH-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Chuỗi Truy Vết Bằng Chứng Bắt Buộc (The Evidence Chain)

Mọi nhận định hoặc kết luận của StudentHub AI đều phải tuân thủ chuỗi mắt xích 6 cấp:

$$\mathbf{CLAIM} \longrightarrow \mathbf{EVIDENCE} \longrightarrow \mathbf{SOURCE} \longrightarrow \mathbf{TIMESTAMP} \longrightarrow \mathbf{MODEL} \longrightarrow \mathbf{CONFIDENCE}$$

```
                ┌──────────────────────────────────────────────┐
                │          TUYÊN BỐ / NHẬN ĐỊNH (CLAIM)        │
                │  "Tên miền hcmute-daotao.xyz là lừa đảo"     │
                └──────────────────────┬───────────────────────┘
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │             BẰNG CHỨNG (EVIDENCE)            │
                │   Nằm trong danh sách cảnh báo của NCSC      │
                └──────────────────────┬───────────────────────┘
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │             NGUỒN GỐC (SOURCE)               │
                │        Cục An toàn Thông tin - Bộ TT&TT       │
                └──────────────────────┬───────────────────────┘
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │             THỜI GIAN (TIMESTAMP)            │
                │     Cập nhật: 2026-02-25T20:40:00.000Z       │
                └──────────────────────┬───────────────────────┘
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │              MÔ HÌNH (MODEL)                 │
                │     Layer 1 Deterministic Threat Screener    │
                └──────────────────────┬───────────────────────┘
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │           ĐỘ TIN CẬY (CONFIDENCE)            │
                │             0.99 (Rất cao / Tuyệt đối)       │
                └──────────────────────────────────────────────┘
```

---

## 2. Tách Biệt Rõ Ràng 5 Cấp Độ Thông Tin
1. **`OFFICIAL_FACT`**: Văn bản có dấu mộc đỏ, công văn chính thức của nhà trường, luật hiện hành.
2. **`OBSERVATION`**: Tọa độ GPS đo được từ cảm biến thiết bị, ảnh chụp camera, dữ liệu HTTP trả về.
3. **`USER_REPORT`**: Phản ánh từ sinh viên (chưa được cơ quan công an/nhà trường xác nhận).
4. **`MODEL_PREDICTION`**: Điểm số xác suất tính toán bởi mạng nơ-ron hoặc thuật toán heuristic.
5. **`UNKNOWN`**: Trường hợp không có dữ liệu đối soát $\rightarrow$ Tuyệt đối giữ nguyên `UNKNOWN`, không suy đoán.
