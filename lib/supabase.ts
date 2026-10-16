import { createClient } from '@supabase/supabase-js';
import { SparringAnalysisResponse, AgenticInsight, TacticalSequence } from '@/types/sparring-analysis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// In-memory / local-first fallback store for sessions with bounded capacity (S12)
const inMemorySparringStore: Map<string, SparringAnalysisResponse> = new Map();
const MAX_SESSIONS_STORE_CAP = 100;

function cacheSessionLocally(session: SparringAnalysisResponse): void {
  if (inMemorySparringStore.size >= MAX_SESSIONS_STORE_CAP) {
    const oldestKey = inMemorySparringStore.keys().next().value;
    if (oldestKey) inMemorySparringStore.delete(oldestKey);
  }
  inMemorySparringStore.set(session.sessionId, session);
}

// Singleton client to prevent connection leaks & timer loops in Node.js server environment
let cachedClient: any = null;

// Returns Supabase client if configured, otherwise null for local-first mode
export const getSupabaseClient = () => {
  if (cachedClient) return cachedClient;

  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
    try {
      const isServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.log('[Supabase Service] Initialized remote Supabase client for URL:', supabaseUrl.substring(0, 20) + '...', isServiceRole ? '(Service Role)' : '(Anon)');
      cachedClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      return cachedClient;
    } catch (err: any) {
      console.warn('[Supabase Service] Supabase initialization failed, falling back to local-first mode:', err?.message);
      return null;
    }
  }
  return null;
};

/**
 * Persist a completed sparring analysis session and its relational events/insights
 */
export async function persistSparringSession(session: SparringAnalysisResponse): Promise<{
  success: boolean;
  persistedToSupabase: boolean;
  sessionId: string;
  error?: string;
}> {
  console.log('[Supabase Service: Persist] Saving session:', {
    sessionId: session.sessionId,
    fighterId: session.fighterId,
    overallScore: session.overallScore,
    grade: session.grade,
    insightsCount: session.insights?.length || 0,
    sequencesCount: session.tacticalSequences?.length || 0,
  });

  // Always cache in-memory for instant retrieval and offline resilience
  cacheSessionLocally(session);

  const client = getSupabaseClient();
  if (!client) {
    console.log('[Supabase Service: Persist] Remote Supabase unconfigured. Session cached in local-first memory store (total cached:', inMemorySparringStore.size, ')');
    return {
      success: true,
      persistedToSupabase: false,
      sessionId: session.sessionId,
    };
  }

  try {
    // 1. Insert session header with 15-second timeout safeguard
    console.log('[Supabase Service: Persist] Executing insert on table "sparring_sessions"...');
    const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out after 15000ms')), 15000)
    );

    const insertSessionPromise = client
      .from('sparring_sessions')
      .insert({
        id: session.sessionId,
        fighter_id: session.fighterId,
        fighter_name: session.fighterName,
        round_number: session.roundNumber,
        round_duration_ms: session.roundDurationMs,
        overall_score: session.overallScore,
        grade: session.grade,
        fight_iq_summary: session.fightIqSummary,
        stats: session.stats,
        analyzed_at: session.analyzedAt,
        source: session.source,
      });

    const { error: sessionError } = (await Promise.race([insertSessionPromise, timeoutPromise])) as any;

    if (sessionError) {
      console.warn('[Supabase Service: Persist] Notice from "sparring_sessions":', sessionError.message, '(session safely preserved in local store)');
      return { 
        success: false, 
        persistedToSupabase: false, 
        sessionId: session.sessionId, 
        error: sessionError.message 
      };
    }

    let hasRelationalError = false;

    // 2. Insert relational insights
    if (session.insights && session.insights.length > 0) {
      console.log(`[Supabase Service: Persist] Inserting ${session.insights.length} rows to "sparring_insights"...`);
      const insightRows = session.insights.map((ins, idx) => ({
        id: ins.id?.includes(session.sessionId) ? ins.id : `${session.sessionId}_ins_${idx + 1}`,
        session_id: session.sessionId,
        category: ins.category,
        title: ins.title,
        observation: ins.observation,
        root_cause: ins.rootCause,
        correction: ins.correction,
        timestamp_ms: ins.timestampMs,
        end_timestamp_ms: ins.endTimestampMs,
        severity: ins.severity,
        confidence_score: ins.confidenceScore,
      }));

      const { error: insErr } = await client.from('sparring_insights').insert(insightRows);
      if (insErr) {
        console.warn('[Supabase Service: Persist] Insights insert notice:', insErr.message);
        hasRelationalError = true;
      }
    }

    // 3. Insert tactical sequences
    if (session.tacticalSequences && session.tacticalSequences.length > 0) {
      console.log(`[Supabase Service: Persist] Inserting ${session.tacticalSequences.length} rows to "sparring_sequences"...`);
      const sequenceRows = session.tacticalSequences.map((seq, idx) => ({
        id: seq.id?.includes(session.sessionId) ? seq.id : `${session.sessionId}_seq_${idx + 1}`,
        session_id: session.sessionId,
        sequence_name: seq.sequenceName,
        start_timestamp_ms: seq.startTimestampMs,
        end_timestamp_ms: seq.endTimestampMs,
        dominant_discipline: seq.dominantDiscipline,
        initiator: seq.initiator,
        positional_transition: seq.positionalTransition,
        outcome: seq.outcome,
        description: seq.description,
      }));

      const { error: seqErr } = await client.from('sparring_sequences').insert(sequenceRows);
      if (seqErr) {
        console.warn('[Supabase Service: Persist] Sequences insert notice:', seqErr.message);
        hasRelationalError = true;
      }
    }

    console.log('[Supabase Service: Persist] Relational session and events committed successfully to Supabase.');
    return {
      success: true,
      persistedToSupabase: !hasRelationalError,
      sessionId: session.sessionId,
    };
  } catch (err: any) {
    console.warn('[Supabase Service: Persist] Caught error (using local-first fallback):', err?.message);
    return {
      success: false,
      persistedToSupabase: false,
      sessionId: session.sessionId,
      error: err?.message,
    };
  }
}

