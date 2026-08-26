# 🛡️ STUDENTHUB AI v9 — DEFENSIVE SECURITY & OWASP GenAI 2025 MODEL
> **Document ID**: `SEC-MOD-002` | **Version**: 9.0.0 | **Constitution 48–51 Certified**  
> **Security Standards**: OWASP Top 10 for GenAI (2025) + NIST AI RMF + MITRE ATT&CK & D3FEND  

---

## 1. 8 Tầng Phòng Thủ Trọng Yếu Theo OWASP Top 10 GenAI (2025)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        OWASP GenAI 2025 DEFENSE FRAMEWORK                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. GENAI:01 — PROMPT INJECTION DEFENSE                                                 │
│    • Dual Pre-Filter + AST Sanitizer: Extracts claims before LLM reasoning.            │
│    • Direct & Indirect Injection Quarantine: Untrusted OCR/Web inputs cannot override │
│      System Constitution instructions.                                                │
│                                                                                        │
│ 2. GENAI:02 — SENSITIVE INFORMATION DISCLOSURE (PII SCRUBBING)                         │
│    • Automatic Tokenization & Scrub: Regex and NLP tokenizers replace citizen IDs,     │
│      bank account numbers, OTPs, and phone numbers with generic tokens before model.  │
│                                                                                        │
│ 3. GENAI:03 — SUPPLY CHAIN VULNERABILITIES                                             │
│    • Model Weight Checksums: SHA-256 validation before loading weight JSON files.      │
│    • Strict Dep-Locking: NPM & WASM libraries locked to audited hashes.                │
│                                                                                        │
│ 4. GENAI:04 — DATA AND MODEL POISONING DEFENSE                                         │
│    • Data Ingest Gate: Raw web scraping data NEVER directly enters training sets.      │
│    • Quarantine Buffer: Failed provenance / license records moved to Quarantine.       │
│                                                                                        │
│ 5. GENAI:05 — VECTOR AND EMBEDDING WEAKNESSES                                          │
│    • Cosine Clustering Anomaly Reject: Rejects out-of-boundary vectors during RAG.      │
│    • Cross-Tenant Namespace Isolation: Prevents memory leakage across workspaces.      │
│                                                                                        │
│ 6. GENAI:06 — EXCESSIVE AGENCY                                                         │
│    • Bounded Execution: Models have ZERO direct OS write permissions or arbitrary API  │
│      calling authority without human-in-the-loop confirmation.                         │
│                                                                                        │
│ 7. GENAI:07 — MISINFORMATION & HALLUCINATION                                           │
│    • Mandatory Evidence DAG: Authoritative questions require Tier 1/2 provenance.     │
│    • Responsible Abstention: Returns UNKNOWN / INSUFFICIENT_EVIDENCE when unverified.  │
│                                                                                        │
│ 8. GENAI:08 — UNBOUNDED CONSUMPTION (RESOURCE DoS)                                     │
│    • Deterministic 0ms Short-Circuit: Layer 1 blocks known threats before LLM call.   │
│    • Canvas Pre-downscaling: 15ms image clamp prevents WASM memory exhaustion.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Quy Trình Xử Lý Dữ Liệu Không Tin Cậy (Untrusted Ingest Flow)

$$\mathbf{RAW\_INPUT} \longrightarrow \mathbf{PII\_SCRUB} \longrightarrow \mathbf{MAGIC\_BYTES\_CHECK} \longrightarrow \mathbf{LAYER\_1\_SCREEN} \longrightarrow \mathbf{SANDBOX\_EVAL}$$

- **Mọi tệp tin bóc tách từ ảnh chụp, PDF, hay mã QR** đều là dữ liệu đối kháng tiềm tàng (adversarial input).
- **Không bao giờ tin tưởng định dạng MIME do client gửi lên**: Luôn kiểm tra Magic Bytes (`\xFF\xD8\xFF` cho JPEG, `\x89\x50\x4E\x47` cho PNG, `\x25\x50\x44\x46` cho PDF).
