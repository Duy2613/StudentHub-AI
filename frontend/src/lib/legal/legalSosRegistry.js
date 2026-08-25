/**
 * Vietnam Legal Framework & Banking Emergency SOS Registry
 * 
 * True legal references (Civil Code 2015, Labor Code 2019, MoIT Electricity Circulars)
 * and genuine 24/7 emergency hotlines of major Vietnamese banks.
 */

export const BANK_EMERGENCY_HOTLINES = [
  {
    code: "VCB",
    name: "Vietcombank (Ngoại Thương)",
    hotline: "1900 54 54 13",
    urgentLockMethod: "Soạn tin nhắn: VCB KHOA THE gửi 6167 hoặc thao tác khóa thẻ tức thì trên ứng dụng VCB Digibank.",
  },
  {
    code: "BIDV",
    name: "BIDV (Đầu Tư & Phát Triển)",
    hotline: "1900 9247",
    urgentLockMethod: "Khóa dịch vụ khẩn cấp trên app SmartBanking hoặc gọi hotline nhấn phím 1.",
  },
  {
    code: "CTG",
    name: "VietinBank (Công Thương)",
    hotline: "1900 558 868",
    urgentLockMethod: "Soạn: CTG KHOA gửi 8149 hoặc chọn 'Khóa thẻ' trên app VietinBank iPay.",
  },
  {
    code: "TCB",
    name: "Techcombank (Kỹ Thương)",
    hotline: "1800 588 822",
    urgentLockMethod: "Gọi hotline 1800 588 822 (miễn phí) hoặc thao tác Khóa thẻ trên Techcombank Mobile.",
  },
  {
    code: "MB",
    name: "MB Bank (Quân Đội)",
    hotline: "1900 54 54 26",
    urgentLockMethod: "Khóa thẻ/khóa tài khoản trực tiếp trong mục Dịch vụ thẻ trên MB Bank App.",
  },
  {
    code: "ACB",
    name: "ACB (Á Châu)",
    hotline: "1900 54 54 86",
    urgentLockMethod: "Gọi hotline 1900 54 54 86 hoặc khóa thẻ trên app ACB ONE.",
  },
  {
    code: "TPB",
    name: "TPBank (Tiên Phong)",
    hotline: "1900 58 58 85",
    urgentLockMethod: "Khóa thẻ nhanh trên app TPBank Mobile hoặc gọi 1900 58 58 85.",
  },
  {
    code: "VPB",
    name: "VPBank (Việt Nam Thịnh Vượng)",
    hotline: "1900 54 54 15",
    urgentLockMethod: "Soạn VPB KT gửi 8149 hoặc thao tác trên VPBank NEO.",
  },
  {
    code: "MOMO",
    name: "Ví Điện Tử MoMo",
    hotline: "1900 54 54 41",
    urgentLockMethod: "Vào mục 'Ví của tôi' -> 'Bảo mật' -> 'Khóa tài khoản MoMo' hoặc gọi 1900 54 54 41.",
  },
  {
    code: "ZALOPAY",
    name: "Ví Điện Tử ZaloPay",
    hotline: "1900 54 54 36",
    urgentLockMethod: "Gọi hotline 1900 54 54 36 để yêu cầu tổng đài viên tạm dừng giao dịch tài khoản.",
  },
];

