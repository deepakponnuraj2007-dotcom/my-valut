-- ============================================================
-- Creator Content Vault — Supabase Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- VIDEOS TABLE
-- Stores YouTube and Instagram video metadata
-- ============================================================
DROP TABLE IF EXISTS public.videos;
CREATE TABLE public.videos (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  user_email    TEXT NOT NULL,
  platform      TEXT NOT NULL,
  category      TEXT DEFAULT 'Other' CHECK (category IN ('Education', 'Entertainment', 'Skill', 'Vlogs', 'Other')),
  video_url     TEXT NOT NULL,
  title         TEXT NOT NULL,
  thumbnail_url TEXT,
  description   TEXT,
  channel_name  TEXT,
  published_at  TIMESTAMPTZ,
  tags          TEXT[] DEFAULT '{}',
  view_count    BIGINT DEFAULT 0,
  like_count    BIGINT DEFAULT 0,
  duration      TEXT,            -- ISO 8601 duration string (e.g., "PT4M13S")
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast platform filtering
CREATE INDEX idx_videos_platform ON public.videos (platform);

-- Index for chronological sorting
CREATE INDEX idx_videos_created_at ON public.videos (created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- Automatically sets updated_at on row update
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- Enable and configure as needed for your auth setup
-- ============================================================
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own videos
CREATE POLICY "Allow individual read access"
  ON public.videos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated inserts
CREATE POLICY "Allow individual inserts"
  ON public.videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated updates
CREATE POLICY "Allow individual updates"
  ON public.videos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated deletes
CREATE POLICY "Allow individual deletes"
  ON public.videos
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- PROFILES TABLE
-- Stores user metadata
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT,
  avatar_url    TEXT,
  is_premium    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual profile read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow individual profile update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- AUTOMATIC PROFILE CREATION
-- Trigger to create a profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for profiles
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

