// lib/supabase/client.js
//
// Supabase client dùng chung toàn app (chỉ client-side — không dùng
// @supabase/ssr/middleware vì Next.js 16 đã đổi middleware.ts -> proxy.ts
// với API chưa xác minh được cú pháp chắc chắn; cách này an toàn hơn và
// đủ dùng vì toàn bộ trang auth hiện tại đều là Client Component).

import { createClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// QUAN TRỌNG: createClient() throw lỗi ngay nếu url/key rỗng — nếu để vậy,
// thiếu .env.local sẽ làm SẬP TOÀN BỘ build/app (kể cả những trang không
// liên quan auth), rất khó truy lỗi vì thông báo không rõ ràng là do thiếu
// env. Dùng placeholder để app vẫn chạy được, chỉ các lời gọi Supabase
// thật sự mới lỗi rõ ràng lúc đó.
if (!envUrl || !envAnonKey) {
  console.error(
    "[Supabase] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local — mọi chức năng đăng nhập/đăng ký sẽ không hoạt động cho tới khi thêm vào."
  );
}

export const supabase = createClient(
  envUrl || "https://placeholder.supabase.co",
  envAnonKey || "placeholder-anon-key"
);
