export interface SparringUploadMetadata {
  fighterId: string;
  roundNumber: number;
  roundDurationSeconds: number;
  sparringPartnerStyle: string;
  intensity: 'Light Technical' | 'Championship Hard' | 'Situational / Wall';
  userNotes?: string;
  videoFileName?: string;
}

export interface BiomechanicalFlaw {
  id: string;
  timestampSeconds: number;
  title: string;
  severity: 'critical' | 'warning' | 'advisory';
  observation: string;
  correction: string;
  jointAngleImpact?: string;
}

export interface KeyMoment {
  id: string;
  timestampSeconds: number;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  tag: string;
}

export interface PrescribedDrill {
  id: string;
  title: string;
  setsAndReps: string;
  targetIssue: string;
  coachInstructions: string;
}

export interface SessionStats {
  strikesLanded: number;
  strikesAbsorbed: number;
  strikeAccuracyPct: number;
  takedownDefensePct: number;
  cageControlSeconds: number;
}

export interface AiSparringFeedback {
  sessionId: string;
  fighterName: string;
  roundNumber: number;
  analyzedAt: string;
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C';
  fightIqSummary: string;
  stats: SessionStats;
  flaws: BiomechanicalFlaw[];
  keyMoments: KeyMoment[];
  prescribedDrills: PrescribedDrill[];
  source?: string; // e.g. "Gemini 3.6 Flash (Multimodal AI)"
}
