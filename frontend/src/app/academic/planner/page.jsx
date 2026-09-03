import React from "react";
import { AcademicWhatIfPlannerView } from "@/components/academic/AcademicWhatIfPlannerView.jsx";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader.js";

export const metadata = {
  title: "Academic What-If Planner & Simulator | StudentHub AI",
  description: "Bộ giả lập học vụ và hoạch định tốt nghiệp cá nhân hóa — khám phá kịch bản cải thiện điểm, tín chỉ, chuẩn ngoại ngữ mà không ảnh hưởng hồ sơ thật."
};

export default function AcademicPlannerPage() {
  const initialData = getAuthoritativeCommandCenterData();

  return (
    <main className="min-h-screen bg-background text-foreground antialiased pt-4">
      <AcademicWhatIfPlannerView initialData={initialData} />
    </main>
  );
}
