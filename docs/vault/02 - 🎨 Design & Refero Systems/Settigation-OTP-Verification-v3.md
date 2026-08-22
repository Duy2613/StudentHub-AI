# 💫 Settigation OTP Verification v3
> **Vault Node**: `Settigation-OTP-Verification-v3` | **Tags**: `#ui` `#settigation` `#otp` `#animation`

---

## 1. Giới Thiệu
Component xác thực mã OTP độc quyền lấy cảm hứng từ tác phẩm **Component 89 của Settigation**:
> *"4 boxes. One ring. Zero dependencies. Type the last digit and the row curls onto an orbit, spins a turn and a quarter, and screws down into verified state."*

---

## 2. Các Trạng Thái Trực Quan (Visual States)

| Trạng Thái | Mô Tả & Hiệu Ứng | Mã Màu / Token |
| :--- | :--- | :--- |
| **Chưa nhập (Idle)** | Các ô số kính mờ trong suốt xếp theo quỹ đạo tròn với tâm phát sáng | `--glass-bg`, `text-gray-500` |
| **Đang gõ (Typing)** | Vòng tròn SVG dash lấp đầy theo tỷ lệ % số ký tự đã nhập, ô hiện tại phát sáng | `#6366f1` (Indigo Glow) |
| **Xoay quỹ đạo (Orbit Spin)** | Khi nhập đủ ký tự, toàn bộ các ô số xoay 450 độ (`rotate(450deg)`) quanh tâm | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Thành công (Verified)** | Vòng tròn chuyển xanh ngọc lục bảo, tâm hub morph thành biểu tượng Checkmark | `#0caa8f` (Jade Green) |
| **Thất bại (Error)** | Rung nhẹ quanh tâm, viền đỏ hồng cảnh báo | `#f43f5e` (Rose 500) |

---

## 3. Cách Tái Sử Dụng trong Dự Án

```jsx
import OtpVerificationOrbit from "@/components/ui/otp-verification-orbit";

<OtpVerificationOrbit
  length={6}
  value={otp}
  onChange={setOtp}
  onComplete={(code) => handleVerify(code)}
  isVerifying={isVerifying}
  isSuccess={isSuccess}
  isError={Boolean(error)}
  errorMessage={error}
  resendCountdown={countdown}
  onResend={handleResend}
/>
```
