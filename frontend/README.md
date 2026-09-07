# StudentHub AI frontend

Next.js App Router application for the StudentHub AI Sequential Trust Studio and the rest of the StudentHub UI/API routes.

## Local development

```powershell
npm ci
Copy-Item .env.local.example .env.local
npm run dev
```

Trust live requires a server-only `FRIEND_BACKEND_API_URL`. See the repository root README and `../backend/README.md` for the exact boundary and response contract. Keep `.env.local` private.

Useful commands:

```powershell
npm run lint
npm run build
npm run test:e2e
```
