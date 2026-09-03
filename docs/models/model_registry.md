# 🤖 STUDENTHUB AI v9 — MASTER MODEL & MLOPS REGISTRY
> **Document ID**: `MOD-REG-002` | **Version**: 9.0.0 | **Constitution 24–26 Certified**  
> **Governance Model**: Champion / Challenger / Experimental Slots + Zero-Regression Gate  

---

## 1. Phân Tầng Vị Trí Mô Hình (Model Governance Hierarchy)

```
                    MASTER MODEL REGISTRY
                   ┌──────────────────────────────┐
                   │          CHAMPION            │
                   │ MOD_FRAUD_MULTIHEAD_V1_4    │
                   │ (F1: 0.9412 | Latency: 1.8ms)│
                   └──────────────┬───────────────┘
                                  │
                      ┌───────────┴───────────┐
                      ▼                       ▼
          ┌───────────────────────┐   ┌───────────────────────┐
          │     CHALLENGER 1      │   │     CHALLENGER 2      │
          │ MOD_FRAUD_TRANSFORMER │   │ MOD_FRAUD_ENSEMBLE    │
          │ (Gate: READY_DEPLOY)  │   │ (Gate: REJECTED_F1)   │
          └───────────┬───────────┘   └───────────┬───────────┘
                      └───────────┬───────────────┘
                                  ▼
                      LOCKED BENCHMARK GATE
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                 Temporal        OOD      Hard Negatives
                 Holdout       Entropy     Preservation
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                        PRODUCTION ADMISSION
```

---

## 2. Bảng Danh Mục & Trạng Thái Mô Hình (Model Registry Table)

| Model ID | Vị Trí Slot | Kiến Trúc Kỹ Thuật | Tập Dữ Liệu Huấn Luyện | Locked F1 | Temporal F1 | OOD Acc | ECE | Độ Trễ (ms) | Trạng Thái Triển Khai |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `MOD_FRAUD_MULTIHEAD_V1_4` | `CHAMPION` | Dense-160 TF-IDF Multi-Head | NCSC, APWG, FTC, HCMUTE | **0.9412** | **0.9125** | **0.9620** | **0.042** | 1.82ms | **`PRODUCTION_ACTIVE`** |
| `MOD_FRAUD_TRANSFORMER_V1_5`| `CHALLENGER` | PhoBERT-Mini LoRA Rank-8 | NCSC, APWG, FTC, Slang VN | **0.9520** | **0.9310** | **0.9410** | **0.038** | 14.5ms | **`EVALUATION_GATE_TESTING`** |
| `MOD_FRAUD_ENSEMBLE_V2_0` | `CHALLENGER` | HGNN + Neural Multi-Head | NCSC + Graph Corpus | **0.9380** | **0.9050** | **0.9750** | **0.051** | 6.80ms | **`BENCHMARK_BELOW_CHAMPION`**|
| `MOD_OCR_VISION_WASM` | `SPECIALIST` | Tesseract WASM + Canvas | Vietnamese Document Corpus | **CER 2.4%**| **CER 3.1%**| **0.9850** | N/A | 820ms | **`PRODUCTION_ACTIVE`** |
| `MOD_JSQR_STREAM` | `SPECIALIST` | Pure JS QR Decoder | Real QR Benchmark Corpus | **Acc 99.9%**| **Acc 99.9%**| **0.9980** | N/A | 12ms | **`PRODUCTION_ACTIVE`** |
| `MOD_CSP_SCHEDULER` | `SPECIALIST` | CSP Backtracking Solver | HCMUTE, UIT, HUST Rules | **1.0000** | **1.0000** | **1.0000** | **0.000** | 3.5ms | **`PRODUCTION_ACTIVE`** |
| `MOD_GPS_MAP_MATCHER` | `SPECIALIST` | 11-Tier Quality + EMA Snapper| Thu Duc Road Network GIS | **Acc 99.4%**| **Acc 99.2%**| **0.9990** | N/A | 0.4ms | **`PRODUCTION_ACTIVE`** |
| `MOD_DOC_DIFF_AST` | `SPECIALIST` | Clause Tokenizer & AST Diff | Labor Code & Housing Law | **1.0000** | **1.0000** | **1.0000** | **0.000** | 0.8ms | **`PRODUCTION_ACTIVE`** |
