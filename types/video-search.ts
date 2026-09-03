export type Discipline = 'Grappling' | 'Striking' | 'Ground' | 'Clinch';
export type Stance = 'Orthodox' | 'Southpaw' | 'Switch';

export interface CheckpointItem {
  label: string;
  status: 'optimal' | 'warning' | 'critical';
  note: string;
}

export interface PhaseTimestamp {
  name: string;
  timestamp: number;
}

export interface BiomechanicalTelemetry {
  leadKneeFlexionDeg: number;
  hipExtensionDeg: number;
  postureAngleDeg: number;
  shoulderAbductionDeg: number;
  angularVelocityDegPerSec: number;
  centerOfMassHeightPct: number;
  checkpoints: CheckpointItem[];
  injuryRiskAssessment: string;
  keyPhases?: PhaseTimestamp[];
}

export interface TechniqueMatchCard {
  id: string;
  videoId: string;
  videoUrl: string;
  thumbnailUrl: string;
  techniqueName: string;
  discipline: Discipline;
  stance: Stance;
  movementType: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  similarityScore: number; // 0 to 1 (cosine similarity)
  confidenceScore: number; // 0 to 1
  fighterNames: string[];
  eventTitle: string;
  description: string;
  biomechanicalData: BiomechanicalTelemetry;
  tags: string[];
  vectorEmbedding?: number[];
}

export interface SearchRequest {
  query_text: string;
  discipline?: Discipline | 'All';
  movement_type?: string;
  stance?: Stance | 'All';
  min_confidence?: number;
  max_posture_angle?: number;
  min_knee_flexion?: number;
  limit?: number;
}

export interface SearchResponse {
  results: TechniqueMatchCard[];
  total_matches: number;
  latency_ms: number;
  fallback_applied: boolean;
  fallback_reason?: string;
  applied_filters?: {
    discipline?: string;
    movement_type?: string;
    min_confidence?: number;
    max_posture_angle?: number;
  };
}

export interface FilterTaxonomy {
  disciplines: string[];
  movementTypes: string[];
  stances: string[];
  techniqueNames: string[];
  biomechanicalRanges: {
    postureAngle: { min: number; max: number };
    kneeFlexion: { min: number; max: number };
    hipExtension: { min: number; max: number };
  };
}
