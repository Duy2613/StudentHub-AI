# 🤖 HCMUTE Academic Model Readiness Report
> **Document ID**: `UNI-MOD-HCMUTE-001` | **Version**: 9.0.0 | **Constitution Article 72 Certified**  

---

## 1. Phân Định Rạch Ròi Thuật Toán Tất Định vs Mô Hình Học Máy

| Subsystem / Model | Loại Công Nghệ | Base / Framework | Dữ Liệu Nạp Vào | Điểm Kiểm Chuẩn | Ranh Giới / Giới Hạn Kỹ Thuật | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **Academic Rule Engine** | `DETERMINISTIC_RULES` | Pure JS Structural Logic | Quy chế đào tạo tín chỉ | **100.0%** (12/12 cases) | Không suy đoán ngoài văn bản quy chế | **`PRODUCTION_ACTIVE`** |
| **CSP Course Scheduler** | `CONSTRAINT_SOLVER` | Backtracking CSP Solver | Khung TKB & Giới hạn ca | **100.0%** (Zero clash) | Giới hạn 24 tín chỉ/kỳ | **`PRODUCTION_ACTIVE`** |
| **What-If Cascade Solver** | `GRAPH_ALGORITHM` | BFS/DFS Transitive Closure | Sơ đồ cây tiên quyết | **100.0%** (Bottleneck graph)| Yêu cầu mã môn chuẩn hóa | **`PRODUCTION_ACTIVE`** |
| **Announcement Diff Engine**| `AST_DIFF_PARSER` | Object & Schema AST Diff | Thông báo v1 vs v2 | **100.0%** (Field diffs) | So khớp chính xác theo trường | **`PRODUCTION_ACTIVE`** |
| **Academic Copilot Router** | `HYBRID_AI_ROUTER` | Vercel AI SDK + Gemini | Vector DB + Rule Context | **F1: 0.941** | LLM chỉ giải thích, không phán quyết luật| **`PRODUCTION_ACTIVE`** |
