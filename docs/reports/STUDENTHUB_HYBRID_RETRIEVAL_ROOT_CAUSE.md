# StudentHub AI — Hybrid Retrieval Root Cause

**Date:** 2026-09-09  
**Status:** `ROOT_CAUSE_CONFIRMED; RETRIEVAL_TARGETS_NOT_ESTABLISHED`

## What was invalidated

The earlier retrieval V3 runner created LIVE and HYBRID candidates directly from each case's `knownOfficialDomains`. Its high recall was an evaluation oracle and is not production evidence. The old result is retained as historical/contaminated validation, not deleted or promoted.

## Real discovery-path result

The corrected N=165 run calls `EvidenceDiscoveryService` and uses gold domains only after ranking for scoring:

| Mode | Recall@5 | NDCG@5 | Precision@5 | MRR | Entity resolution |
|---|---:|---:|---:|---:|---:|
| STATIC_KB | 21.2% | 19.7% | 12.5% | 0.186 | 93.3% |
| LIVE_WEB | 9.1% | 8.3% | 5.7% | 0.078 | 93.3% |
| HYBRID | 21.2% | 19.7% | 12.5% | 0.186 | 93.3% |

HYBRID official-source hit was 100.0% and irrelevant top-1 was 0.6%, but Recall@5 and NDCG@5 remain below the 92%/88% targets. The union/monotonic invariant passed: HYBRID improved over LIVE by 12.1 percentage points and deleted zero candidates because entity status was UNKNOWN.

## Root cause

1. The live adapter currently searches the Vietnamese Wikipedia/MediaWiki endpoint; it is not a nationwide official-institution index.
2. The static institutional KB contains too few institutions and policy documents for the OOD query mix.
3. Official discovery is now an explicit third pool. A bounded `OfficialDiscoveryAdapter` is implemented and wired into RC3 in opt-in mode, but the frozen V3 run predates that wiring; its MOET pages are useful discovery context, not a complete institution-domain index.
4. A separate OpenAlex institution-discovery lane now widens entity/domain recall with bounded homepage metadata, deduplicated queries and no-authority semantics. Resolver-confirmed discovery candidates receive only a narrow ordering boost; `UNKNOWN` and `AMBIGUOUS` candidates remain retained and non-authoritative.

The public Cục Quản lý Chất lượng notice listing accredited higher-education programmes is a legitimate discovery signal: [official MOET quality-management notice](https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-bao-dam/thong-bao/danh-sach-cac-co-so-giao-duc-chuong-trinh-dao-tao-giao-duc-dai-hoc-va-cao-dang-su-pham-duoc-cong-nhan-dat-tieu-chuan-chat-luong-giao-duc-cap-nhat-den-ngay-31-7-2026-93.html). It does not by itself establish a complete university-domain directory, redistribution rights, or legal/provenance sufficiency.

## Code remediation

- `EvidenceCandidatePool` implements `SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)` with provenance and drop traces.
- `EvidenceDiscoveryService` no longer silently falls back from an empty LIVE run to STATIC; typed `SEARCH_UNAVAILABLE`/`INSUFFICIENT_EVIDENCE` states remain visible.
- Authority ranking runs only after pool preservation.
- Entity resolution reports competing specific institutions as `AMBIGUOUS` and Trust no longer forces HCMUTE when no entity matches.

**Decision:** freeze this result as RC2 retrieval evidence and preserve it as RC3 regression-only evidence. The new RC3 V4 run also remains validation-only: Hybrid Recall@5 is `17.3%`, NDCG@5 is `17.0%`, and target-domain official-source hit is `17.3%`. Do not promote nationwide retrieval. The subsequent RC4/RC5 work adds a bounded OpenAlex institution-discovery lane, but a final promotion decision still requires the post-ranking-freeze holdout, legal/provenance review and unchanged database gates.
