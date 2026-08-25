import { NextResponse } from "next/server";

// Realistic campus cyber safety training quests (Zero fake data)
let QUESTS_REGISTRY = [
  {
    id: "quest-01",
    title: "Xác thực 01 cảnh báo điểm nóng trên Bản Đồ An Ninh",
    type: "COMMUNITY_VERIFY",
    rewardPoints: 5,
    description: "Vào Bản đồ An ninh (/safety-map), kiểm tra và bấm 'Xác nhận đúng' hoặc 'Báo cáo sai' cho một điểm nóng quanh trường bạn.",
    actionUrl: "/safety-map",
    isCompleted: false,
  },
  {
    id: "quest-02",
    title: "Giải mã tình huống nhận diện thủ đoạn mạo danh PĐT thu học phí",
    type: "SCENARIO_DRILL",
    rewardPoints: 10,
    description: "Đối soát 01 thông tin học phí trên Radar Học phí (/tuition-radar) để nắm rõ nguyên tắc 100% trường công không thu tiền qua STK cá nhân.",
    actionUrl: "/tuition-radar",
    isCompleted: false,
  },
  {
    id: "quest-03",
    title: "Kiểm tra 01 hợp đồng mẫu trên AI Bóc Tách Bẫy Hợp Đồng",
    type: "LEGAL_AUDIT",
    rewardPoints: 10,
    description: "Thực hiện bóc tách 01 văn bản hợp đồng thuê trọ hoặc việc làm thêm (/contract-check) để nhận diện các điều khoản phạt vi phạm trái luật.",
    actionUrl: "/contract-check",
    isCompleted: false,
  },
  {
    id: "quest-04",
    title: "Đóng góp 01 review có ích trên Diễn Đàn Sinh Viên",
    type: "FORUM_CONTRIBUTION",
    rewardPoints: 5,
    description: "Chia sẻ một trải nghiệm thực tế về quán ăn ngon, chủ trọ tốt hoặc thủ tục trường học trên Diễn đàn (/forum).",
    actionUrl: "/forum",
    isCompleted: false,
  },
];

/**
 * GET /api/quests/daily
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      count: QUESTS_REGISTRY.length,
      quests: QUESTS_REGISTRY,
    });
  } catch (error) {
    console.error("[Quests GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải nhiệm vụ." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quests/daily
 * Claim reward for completed quest
 * Body: { questId: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { questId } = body || {};

    const quest = QUESTS_REGISTRY.find((q) => q.id === questId);
    if (!quest) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy nhiệm vụ yêu cầu." },
        { status: 404 }
      );
    }

    quest.isCompleted = true;

    return NextResponse.json({
      success: true,
      message: `Chúc mừng bạn đã hoàn thành nhiệm vụ và nhận +${quest.rewardPoints} Điểm Tín Nhiệm!`,
      quest,
      rewardPoints: quest.rewardPoints,
    });
  } catch (error) {
    console.error("[Quests POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi nhận thưởng nhiệm vụ." },
      { status: 500 }
    );
  }
}
