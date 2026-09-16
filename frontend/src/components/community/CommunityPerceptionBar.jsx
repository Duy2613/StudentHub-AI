"use client";

import React from "react";
import { Heart, ShieldCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

export default function CommunityPerceptionBar({ post, canInteract = false, onInteract }) {
  const perception = post?.communityPerception || {};
  const loginHref = "/login?next=%2Fcommunity";
  return (
    <div className="community-perception" aria-label="Cảm nhận cộng đồng">
      <div className="community-perception-copy">
        <span className="data-label"><ShieldCheck size={13} /> Cảm nhận cộng đồng</span>
        <small>Cảm nhận cộng đồng, không phải kết luận xác minh.</small>
      </div>
      <div className="community-perception-actions">
        {canInteract ? (
          <>
            <button type="button" onClick={() => onInteract?.("perception", { value: 1 })} aria-label="Đánh dấu đáng tin">
              <ThumbsUp size={14} /> Đáng tin <strong>{perception.trust || 0}</strong>
            </button>
            <button type="button" onClick={() => onInteract?.("perception", { value: -1 })} aria-label="Đánh dấu không tin">
              <ThumbsDown size={14} /> Không tin <strong>{perception.doubt || 0}</strong>
            </button>
          </>
        ) : (
          <Link href={loginHref} className="community-perception-login"><ThumbsUp size={14} /> Đăng nhập để phản hồi</Link>
        )}
        <span className="community-perception-like"><Heart size={14} /> {post?.likeCount || 0}</span>
      </div>
    </div>
  );
}