export const CONTRACT_LEGAL_RULES = {
  HOUSING: [
    {
      id: "RULE_ELECTRICITY_OVERCHARGE",
      pattern: /(tiền điện|giá điện).*?([5-9]\.?\d{3}|[1-9]\d{4})\s*(đ|vnd|đồng|k\/kwh|k\/số)/i,
      severity: "HIGH",
      title: "Giá điện nhà trọ vượt khung quy định của Nhà nước",
      legalBasis: "Khoản 6 Điều 10 Thông tư 25/2018/TT-BCT của Bộ Công Thương",
      analysis: "Chủ nhà thu tiền điện với mức vượt quá biểu giá bán lẻ điện sinh hoạt bậc thang của Nhà nước. Hành vi này có thể bị xử phạt hành chính từ 7.000.000đ đến 10.000.000đ theo Điều 12 Nghị định 134/2013/NĐ-CP.",
      recommendation: "Yêu cầu chủ trọ áp dụng biểu giá điện sinh hoạt của EVN hoặc đăng ký định mức số lượng sinh viên cư trú.",
    },
    {
      id: "RULE_UNILATERAL_DEPOSIT_FORFEIT",
      pattern: /(mất cọc|không trả lại cọc|tịch thu cọc|mất toàn bộ tiền cọc).*?(chuyển đi|chấm dứt|trước hạn)/i,
      severity: "CRITICAL",
      title: "Bẫy tịch thu tiền cọc bất hợp lý khi chấm dứt hợp đồng",
      legalBasis: "Điều 328 & Điều 428 Bộ luật Dân sự 2015",
      analysis: "Quy định người thuê chuyển đi phải báo trước 30 ngày, nếu đã thông báo đúng hạn thì chủ nhà phải hoàn trả tiền đặt cọc sau khi trừ các chi phí hợp lý. Điều khoản tịch thu toàn bộ cọc vô điều kiện là điều khoản bất bình đẳng.",
      recommendation: "Đàm phán sửa thành: 'Nếu bên thuê thông báo trước ít nhất 30 ngày thì bên cho thuê có nghĩa vụ hoàn trả 100% tiền đặt cọc sau khi thanh toán hết các hóa đơn dịch vụ.'",
    },
    {
      id: "RULE_NO_MAINTENANCE_LIABILITY",
      pattern: /(tự sửa chữa|không chịu trách nhiệm sửa chữa|bên thuê tự chịu mọi hư hỏng|không bảo hành thiết bị)/i,
      severity: "MEDIUM",
      title: "Đẩy toàn bộ chi phí sửa chữa hao mòn tự nhiên cho sinh viên",
      legalBasis: "Điều 477 Bộ luật Dân sự 2015 (Nghĩa vụ bảo đảm giá trị sử dụng của tài sản thuê)",
      analysis: "Bên cho thuê có nghĩa vụ sửa chữa các hư hỏng do hao mòn tự nhiên (như hỏng máy lạnh, thấm dột, chập đường điện âm tường). Sinh viên chỉ chịu trách nhiệm đối với các hư hỏng do lỗi cố ý hoặc bất cẩn của mình.",
      recommendation: "Thêm điều khoản: 'Bên cho thuê chịu trách nhiệm sửa chữa các hư hỏng kết cấu và hao mòn tự nhiên của thiết bị trong vòng 48h kể từ khi nhận được thông báo.'",
    },
  ],
  EMPLOYMENT: [
    {
      id: "RULE_WITHHOLD_ID_DOCUMENTS",
      pattern: /(giữ cccd|giữ chứng minh|giữ bằng gốc|nộp bản chính cccd|giữ học bạ gốc|giữ thẻ sinh viên)/i,
      severity: "CRITICAL",
      title: "Hành vi giữ bản chính giấy tờ tùy thân trái pháp luật",
      legalBasis: "Khoản 1 Điều 17 Bộ luật Lao động 2019",
      analysis: "Hành vi giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động bị nghiêm cấm và bị xử phạt từ 20.000.000đ đến 25.000.000đ theo Nghị định 12/2022/NĐ-CP.",
      recommendation: "TUYỆT ĐỐI KHÔNG nộp bản chính CCCD hoặc bằng cấp. Chỉ cung cấp bản photo công chứng hoặc xuất trình bản gốc để đối chiếu tại chỗ.",
    },
    {
      id: "RULE_EMPLOYMENT_DEPOSIT_DEMAND",
      pattern: /(đặt cọc nhận việc|phí đồng phục|phí đào tạo|phí hồ sơ|cọc làm việc|nộp trước\s*\d+.*(k|tr|triệu|đồng)|phí giữ chỗ việc làm)/i,
      severity: "CRITICAL",
      title: "Yêu cầu đóng tiền / đặt cọc để được nhận việc (Dấu hiệu lừa đảo)",
      legalBasis: "Khoản 2 Điều 17 Bộ luật Lao động 2019",
      analysis: "Pháp luật nghiêm cấm người sử dụng lao động yêu cầu người lao động phải thực hiện biện pháp bảo đảm bằng tiền hoặc tài sản khác cho việc thực hiện hợp đồng lao động.",
      recommendation: "DỪNG KÝ HỢP ĐỒNG NGAY. Bất kỳ công ty tuyển dụng nào bắt đóng tiền đồng phục, tiền cọc trước khi làm việc đều có dấu hiệu lừa đảo 100%.",
    },
    {
      id: "RULE_MLM_SALES_QUOTA_FORCED",
      pattern: /(phải mua gói sản phẩm|ôm hàng|mua sản phẩm mẫu|tuyển thêm người|hoa hồng đa tầng)/i,
      severity: "HIGH",
      title: "Dấu hiệu bẫy bán hàng đa cấp bất chính / ép mua hàng",
      legalBasis: "Nghị định 40/2018/NĐ-CP về quản lý hoạt động kinh doanh theo phương thức đa cấp",
      analysis: "Cấm doanh nghiệp đa cấp yêu cầu người tham gia phải đặt cọc, mua một số lượng hàng hóa ban đầu hoặc đóng tiền để được quyền tham gia mạng lưới.",
      recommendation: "Không nộp tiền mua bất kỳ gói hàng nào để 'đủ điều kiện nhận lương'.",
    },
  ],
};
