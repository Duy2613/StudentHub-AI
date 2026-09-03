"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AcademicHeader } from "./AcademicHeader.jsx";
import { ActionCenter } from "./ActionCenter.jsx";
import { WhatChangedSection } from "./WhatChangedSection.jsx";
import { WhyAffectedSection } from "./WhyAffectedSection.jsx";
import { AcademicTimeline } from "./AcademicTimeline.jsx";
import { SourceEvidenceDrawer } from "./SourceEvidenceDrawer.jsx";
import { WorkflowDetailDrawer } from "./WorkflowDetailDrawer.jsx";
import { DigitalTwinDrawer } from "./DigitalTwinDrawer.jsx";
import { NotificationCenterDrawer } from "./NotificationCenterDrawer.jsx";
import { AcademicLoadingSkeleton, AcademicEmptyState, AcademicErrorState } from "./AcademicStates.jsx";

export function AcademicCommandCenter({ initialData = null }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [selectedItemForEvidence, setSelectedItemForEvidence] = useState(null);
  const [selectedTaskForWorkflow, setSelectedTaskForWorkflow] = useState(null);
  const [isTwinDrawerOpen, setIsTwinDrawerOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isMutatingStep, setIsMutatingStep] = useState(false);

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

  // Server-authoritative step completion handler
  const handleCompleteStep = async (taskId, stepId) => {
    if (isMutatingStep) return;
    setIsMutatingStep(true);
    try {
      const res = await fetch(`/api/academic/tasks/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_STEP",
          stepId,
          studentId: data?.studentProfile?.studentId || "24110001"
        })
      });

      const resJson = await res.json();
      if (!resJson.success) {
        throw new Error(resJson.message || "Không thể cập nhật bước học vụ.");
      }

      // Update task in local state from server authoritative response
      const updatedTask = resJson.task;
      setData(prev => {
        if (!prev) return prev;
        const nextTasks = (prev.academicTasks || []).map(t => t.taskId === taskId ? updatedTask : t);
        return {
          ...prev,
          academicTasks: nextTasks
        };
      });

      setSelectedTaskForWorkflow(updatedTask);
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật bước.");
    } finally {
      setIsMutatingStep(false);
    }
  };

  // Notification action handlers
  const handleNotificationAction = async (action, notificationId, extra = {}) => {
    try {
      const res = await fetch("/api/academic/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notificationId,
          studentId: data?.studentProfile?.studentId || "24110001",
          ...extra
        })
      });

      const resJson = await res.json();
      if (!resJson.success) {
        throw new Error(resJson.message || "Không thể thực hiện hành động thông báo.");
      }

      // Update notification state locally from server response
      const updatedNotif = resJson.notification;
      setData(prev => {
        if (!prev) return prev;
        const nextNotifications = (prev.notifications || []).map(n => 
          n.notificationId === notificationId ? updatedNotif : n
        );
        return {
          ...prev,
          notifications: nextNotifications,
          unreadNotificationCount: resJson.unreadCount ?? prev.unreadNotificationCount
        };
      });
    } catch (err) {
      alert(err.message || "Lỗi xử lý thông báo.");
    }
  };

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
    digitalTwin = null,
    eligibilityResult = null,
    digitalTwinState = {},
    priorityInsights = [],
    academicTasks = [],
    recentChanges = [],
    timelineEvents = [],
    notifications = [],
    unreadNotificationCount = 0,
    roadmap = null,
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
        onOpenTwinDrawer={() => setIsTwinDrawerOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
      />

      {data.dataNotice && (
        <div className="truth-note" role="note">
          <span aria-hidden="true">?</span>
          <span>{data.dataNotice}</span>
        </div>
      )}

      {/* 1.5. Academic Journey Summary Card */}
      {roadmap && (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 md:p-5 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/academic/roadmap" className="flex items-center gap-3 group flex-1">
            <span className="text-xl">🗺️</span>
            <div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>Lộ trình Học vụ</span>
                <span className="text-xs text-muted-foreground/60">→</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {roadmap.progress.completed}/{roadmap.progress.total} cột mốc hoàn thành
                {roadmap.blockers && roadmap.blockers.length > 0 && (
                  <span className="text-red-400 ml-1">• {roadmap.blockers.length} yếu tố chặn</span>
                )}
              </p>
            </div>
          </Link>
          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
            <div className="text-left sm:text-right">
              <span className="text-lg font-bold text-foreground tabular-nums">{roadmap.progress.percentage}%</span>
            </div>
            <Link
              href="/academic/execution"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>📊</span>
              <span>Theo Dõi Thực Thi</span>
            </Link>
            <Link
              href="/academic/planner"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>⚖️</span>
              <span>Kế Hoạch & Quyết Định</span>
            </Link>
            <Link
              href="/trust"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🛡️</span>
              <span>AI Trust</span>
            </Link>
            <Link
              href="/expert"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🎓</span>
              <span>Chuyên Gia</span>
            </Link>
            <Link
              href="/community"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>👥</span>
              <span>Cộng Đồng</span>
            </Link>
          </div>
        </div>
      )}

      {!hasAnyContent ? (
        <AcademicEmptyState />
      ) : (
        <div className="space-y-8">
          {/* 2. Urgent Action Center with Multi-Step Tasks */}
          <ActionCenter
            insights={priorityInsights}
            academicTasks={academicTasks}
            onOpenEvidence={(item) => setSelectedItemForEvidence(item)}
            onOpenWorkflow={(task) => setSelectedTaskForWorkflow(task)}
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

      {/* 6. Slide-over Workflow Detail Drawer */}
      <WorkflowDetailDrawer
        task={selectedTaskForWorkflow}
        isOpen={Boolean(selectedTaskForWorkflow)}
        onClose={() => setSelectedTaskForWorkflow(null)}
        onCompleteStep={handleCompleteStep}
        isMutating={isMutatingStep}
      />

      {/* 7. Slide-over Digital Twin & Eligibility Drawer */}
      <DigitalTwinDrawer
        isOpen={isTwinDrawerOpen}
        onClose={() => setIsTwinDrawerOpen(false)}
        digitalTwin={digitalTwin}
        eligibilityResult={eligibilityResult}
      />

      {/* 8. Slide-over Notification Center Drawer */}
      <NotificationCenterDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        unreadCount={unreadNotificationCount}
        onMarkRead={(id) => handleNotificationAction("MARK_READ", id)}
        onAcknowledge={(id) => handleNotificationAction("ACKNOWLEDGE", id)}
        onSnooze={(id, hours) => handleNotificationAction("SNOOZE", id, { snoozeHours: hours })}
        onDismiss={(id) => handleNotificationAction("DISMISS", id)}
        onOpenWorkflow={(taskId) => {
          const targetTask = (academicTasks || []).find(t => t.taskId === taskId);
          if (targetTask) {
            setSelectedTaskForWorkflow(targetTask);
          }
        }}
      />
    </div>
  );
}
