import { create } from 'zustand';
import { 
  Fighter, 
  CheckIn, 
  HydrationLog, 
  TrainingSession, 
  WeightCutDataPoint, 
  WeightUnit, 
  SyncStatus 
} from '../types/camp';
import { 
  INITIAL_FIGHTERS, 
  INITIAL_CHECKINS, 
  INITIAL_HYDRATION, 
  INITIAL_TRAINING_SESSIONS, 
  MOCK_WEIGHT_TRAJECTORY 
} from './mock-data';
import { AnalysisJob } from './ai/video-jobs';
import { getLocalDateString, calculateDaysOut } from './utils';

interface CampStoreState {
  currentRole: 'coach' | 'fighter' | 'analyzer';
  selectedFighterId: string;
  activeFighterId: string | null; // For fighter PIN login
  isPinAuthenticated: boolean;
  weightUnit: WeightUnit;
  fighters: Fighter[];
  checkIns: CheckIn[];
  hydrationLogs: HydrationLog[];
  trainingSessions: TrainingSession[];
  weightTrajectories: Record<string, WeightCutDataPoint[]>;
  syncStatus: SyncStatus;
  offlineQueue: Array<{ type: string; payload: any; timestamp: string }>;
  isCutSheetOpen: boolean;
  isWeighInModalOpen: boolean;
  isCheckInModalOpen: boolean;

  // Background Analysis Jobs state
  activeJobs: AnalysisJob[];
  completedJobs: AnalysisJob[];
  selectedCompletedJobId: string | null;

  // Setters & UI Actions
  setRole: (role: 'coach' | 'fighter' | 'analyzer') => void;
  setSelectedFighterId: (id: string) => void;
  authenticatePin: (pin: string, fighterId?: string) => boolean;
  logoutFighter: () => void;
  toggleWeightUnit: () => void;
  setCutSheetOpen: (open: boolean) => void;
  setWeighInModalOpen: (open: boolean) => void;
  setCheckInModalOpen: (open: boolean) => void;

  // Job Actions
  trackJob: (job: AnalysisJob) => void;
  updateJob: (jobId: string, updates: Partial<AnalysisJob>) => void;
  dismissJob: (jobId: string) => void;
  cancelJob: (jobId: string) => Promise<void>;
  setSelectedCompletedJobId: (jobId: string | null) => void;
  fetchActiveJobs: () => Promise<void>;

  // Data Actions
  submitDailyCheckIn: (data: {
    fighterId: string;
    weightLbs: number;
    sleepHours: number;
    sleepQuality: 1 | 2 | 3 | 4 | 5;
    sorenessLevel: number;
    sorenessAreas: any[];
    mentalFocus: 1 | 2 | 3 | 4 | 5;
    rpeFatigue: number;
    notes?: string;
  }) => void;

  logCoachWeighIn: (fighterId: string, weightLbs: number, isEvening?: boolean, notes?: string) => void;

  updateHydrationLog: (
    fighterId: string, 
    waterAddOz: number, 
    electrolytesAdd?: number, 
    urineScale?: 1 | 2 | 3 | 4 | 5
  ) => void;

  toggleWorkoutRound: (sessionId: string, roundNumber: number) => void;
  completeTrainingSession: (sessionId: string, actualRpe?: number, fighterNotes?: string) => void;
  addTrainingSession: (session: Omit<TrainingSession, 'id' | 'completed'>) => void;
  syncAiSparringDebrief: (
    fighterId: string,
    roundNumber: number,
    feedbackSummary: string,
    drills: string[]
  ) => void;

  // Sync actions
  broadcastStateChange: (eventType: string, data: any) => void;
  syncOfflineQueue: () => void;
  resetToDefaultData: () => void;
  rehydrateFromStorage: () => void;
}

const STORAGE_KEY = 'campos_state_v1';
let syncChannel: BroadcastChannel | null = null;

