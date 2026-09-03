/**
 * StudentHub AI — Academic Execution Center Server Page
 * /academic/execution
 * 
 * Server-rendered React component that loads authoritative baseline data
 * and renders AcademicExecutionCenterView.
 */

import React from "react";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicPlanDriftEngine } from "@/lib/intelligence/academic/academicPlanDriftEngine";
import { AcademicExecutionCenterView } from "@/components/academic/AcademicExecutionCenterView";

export const metadata = {
  title: "Academic Execution Center | StudentHub AI",
  description: "Theo dõi thực thi kế hoạch học tập, đối soát dữ liệu thực tế và phát hiện độ lệch học vụ."
};

export default function AcademicExecutionPage() {
  const serverData = getAuthoritativeCommandCenterData();

  let initialExecution = null;
  if (serverData.success) {
    const { studentProfile, profile360, digitalTwin } = serverData;
    initialExecution = AcademicPlanDriftEngine.evaluateExecution({
      studentId: studentProfile.studentId,
      targetTerm: "2026-HK1",
      profile360,
      digitalTwin
    });
  }

  return (
    <AcademicExecutionCenterView
      initialData={{
        ...serverData,
        execution: initialExecution
      }}
    />
  );
}
