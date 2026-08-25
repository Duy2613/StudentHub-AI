# 🤖 StudentHub AI — Model Card: 4-Layer Multi-Head Neural Trust

> **Document ID**: `FRAUD-MODEL-CARD-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. Thông Tin Kiến Trúc Mô Hình (Model Details)
* **Tên mô hình**: `StudentHubMultiLabelNeuralModel` (v2.0)
* **Kiến trúc**: Mạng nơ-ron phân loại đa đầu ra (Multi-Head Multi-Label Architecture) kết hợp luật tất định Layer 1 và bộ suy luận Layer 4.
* **Các đầu ra phân loại**:
  - `Head 1 (Scam Probability)`: Điểm xác suất nhị phân $P(\text{Scam}) \in [0.0, 1.0]$.
  - `Head 2 (Scam Taxonomy Types)`: 38 lớp đa nhãn.
  - `Head 3 (Psychological Tactics)`: 24 chiến thuật thao túng.
  - `Head 4 (Attack Stages)`: 6 giai đoạn (Contact $\rightarrow$ Credential $\rightarrow$ Payment Extraction).
  - `Head 5 (Requested Actions)`: Hành động bị yêu cầu (Chuyển tiền, đọc OTP, click link, tải APK).
* **Độ trễ trung bình**: $1.2\text{ms} - 4.5\text{ms}$ (CPU Node.js execution).
* **Hiệu chuẩn (Calibration)**: Điểm tin cậy được căn chuẩn theo Brier Score $< 0.05$.