/**
 * Retrieve sparring sessions for a given fighter (or all fighters)
 */
export async function getSparringSessions(fighterId?: string): Promise<SparringAnalysisResponse[]> {
  console.log('[Supabase Service: Retrieve] Fetching sessions for fighterId:', fighterId || 'All');
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('sparring_sessions').select('*').order('created_at', { ascending: false });
      if (fighterId) {
        query = query.eq('fighter_id', fighterId);
      }
      const { data, error } = await query;
      // Branch on error, not data.length (S5), and map snake_case to camelCase explicitly (S6)
      if (!error && Array.isArray(data)) {
        console.log(`[Supabase Service: Retrieve] Found ${data.length} sessions in Supabase.`);
        return data.map((row: any): SparringAnalysisResponse => ({
          sessionId: row.id,
          fighterId: row.fighter_id,
          fighterName: row.fighter_name || 'Fighter',
          roundNumber: row.round_number || 1,
          roundDurationMs: row.round_duration_ms || 30000,
          analyzedAt: row.analyzed_at || new Date().toLocaleTimeString(),
          overallScore: row.overall_score || 80,
          grade: row.grade || 'B+',
          fightIqSummary: row.fight_iq_summary || '',
          stats: row.stats || {
            strikesLanded: 0,
            strikesAbsorbed: 0,
            strikeAccuracyPct: 0,
            takedownDefensePct: 0,
            cageControlSeconds: 0,
          },
          tacticalSequences: [],
          biomechanicalMetrics: [],
          insights: [],
          actionItems: [],
          flaws: [],
          keyMoments: [],
          prescribedDrills: [],
          source: row.source,
          persistedToSupabase: true,
        }));
      }
    } catch (e: any) {
      console.warn('[Supabase Service: Retrieve] Notice fetching from Supabase, falling back to local-first cache:', e?.message);
    }
  }

  const all = Array.from(inMemorySparringStore.values());
  const filtered = fighterId ? all.filter((s) => s.fighterId === fighterId) : all;
  console.log(`[Supabase Service: Retrieve] Returning ${filtered.length} sessions from local-first memory store.`);
  return filtered;
}
