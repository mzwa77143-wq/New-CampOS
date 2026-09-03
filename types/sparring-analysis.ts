import { Discipline } from './video-search';

export interface SparringUploadMetadata {
  fighterId: string;
  roundNumber: number;
  roundDurationSeconds: number;
  sparringPartnerStyle: string;
  intensity: 'Light Technical' | 'Championship Hard' | 'Situational / Wall';
  userNotes?: string;
  videoFileName?: string;
  videoUrl?: string;
}

export interface TacticalSequence {
  id: string;
  startTimestampMs: number;
  endTimestampMs: number;
  sequenceName: string;
  dominantDiscipline: Discipline;
  initiator: 'fighter' | 'partner';
  positionalTransition: string; // e.g. "Clinch -> Underhook Pummel -> Mat Return"
  outcome: string;
  description: string;
}

export interface BiomechanicalMetric {
  id: string;
  metricName: string;
  measuredValue: number;
  optimalRangeMin: number;
  optimalRangeMax: number;
  unit: string; // "deg", "deg/s", "%", "ms"
  jointOrSegment: string; // e.g. "Thoracic Spine", "Lead Knee", "Pelvic Rotation"
  status: 'optimal' | 'warning' | 'critical';
  timestampMs: number;
  notes?: string;
}

export interface AgenticInsight {
  id: string;
  category: 'tactical' | 'biomechanical' | 'conditioning' | 'fight_iq';
  title: string;
  observation: string;
  rootCause: string;
  correction: string;
  confidenceScore: number;
  timestampMs: number;
  endTimestampMs?: number;
  severity: 'critical' | 'warning' | 'advisory';
  impactMetric?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  targetFlaw: string;
  prescribedDrill: string;
  setsAndReps: string;
  coachInstructions: string;
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

export interface SparringAnalysisResponse {
  sessionId: string;
  fighterId: string;
  fighterName: string;
  roundNumber: number;
  roundDurationMs: number;
  analyzedAt: string;
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C';
  fightIqSummary: string;
  stats: SessionStats;
  tacticalSequences: TacticalSequence[];
  biomechanicalMetrics: BiomechanicalMetric[];
  insights: AgenticInsight[];
  actionItems: ActionItem[];
  // Backwards compatible fields for legacy UI components
  flaws: BiomechanicalFlaw[];
  keyMoments: KeyMoment[];
  prescribedDrills: PrescribedDrill[];
  source?: string;
  persistedToSupabase?: boolean;
  qdrantIndexed?: boolean;
}

export type AiSparringFeedback = SparringAnalysisResponse;
