# Trust Engine V5 — L5 Adversarial Assurance

L5 is an auditor, not a second judge. Its deterministic checks inspect the completed stage set and the L4 result for:

- missing or misidentified stages;
- invalid stage order or incomplete terminal status;
- dropped L1/L2A hard negatives;
- provider failure that improves a result;
- concentrated or stale evidence;
- confidence/evidence/calibration mismatch;
- unsupported AI narrative references;
- policy-version mismatch and premature completion.

An optional AI reviewer receives only bounded stage findings/statuses and existing anomaly codes. Its output is untrusted, cannot define policy, and cannot improve safety. If it fails, L5 reports `FALLBACK_DETERMINISTIC` and uses deterministic checks.

## Authority matrix

| Component | May upgrade safety? | May downgrade/review? |
| --- | --- | --- |
| L1 | No | Yes, by blocking interaction |
| L2A | No | Yes, by reporting a threat match |
| L2B/L2C | No | Yes, by adding advisory suspicion |
| L3 | No | Yes, by exposing insufficient/conflicting/stale evidence |
| L4 | Authoritative policy decision | Yes, deterministically |
| L5 | No | Yes, to review/recheck/inconclusive/missing evidence |

`ASSURANCE_PASS` preserves L4; it does not certify the input. Any non-pass assurance can make presentation more cautious. A missing assurance result is an evidence gap and cannot be treated as a pass.
