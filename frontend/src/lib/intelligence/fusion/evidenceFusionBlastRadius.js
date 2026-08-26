/**
 * StudentHub AI — Downstream Blast-Radius & Change Impact Engine V1
 * 
 * Computes downstream dependency DAG and impact radius when a Knowledge Object is recomputed
 * or when an official regulation/source is superseded/retracted.
 */

export class EvidenceFusionBlastRadius {
  /**
   * Computes affected downstream systems and objects
   */
  static computeBlastRadius(knowledgeObject, previousObject = null) {
    if (!knowledgeObject) return { impactedCount: 0, consumers: [] };

    const consumers = [];
    const subject = knowledgeObject.subject;
    const topic = knowledgeObject.topic;

    // 1. Academic Eligibility & Digital Twin
    if (subject === "ENGLISH_EXIT_STANDARD" || subject === "GRADUATION_REQUIREMENTS") {
      consumers.push({
        systemId: "ACADEMIC_DIGITAL_TWIN",
        systemName: "Bản Sao Số Học Vụ (Digital Twin)",
        actionRequired: "RECOMPUTE_ELIGIBILITY",
        severity: "HIGH",
        explanation: "Thay đổi chuẩn đầu ra đòi hỏi tái tính toán điều kiện tốt nghiệp cho các khóa bị ảnh hưởng."
      });
    }

    // 2. Personal Academic Roadmap
    consumers.push({
      systemId: "ACADEMIC_ROADMAP",
      systemName: "Lộ Trình Học Vụ (Roadmap DAG)",
      actionRequired: "RE_ALIGN_MILESTONES",
      severity: "MEDIUM",
      explanation: `Cập nhật mốc thời gian hoặc điều kiện của chủ đề '${topic}'.`
    });

    // 3. Workflow Action Center & Tasks
    if (subject === "DEADLINE" || knowledgeObject.realityGaps?.length > 0) {
      consumers.push({
        systemId: "ACADEMIC_WORKFLOW",
        systemName: "Trung Tâm Nhiệm Vụ & Quy Trình",
        actionRequired: "RECONCILE_TASK_DEADLINES",
        severity: "CRITICAL",
        explanation: "Hạn chót hoặc thời gian thẩm định thay đổi, kích hoạt đối soát nhiệm vụ học vụ đang chờ."
      });
    }

    // 4. Notification & Deadline Orchestrator
    consumers.push({
      systemId: "ACADEMIC_NOTIFICATIONS",
      systemName: "Điều Phối Thông Báo & Nhắc Nhở",
      actionRequired: "RE_SCHEDULE_NOTIFICATIONS",
      severity: "MEDIUM",
      explanation: "Hủy lịch nhắc nhở cũ và lập lịch thông báo mới theo hạn chót cập nhật."
    });

    return {
      knowledgeObjectId: knowledgeObject.knowledgeObjectId,
      version: knowledgeObject.version,
      hasChange: previousObject ? previousObject.sourceSetHash !== knowledgeObject.sourceSetHash : true,
      impactedCount: consumers.length,
      consumers,
      computedAt: new Date().toISOString()
    };
  }
}
