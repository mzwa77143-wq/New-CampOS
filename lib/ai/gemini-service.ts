import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { 
  SparringUploadMetadata, 
  SparringAnalysisResponse,
  TacticalSequence,
  BiomechanicalMetric,
  AgenticInsight,
  ActionItem,
  BiomechanicalFlaw,
  KeyMoment,
  PrescribedDrill
} from '@/types/sparring-analysis';
import { generateAiSparringFeedback } from './sparring-analyzer';

// Cascade through verified Gemini models: prioritizes gemini-3.6-flash
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export interface VideoFrameInput {
  timestampSeconds: number;
  base64: string;
}

export interface SparringChunkContext {
  chunkIndex: number;
  totalChunks: number;
  chunkStartSeconds: number;
  chunkEndSeconds: number;
  fullVideoDurationSeconds: number;
}

export async function analyzeSparringWithGemini(
  metadata: SparringUploadMetadata,
  actualDurationSeconds: number = 30,
  framesBase64?: Array<string | VideoFrameInput>,
  chunkContext?: SparringChunkContext
): Promise<SparringAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  const normalizedFrames: VideoFrameInput[] = (framesBase64 || []).map((f, idx) => {
    if (typeof f === 'string') {
      const step = actualDurationSeconds / Math.max(1, framesBase64?.length || 1);
      return {
        timestampSeconds: parseFloat((step * idx).toFixed(1)),
        base64: f,
      };
    }
    return f;
  });

  const isChunked = Boolean(chunkContext);
  const timeOffsetMs = chunkContext ? Math.round(chunkContext.chunkStartSeconds * 1000) : 0;
  const masterDurationSec = chunkContext ? chunkContext.fullVideoDurationSeconds : actualDurationSeconds;
  const masterDurationMs = masterDurationSec * 1000;

  console.log('[Gemini Service] Initializing sparring video analysis:', {
    fighterId: metadata.fighterId,
    round: metadata.roundNumber,
    durationSeconds: actualDurationSeconds,
    isChunked,
    chunkIndex: chunkContext?.chunkIndex,
    totalChunks: chunkContext?.totalChunks,
    chunkWindow: chunkContext ? `${chunkContext.chunkStartSeconds}s - ${chunkContext.chunkEndSeconds}s` : 'full',
    temporalFramesCount: normalizedFrames.length,
    timestamps: normalizedFrames.map((f) => `${f.timestampSeconds}s`),
    apiKeyConfigured: Boolean(apiKey),
  });

  // Google AI Studio API keys start with "AIzaSy...". Keys starting with "AQ." are internal OAuth tokens
  if (!apiKey || apiKey.startsWith('AQ.')) {
    if (apiKey?.startsWith('AQ.')) {
      console.warn('[Gemini Service] GEMINI_API_KEY in .env.local begins with "AQ." (OAuth access token). Google Generative Language API expects a Google AI Studio API key starting with "AIzaSy...". Delegating directly to CampOS Combat Engine.');
    } else {
      console.warn('[Gemini Service] GEMINI_API_KEY not configured. Falling back to CampOS Combat Engine.');
    }
    const fallback = generateAiSparringFeedback(metadata, actualDurationSeconds);
    console.log('[Gemini Service: Fallback] Combat engine generated response:', {
      score: fallback.overallScore,
      grade: fallback.grade,
      tacticalSequences: fallback.tacticalSequences.length,
      insights: fallback.insights.length,
    });
    return {
      ...fallback,
      source: 'CampOS Combat Engine (Built-in Biomechanics Fallback)',
    };
  }

  let fighterName = 'Alex Silva';
  if (metadata.fighterId === 'f2') fighterName = 'Sean Martinez';
  else if (metadata.fighterId === 'f3') fighterName = 'Valentina Santos';
  else if (metadata.fighterId === 'f4') fighterName = 'Justin Vance';

  const durationMs = actualDurationSeconds * 1000;

  const startMinSec = chunkContext
    ? `${Math.floor(chunkContext.chunkStartSeconds / 60)}:${Math.floor(chunkContext.chunkStartSeconds % 60).toString().padStart(2, '0')}`
    : '0:00';
  const endMinSec = chunkContext
    ? `${Math.floor(chunkContext.chunkEndSeconds / 60)}:${Math.floor(chunkContext.chunkEndSeconds % 60).toString().padStart(2, '0')}`
    : `${Math.floor(actualDurationSeconds / 60)}:${Math.floor(actualDurationSeconds % 60).toString().padStart(2, '0')}`;

  const promptText = isChunked
    ? `You are an elite UFC championship fight camp head coach, master corner strategist, and sports biomechanics scientist.
You are analyzing CHUNK ${chunkContext!.chunkIndex} of ${chunkContext!.totalChunks} of a complete sparring round:
- Fighter: ${fighterName}
- Camp Round: Round ${metadata.roundNumber || 1}
- Opponent Sparring Style: ${metadata.sparringPartnerStyle || 'Mixed Martial Artist'}
- Session Intensity: ${metadata.intensity}
- Full Round Duration: ${masterDurationSec} seconds (${masterDurationMs} ms)
- CURRENT SPLICED CHUNK WINDOW: ${startMinSec} to ${endMinSec} (${chunkContext!.chunkStartSeconds}s to ${chunkContext!.chunkEndSeconds}s)
- Current Chunk Duration: ${actualDurationSeconds} seconds (${durationMs} ms)
- Footage File: ${metadata.videoFileName || 'Sparring_Round.mp4'}

CRITICAL CHUNK INSTRUCTIONS:
1. You have been provided with chronological keyframe snapshots from this specific ${startMinSec} to ${endMinSec} window.
2. Analyze the combat action, strikes, biomechanics, footwork, and tactical decisions occurring in this window.
3. Every insight and tactical sequence timestamp MUST be in milliseconds relative to the start of this chunk (between 0 and ${durationMs} ms).
4. Provide 3 to 5 genuine, highly detailed insights for this specific window.
5. Provide 2 to 3 tactical sequences and 2 to 3 biomechanical joint metrics for this window.
6. Provide matching corrective action drills in 'actionItems'.
7. Return ONLY a valid JSON object matching the standard schema.`
    : `You are an elite UFC championship fight camp head coach, master corner strategist, and sports biomechanics scientist.
You are analyzing a complete sparring round on film:
- Fighter: ${fighterName}
- Camp Round: Round ${metadata.roundNumber || 1}
- Opponent Sparring Style: ${metadata.sparringPartnerStyle || 'Mixed Martial Artist'}
- Session Intensity: ${metadata.intensity}
- Full Round Duration: ${actualDurationSeconds} seconds (${durationMs} ms)
- Footage File: ${metadata.videoFileName || 'Sparring_Round.mp4'}

You have been provided with chronological keyframe snapshots captured across the entire ${actualDurationSeconds}-second round.
Analyze the round in full depth across its 3 chronological fight phases:
1. EARLY ROUND (Opening 0:00 to ~30% of round): Range calibration, stance posture, lead hand probing, distance management, and ring center control.
2. MID-ROUND (~30% to ~70% of round): Combination exchanges, pocket clashes, clinch pummeling/collar tie battles, fence pressure, and takedown defense.
3. LATE ROUND (~70% to end of round): Biomechanical fatigue degradation, guard discipline under exhaustion, chin elevation, linear escapes, and breath/pacing reset.

CRITICAL INSTRUCTIONS:
1. Generate between 6 to 10 comprehensive, genuine technical insights across all 3 phases (at least 2 for Early Round, at least 3 for Mid-Round, at least 2 for Late Round).
2. Every insight must cite its realistic observed timestamp in milliseconds ('timestampMs' and 'endTimestampMs') reflecting when it happened on the video timeline.
3. For EVERY identified flaw, create a dedicated 1-to-1 corrective camp homework drill in 'actionItems' with concrete sets, reps, and partner cues.
4. Provide 4 to 6 'tacticalSequences' documenting key combat exchanges from start to finish.
5. Provide 4 to 6 'biomechanicalMetrics' tracking joint angles (e.g. Lead Knee Valgus, Thoracic Flexion, Cervical Spine Angle, Lead Hip Rotation).
6. Return ONLY a valid JSON object matching this schema (do NOT wrap with markdown, return only raw JSON):`;

  const schemaExample = `{
  "overallScore": 86,
  "grade": "B+",
  "fightIqSummary": "4 sentence authoritative tactical breakdown of fighter's performance.",
  "stats": {
    "strikesLanded": 28,
    "strikesAbsorbed": 13,
    "strikeAccuracyPct": 68,
    "takedownDefensePct": 85,
    "cageControlSeconds": 17
  },
  "tacticalSequences": [
    {
      "startTimestampMs": 2000,
      "endTimestampMs": 6800,
      "sequenceName": "Level-Change Entry to Overhand Counter",
      "dominantDiscipline": "Striking",
      "initiator": "fighter",
      "positionalTransition": "Open Center -> Pocket Exchange -> Angle Pivot",
      "outcome": "Clean strike landed",
      "description": "Timed the partner's jab with a slip to the outside and heavy right cross entry."
    }
  ],
  "biomechanicalMetrics": [
    {
      "metricName": "Lead Knee Valgus Angle",
      "measuredValue": 14,
      "optimalRangeMin": 0,
      "optimalRangeMax": 8,
      "unit": "deg",
      "jointOrSegment": "Left Knee Joint",
      "status": "warning",
      "timestampMs": 3500,
      "notes": "Inward knee buckle upon planting lead foot"
    }
  ],
  "insights": [
    {
      "category": "biomechanical",
      "title": "Dropped Rear Guard on Lead Hook Recovery",
      "observation": "Right hand dropped to collarbone level while delivering lead hook, exposing chin to counter overhand.",
      "rootCause": "Lack of latissimus isometric tension to anchor rear guard during rotational hip drive.",
      "correction": "Anchor right thumb to zygomatic arch throughout full rotational trajectory and return.",
      "confidenceScore": 0.94,
      "timestampMs": 4200,
      "endTimestampMs": 7800,
      "severity": "critical",
      "impactMetric": "Chin exposed 22 degrees to counter cross corridor",
      "phase": "Early Round"
    }
  ],
  "actionItems": [
    {
      "title": "Tennis Ball Chin-Tuck Hook Drill",
      "priority": "high",
      "targetFlaw": "Dropped Rear Guard on Lead Hook Recovery",
      "prescribedDrill": "Wall-Anchored Lead Hooks with Tennis Ball Chin Clamp",
      "setsAndReps": "4 rounds x 3 minutes",
      "coachInstructions": "Fighter clamps tennis ball under right chin while throwing left hooks on heavy bag. Any drop immediately penalizes with 10 pushups."
    }
  ]
}`;

  const fullPrompt = `${promptText}\n${schemaExample}`;
  const promptParts: (string | Part)[] = [fullPrompt];

  // Include extracted chronological video frames across the entire round
  if (normalizedFrames.length > 0) {
    promptParts.push(`\n=== CHRONOLOGICAL SPARRING ROUND KEYFRAME SNAPSHOTS (${normalizedFrames.length} frames across ${actualDurationSeconds}s) ===\n`);
    normalizedFrames.forEach((frame, idx) => {
      const cleaned = frame.base64.replace(/^data:image\/\w+;base64,/, '');
      promptParts.push(`[Keyframe #${idx + 1}: ${frame.timestampSeconds}s elapsed of ${actualDurationSeconds}s round]`);
      promptParts.push({
        inlineData: {
          data: cleaned,
          mimeType: 'image/jpeg',
        },
      });
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[Gemini Service] Contacting model: "${modelName}" with ${normalizedFrames.length} full-video temporal frames...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptParts);
      const responseText = result.response.text();
      console.log(`[Gemini Service] Model "${modelName}" returned ${responseText.length} characters.`);

      if (responseText) {
        const cleaned = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        const sessionId = `gemini_${modelName}_${Date.now()}`;

        // Ensure every generated sequence, metric, and insight from Gemini has a unique session-scoped ID and offset timestamps
        const tacticalSequences: TacticalSequence[] = Array.isArray(parsed.tacticalSequences)
          ? parsed.tacticalSequences.map((seq: any, idx: number) => ({
              ...seq,
              id: `${sessionId}_seq_${idx + 1}`,
              startTimestampMs: (seq.startTimestampMs || 0) + timeOffsetMs,
              endTimestampMs: (seq.endTimestampMs || 3000) + timeOffsetMs,
            }))
          : [];

        const biomechanicalMetrics: BiomechanicalMetric[] = Array.isArray(parsed.biomechanicalMetrics)
          ? parsed.biomechanicalMetrics.map((bm: any, idx: number) => ({
              ...bm,
              id: `${sessionId}_bm_${idx + 1}`,
              timestampMs: (bm.timestampMs || 0) + timeOffsetMs,
            }))
          : [];

        const insights: AgenticInsight[] = Array.isArray(parsed.insights)
          ? parsed.insights.map((ins: any, idx: number) => {
              const localTs = typeof ins.timestampMs === 'number' ? ins.timestampMs : (idx + 1) * 3500;
              const masterTs = localTs + timeOffsetMs;
              const ratio = masterTs / masterDurationMs;
              const calculatedPhase = ratio < 0.33 ? 'Early Round' : ratio < 0.67 ? 'Mid-Round' : 'Late Round';
              return {
                ...ins,
                id: `${sessionId}_ins_${idx + 1}`,
                timestampMs: masterTs,
                endTimestampMs: (ins.endTimestampMs ? ins.endTimestampMs : localTs + 3000) + timeOffsetMs,
                phase: ins.phase || calculatedPhase,
              };
            })
          : [];

        const actionItems: ActionItem[] = Array.isArray(parsed.actionItems)
          ? parsed.actionItems.map((act: any, idx: number) => ({
              ...act,
              id: `${sessionId}_act_${idx + 1}`,
            }))
          : [];

        // Direct pass-through of Gemini's live insights into UI flaw models
        const flaws: BiomechanicalFlaw[] = insights.map((ins) => ({
          id: ins.id,
          timestampSeconds: parseFloat((ins.timestampMs / 1000).toFixed(1)),
          title: ins.title,
          severity: ins.severity || 'warning',
          observation: ins.observation,
          correction: ins.correction,
          jointAngleImpact: ins.impactMetric,
          phase: ins.phase,
        }));

        const keyMoments: KeyMoment[] = tacticalSequences.map((seq) => ({
          id: seq.id,
          timestampSeconds: parseFloat((seq.startTimestampMs / 1000).toFixed(1)),
          type: 'positive',
          title: seq.sequenceName,
          description: seq.description || seq.outcome,
          tag: seq.dominantDiscipline || 'Tactics',
        }));

        const prescribedDrills: PrescribedDrill[] = actionItems.map((act) => ({
          id: act.id,
          title: act.prescribedDrill || act.title,
          setsAndReps: act.setsAndReps,
          targetIssue: act.targetFlaw,
          coachInstructions: act.coachInstructions,
        }));

        return {
          sessionId,
          fighterId: metadata.fighterId || 'f1',
          fighterName,
          roundNumber: metadata.roundNumber || 1,
          roundDurationMs: isChunked ? masterDurationMs : durationMs,
          analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 88,
          grade: parsed.grade || 'B+',
          fightIqSummary: parsed.fightIqSummary || `${fighterName} showcased high-level distance control and combinations.`,
          stats: parsed.stats || {
            strikesLanded: 30,
            strikesAbsorbed: 12,
            strikeAccuracyPct: 71,
            takedownDefensePct: 88,
            cageControlSeconds: 16,
          },
          tacticalSequences,
          biomechanicalMetrics,
          insights,
          actionItems,
          flaws,
          keyMoments,
          prescribedDrills,
          source: `Gemini (${modelName})`,
        };
      }
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} call error:`, err.message);
    }
  }

  // Graceful fallback
  return {
    ...generateAiSparringFeedback(metadata, actualDurationSeconds),
    source: 'CampOS Combat Engine (Offline Fallback)',
  };
}
