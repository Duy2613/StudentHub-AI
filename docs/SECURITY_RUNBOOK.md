# STUDENTHUB OS — SECURITY INCIDENT RESPONSE RUNBOOK

**Security Posture**: Zero-Trust Architecture (NIST SP 800-207 Aligned)

---

## 1. P0 Incident Response Protocol (BOLA / IDOR / PII Leakage)

### Triage & Containment
1. **Immediate Step-Up Enforcement**: Force session assurance elevation (`AAL2`) on sensitive endpoints.
2. **Global Session Invalidation**: Invalidate active tokens via `SessionManager.globalLogout(subjectId)`.
3. **Endpoint Shielding**: Verify that all private route handlers invoke `ObjectAuthorizer.assertAccess(principal, resource)`.

---

## 2. AI Safety Firewall & Prompt Injection Defense

- **Passive Enveloping**: Untrusted user inputs and community posts are sealed in passive markdown envelopes before processing.
- **AI Tool Authorization**: The AI Copilot operates under a delegated principal with strict tool allowlists; administrative tools are hard-denied.
- **Memory Guard**: Candidate AI memories require explicit student approval before durable persistence.

---

## 3. Remote Device & Session Revocation

To revoke a compromised client device:
1. Student invokes `DELETE /api/personalization/devices/revoke` with `{ deviceId }`.
2. `DeviceSyncEngine.revokeDevice(deviceId)` revokes the record in `DeviceRepository`.
3. Subsequent requests from that device are blocked at the Security Fabric Gateway with `401 / 403`.
