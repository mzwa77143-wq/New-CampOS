import fs from 'fs';
import path from 'path';
import { getSupabaseClient } from '@/lib/supabase';

export interface UploadedVideoRecord {
  id: string;
  fighterId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  videoUrl: string;
  storageProvider: 'supabase' | 'local';
  storagePath: string;
  durationSeconds: number;
  roundNumber: number;
  partnerStyle?: string;
  intensity?: string;
  session_id?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'uploaded_videos.json');

// Ensure local persistence directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read local JSON file database
function readLocalDatabase(): UploadedVideoRecord[] {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    // Seed with initial demo videos if file doesn't exist yet
    const initialSeed: UploadedVideoRecord[] = [
      {
        id: 'vid_seed_01',
        fighterId: 'f1',
        fileName: 'sparring_rd1_technical_flow.mp4',
        fileSizeBytes: 14529000,
        mimeType: 'video/mp4',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        storageProvider: 'local',
        storagePath: 'sample/oceans.mp4',
        durationSeconds: 30,
        roundNumber: 1,
        partnerStyle: 'Southpaw Pressure Boxer',
        intensity: 'Championship Hard',
        uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'vid_seed_02',
        fighterId: 'f1',
        fileName: 'cage_wrestling_wall_work.mp4',
        fileSizeBytes: 9840000,
        mimeType: 'video/mp4',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        storageProvider: 'local',
        storagePath: 'sample/flower.mp4',
        durationSeconds: 15,
        roundNumber: 2,
        partnerStyle: 'Dagestani Chain Wrestler',
        intensity: 'Situational / Wall',
        uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2), 'utf8');
      return initialSeed;
    } catch (e) {
      return initialSeed;
    }
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as UploadedVideoRecord[];
  } catch (err) {
    console.warn('[Video DB] Error reading local database file, using empty state:', err);
    return [];
  }
}

// Write local JSON file database
function writeLocalDatabase(records: UploadedVideoRecord[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), 'utf8');
    console.log(`[Video DB: Local File] Successfully committed ${records.length} video records to ${DB_FILE}`);
  } catch (err: any) {
    console.error('[Video DB: Local File Error] Failed to write database file:', err?.message);
  }
}

/**
 * Save an uploaded video record to the database (Supabase + Local Disk Backup)
 */
export async function saveUploadedVideo(video: UploadedVideoRecord): Promise<{
  success: boolean;
  persistedToSupabase: boolean;
  video: UploadedVideoRecord;
}> {
  console.log('[Video DB: Save] Inserting new video record into database:', {
    id: video.id,
    fileName: video.fileName,
    fighterId: video.fighterId,
    fileSizeMB: (video.fileSizeBytes / (1024 * 1024)).toFixed(2),
    storageProvider: video.storageProvider,
    videoUrl: video.videoUrl,
  });

  // 1. Always commit to local persistent JSON file
  const localList = readLocalDatabase();
  const filtered = localList.filter((v) => v.id !== video.id);
  const updatedList = [video, ...filtered];
  writeLocalDatabase(updatedList);

  // 2. Persist to Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      console.log('[Video DB: Supabase] Upserting row into "uploaded_videos"...');
      const { error } = await client.from('uploaded_videos').upsert({
        id: video.id,
        fighter_id: video.fighterId,
        file_name: video.fileName,
        file_size_bytes: video.fileSizeBytes,
        mime_type: video.mimeType,
        video_url: video.videoUrl,
        storage_provider: video.storageProvider,
        storage_path: video.storagePath,
        duration_seconds: video.durationSeconds,
        round_number: video.roundNumber,
        partner_style: video.partnerStyle,
        intensity: video.intensity,
        session_id: video.session_id,
        thumbnail_url: video.thumbnailUrl,
        uploaded_at: video.uploadedAt,
      });

      if (!error) {
        console.log('[Video DB: Supabase] Row inserted successfully into Supabase "uploaded_videos".');
        return { success: true, persistedToSupabase: true, video };
      } else {
        console.warn('[Video DB: Supabase] Upsert notice (cached locally):', error.message);
      }
    } catch (err: any) {
      console.warn('[Video DB: Supabase] Caught error syncing to remote table:', err?.message);
    }
  }

  return { success: true, persistedToSupabase: false, video };
}

/**
 * Retrieve uploaded videos, optionally filtered by fighterId
 */
export async function getUploadedVideos(fighterId?: string): Promise<UploadedVideoRecord[]> {
  console.log('[Video DB: Retrieve] Querying uploaded videos for fighterId:', fighterId || 'All');

  // Try Supabase first if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('uploaded_videos').select('*').order('uploaded_at', { ascending: false });
      if (fighterId) {
        query = query.eq('fighter_id', fighterId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        console.log(`[Video DB: Supabase] Found ${data.length} records in remote database.`);
        return data.map((row: any) => ({
          id: row.id,
          fighterId: row.fighter_id,
          fileName: row.file_name,
          fileSizeBytes: row.file_size_bytes,
          mimeType: row.mime_type,
          videoUrl: row.video_url,
          storageProvider: row.storage_provider || 'supabase',
          storagePath: row.storage_path,
          durationSeconds: row.duration_seconds || 30,
          roundNumber: row.round_number || 1,
          partnerStyle: row.partner_style,
          intensity: row.intensity,
          session_id: row.session_id,
          thumbnailUrl: row.thumbnail_url,
          uploadedAt: row.uploaded_at,
        }));
      }
    } catch (e) {
      // Fallback to local store
    }
  }

  // Fallback to local database
  const localList = readLocalDatabase();
  const results = fighterId ? localList.filter((v) => v.fighterId === fighterId) : localList;
  console.log(`[Video DB: Local] Returning ${results.length} records from local database.`);
  return results;
}

/**
 * Retrieve a single uploaded video by ID
 */
export async function getUploadedVideoById(id: string): Promise<UploadedVideoRecord | null> {
  const all = await getUploadedVideos();
  return all.find((v) => v.id === id) || null;
}

/**
 * Delete a video record and remove from disk/Supabase
 */
export async function deleteUploadedVideo(id: string): Promise<boolean> {
  console.log('[Video DB: Delete] Deleting video record with id:', id);

  const localList = readLocalDatabase();
  const target = localList.find((v) => v.id === id);

  // If local file exists, remove from disk
  if (target && target.storageProvider === 'local' && target.videoUrl.startsWith('/uploads/videos/')) {
    const localFilePath = path.join(process.cwd(), 'public', target.videoUrl);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log('[Video DB: Delete] Deleted local video file from disk:', localFilePath);
      } catch (e) {}
    }
  }

  // Remove from local database file
  const updatedList = localList.filter((v) => v.id !== id);
  writeLocalDatabase(updatedList);

  // Remove from Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('uploaded_videos').delete().eq('id', id);
    } catch (e) {}
  }

  return true;
}
