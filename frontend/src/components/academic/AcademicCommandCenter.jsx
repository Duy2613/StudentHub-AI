"use client";

import React, { useState, useEffect } from "react";
import { AcademicHeader } from "./AcademicHeader.jsx";
import { ActionCenter } from "./ActionCenter.jsx";
import { WhatChangedSection } from "./WhatChangedSection.jsx";
import { WhyAffectedSection } from "./WhyAffectedSection.jsx";
import { AcademicTimeline } from "./AcademicTimeline.jsx";
import { SourceEvidenceDrawer } from "./SourceEvidenceDrawer.jsx";
import { AcademicLoadingSkeleton, AcademicEmptyState, AcademicErrorState } from "./AcademicStates.jsx";

export function AcademicCommandCenter({ initialData = null }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [selectedItemForEvidence, setSelectedItemForEvidence] = useState(null);

  const fetchCommandCenterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/academic/command-center");
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: Không thể lấy dữ liệu từ máy chủ.`);
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Lỗi phản hồi từ dịch vụ học vụ.");
      }
      setData(json);
    } catch (err) {
      setError(err.message || "Lỗi kết nối học vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchCommandCenterData();
    }
  }, [initialData]);

  if (loading) {
    return <AcademicLoadingSkeleton />;
  }

  if (error) {
    return <AcademicErrorState error={error} onRetry={fetchCommandCenterData} />;
  }

  if (!data) {
    return <AcademicEmptyState />;
  }

  const {
    studentProfile = {},
    digitalTwinState = {},
    priorityInsights = [],
    recentChanges = [],
    timelineEvents = [],
    syncStatus = {}
  } = data;

  const hasAnyContent = priorityInsights.length > 0 || recentChanges.length > 0 || timelineEvents.length > 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* 1. Command Center Header & Twin Overview */}
      <AcademicHeader
        studentProfile={studentProfile}
        digitalTwinState={digitalTwinState}
        syncStatus={syncStatus}
      />

      {!hasAnyContent ? (
        <AcademicEmptyState />
      ) : (
        <div className="space-y-8">
          {/* 2. Urgent Action Center (Most Critical First) */}
          <ActionCenter
            insights={priorityInsights}
            onOpenEvidence={(item) => setSelectedItemForEvidence(item)}
          />

          {/* 3. Grid Layout: What Changed & Why You Are Affected */}
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            {/* Left: What Changed (Semantic Diffs) */}
            <WhatChangedSection
              changes={recentChanges}
              onSelectChange={(change) => setSelectedItemForEvidence(change)}
            />

            {/* Right: Why You Are Affected (Personalized Reasons) */}
            <WhyAffectedSection
              insights={priorityInsights}
              studentProfile={studentProfile}
            />
          </div>

          {/* 4. Chronological Academic Timeline */}
          <div className="rounded-3xl border border-border/60 bg-card/30 p-6 md:p-8 backdrop-blur-xl shadow-lg">
            <AcademicTimeline
              timelineEvents={timelineEvents}
              onSelectEvent={(ev) => setSelectedItemForEvidence(ev)}
            />
          </div>
        </div>
      )}

      {/* 5. Slide-over Source & Evidence Drawer */}
      <SourceEvidenceDrawer
        item={selectedItemForEvidence}
        isOpen={Boolean(selectedItemForEvidence)}
        onClose={() => setSelectedItemForEvidence(null)}
      />
    </div>
  );
}
