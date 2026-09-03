const ACTIONS = Object.freeze({
  otp: "Không cung cấp OTP, mật khẩu hoặc mã khôi phục.",
  payment: "Tạm dừng chuyển tiền và xác minh người nhận qua kênh chính thức.",
  credential: "Không đăng nhập hoặc nhập thông tin cá nhân qua liên kết này.",
  verify: "Đối chiếu nội dung với website hoặc số điện thoại chính thức của tổ chức.",
  insufficient: "Chưa hành động dựa trên nội dung này cho đến khi có thêm bằng chứng độc lập.",
});

export function deriveSafetyActions({ input = "", status = "", risk = "" }) {
  const normalized = `${input} ${status} ${risk}`.toLocaleLowerCase("vi-VN");
  const actions = [];

  if (/\b(otp|mật khẩu|password|mã xác minh|verification code)\b/i.test(normalized)) actions.push(ACTIONS.otp);
  if (/chuyển khoản|chuyển tiền|thanh toán|đặt cọc|số tài khoản|ngân hàng/i.test(normalized)) actions.push(ACTIONS.payment);
  if (/đăng nhập|login|tài khoản|credential|liên kết|đường dẫn|url/i.test(normalized)) actions.push(ACTIONS.credential);
  if (/insufficient|chưa đủ|unknown|không xác định/i.test(normalized)) actions.push(ACTIONS.insufficient);
  actions.push(ACTIONS.verify);

  return [...new Set(actions)].slice(0, 3);
}
