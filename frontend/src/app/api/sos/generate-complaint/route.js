import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * POST /api/sos/generate-complaint
 * Tự động tạo Đơn Tố Giác Tội Phạm chuẩn theo quy định Bộ Công An & Bộ luật Tố tụng Hình sự 2015
 * Body: { victimName, victimCccd, victimPhone, victimAddress, targetName, targetAccount, targetPhone, amountLost, eventDescription, targetPoliceStation }
 */
async function generateComplaint(request, _routeContext, _principal, secContext) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      victimName,
      victimDob,
      victimCccd,
      victimPhone,
      victimAddress,
      targetName,
      targetAccount,
      targetBank,
      targetPhone,
      amountLost,
      eventDescription,
      targetPoliceStation,
    } = body || {};

    const stringFields = [victimName, victimDob, victimCccd, victimPhone, victimAddress, targetName, targetAccount, targetBank, targetPhone, eventDescription, targetPoliceStation];
    if (stringFields.some(value => value !== undefined && typeof value !== "string") ||
        stringFields.some(value => typeof value === "string" && value.length > 4000) ||
        typeof victimName !== "string" || typeof victimPhone !== "string" || typeof eventDescription !== "string" ||
        !victimName.trim() || !victimPhone.trim() || !eventDescription.trim() ||
        !Number.isFinite(Number(amountLost)) || Number(amountLost) <= 0 || Number(amountLost) > 10_000_000_000) {
      return Response.json({ success: false, error: {
        code: "COMPLAINT_INPUT_INVALID",
        userMessage: "Vui lòng nhập thông tin vụ việc hợp lệ.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }

    const today = new Date();
    const dateFormatted = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    const complaintDocument = `
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---------------------------------

ĐƠN TỐ GIÁC TỘI PHẠM
(V/v: Hành vi lừa đảo chiếm đoạt tài sản qua mạng viễn thông / không gian mạng)

Kính gửi:
- CƠ QUAN CẢNH SÁT ĐIỀU TRA - CÔNG AN ${targetPoliceStation || "QUẬN/HUYỆN/THÀNH PHỐ"}
- VIỆN KIỂM SÁT NHÂN DÂN ${targetPoliceStation || "CÙNG CẤP"}

I. THÔNG TIN NGƯỜI TỐ GIÁC:
1. Họ và tên: ${victimName.toUpperCase()}
2. Năm sinh: ${victimDob || "........................"}
3. Số CCCD/CMND: ${victimCccd || "........................"}
4. Nơi đăng ký thường trú / tạm trú: ${victimAddress || "........................"}
5. Số điện thoại liên hệ: ${victimPhone}

II. THÔNG TIN ĐỐI TƯỢNG BỊ TỐ GIÁC (Theo thông tin thu thập được):
1. Tên hiển thị / Nickname: ${targetName || "Đối tượng ẩn danh"}
2. Số điện thoại / Zalo / Telegram đối tượng sử dụng: ${targetPhone || "Chưa xác định"}
3. Số tài khoản ngân hàng nhận tiền: ${targetAccount || "Chưa xác định"}
4. Tại ngân hàng: ${targetBank || "Chưa xác định"}

III. NỘI DUNG VỤ VIỆC VÀ THIỆT HẠI:
- Số tiền bị chiếm đoạt: ${Number(amountLost).toLocaleString("vi-VN")} VNĐ (Bằng chữ: .............................................................. đồng).
- Diễn biến sự việc:
${eventDescription}

IV. CĂN CỨ PHÁP LÝ VÀ YÊU CẦU GIẢI QUYẾT:
Căn cứ Điều 144, 145 Bộ luật Tố tụng Hình sự 2015 và Điều 174 Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017) về "Tội lừa đảo chiếm đoạt tài sản".

Tôi kính đề nghị Quý cơ quan:
1. Tiếp nhận đơn tố giác và tiến hành xác minh, điều tra làm rõ hành vi phạm tội của đối tượng.
2. Áp dụng các biện pháp ngăn chặn, phối hợp cùng Ngân hàng phong tỏa số tài khoản thụ hưởng để thu hồi tài sản bị chiếm đoạt.
3. Khởi tố vụ án hình sự và xử lý nghiêm minh đối tượng theo quy định của pháp luật.

Tôi xin cam đoan các nội dung trình bày trên đây là hoàn toàn đúng sự thật và chịu trách nhiệm trước pháp luật về lời khai của mình.

TÀI LIỆU KÈM THEO ĐƠN:
1. Bản sao CCCD người tố giác.
2. Bản in sao kê giao dịch ngân hàng / Giấy nộp tiền có dấu mộc hoặc mã FT.
3. Bản in ảnh chụp toàn bộ đoạn hội thoại, thông tin số điện thoại của đối tượng.

..., ${dateFormatted}
NGƯỜI TỐ GIÁC
(Ký và ghi rõ họ tên)



${victimName.toUpperCase()}
`.trim();

    return NextResponse.json({
      success: true,
      timestamp: today.toISOString(),
      complaintDocument,
      adviceList: [
        "1. In đơn này thành 02 bản, ký tên và dán kèm bản photo CCCD.",
        "2. Đem theo bản gốc CCCD và sao kê chuyển tiền có đóng dấu đỏ của Ngân hàng (hoặc in ủy nhiệm chi điện tử có mã tham chiếu giao dịch FT).",
        "3. Nộp trực tiếp tại Đội Cảnh sát Hình sự hoặc Cơ quan Cảnh sát Điều tra Công an quận/huyện nơi bạn thực hiện giao dịch chuyển tiền hoặc nơi đối tượng cư trú.",
      ],
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "GENERATE_PRIVATE_COMPLAINT_DRAFT",
  maxRequests: 10,
  maxBodyBytes: 128 * 1024,
}, generateComplaint);
