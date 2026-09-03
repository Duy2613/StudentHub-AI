# 🏷️ STUDENTHUB AI — DATA LINEAGE & PROVENANCE SPECIFICATION
> **Document ID**: `EVID-LINEAGE-001` | **Version**: 1.0.0 | **Zero-Fabrication Standard**

---

## 1. 10 Giai Đoạn Dòng Chảy Dữ Liệu (10-Stage Data Lineage)

1. **`DATA_INGESTION`**: Thu nhận luồng đầu vào (Văn bản, link, ảnh camera, mã QR, STK).
2. **`PREPROCESSING`**: Chuẩn hóa Unicode NFKC, giải trừ ký tự vô hình, resize ảnh tối ưu 1024px.
3. **`ENTITY_EXTRACTION`**: Trích xuất tên miền, STK, tên trường, số tiền, điều khoản luật, mã QR.
4. **`SOURCE_CORRELATION`**: Đối soát với Danh bạ trường ĐH, danh sách đen NCSC, API URLhaus.
5. **`FORENSIC_ANALYSIS`**: Phân tích phông chữ, con dấu, độ mờ nhòe, mâu thuẫn chéo danh tính.
6. **`PSYCHOLOGICAL_MAPPING`**: Khớp nối 24 chiến thuật thao túng tâm lý (sợ hãi, cấp bách, giữ bí mật).
7. **`ATTACK_STAGE_TRACKING`**: Xác định giai đoạn lừa đảo (Tiếp cận $\rightarrow$ Đòi cọc $\rightarrow$ Tống tiền).
8. **`EVIDENCE_GRAPH_FUSION`**: Tạo DAG liên kết các thực thể và tính toán mâu thuẫn chéo.
9. **`CALIBRATED_DECISION`**: Đưa ra phán quyết giải thích được kèm độ tin cậy được hiệu chuẩn.
10. **`AUDITABLE_OUTPUT`**: Xuất báo cáo gồm: Nguyên nhân, Bằng chứng, Nguồn dẫn chứng, Hướng dẫn hành động.
