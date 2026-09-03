import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { 
  SparringUploadMetadata, 
  AiSparringFeedback, 
} from '@/types/sparring-analysis';
import { generateAiSparringFeedback } from './sparring-analyzer';

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6I6i6BKYwMLhAyuWJ0a0pygEoedTyYfy6-DASP07f-SmQ';

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
): Promise<AiSparringFeedback> {
  const apiKey = process.env.GEMINI_API_KEY || DEFAULT_API_KEY;

  if (!apiKey) {
    console.warn('No Gemini API key available, using local combat engine fallback');
    return {
      ...generateAiSparringFeedback(metadata, actualDurationSeconds),
      source: 'CampOS Combat Engine (Offline Fallback)',
    };
  }

  let fighterName = 'Alex Silva';
  if (metadata.fighterId === 'f2') fighterName = 'Sean Martinez';
  else if (metadata.fighterId === 'f3') fighterName = 'Valentina Santos';
  else if (metadata.fighterId === 'f4') fighterName = 'Justin Vance';

  const promptText = `You are an elite UFC championship MMA fight camp coach and sports biomechanics expert.
Analyze this sparring round:
- Fighter: ${fighterName}
- Camp Round: Round ${metadata.roundNumber || 1}
- Sparring Partner Style: ${metadata.sparringPartnerStyle || 'Mixed Martial Artist'}
- Session Intensity: ${metadata.intensity}
- Round Duration: ${actualDurationSeconds} seconds
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
  "flaws": [
    {
      "id": "flaw_1",
      "timestampSeconds": 4.5,
      "title": "Short descriptive title of technical flaw",
      "severity": "critical",
      "observation": "What the fighter did incorrectly",
      "correction": "Exact biomechanical correction",
      "jointAngleImpact": "Specific degrees or biomechanical deviation"
    },
    {
      "id": "flaw_2",
      "timestampSeconds": 12.0,
      "title": "Second flaw title",
      "severity": "warning",
      "observation": "Observation",
      "correction": "Correction",
      "jointAngleImpact": "Impact"
    },
    {
      "id": "flaw_3",
      "timestampSeconds": 24.5,
      "title": "Third flaw title",
      "severity": "advisory",
      "observation": "Observation",
      "correction": "Correction",
      "jointAngleImpact": "Impact"
    }
  ],
  "keyMoments": [
    {
      "id": "km_1",
      "timestampSeconds": 3.2,
      "type": "positive",
      "title": "Calf Kick Timing on Stance Switch",
      "description": "Exchange description",
      "tag": "Striking IQ"
    },
    {
      "id": "km_2",
      "timestampSeconds": 15.0,
      "type": "positive",
      "title": "Cage Wrestling Reversal",
      "description": "Exchange description",
      "tag": "Cage Wrestling"
    },
    {
      "id": "km_3",
      "timestampSeconds": 28.0,
      "type": "negative",
      "title": "Counter Absorbed",
      "description": "Exchange description",
      "tag": "Defensive Lag"
    }
  ],
  "prescribedDrills": [
    {
      "id": "drill_1",
      "title": "Corrective Drill Name",
      "setsAndReps": "4 rounds x 3 minutes",
      "targetIssue": "What this fixes",
      "coachInstructions": "How to perform drill"
    },
    {
      "id": "drill_2",
      "title": "Second Corrective Drill",
      "setsAndReps": "5 sets x 10 reps",
      "targetIssue": "Target issue",
      "coachInstructions": "How to perform drill"
    },
    {
      "id": "drill_3",
      "title": "Third Corrective Drill",
      "setsAndReps": "3 rounds x 4 minutes",
      "targetIssue": "Target issue",
      "coachInstructions": "How to perform drill"
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
        return {
          sessionId: `gemini_${modelName}_${Date.now()}`,
          fighterName,
          roundNumber: metadata.roundNumber || 1,
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
          flaws: Array.isArray(parsed.flaws) ? parsed.flaws : [],
          keyMoments: Array.isArray(parsed.keyMoments) ? parsed.keyMoments : [],
          prescribedDrills: Array.isArray(parsed.prescribedDrills) ? parsed.prescribedDrills : [],
          source: `Gemini (${modelName})`,
        };
      }
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} call error:`, err.message);
      // continue to next model in CANDIDATE_MODELS
    }
  }

  // Graceful fallback
  return {
    ...generateAiSparringFeedback(metadata, actualDurationSeconds),
    source: 'CampOS Combat Engine (Offline Fallback)',
  };
}
