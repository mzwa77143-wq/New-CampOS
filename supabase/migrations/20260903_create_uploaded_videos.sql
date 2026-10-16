-- ====================================================================
-- Migration: Create Uploaded Videos Table & Storage Bucket for CampOS
-- Date: 2026-09-03
-- Description: Stores metadata and links for uploaded sparring session videos
-- ====================================================================

-- 1. Create table for uploaded sparring videos
CREATE TABLE IF NOT EXISTS public.uploaded_videos (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fighter_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  video_url TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'supabase', -- 'supabase' | 'local'
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC DEFAULT 30,
  round_number INT DEFAULT 1,
  partner_style TEXT,
  intensity TEXT,
  session_id TEXT,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for fast lookup by owner, fighter and upload date
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_owner_id ON public.uploaded_videos(owner_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_fighter_id ON public.uploaded_videos(fighter_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_uploaded_at ON public.uploaded_videos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_session_id ON public.uploaded_videos(session_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.uploaded_videos ENABLE ROW LEVEL SECURITY;

-- 4. Scoped authenticated owner policies (B2 fix: no public delete/insert)
CREATE POLICY "Allow authenticated read access to owned uploaded videos"
  ON public.uploaded_videos FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Allow authenticated insert to owned uploaded videos"
  ON public.uploaded_videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Allow authenticated update to owned uploaded videos"
  ON public.uploaded_videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Allow authenticated delete of owned uploaded videos"
  ON public.uploaded_videos FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 5. Supabase Storage Bucket setup for sparring videos (Private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sparring-videos', 'sparring-videos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies for sparring-videos bucket (scoped to authenticated user)
CREATE POLICY "Authenticated Read Access on sparring-videos bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'sparring-videos');

CREATE POLICY "Authenticated Upload Access on sparring-videos bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sparring-videos' AND auth.role() = 'authenticated');

