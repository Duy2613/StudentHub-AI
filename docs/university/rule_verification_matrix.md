# 📜 HCMUTE Academic Rule Proof & Verification Matrix
> **Document ID**: `UNI-VERIF-RULE-001` | **Version**: 9.0.0 | **Zero-Fabrication Standard**  
> **Institution**: Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)  

---

## 1. Ma Trận Chứng Minh Quy Tắc Học Vụ (Source-to-Rule Proof Table)

| Rule ID | Loại Quy Tắc | Nội Dung Yêu Cầu | Ngành / Khóa | Căn Cứ Pháp Lý | Điều / Khoản / Trang | Code Reference | Test Reference | Trạng Thái Xác Minh |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `RULE_CREDIT_SEM_NORMAL` | Đăng ký TC | Min 12 TC, Max 24 TC / kỳ | Toàn trường / Mọi khóa | QĐ 3116/QĐ-ĐHSPKT (22/08/2025) | Điều 14, Khoản 2 | `academicRuleEngine.js:L64` | `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_CREDIT_SEM_OVERLOAD`| Đăng ký TC | Max 28 TC nếu CPA >= 3.20 | Toàn trường / Mọi khóa | QĐ 3116/QĐ-ĐHSPKT (22/08/2025) | Điều 14, Khoản 3 | `academicRuleEngine.js:L76` | `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_CREDIT_SEM_PROBATION`| Đăng ký TC | Max 16 TC nếu bị cảnh báo | Toàn trường / Mọi khóa | QĐ 3116/QĐ-ĐHSPKT (22/08/2025) | Điều 14, Khoản 4 | `academicRuleEngine.js:L78` | `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_ACADEMIC_WARNING_SEM1`| Cảnh báo | DTB học kỳ 1 < 0.80 | Toàn trường / Mọi khóa | QĐ 3116/QĐ-ĐHSPKT (22/08/2025) | Điều 16, Khoản 1a | `academicRuleEngine.js:L118`| `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_ACADEMIC_WARNING_SEMN`| Cảnh báo | DTB học kỳ N < 1.00 | Toàn trường / Mọi khóa | QĐ 3116/QĐ-ĐHSPKT (22/08/2025) | Điều 16, Khoản 1b | `academicRuleEngine.js:L123`| `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_FORCED_ACADEMIC_DROP` | Thôi học | 3 lần cảnh báo liên tiếp | Toàn trường / Mọi khóa | QĐ 3116/QĐ-ĐHSPKT (22/08/2025) | Điều 16, Khoản 2a | `academicRuleEngine.js:L157`| `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_ENGLISH_EXIT_K23_SE` | Ngoại ngữ | TOEIC 450 / B1 | KTPM / K23 | QĐ Chuẩn Ngoại Ngữ | Mục 2.1 - Bảng CĐR K23 | `versionedCurricula.js:L35` | `academic_intelligence.test.mjs:P2` | **`VERIFIED`** |
| `RULE_ENGLISH_EXIT_K26_SE` | Ngoại ngữ | TOEIC 550 / B2 Quốc tế | KTPM / K26 | QĐ Chuẩn Ngoại Ngữ | Mục 3.4 - Lộ trình K26 | `versionedCurricula.js:L140`| `academic_intelligence.test.mjs:P2` | **`VERIFIED`** |
| `RULE_THESIS_ELIGIBILITY_FIT`| Khóa luận | >= 110 TC, CPA >= 2.50 | KTPM & CNTT / K23-K26 | Quy định Khóa luận Khoa CNTT | Mục 4.2 - Tiêu chí làm KLTN | `academicRuleEngine.js:L175`| `academic_intelligence.test.mjs:P3` | **`VERIFIED`** |
| `RULE_UNVERIFIED_GENERIC_150`| Giả định | Bắt buộc đúng 150 TC cho mọi ngành| Giả định toàn trường | Không có văn bản chung | N/A | N/A | `academic_intelligence.test.mjs:P7` | **`UNVERIFIED`** |
