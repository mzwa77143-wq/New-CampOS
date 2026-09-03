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

// Cascade through models to prevent 503 high-demand spikes
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

export async function analyzeSparringWithGemini(
  metadata: SparringUploadMetadata,
  actualDurationSeconds: number = 30,
  framesBase64?: string[]
): Promise<SparringAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured in environment or GitHub Secrets. Using local combat engine fallback.');
    return {
      ...generateAiSparringFeedback(metadata, actualDurationSeconds),
      source: 'CampOS Combat Engine (Offline Fallback)',
    };
  }

  let fighterName = 'Alex Silva';
  if (metadata.fighterId === 'f2') fighterName = 'Sean Martinez';
  else if (metadata.fighterId === 'f3') fighterName = 'Valentina Santos';
  else if (metadata.fighterId === 'f4') fighterName = 'Justin Vance';

  const durationMs = actualDurationSeconds * 1000;

  const promptText = `You are an elite UFC championship MMA fight camp coach and sports biomechanics expert.
Analyze this sparring round:
- Fighter: ${fighterName}
- Camp Round: Round ${metadata.roundNumber || 1}
- Sparring Partner Style: ${metadata.sparringPartnerStyle || 'Mixed Martial Artist'}
- Session Intensity: ${metadata.intensity}
- Round Duration: ${actualDurationSeconds} seconds (${durationMs} ms)
- Footage File: ${metadata.videoFileName || 'Sparring_Round.mp4'}

Evaluate the footage and provide an authoritative technical critique.
Return ONLY a valid JSON object matching this exact format:
{
  "overallScore": 89,
  "grade": "A-",
  "fightIqSummary": "3 sentence punchy tactical combat analysis of fighter's performance.",
  "stats": {
    "strikesLanded": 32,
    "strikesAbsorbed": 14,
    "strikeAccuracyPct": 69,
    "takedownDefensePct": 85,
    "cageControlSeconds": 18
  },
  "tacticalSequences": [
    {
      "id": "seq_1",
      "startTimestampMs": 3500,
      "endTimestampMs": 8200,
      "sequenceName": "Calf Kick & Angle Disengage",
      "dominantDiscipline": "Striking",
      "initiator": "fighter",
      "positionalTransition": "Open Space -> Pocket Exchange -> Angle Pivot",
      "outcome": "Clean strike landed",
      "description": "Timed lead foot placement with low kick and pivoted off centerline"
    }
  ],
  "biomechanicalMetrics": [
    {
      "id": "bm_1",
      "metricName": "Thoracic Spine Flexion",
      "measuredValue": 44,
      "optimalRangeMin": 15,
      "optimalRangeMax": 30,
      "unit": "deg",
      "jointOrSegment": "Thoracic Spine",
      "status": "warning",
      "timestampMs": 4500,
      "notes": "Forward overextension on jab"
    }
  ],
  "insights": [
    {
      "id": "ins_1",
      "category": "biomechanical",
      "title": "Dropped Rear Hand on Lead Hook",
      "observation": "Right hand dropped to collarbone level while delivering lead hook",
      "rootCause": "Absence of latissimus engagement to stabilize guard during torso rotation",
      "correction": "Glue right thumb to zygomatic arch throughout rotational hook recovery",
      "confidenceScore": 0.94,
      "timestampMs": 4500,
      "endTimestampMs": 7200,
      "severity": "critical",
      "impactMetric": "Guard dropped 25 degrees below protective line"
    },
    {
      "id": "ins_2",
      "category": "tactical",
      "title": "Linear Retreat into Fence Vulnerability",
      "observation": "Backed straight up into fence when partner blitzed with 1-2 combination",
      "rootCause": "Lack of 45-degree angle pivot off lead foot upon disengaging",
      "correction": "Step lead foot first on advance, pivot 45 degrees to exit partner power corridor",
      "confidenceScore": 0.91,
      "timestampMs": 14500,
      "endTimestampMs": 18200,
      "severity": "warning",
      "impactMetric": "Lost 8 feet of cage space in linear retreat"
    }
  ],
  "actionItems": [
    {
      "id": "action_1",
      "title": "Chin-Tuck Hook Repetitions",
      "priority": "high",
      "targetFlaw": "Dropped rear hand guard",
      "prescribedDrill": "Tennis Ball Chin-Tuck Hook Drill",
      "setsAndReps": "4 rounds x 3 minutes",
      "coachInstructions": "Hold tennis ball under right chin while delivering lead hooks on heavy bag"
    }
  ]
}`;

  const promptParts: (string | Part)[] = [promptText];

  // Include extracted video frames if provided
  if (framesBase64 && framesBase64.length > 0) {
    framesBase64.slice(0, 3).forEach((base64Data) => {
      const cleaned = base64Data.replace(/^data:image\/\w+;base64,/, '');
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleaned,
        },
      });
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptParts);
      const responseText = result.response.text();

      if (responseText) {
        const cleaned = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        const tacticalSequences: TacticalSequence[] = Array.isArray(parsed.tacticalSequences)
          ? parsed.tacticalSequences
          : [];

        const biomechanicalMetrics: BiomechanicalMetric[] = Array.isArray(parsed.biomechanicalMetrics)
          ? parsed.biomechanicalMetrics
          : [];

        const insights: AgenticInsight[] = Array.isArray(parsed.insights)
          ? parsed.insights
          : [];

        const actionItems: ActionItem[] = Array.isArray(parsed.actionItems)
          ? parsed.actionItems
          : [];

        // Legacy compatibility mappings
        const flaws: BiomechanicalFlaw[] = insights.map((ins, idx) => ({
          id: ins.id || `flaw_${idx + 1}`,
          timestampSeconds: parseFloat(((ins.timestampMs || 4000) / 1000).toFixed(1)),
          title: ins.title,
          severity: ins.severity || 'warning',
          observation: ins.observation,
          correction: ins.correction,
          jointAngleImpact: ins.impactMetric,
        }));

        const keyMoments: KeyMoment[] = tacticalSequences.map((seq, idx) => ({
          id: seq.id || `km_${idx + 1}`,
          timestampSeconds: parseFloat(((seq.startTimestampMs || 3000) / 1000).toFixed(1)),
          type: 'positive',
          title: seq.sequenceName,
          description: seq.description || seq.outcome,
          tag: seq.dominantDiscipline || 'Tactics',
        }));

        const prescribedDrills: PrescribedDrill[] = actionItems.map((act, idx) => ({
          id: act.id || `drill_${idx + 1}`,
          title: act.prescribedDrill || act.title,
          setsAndReps: act.setsAndReps,
          targetIssue: act.targetFlaw,
          coachInstructions: act.coachInstructions,
        }));

        return {
          sessionId: `gemini_${modelName}_${Date.now()}`,
          fighterId: metadata.fighterId || 'f1',
          fighterName,
          roundNumber: metadata.roundNumber || 1,
          roundDurationMs: durationMs,
          analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 88,
          grade: parsed.grade || 'A-',
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
