# 🛡️ Zero-Trust Security Fabric Promax V1
> **Vault Node**: `Zero-Trust-Security-Fabric-Promax-V1` | **Tags**: `#security` `#zero-trust` `#authorization` `#ai-security`

---

## 1. Tổng Quan Kiến Trúc Bảo Mật Zero-Trust
Hệ thống chuyển đổi từ mô hình xác thực truyền thống sang **Security Fabric Promax**:
- **Identity**: Danh tính xác lập từ Server Context (`SecurityPrincipal`), không tin tưởng `studentId` hay `role` do frontend/client gửi lên.
- **Session**: Quản lý phiên máy chủ (`SessionManager`), hỗ trợ timeout tuyệt đối (24h), timeout không hoạt động (30m), thu hồi tức thì và xoay vòng phiên.
- **Authorization**: Động cơ phân quyền tập trung `AuthorizationEngine` kết hợp RBAC + ABAC + ReBAC + Scopes + Hard Safety Rules.
- **Capabilities & Purpose**: Quản lý thẻ năng lực đơn kỳ (`CapabilityManager`) chống tấn công Replay và ràng buộc mục đích nghiệp vụ (`PurposeValidator`).
- **AI Tool Firewall**: Định danh riêng cho AI Agent (`AgentIdentity`), kiểm soát ủy quyền (`AiDelegationEngine`), danh mục Tool Allowlist, chống Prompt Injection và tối thiểu hóa dữ liệu (`PropertyFilter`).
- **Hardening & Telemetry**: Giới hạn tần suất trượt (`RateLimiter`), chống rà quét (`AntiEnumerationGuard`), gắn Header an ninh (CSP, HSTS) và ghi nhật ký kiểm toán bất biến (`SecurityAuditLogger`).

---

## 2. Liên Kết Tài Liệu Kỹ Thuật
- [[docs/security/SECURITY_ARCHITECTURE.md|Kiến Trúc Chi Tiết]]
- [[docs/security/API_SECURITY_MODEL.md|Hợp Đồng API & Scopes]]
- [[docs/security/AI_SECURITY_MODEL.md|Mô Hình An Toàn AI & Tool Firewall]]
- [[docs/security/THREAT_MODEL.md|Mô Hình Đe Dọa STRIDE & OWASP]]
- [[docs/security/SECURITY_TEST_MATRIX.md|Ma Trận Kiểm Thử 10 Vector Tấn Công]]
