# 🏗️ System Architecture & Data Flow
> **Vault Node**: `System-Architecture` | **Tags**: `#architecture` `#nextjs` `#supabase` `#vercel-ai`

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống (Architecture Diagram)

```mermaid
graph TD
    Client["🌐 Next.js 16 App Router (React 19 + Tailwind v4)"]
    
    subgraph Frontend Layer
        AuthUI["Auth & Settigation OTP Orbit"]
        MentorUI["AI Mentor & Copilot"]
        WhiteboardUI["Tldraw Canvas Studio"]
        WorkspaceUI["Realtime Workspace Hub"]
    end

    subgraph Backend & Auth
        SupabaseAuth["Supabase Auth (OTP / OAuth)"]
        SupabaseDB["PostgreSQL (Profiles, Workspaces, Chats)"]
        SupabaseRealtime["Realtime Channels (Presence & Sync)"]
    end

    subgraph AI Engine
        VercelAISDK["Vercel AI SDK (@ai-sdk/react)"]
        OpenAI["OpenAI GPT-4o / O1"]
        Gemini["Google Gemini 2.5/3.0"]
    end

    Client --> Frontend Layer
    AuthUI --> SupabaseAuth
    WorkspaceUI --> SupabaseDB
    WhiteboardUI --> SupabaseRealtime
    MentorUI --> VercelAISDK
    VercelAISDK --> OpenAI
    VercelAISDK --> Gemini
```

---

## 2. Các Thành Phần Chính
1. **Frontend**: Next.js 16 (Turbopack, App Router, React 19 Compiler, TailwindCSS v4).
2. **Design Tokens**: [[DESIGN|Refero Styles]], Frosted Glass, Ambient Glows.
3. **Authentication**: [[Auth-Flow-OTP-Verification|Supabase 2-Step OTP + Settigation Orbit v3]].
4. **Database & Realtime**: PostgreSQL qua `@supabase/supabase-js`.
5. **Interactive Whiteboard**: `tldraw` v5.3.2 cho tư duy hình ảnh và giải toán trực quan.
