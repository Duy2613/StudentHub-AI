# StudentHub AI — Sequential 4-Layer Variant

Đây là biến thể chạy tuần tự của StudentHub AI. UI, BFF/API và Trust Studio nằm trong một ứng dụng Next.js tại `frontend/`.

## Phạm vi hiện tại

- **L1 — Local security:** kiểm tra offline bằng detector/regex, không gọi mạng.
- **L2 — URL threat intelligence:** chỉ áp dụng cho URL; gọi Friend Backend → Google Safe Browsing.
- **L3 — Evidence & provenance:** gọi Friend Backend → Tavily/web evidence.
- **L4 — Independent synthesis:** gọi Friend Backend → Gemini/Groq theo response contract.

Pipeline là fail-closed: `UNKNOWN`, `UNAVAILABLE`, timeout, lỗi contract và provider không cấu hình không bao giờ bị đổi thành `SAFE`, `TRUE` hoặc confidence giả. L2 dangerous dừng pipeline; L3 chỉ cho chạy L4 khi response có `canContinueToLayer4=true`. L5 assurance không thuộc biến thể bốn layer và luôn được báo là `INCONCLUSIVE`.

## Chạy local

Yêu cầu Node.js `>=24 <25` và npm `>=11 <12`.

```powershell
cd frontend
npm ci
Copy-Item .env.local.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Có thể chạy từ root sau khi đã cài dependencies:

```powershell
npm run dev
```

`frontend/.env.local` là file local bị gitignore. Chỉ commit `frontend/.env.local.example`; không đưa API key, database URL, JWT secret hoặc Supabase service key lên GitHub.

## Cấu hình live

Trust Studio dùng same-origin route `POST /api/v1/trust`. Muốn chạy đủ L2–L4 live, cần cấu hình:

```dotenv
NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE=LIVE
FRIEND_BACKEND_API_URL=https://studenthub-api-8fqp.onrender.com
FRIEND_BACKEND_API_KEY=
```

URL Render ở trên là endpoint Friend Backend được dùng trong tài liệu tích hợp; thay bằng URL backend hiện hành nếu chủ backend đổi deployment. Frontend không tự chạy mock khi backend lỗi. Khi để trống hoặc backend không khả dụng, API trả trạng thái có mã lỗi rõ ràng và UI giữ `UNKNOWN/PARTIAL`.

Nếu cần auth/persistence đầy đủ, điền thêm Supabase, PostgreSQL và session secrets trong `.env.local`. Readiness có thể trả `503 NOT_READY` khi database/session chưa cấu hình; đó là trạng thái trung thực, không phải lỗi build.

## API và health check

- `GET /api/health/live` — kiểm tra process Next.js còn sống.
- `GET /api/health/ready` — kiểm tra runtime, database, durable session và các provider bắt buộc.
- `POST /api/v1/trust` — Trust pipeline canonical; hỗ trợ JSON và SSE (`Accept: text/event-stream`).

API backend của biến thể này là Next.js Route Handler tại `frontend/src/app/api/v1/trust/route.js`. Thư mục `backend/` chỉ chứa runbook cho boundary Friend Backend, không phải một server thứ hai bị bỏ quên.

## Kiểm thử và build

```powershell
npm run lint
npm run test:all-discovered
npm run audit:bundle
npm run build
```

Các test integration quan trọng của pipeline tuần tự nằm tại `frontend/tests/integration/trust_sequential_friend.test.mjs`. Test live database/staging/provider cần secret và endpoint thật nên được chạy riêng, không được biến thành fixture giả.

Single-head proprietary neural weights không được đóng gói trong checkout sequential; runtime dùng fallback trung tính `WEIGHTS_NOT_SHIPPED` và các detector deterministic hiện có. Artifact multilabel riêng vẫn được giữ cho các test/mô-đun tương ứng.

## Deploy

`vercel.json` đã cấu hình build/install cho monorepo:

- install: `cd frontend && npm install --legacy-peer-deps`
- build: `cd frontend && npm run build`
- output: `frontend/.next`

Set environment variables trong Vercel Project Settings, không commit `.env.local`.
