# 🧠 00 - Permanent Agent Memory & Context Rulebook
> **Vault Node**: `00-Permanent-Memory` | **Tags**: `#agent-memory` `#context` `#rules`

---

## 1. Nguyên Tắc Bộ Nhớ Vĩnh Viễn Cho AI Agent
Khi làm việc với dự án **StudentHub-AI**, mọi Agent (Claude Code, Antigravity, Cursor, Codex) phải:
1. **Kiểm tra Vault trước khi code**: Luôn tra cứu `docs/vault/` để nắm rõ quyết định kiến trúc và token thiết kế hiện tại.
2. **Không tái tạo bánh xe**: Luôn tái sử dụng các component UI cao cấp đã có trong `frontend/src/components/ui/` thay vì viết lại từ đầu.
3. **Cập nhật Session Context**: Khi hoàn thành một tính năng lớn hoặc đổi cấu trúc file, cập nhật lại [[Active-Session-Context]] và [[Sprint-Board]].

---

## 2. Các Tiêu Chuẩn Thiết Kế Bắt Buộc (Refero + OpenHero)
- Xem chi tiết tại [[DESIGN|Refero Styles Design System]].
- **Màu nền**: Luôn dùng Space Dark Palette (`#07090e`, `#0c0f17`, `#111522`).
- **Giao diện**: Không dùng các màu cơ bản thô ráp (Plain red, green, blue). Luôn dùng màu HSL tinh chỉnh và hiệu ứng Frosted Glass `backdrop-blur-xl`.
- **Hiệu ứng**: Có animation mượt mà với đường cong chuyển động `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 3. Liên Kết Nhanh
- [[System-Architecture|🏗️ Tổng quan Kiến trúc]]
- [[Auth-Flow-OTP-Verification|🔐 Luồng Xác Thực OTP & Settigation]]
- [[Sprint-Board|📋 Bảng Nhiệm Vụ Sprint]]
