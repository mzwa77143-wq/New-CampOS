import { createClient } from '@supabase/supabase-js';
import { SparringAnalysisResponse, AgenticInsight, TacticalSequence } from '@/types/sparring-analysis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// In-memory / local-first fallback store for sessions when Supabase is not configured
const inMemorySparringStore: Map<string, SparringAnalysisResponse> = new Map();

// Returns Supabase client if configured, otherwise null for local-first mode
export const getSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      console.log('[Supabase Service] Initialized remote Supabase client for URL:', supabaseUrl.substring(0, 20) + '...');
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('[Supabase Service] Supabase initialization failed, falling back to local-first mode', err);
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
  inMemorySparringStore.set(session.sessionId, session);

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
    // 1. Insert session header
    console.log('[Supabase Service: Persist] Executing upsert on table "sparring_sessions"...');
    const { error: sessionError } = await client
      .from('sparring_sessions')
      .upsert({
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

    if (sessionError) {
      console.warn('[Supabase Service: Persist] Notice from "sparring_sessions":', sessionError.message, '(session safely preserved in local store)');
      return { success: true, persistedToSupabase: false, sessionId: session.sessionId };
    }

    // 2. Insert relational insights
    if (session.insights && session.insights.length > 0) {
      console.log(`[Supabase Service: Persist] Upserting ${session.insights.length} rows to "sparring_insights"...`);
      const insightRows = session.insights.map((ins) => ({
        id: ins.id,
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

      await client.from('sparring_insights').upsert(insightRows);
    }

    // 3. Insert tactical sequences
    if (session.tacticalSequences && session.tacticalSequences.length > 0) {
      console.log(`[Supabase Service: Persist] Upserting ${session.tacticalSequences.length} rows to "sparring_sequences"...`);
      const sequenceRows = session.tacticalSequences.map((seq) => ({
        id: seq.id,
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

      await client.from('sparring_sequences').upsert(sequenceRows);
    }

    console.log('[Supabase Service: Persist] Relational session and events committed successfully to Supabase.');
    return {
      success: true,
      persistedToSupabase: true,
      sessionId: session.sessionId,
    };
  } catch (err: any) {
    console.warn('[Supabase Service: Persist] Caught error (using local-first fallback):', err.message);
    return {
      success: true,
      persistedToSupabase: false,
      sessionId: session.sessionId,
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
      if (!error && data && data.length > 0) {
        console.log(`[Supabase Service: Retrieve] Found ${data.length} sessions in Supabase.`);
        return data as any[];
      }
    } catch (e) {
      // Fallback to in-memory store
    }
  }

  const all = Array.from(inMemorySparringStore.values());
  const filtered = fighterId ? all.filter((s) => s.fighterId === fighterId) : all;
  console.log(`[Supabase Service: Retrieve] Returning ${filtered.length} sessions from local-first memory store.`);
  return filtered;
}
