-- ====================================================================
-- Migration: Create Uploaded Videos Table & Storage Bucket for CampOS
-- Date: 2026-09-03
-- Description: Stores metadata and links for uploaded sparring session videos
-- ====================================================================

-- 1. Create table for uploaded sparring videos
CREATE TABLE IF NOT EXISTS public.uploaded_videos (
  id TEXT PRIMARY KEY,
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

-- 2. Indexes for fast lookup by fighter and upload date
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_fighter_id ON public.uploaded_videos(fighter_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_uploaded_at ON public.uploaded_videos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_session_id ON public.uploaded_videos(session_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.uploaded_videos ENABLE ROW LEVEL SECURITY;

-- 4. Public access policies for gym floor operation
CREATE POLICY "Allow public read access to uploaded videos"
  ON public.uploaded_videos FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to uploaded videos"
  ON public.uploaded_videos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete of uploaded videos"
  ON public.uploaded_videos FOR DELETE
  USING (true);

-- 5. Supabase Storage Bucket setup for sparring videos (if using storage schema)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sparring-videos', 'sparring-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sparring-videos bucket
CREATE POLICY "Public Read Access on sparring-videos bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sparring-videos');

CREATE POLICY "Public Upload Access on sparring-videos bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sparring-videos');
