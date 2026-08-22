-- ==============================================================================
-- STUDENTHUB AI - SUPABASE PROFILES SCHEMA & TRIGGER DEFINITION
-- ==============================================================================
-- Bảng profiles lưu trữ thông tin mở rộng của người dùng:
-- - id: UUID khóa chính tham chiếu trực tiếp auth.users
-- - role: 'standard' (Người dùng tiêu chuẩn) hoặc 'expert' (Chuyên gia uy tín)
-- - avatar_url: Đường dẫn ảnh đại diện
-- - reputation_score: Điểm uy tín được tính toán tự động
-- - github_username, top_repos, bio, full_name, onboarded
-- ==============================================================================

-- 1. Tạo hoặc Cập nhật Bảng profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'standard' CHECK (role IN ('standard', 'expert', 'student')),
    avatar_id TEXT DEFAULT 'student-tech',
    avatar_url TEXT,
    reputation_score INTEGER DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
    trust_score INTEGER DEFAULT 50,
    github_username TEXT,
    top_repos JSONB DEFAULT '[]'::jsonb,
    university TEXT,
    major TEXT,
    academic_year TEXT,
    expert_title TEXT,
    expert_field TEXT,
    experience_years TEXT,
    bio TEXT,
    verified_student BOOLEAN DEFAULT FALSE,
    verified_expert BOOLEAN DEFAULT FALSE,
    onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bật Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tạo chính sách RLS an toàn
-- Cho phép mọi người đọc thông tin hồ sơ công khai
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Cho phép người dùng chỉnh sửa hồ sơ của chính mình
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 4. Trigger tự động tạo profile khi có user mới đăng nhập qua GitHub / OAuth / Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_edu BOOLEAN;
    calculated_score INTEGER;
BEGIN
    is_edu := (NEW.email ILIKE '%.edu' OR NEW.email ILIKE '%.edu.%' OR NEW.email ILIKE '%@%.ac.%');
    calculated_score := CASE WHEN is_edu THEN 80 ELSE 50 END;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        avatar_id,
        avatar_url,
        reputation_score,
        trust_score,
        github_username,
        verified_student,
        verified_expert,
        onboarded,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'user_name', 'Thành viên StudentHub'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'standard'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_id', 'student-tech'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'avatarUrl', NULL),
        COALESCE((NEW.raw_user_meta_data->>'reputation_score')::integer, calculated_score),
        COALESCE((NEW.raw_user_meta_data->>'trust_score')::integer, calculated_score),
        COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'github_username', NULL),
        is_edu,
        COALESCE((NEW.raw_user_meta_data->>'role') = 'expert', FALSE),
        COALESCE((NEW.raw_user_meta_data->>'onboarded')::boolean, FALSE),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        github_username = COALESCE(EXCLUDED.github_username, public.profiles.github_username),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
