export type WeightUnit = 'lbs' | 'kg';

export type BodyPart = 
  | 'neck' 
  | 'shoulders' 
  | 'chest' 
  | 'upperBack' 
  | 'lowerBack' 
  | 'ribs' 
  | 'hands' 
  | 'wrists' 
  | 'hips' 
  | 'groin' 
  | 'hamstrings' 
  | 'quads' 
  | 'knees' 
  | 'shins' 
  | 'ankles';

export interface Fighter {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  pin: string; // 4-digit PIN e.g. "1234"
  weightClass: string; // e.g. "Light Heavyweight (205 lbs)", "Bantamweight (135 lbs)"
  divisionLimitLbs: number; // e.g. 205.0
  championshipWeight: boolean; // 0.5 lb allowance or championship exact
  walkoutWeightLbs: number; // e.g. 228.0
  currentWeightLbs: number; // latest morning weigh-in
  fightDate: string; // ISO date string e.g. "2026-09-26"
  opponent: string; // e.g. "Magomed Ankalaev"
  event: string; // e.g. "UFC 314"
  record: string; // e.g. "12-2-0 (9 KOs)"
  campWeeksTotal: number;
  campWeekCurrent: number;
  status: 'optimal' | 'warning' | 'critical';
  statusMessage?: string;
}

export interface CheckIn {
  id: string;
  fighterId: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  weightLbs: number;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5; // 1 to 5 stars
  sorenessLevel: number; // 1 to 10
  sorenessAreas: BodyPart[];
  restingHR?: number;
  mentalFocus: 1 | 2 | 3 | 4 | 5;
  rpeFatigue: number; // 1 to 10
  notes?: string;
  synced: boolean;
}

export interface HydrationLog {
  id: string;
  fighterId: string;
  date: string; // YYYY-MM-DD
  waterIntakeOz: number;
  targetWaterOz: number;
  electrolytesPackets: number;
  urineColorScale: 1 | 2 | 3 | 4 | 5; // 1 (clear/pale) to 5 (amber/dehydrated)
  lastUpdated: string;
  synced: boolean;
}

export type TrainingType = 
  | 'sparring' 
  | 'striking' 
  | 'wrestling_grappling' 
  | 'strength_conditioning' 
  | 'roadwork' 
  | 'recovery';

export interface TrainingRound {
  roundNumber: number;
  durationMinutes: number;
  completed: boolean;
  notes?: string;
}

export interface TrainingSession {
  id: string;
  fighterId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  title: string;
  type: TrainingType;
  durationMinutes: number;
  targetRounds?: number;
  rounds?: TrainingRound[];
  intensity: 'Low' | 'Moderate' | 'High' | 'Max Effort';
  targetRpe: number; // 1 to 10
  actualRpe?: number;
  coachNotes?: string;
  fighterNotes?: string;
  completed: boolean;
  completedAt?: string;
}

export interface WeightCutDataPoint {
  dayNumber: number;
  date: string;
  daysOut: number;
  targetWeightLbs: number;
  actualWeightLbs?: number;
  eveningWeightLbs?: number;
  dangerZoneThresholdLbs: number;
  isWaterCutPhase: boolean;
  notes?: string;
}

export interface CutProtocolDay {
  daysOut: number;
  date: string;
  phaseName: string;
  waterGoalGal: number; // e.g. 2.0, 1.0, 0.5, 0.25
  sodiumLevel: 'Normal' | 'High (Loading)' | 'Low' | 'Zero' | 'Re-hydration';
  carbsGrams: number;
  sweatMethod?: string; // e.g. "Sauna 3x15min" or "Bath with Epsom Salt"
  targetWeightLbs: number;
  coachCheckpoints: string[];
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  syncMode: 'local' | 'cloud' | 'syncing';
}