// Helper to broadcast changes across open tabs/windows
const sendBroadcast = (type: string, payload: any) => {
  if (typeof window !== 'undefined') {
    try {
      if (!syncChannel && typeof BroadcastChannel !== 'undefined') {
        syncChannel = new BroadcastChannel('campos_realtime_sync');
      }
      syncChannel?.postMessage({ type, payload, timestamp: new Date().toISOString() });
    } catch (e: any) {
      console.warn('[Sync] BroadcastChannel post message notice:', e?.message);
    }
  }
};

// PIN lockout tracking: 5 failed attempts locks fighter out for 60 seconds (B5)
const failedPinAttempts: Record<string, { count: number; lockedUntil: number }> = {};

export function getPinLockoutRemainingSeconds(fighterId: string): number {
  const attempt = failedPinAttempts[fighterId];
  if (!attempt || !attempt.lockedUntil) return 0;
  const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function resetPinLockout(fighterId: string): void {
  delete failedPinAttempts[fighterId];
}

// Explicit sync initializer (N6: moved out of store initializer)
let syncInitialized = false;
export function initRealtimeSync(): void {
  if (typeof window === 'undefined' || syncInitialized) return;
  syncInitialized = true;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel('campos_realtime_sync');
      syncChannel.onmessage = (event) => {
        const { type } = event.data;
        if (type === 'STATE_UPDATED') {
          const fresh = loadInitialState();
          if (fresh) {
            useCampStore.setState((state) => ({
              ...state,
              fighters: fresh.fighters || state.fighters,
              checkIns: fresh.checkIns || state.checkIns,
              hydrationLogs: fresh.hydrationLogs || state.hydrationLogs,
              trainingSessions: fresh.trainingSessions || state.trainingSessions,
              weightTrajectories: fresh.weightTrajectories || state.weightTrajectories,
              syncStatus: {
                ...state.syncStatus,
                lastSyncedAt: new Date().toLocaleTimeString(),
              },
            }));
          }
        }
      };
    }
  } catch (e: any) {
    console.warn('[Sync] Realtime sync initialization notice:', e?.message);
  }
}

// Safe localStorage loader
const loadInitialState = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e: any) {
    console.warn('Failed to parse cached CampOS state, using mock defaults:', e?.message);
  }
  return null;
};

