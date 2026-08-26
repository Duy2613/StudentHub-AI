import React from "react";
import { AiTrustStudioView } from "@/components/trust/AiTrustStudioView";
import { AiTrustEngine } from "@/lib/intelligence/trust/aiTrustEngine";

export const metadata = {
  title: "AI Trust Engine — StudentHub AI",
  description: "AI Reliability, Claim-Level Grounding & Citation Verification System"
};

export default function TrustPage() {
  const initialEvaluation = AiTrustEngine.evaluate({
    query: "HCMUTE yêu cầu TOEIC bao nhiêu điểm đối với sinh viên khóa K24?",
    rawAnswer: "HCMUTE yêu cầu sinh viên khóa K24 đạt chuẩn đầu ra TOEIC 550 điểm.",
    sources: [
      {
        sourceId: "SRC_HCMUTE_K24_REG",
        sourceType: "OFFICIAL",
        authorityTier: 100,
        url: "https://daotao.hcmute.edu.vn/chuan-dau-ra-k24",
        publisher: "Phòng Đào Tạo HCMUTE",
        domainScope: "ACADEMIC_REGULATION",
        version: "2.0"
      }
    ],
    evidenceSpans: [
      {
        evidenceId: "EVID_K24_550",
        sourceId: "SRC_HCMUTE_K24_REG",
        documentId: "DOC_K24_REG",
        passage: "Quy chuẩn tốt nghiệp áp dụng cho sinh viên đại học chính quy K24: Chuẩn tiếng Anh tối thiểu TOEIC 550 điểm.",
        section: "Điều 5"
      }
    ],
    stakeLevel: "HIGH"
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AiTrustStudioView initialEvaluation={initialEvaluation} />
    </main>
  );
}
