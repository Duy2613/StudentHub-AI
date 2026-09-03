"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, CheckCheck, Clock, AlertTriangle, ShieldCheck, ArrowRight, Calendar, CheckCircle, AlarmClock } from "lucide-react";

export function NotificationCenterDrawer({
  isOpen = false,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onAcknowledge,
  onSnooze,
  onDismiss,
  onOpenWorkflow
}) {
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, UNREAD, DEADLINES, TASKS

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "UNREAD") {
      return notif.status === "SENT" || (notif.status === "READ" && !notif.readAt);
    }
    if (activeFilter === "DEADLINES") {
      return notif.type.includes("DEADLINE") || notif.type.includes("OVERDUE");
    }
    if (activeFilter === "TASKS") {
      return notif.type.includes("TASK") || notif.type.includes("VERIFICATION");
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MEDIUM":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getTypeIcon = (type) => {
    if (type.includes("DEADLINE") || type.includes("OVERDUE")) {
      return <Clock className="h-4 w-4 text-amber-400" />;
    }
    if (type.includes("BLOCKED")) {
      return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    }
    if (type.includes("COMPLETED")) {
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    }
    return <Bell className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-card/95 border-l border-border/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    Thông Báo Học Vụ
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                        {unreadCount} mới
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cảnh báo hạn chót, tiến độ quy trình và cập nhật quy chế.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/80 border border-border/40 text-xs font-semibold">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "UNREAD", label: `Chưa đọc (${unreadCount})` },
                { id: "DEADLINES", label: "Hạn chót" },
                { id: "TASKS", label: "Quy trình" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                    activeFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List */}
          <div className="my-6 flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-3xl bg-muted/30 border border-border/40 text-muted-foreground mb-3">
                  <CheckCheck className="h-8 w-8 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Không có thông báo mới</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Tất cả quy trình học vụ và hạn chót đều đang trong trạng thái hoàn hảo.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = notif.status === "SENT" || (!notif.readAt && notif.status !== "ACKNOWLEDGED");
                return (
                  <div
                    key={notif.notificationId}
                    className={`rounded-2xl border p-4 transition-all ${
                      isUnread
                        ? "bg-primary/5 border-primary/30 shadow-md"
                        : "bg-background/40 border-border/50 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Top row: Priority & Type Icon */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(notif.type)}
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${getPriorityBadge(notif.priority)}`}>
                          {notif.priority}
                        </span>
                      </div>

                      {notif.dueAt && (
                        <span className="text-[11px] font-medium text-amber-300/90 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(notif.dueAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>

                    {/* Title & Body */}
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {notif.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {notif.body}
                    </p>

                    {/* Action Toolbar */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {notif.taskId && (
                          <button
                            onClick={() => {
                              onOpenWorkflow?.(notif.taskId);
                              onClose?.();
                            }}
                            className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary/80 transition-colors"
                          >
                            Tiếp tục quy trình <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isUnread && (
                          <button
                            onClick={() => onMarkRead?.(notif.notificationId)}
                            className="px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            Đã đọc
                          </button>
                        )}

                        <button
                          onClick={() => onSnooze?.(notif.notificationId, 4)}
                          className="px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors inline-flex items-center gap-1"
                          title="Nhắc lại sau 4 giờ"
                        >
                          <AlarmClock className="h-3 w-3" /> Báo lại
                        </button>

                        <button
                          onClick={() => onAcknowledge?.(notif.notificationId)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" /> Xác nhận
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 pt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Server-Authoritative Orchestration
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl font-semibold bg-muted/60 hover:bg-muted text-foreground transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
