-- ==============================================================================
-- Foclyra Database Schema & Row Level Security (RLS)
-- Instructions: Copy and run this in your Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- 1. PROFILES TABLE (User Accounts & Quota Details)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to automatically create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. USER COURSES TABLE (Tracks Course Slots & Limits)
-- Allows registered users up to 5 unique imported playlists.
-- Accidental deletion protection: re-importing the same playlist preserves the slot.
CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  total_lessons INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  first_imported_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_playlist UNIQUE (user_id, playlist_id)
);

-- Enable RLS on user_courses
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses"
  ON public.user_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON public.user_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON public.user_courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON public.user_courses FOR DELETE
  USING (auth.uid() = user_id);


-- 3. USER NOTES TABLE (Cloud Backup & Sync of Timestamped Lecture Notes)
CREATE TABLE IF NOT EXISTS public.user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  timestamp NUMERIC DEFAULT 0,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on user_notes
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.user_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.user_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.user_notes FOR DELETE
  USING (auth.uid() = user_id);


-- 4. USER PROGRESS TABLE (Cloud Backup of Watch Time & Lesson Completions)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id TEXT PRIMARY KEY, -- Format: {user_id}_{course_id}_{lesson_id}
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  watch_time INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.user_progress FOR DELETE
  USING (auth.uid() = user_id);


-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_course ON public.user_notes(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON public.user_progress(user_id, course_id);

-- 5. SECURE ACCOUNT DELETION (Self-service user deletion)
-- Authenticated users can permanently delete their own account.
-- ON DELETE CASCADE ensures profiles, user_courses, user_notes, and user_progress are wiped.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
