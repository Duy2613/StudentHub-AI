"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Clock3, ShieldCheck, Video } from "lucide-react";
import { useRealtime } from "@/components/providers/RealtimeContext";

function roomHref(roomId) {
  return `/expert/rooms?room=${encodeURIComponent(roomId)}`;
}

function roomStateLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

export default function ExpertRoomNotificationBell() {
  const { roomInbox } = useRealtime();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const now = Date.now();
  const rooms = Array.isArray(roomInbox?.myRooms) ? roomInbox.myRooms : [];
  const invitations = rooms.filter((room) => room.role === "SUPERVISOR_INVITEE"
    && Date.parse(room.supervisorOfferExpiresAt || "") > now);
  const activeRooms = rooms.filter((room) => room.role !== "SUPERVISOR_INVITEE"
    && !["CLOSED", "CANCELLED"].includes(room.status)).slice(0, 5);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
        aria-label={invitations.length ? `Thông báo phòng, ${invitations.length} lời mời mới` : "Thông báo phòng xác minh"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="expert-room-notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={17} aria-hidden="true" />
        {invitations.length > 0 && <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--action-primary)] px-1 text-[10px] font-bold text-white">{invitations.length > 9 ? "9+" : invitations.length}</span>}
      </button>

      {open && <section
        id="expert-room-notifications"
        role="dialog"
        aria-label="Thông báo phòng xác minh"
        className="absolute right-0 top-full z-[80] mt-3 max-h-[min(75vh,34rem)] w-[min(23rem,calc(100vw-2rem))] overflow-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 text-[var(--text-primary)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div><p className="text-[10px] font-bold tracking-[0.18em] text-[var(--text-secondary)]">LIVE ROOM</p><h2 className="mt-1 text-base font-semibold">Thông báo phòng</h2></div>
          <Link href="/expert/rooms" onClick={() => setOpen(false)} className="text-xs font-semibold text-[var(--action-primary)] hover:underline">Mở danh sách</Link>
        </div>

        {roomInbox?.status === "UNAVAILABLE" && <p role="status" className="mt-3 rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text-secondary)]">Thông báo phòng tạm thời chưa tải được. Bấm “Mở danh sách” để thử lại.</p>}

        {invitations.map((room) => <article key={`${room.roomId}:${room.supervisorOfferExpiresAt}`} className="mt-3 rounded-xl border border-[var(--action-primary)]/40 bg-[var(--surface-2)] p-3">
          <div className="flex items-start gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--action-primary)]" /><div className="min-w-0 flex-1"><strong className="block text-sm">Lời mời Supervisor độc lập</strong><p className="mt-1 text-xs text-[var(--text-secondary)]">Phòng {String(room.domainCode || "").replaceAll("_", " ")} · {room.inputType}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-secondary)]"><Clock3 size={12} /> Hết hạn {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(room.supervisorOfferExpiresAt))}</p></div></div>
          <Link href={roomHref(room.roomId)} onClick={() => setOpen(false)} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[var(--action-primary)] px-3 py-2 text-xs font-bold text-white">Mở lời mời và khai báo xung đột</Link>
        </article>)}

        {activeRooms.map((room) => <Link key={room.roomId} href={roomHref(room.roomId)} onClick={() => setOpen(false)} className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] p-3 hover:bg-[var(--surface-2)]">
          <Video size={16} className="mt-0.5 shrink-0 text-[var(--text-secondary)]" /><span className="min-w-0"><strong className="block text-sm">{String(room.domainCode || "").replaceAll("_", " ")}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{roomStateLabel(room.status)} · {room.inputType}</span></span>
        </Link>)}

        {!invitations.length && !activeRooms.length && roomInbox?.status !== "UNAVAILABLE" && <p className="mt-3 rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]">Chưa có lời mời hoặc cập nhật phòng đang hoạt động.</p>}
      </section>}
    </div>
  );
}
