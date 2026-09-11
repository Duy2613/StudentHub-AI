import { getPostgresPool } from "./PostgresPool.js";

/**
 * ExpertMissionService
 *
 * Implements Daily Expert Missions ("Nhiệm vụ hôm nay") for Expert Trust Network V3.
 *
 * Missions are dynamically derived from server-side pending queues:
 * 1. Expert assignments awaiting evaluation
 * 2. Community claims / contributions needing evidence verification
 * 3. Community perception peer-reviews
 * 4. Moderation cases (for qualified reviewers)
 */
export class ExpertMissionService {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async getDailyMissions(userId) {
    if (!userId) return { missions: [], completedCount: 0, totalCount: 0, progressPct: 0 };

    const missions = [];

    // 1. Check assigned expert cases
    const assignmentRes = await this.pool.query(
      `SELECT a.id, a.case_id, a.case_revision, a.status, NULL as title
       FROM private.expert_assignments a
       JOIN public.trust_cases tc ON tc.id = a.case_id
       WHERE a.expert_id = $1
         AND a.status IN ('ASSIGNED', 'IN_REVIEW')
       LIMIT 2`,
      [userId]
    );

    for (const a of assignmentRes.rows) {
      missions.push({
        id: `mission-assignment-${a.id}`,
        category: "EXPERT_ADJUDICATION",
        title: `Thẩm định chuyên gia: ${a.title || "Hồ sơ độ tin cậy"}`,
        description: "Xem xét bằng chứng độc lập và đưa ra đánh giá chuyên môn có cấu trúc.",
        actionUrl: `/expert/review/${a.id}`,
        badge: "Nhiệm vụ chính",
        points: 20,
        completed: false,
        priority: "HIGH",
      });
    }

    // 2. Check community contributions needing verification
    const contributionRes = await this.pool.query(
      `SELECT c.id, c.case_id, c.contribution_type, NULL as title
       FROM public.community_contributions c
       JOIN public.trust_cases tc ON tc.id = c.case_id
       WHERE c.evidence_state IN ('UNKNOWN', 'INSUFFICIENT', 'NEEDS_VERIFICATION')
         AND c.publication_state = 'PUBLISHED'
         AND c.author_id <> $1
       LIMIT 1`,
      [userId]
    );

    if (contributionRes.rows.length > 0) {
      const c = contributionRes.rows[0];
      missions.push({
        id: `mission-community-${c.id}`,
        category: "COMMUNITY_VERIFICATION",
        title: `Xác minh nguồn tin: ${c.title || "Đóng góp cộng đồng"}`,
        description: "Kiểm tra tính độc lập và độ tin cậy của tài liệu minh chứng sinh viên vừa nộp.",
        actionUrl: `/community?caseId=${c.case_id}`,
        badge: "Đóng góp",
        points: 10,
        completed: false,
        priority: "MEDIUM",
      });
    }

    // 3. Community perception vote mission
    const todayVoteRes = await this.pool.query(
      `SELECT count(*)::int as count
       FROM public.community_perception_votes
       WHERE user_id = $1
         AND created_at >= current_date`,
      [userId]
    );
    const hasVotedToday = (todayVoteRes.rows[0]?.count || 0) > 0;

    missions.push({
      id: `mission-perception-${userId}`,
      category: "COMMUNITY_PERCEPTION",
      title: "Góp tiếng nói cộng đồng (Perception Vote)",
      description: "Bỏ phiếu Đáng tin / Nghi ngờ cho ít nhất một hồ sơ cộng đồng hôm nay.",
      actionUrl: "/community",
      badge: "Cộng đồng",
      points: 5,
      completed: hasVotedToday,
      priority: "LOW",
    });

    // 4. If user is coordinator/moderator, check pending moderation
    const modRes = await this.pool.query(
      `SELECT count(*)::int as count FROM private.moderation_cases
       WHERE status = 'OPEN'`,
      []
    );
    const openModCount = modRes.rows[0]?.count || 0;
    if (openModCount > 0) {
      missions.push({
        id: "mission-moderation-queue",
        category: "MODERATION",
        title: `Kiểm duyệt cộng đồng (${openModCount} báo cáo đang chờ)`,
        description: "Bỏ phiếu xử lý các bài đăng có dấu hiệu vi phạm chuẩn mực học thuật.",
        actionUrl: "/expert?tab=moderation",
        badge: "Kiểm duyệt",
        points: 15,
        completed: false,
        priority: "MEDIUM",
      });
    }

    const completedCount = missions.filter((m) => m.completed).length;
    const totalCount = missions.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      missions,
      completedCount,
      totalCount,
      progressPct,
    };
  }
}
