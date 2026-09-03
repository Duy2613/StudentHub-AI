/**
 * StudentHub AI — Emergency System & Emergency Companion Engine (AI-21)
 * 
 * Safety-critical emergency architecture:
 * - Requires deliberate 2-second hold activation (Hold-2s UX) to prevent accidental triggers
 * - Dispatches strictly to official Vietnamese emergency channels (112, 113, 114, 115, 24/7 Bank hotlines)
 * - Captures real-time GPS coordinates and generates instant SOS message for trusted contacts
 * - Emergency Companion: Trip timer monitoring and safe arrival confirmation
 */

export const OFFICIAL_EMERGENCY_HOTLINES = [
  {
    code: "112",
    name: "Tổng Đài Cứu Nạn Khẩn Cấp Quốc Gia",
    scope: "Tiếp nhận 24/7 mọi tình huống nguy cấp, thiên tai, cứu hộ sự cố và chuyển tiếp liên ngành",
    dialUrl: "tel:112",
    icon: "ShieldAlert",
    priority: "CRITICAL",
  },
  {
    code: "113",
    name: "Cảnh Sát Phản Ứng Nhanh",
    scope: "Trình báo tội phạm, trộm cắp, bị đe dọa bạo lực hoặc mất an ninh trật tự",
    dialUrl: "tel:113",
    icon: "Siren",
    priority: "CRITICAL",
  },
  {
    code: "115",
    name: "Cấp Cứu Y Tế 24/7",
    scope: "Cứu hộ y tế, tai nạn thương tích và vận chuyển cấp cứu bệnh viện",
    dialUrl: "tel:115",
    icon: "HeartPulse",
    priority: "CRITICAL",
  },
  {
    code: "114",
    name: "Cứu Hỏa & PCCC",
    scope: "Báo cháy nổ, sập đổ công trình, giải cứu trong không gian kín",
    dialUrl: "tel:114",
    icon: "Flame",
    priority: "HIGH",
  },
  {
    code: "1800545413",
    name: "Vietcombank Khẩn Cấp (Khóa Thẻ/App 24/7)",
    scope: "Khóa thẻ tức thì khi bị lộ OTP, mất điện thoại hoặc nghi ngờ bị hack tài khoản",
    dialUrl: "tel:1800545413",
    icon: "CreditCard",
    priority: "FINANCIAL",
  },
];

/**
 * Generates an SMS / Zalo SOS Payload with current GPS coordinates
 */
export function generateEmergencySosPayload({ lat, lng, studentName = "Sinh viên", customNote = "" }) {
  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : "Chưa xác định tọa độ";
  const timestamp = new Date().toLocaleString("vi-VN");

  const message = `[CẤP CỨU SOS TỪ STUDENTHUB AI]\n${studentName} đang cần trợ giúp khẩn cấp!\nThời gian: ${timestamp}\nVị trí GPS: ${mapsLink}\nGhi chú: ${customNote || "Đang gặp nguy hiểm/cần hỗ trợ gấp!"}`;

  return {
    message,
    smsUrl: `sms:?body=${encodeURIComponent(message)}`,
    googleMapsUrl: mapsLink,
    timestamp,
  };
}

/**
 * Emergency Companion: Creates a Trip Monitoring Timer
 */
export function createTripCompanion({ estimatedMinutes = 20, destination = "Phòng trọ" }) {
  const startTime = new Date().getTime();
  const deadlineTime = startTime + estimatedMinutes * 60 * 1000;

  return {
    tripId: `trip_${Date.now()}`,
    destination,
    estimatedMinutes,
    startTime: new Date(startTime).toISOString(),
    deadlineTime: new Date(deadlineTime).toISOString(),
    status: "ACTIVE_IN_TRANSIT", // ACTIVE_IN_TRANSIT | ARRIVED_SAFE | MISSED_CHECKIN
    instructions: "Nếu quá thời hạn di chuyển mà bạn không bấm 'Xác Nhận An Toàn', hệ thống sẽ gửi tin nhắn cảnh báo tới liên hệ khẩn cấp.",
  };
}