export const useCampStore = create<CampStoreState>((set, get) => {
  const cached = loadInitialState();

  const persist = (partial: Partial<CampStoreState>) => {
    if (typeof window !== 'undefined') {
      try {
        const current = {
          fighters: get().fighters,
          checkIns: get().checkIns,
          hydrationLogs: get().hydrationLogs,
          trainingSessions: get().trainingSessions,
          weightTrajectories: get().weightTrajectories,
          weightUnit: get().weightUnit,
          ...partial,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        sendBroadcast('STATE_UPDATED', {});
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }
  };

  return {
    currentRole: 'coach',
    selectedFighterId: 'f1',
    activeFighterId: null,
    isPinAuthenticated: false,
    weightUnit: 'lbs',
    fighters: INITIAL_FIGHTERS,
    checkIns: INITIAL_CHECKINS,
    hydrationLogs: INITIAL_HYDRATION,
    trainingSessions: INITIAL_TRAINING_SESSIONS,
    weightTrajectories: MOCK_WEIGHT_TRAJECTORY,
    syncStatus: {
      isOnline: typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
      lastSyncedAt: 'Just now',
      pendingCount: 0,
      syncMode: 'local',
    },
    offlineQueue: [],
    isCutSheetOpen: false,
    isWeighInModalOpen: false,
    isCheckInModalOpen: false,

    // Background Analysis Jobs initial state
    activeJobs: [],
    completedJobs: [],
    selectedCompletedJobId: null,

    setRole: (role) => set({ currentRole: role }),
    setSelectedFighterId: (id) => set({ selectedFighterId: id }),

    authenticatePin: (pin: string, fighterId?: string) => {
      const targetId = fighterId || get().selectedFighterId;
      const attempt = failedPinAttempts[targetId] || { count: 0, lockedUntil: 0 };

      // B5: Lockout check
      if (Date.now() < attempt.lockedUntil) {
        console.warn(`[Auth: PIN] Fighter ${targetId} is locked out for ${Math.ceil((attempt.lockedUntil - Date.now()) / 1000)}s.`);
        return false;
      }

      const fighter = get().fighters.find((f) => f.id === targetId);

      // B5: Strict PIN authentication without universal 1234 backdoor
      if (fighter && fighter.pin === pin) {
        delete failedPinAttempts[targetId];
        set({
          isPinAuthenticated: true,
          activeFighterId: targetId,
          selectedFighterId: targetId,
        });
        return true;
      }

      // Record failed attempt
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockedUntil = Date.now() + 60000; // 60-second lockout
        console.warn(`[Auth: PIN Lockout] Fighter ${targetId} locked out for 60 seconds after 5 failed attempts.`);
      }
      failedPinAttempts[targetId] = attempt;
      return false;
    },

    logoutFighter: () => {
      set({ isPinAuthenticated: false, activeFighterId: null });
    },

    toggleWeightUnit: () => {
      const nextUnit: WeightUnit = get().weightUnit === 'lbs' ? 'kg' : 'lbs';
      set({ weightUnit: nextUnit });
      persist({ weightUnit: nextUnit });
    },

    setCutSheetOpen: (open) => set({ isCutSheetOpen: open }),
    setWeighInModalOpen: (open) => set({ isWeighInModalOpen: open }),
    setCheckInModalOpen: (open) => set({ isCheckInModalOpen: open }),

    submitDailyCheckIn: (data) => {
      const today = getLocalDateString();
      const newCheckIn: CheckIn = {
        id: `ci_${Date.now()}`,
        fighterId: data.fighterId,
        timestamp: new Date().toISOString(),
        date: today,
        weightLbs: data.weightLbs,
        sleepHours: data.sleepHours,
        sleepQuality: data.sleepQuality,
        sorenessLevel: data.sorenessLevel,
        sorenessAreas: data.sorenessAreas,
        mentalFocus: data.mentalFocus,
        rpeFatigue: data.rpeFatigue,
        notes: data.notes,
        synced: true,
      };

      // Update Fighter current weight and status
      const updatedFighters = get().fighters.map((f) => {
        if (f.id === data.fighterId) {
          let status: 'optimal' | 'warning' | 'critical' = 'optimal';
          let statusMessage = 'Daily check-in logged and within targets';

          if (data.sorenessLevel >= 7 || data.rpeFatigue >= 8) {
            status = 'critical';
            statusMessage = `High fatigue / soreness (${data.sorenessAreas.join(', ') || 'general body'})`;
          } else if (data.sleepHours < 6 || data.sorenessLevel >= 5) {
            status = 'warning';
            statusMessage = 'Sub-optimal sleep / moderate soreness reported';
          }

          return {
            ...f,
            currentWeightLbs: data.weightLbs,
            status,
            statusMessage,
          };
        }
        return f;
      });

      // Update trajectory data with today's weigh-in (S9)
      const fighterObj = get().fighters.find((f) => f.id === data.fighterId);
      const daysOut = fighterObj ? calculateDaysOut(fighterObj.fightDate) : 0;
      const displayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      const fighterTrajectory = [...(get().weightTrajectories[data.fighterId] || [])];
      const todayIndex = fighterTrajectory.findIndex(
        (dp) => dp.date === displayDate || dp.daysOut === daysOut
      );

      if (todayIndex >= 0) {
        fighterTrajectory[todayIndex] = {
          ...fighterTrajectory[todayIndex],
          actualWeightLbs: data.weightLbs,
        };
      } else {
        fighterTrajectory.push({
          date: displayDate,
          daysOut,
          targetWeightLbs: fighterObj ? fighterObj.divisionLimitLbs : data.weightLbs,
          actualWeightLbs: data.weightLbs,
          dangerZoneThresholdLbs: fighterObj ? fighterObj.divisionLimitLbs + 15 : data.weightLbs + 15,
          isWaterCutPhase: daysOut <= 5,
        });
        fighterTrajectory.sort((a, b) => b.daysOut - a.daysOut);
      }

      const updatedTrajectories = {
        ...get().weightTrajectories,
        [data.fighterId]: fighterTrajectory,
      };

      // Filter out previous checkin for today if any, and prepend new one
      const filteredCheckins = get().checkIns.filter(
        (ci) => !(ci.fighterId === data.fighterId && ci.date === today)
      );
      const updatedCheckIns = [newCheckIn, ...filteredCheckins];

      set({
        checkIns: updatedCheckIns,
        fighters: updatedFighters,
        weightTrajectories: updatedTrajectories,
        syncStatus: {
          ...get().syncStatus,
          lastSyncedAt: new Date().toLocaleTimeString(),
        },
      });

      persist({
        checkIns: updatedCheckIns,
        fighters: updatedFighters,
        weightTrajectories: updatedTrajectories,
      });
    },

    logCoachWeighIn: (fighterId, weightLbs, isEvening = false, notes) => {
      const today = getLocalDateString();
      const fighterObj = get().fighters.find((f) => f.id === fighterId);
      const daysOut = fighterObj ? calculateDaysOut(fighterObj.fightDate) : 0;
      const displayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      const fighterTrajectory = [...(get().weightTrajectories[fighterId] || [])];
      const todayIndex = fighterTrajectory.findIndex(
        (dp) => dp.date === displayDate || dp.daysOut === daysOut
      );

      if (todayIndex >= 0) {
        fighterTrajectory[todayIndex] = {
          ...fighterTrajectory[todayIndex],
          [isEvening ? 'eveningWeightLbs' : 'actualWeightLbs']: weightLbs,
          notes: notes || fighterTrajectory[todayIndex].notes,
        };
      } else {
        fighterTrajectory.push({
          date: displayDate,
          daysOut,
          targetWeightLbs: fighterObj ? fighterObj.divisionLimitLbs : weightLbs,
          actualWeightLbs: !isEvening ? weightLbs : undefined,
          eveningWeightLbs: isEvening ? weightLbs : undefined,
          dangerZoneThresholdLbs: fighterObj ? fighterObj.divisionLimitLbs + 15 : weightLbs + 15,
          isWaterCutPhase: daysOut <= 5,
          notes,
        });
        fighterTrajectory.sort((a, b) => b.daysOut - a.daysOut);
      }

      const updatedFighters = get().fighters.map((f) => {
        if (f.id === fighterId) {
          return {
            ...f,
            currentWeightLbs: weightLbs,
          };
        }
        return f;
      });

      const updatedTrajectories = {
        ...get().weightTrajectories,
        [fighterId]: fighterTrajectory,
      };

      set({
        fighters: updatedFighters,
        weightTrajectories: updatedTrajectories,
      });

      persist({
        fighters: updatedFighters,
        weightTrajectories: updatedTrajectories,
      });
    },

    updateHydrationLog: (fighterId, waterAddOz, electrolytesAdd = 0, urineScale) => {
      const today = getLocalDateString();
      const currentLogs = [...get().hydrationLogs];
      const logIndex = currentLogs.findIndex((h) => h.fighterId === fighterId && h.date === today);

      let updatedLogs: HydrationLog[];
      if (logIndex >= 0) {
        const existing = currentLogs[logIndex];
        const updated: HydrationLog = {
          ...existing,
          waterIntakeOz: Math.max(0, existing.waterIntakeOz + waterAddOz),
          electrolytesPackets: Math.max(0, existing.electrolytesPackets + electrolytesAdd),
          urineColorScale: urineScale !== undefined ? urineScale : existing.urineColorScale,
          lastUpdated: new Date().toISOString(),
        };
        currentLogs[logIndex] = updated;
        updatedLogs = currentLogs;
      } else {
        const newLog: HydrationLog = {
          id: `h_${Date.now()}`,
          fighterId,
          date: today,
          waterIntakeOz: Math.max(0, waterAddOz),
          targetWaterOz: 192,
          electrolytesPackets: electrolytesAdd,
          urineColorScale: urineScale || 2,
          lastUpdated: new Date().toISOString(),
          synced: true,
        };
        updatedLogs = [newLog, ...currentLogs];
      }

      set({ hydrationLogs: updatedLogs });
      persist({ hydrationLogs: updatedLogs });
    },

    toggleWorkoutRound: (sessionId, roundNumber) => {
      const updatedSessions = get().trainingSessions.map((session) => {
        if (session.id === sessionId && session.rounds) {
          const updatedRounds = session.rounds.map((round) => {
            if (round.roundNumber === roundNumber) {
              return { ...round, completed: !round.completed };
            }
            return round;
          });
          const allCompleted = updatedRounds.every((r) => r.completed);
          return {
            ...session,
            rounds: updatedRounds,
            completed: allCompleted,
            completedAt: allCompleted ? new Date().toISOString() : session.completedAt,
          };
        }
        return session;
      });

      set({ trainingSessions: updatedSessions });
      persist({ trainingSessions: updatedSessions });
    },

    completeTrainingSession: (sessionId, actualRpe, fighterNotes) => {
      const updatedSessions = get().trainingSessions.map((session) => {
        if (session.id === sessionId) {
          const updatedRounds = session.rounds?.map((r) => ({ ...r, completed: true }));
          return {
            ...session,
            rounds: updatedRounds,
            completed: true,
            completedAt: new Date().toISOString(),
            actualRpe: actualRpe !== undefined ? actualRpe : session.actualRpe || session.targetRpe,
            fighterNotes: fighterNotes !== undefined ? fighterNotes : session.fighterNotes,
          };
        }
        return session;
      });

      set({ trainingSessions: updatedSessions });
      persist({ trainingSessions: updatedSessions });
    },

    addTrainingSession: (sessionData) => {
      const newSession: TrainingSession = {
        ...sessionData,
        id: `t_${Date.now()}`,
        completed: false,
      };
      const updated = [...get().trainingSessions, newSession];
      set({ trainingSessions: updated });
      persist({ trainingSessions: updated });
    },

    syncAiSparringDebrief: (fighterId, roundNumber, feedbackSummary, drills) => {
      const today = getLocalDateString();
      const sessions = [...get().trainingSessions];
      const existingIdx = sessions.findIndex((s) => s.fighterId === fighterId && s.type === 'sparring' && s.date === today);

      const drillsText = drills.length > 0 ? `\n\nPrescribed Drills:\n• ${drills.join('\n• ')}` : '';
      const debriefNote = `[AI Sparring Debrief - Round ${roundNumber}]: ${feedbackSummary}${drillsText}`;

      if (existingIdx >= 0) {
        const session = sessions[existingIdx];
        const updatedRounds = session.rounds?.map((r) => r.roundNumber === roundNumber ? { ...r, completed: true } : r);
        sessions[existingIdx] = {
          ...session,
          rounds: updatedRounds,
          coachNotes: session.coachNotes ? `${session.coachNotes}\n\n${debriefNote}` : debriefNote,
        };
      } else {
        const newSession: TrainingSession = {
          id: `t_${Date.now()}`,
          fighterId,
          date: today,
          time: '12:00 PM',
          title: `Championship Sparring (Round ${roundNumber})`,
          type: 'sparring',
          durationMinutes: 45,
          targetRounds: 5,
          intensity: 'High',
          targetRpe: 8,
          coachNotes: debriefNote,
          completed: false,
          rounds: [
            { roundNumber, durationMinutes: 5, completed: true, notes: 'AI Video Analyzed' }
          ]
        };
        sessions.push(newSession);
      }

      set({ trainingSessions: sessions });
      persist({ trainingSessions: sessions });
    },

    broadcastStateChange: (eventType, data) => {
      sendBroadcast(eventType, data);
    },

    syncOfflineQueue: () => {
      set({
        syncStatus: {
          isOnline: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
          pendingCount: 0,
          syncMode: 'local',
        },
        offlineQueue: [],
      });
    },

    // Reset full state slice (N7)
    resetToDefaultData: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({
        fighters: INITIAL_FIGHTERS,
        checkIns: INITIAL_CHECKINS,
        hydrationLogs: INITIAL_HYDRATION,
        trainingSessions: INITIAL_TRAINING_SESSIONS,
        weightTrajectories: MOCK_WEIGHT_TRAJECTORY,
        weightUnit: 'lbs',
        currentRole: 'coach',
        isPinAuthenticated: false,
        activeFighterId: null,
        selectedFighterId: 'f1',
        activeJobs: [],
        completedJobs: [],
        selectedCompletedJobId: null,
        isCutSheetOpen: false,
        isWeighInModalOpen: false,
        isCheckInModalOpen: false,
        syncStatus: {
          isOnline: true,
          lastSyncedAt: 'Just now',
          pendingCount: 0,
          syncMode: 'local',
        },
        offlineQueue: [],
      });
      sendBroadcast('STATE_UPDATED', {});
    },

    rehydrateFromStorage: () => {
      const fresh = loadInitialState();
      if (fresh) {
        set((state) => ({
          ...state,
          weightUnit: fresh.weightUnit || state.weightUnit,
          fighters: fresh.fighters || state.fighters,
          checkIns: fresh.checkIns || state.checkIns,
          hydrationLogs: fresh.hydrationLogs || state.hydrationLogs,
          trainingSessions: fresh.trainingSessions || state.trainingSessions,
          weightTrajectories: fresh.weightTrajectories || state.weightTrajectories,
        }));
      }
    },

    trackJob: (job) => {
      set((state) => {
        const filtered = state.activeJobs.filter((j) => j.jobId !== job.jobId);
        return { activeJobs: [job, ...filtered] };
      });
    },

    updateJob: (jobId, updates) => {
      set((state) => {
        const activeIdx = state.activeJobs.findIndex((j) => j.jobId === jobId);
        if (activeIdx !== -1) {
          const current = state.activeJobs[activeIdx];
          const updated = { ...current, ...updates };
          if (updated.status === 'completed') {
            return {
              activeJobs: state.activeJobs.filter((j) => j.jobId !== jobId),
              completedJobs: [updated, ...state.completedJobs.filter((j) => j.jobId !== jobId)],
            };
          }
          const updatedActive = [...state.activeJobs];
          updatedActive[activeIdx] = updated;
          return { activeJobs: updatedActive };
        }
        return state;
      });
    },

    dismissJob: (jobId) => {
      set((state) => ({
        activeJobs: state.activeJobs.filter((j) => j.jobId !== jobId),
        completedJobs: state.completedJobs.filter((j) => j.jobId !== jobId),
      }));
    },

    cancelJob: async (jobId) => {
      try {
        await fetch(`/api/v1/mma/jobs?jobId=${jobId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('[CampStore] Notice calling cancel job API:', e);
      }
      set((state) => ({
        activeJobs: state.activeJobs.filter((j) => j.jobId !== jobId),
        completedJobs: state.completedJobs.filter((j) => j.jobId !== jobId),
      }));
    },

    setSelectedCompletedJobId: (jobId) => {
      set({ selectedCompletedJobId: jobId });
    },

    fetchActiveJobs: async () => {
      try {
        const res = await fetch('/api/v1/mma/jobs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.jobs)) {
            const active: AnalysisJob[] = [];
            const completed: AnalysisJob[] = [];
            data.jobs.forEach((j: AnalysisJob) => {
              if (j.status === 'completed') completed.push(j);
              else active.push(j);
            });
            set((state) => ({
              activeJobs: active,
              completedJobs: [
                ...completed,
                ...state.completedJobs.filter((cj) => !completed.some((c) => c.jobId === cj.jobId)),
              ],
            }));
          }
        }
      } catch (e) {}
    },
  };
});
