import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient } from '@/lib/supabase';
import { saveUploadedVideo, UploadedVideoRecord } from '@/lib/db/video-db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('───────────────────────────────────────────────────────');
  console.log('[API: /api/v1/mma/videos/upload] Received video upload request at', new Date().toISOString());

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fighterId = (formData.get('fighterId') as string) || 'f1';
    const roundNumber = parseInt((formData.get('roundNumber') as string) || '1', 10);
    const partnerStyle = (formData.get('partnerStyle') as string) || 'Mixed Martial Artist';
    const intensity = (formData.get('intensity') as string) || 'Championship Hard';
    const durationSeconds = parseFloat((formData.get('durationSeconds') as string) || '30');

    if (!file) {
      console.warn('[API: /api/v1/mma/videos/upload] 400 Bad Request: Missing "file" in form data.');
      return NextResponse.json(
        { error: 'No video file provided in form data.' },
        { status: 400 }
      );
    }

    const fileSizeBytes = file.size;
    const mimeType = file.type || 'video/mp4';
    const rawFileName = file.name || 'sparring_video.mp4';
    const sanitizedFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('[API: /api/v1/mma/videos/upload] Processing upload payload:', {
      videoId,
      originalName: rawFileName,
      sizeBytes: fileSizeBytes,
      sizeMB: (fileSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
      mimeType,
      fighterId,
      roundNumber,
    });

    let storageProvider: 'supabase' | 'local' = 'local';
    let storagePath = `uploads/videos/${videoId}-${sanitizedFileName}`;
    let videoUrl = `/uploads/videos/${videoId}-${sanitizedFileName}`;

    // 1. Try Supabase Storage bucket if configured
    const client = getSupabaseClient();
    if (client) {
      try {
        console.log('[API: /api/v1/mma/videos/upload] Attempting upload to Supabase Storage bucket "sparring-videos"...');
        const supabasePath = `${fighterId}/${videoId}-${sanitizedFileName}`;
        const { data: uploadData, error: uploadError } = await client.storage
          .from('sparring-videos')
          .upload(supabasePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = client.storage
            .from('sparring-videos')
            .getPublicUrl(supabasePath);

          if (publicUrlData && publicUrlData.publicUrl) {
            storageProvider = 'supabase';
            storagePath = supabasePath;
            videoUrl = publicUrlData.publicUrl;
            console.log('[API: /api/v1/mma/videos/upload] Successfully uploaded to Supabase Storage. Public URL:', videoUrl);
          }
        } else {
          console.warn('[API: /api/v1/mma/videos/upload] Supabase bucket notice, falling back to local filesystem storage:', uploadError?.message);
        }
      } catch (storageErr: any) {
        console.warn('[API: /api/v1/mma/videos/upload] Storage upload exception, falling back to local:', storageErr?.message);
      }
    }

    // 2. Local filesystem storage (local-first fallback)
    if (storageProvider === 'local') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
      await fs.mkdir(uploadDir, { recursive: true });
      const localFilePath = path.join(uploadDir, `${videoId}-${sanitizedFileName}`);
      await fs.writeFile(localFilePath, buffer);
      console.log('[API: /api/v1/mma/videos/upload] Successfully written to local disk storage:', localFilePath);
    }

    // 3. Persist metadata into the video database
    const videoRecord: UploadedVideoRecord = {
      id: videoId,
      fighterId,
      fileName: rawFileName,
      fileSizeBytes,
      mimeType,
      videoUrl,
      storageProvider,
      storagePath,
      durationSeconds,
      roundNumber,
      partnerStyle,
      intensity,
      uploadedAt: new Date().toISOString(),
    };

    const dbResult = await saveUploadedVideo(videoRecord);

    const elapsed = Date.now() - startTime;
    console.log('[API: /api/v1/mma/videos/upload] Pipeline finished successfully:', {
      videoId,
      videoUrl,
      storageProvider,
      persistedToSupabase: dbResult.persistedToSupabase,
      latencyMs: elapsed,
    });
    console.log('───────────────────────────────────────────────────────');

    return NextResponse.json(
      {
        success: true,
        video: videoRecord,
        persistedToSupabase: dbResult.persistedToSupabase,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[API: /api/v1/mma/videos/upload] Error uploading video after ${elapsed}ms:`, error);
    console.log('───────────────────────────────────────────────────────');
    return NextResponse.json(
      { error: 'Failed to upload video to database.', details: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
