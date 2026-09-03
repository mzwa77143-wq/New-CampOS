'use client';

import React from 'react';
import { useCampStore } from '@/lib/store';
import { formatWeight, calculateDaysOut } from '@/lib/utils';
import { HydrationTracker } from './HydrationTracker';
import { WorkoutChecklist } from './WorkoutChecklist';
import { CheckInModal } from './CheckInModal';
import { 
  Sparkles, 
  Scale, 
  Flame, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Wifi,
  WifiOff
} from 'lucide-react';

export const FighterHome: React.FC = () => {
  const { 
    fighters, 
    selectedFighterId, 
    logoutFighter, 
    setCheckInModalOpen, 
    weightUnit, 
    checkIns, 
    syncStatus 
  } = useCampStore();

  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find((ci) => ci.fighterId === fighter.id && ci.date === today);

  const daysOut = calculateDaysOut(fighter.fightDate);
  const remainingCut = fighter.currentWeightLbs - fighter.divisionLimitLbs;

  return (
    <div className="flex flex-col gap-5 p-4 max-w-lg mx-auto w-full pb-20">
      
      {/* Fighter HUD Header */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-[#131317] to-zinc-950 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-44 w-44 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fighter.avatarUrl}
              alt={fighter.name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-red-500 shadow-glow-red"
            />
            <div>
              <h2 className="text-base font-bold text-white font-mono leading-tight">
                {fighter.name}
              </h2>
              <p className="text-xs text-red-400 font-serif italic">
                &quot;{fighter.nickname}&quot;
              </p>
              <span className="text-[11px] font-mono text-zinc-400">
                {fighter.weightClass} &bull; {fighter.event}
              </span>
            </div>
          </div>

          <button
            onClick={logoutFighter}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            title="Lock Fighter PIN Session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Days Out & Weight Delta Pillars */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80">
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
              Weigh-In Countdown
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black font-mono text-white">{daysOut}</span>
              <span className="text-xs font-mono font-bold text-red-400">DAYS OUT</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Fight: {fighter.fightDate}
            </span>
          </div>

          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
              Current vs. Limit
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black font-mono text-white">
                {formatWeight(fighter.currentWeightLbs, weightUnit)}
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${remainingCut <= 3 ? 'text-emerald-400' : 'text-red-400'}`}>
              +{formatWeight(remainingCut, weightUnit)} to target
            </span>
          </div>
        </div>
      </div>

      {/* Daily Check-In Hero Action */}
      <div className={`rounded-3xl border p-5 flex flex-col gap-3 transition-all ${
        todayCheckIn
          ? 'bg-zinc-950/60 border-emerald-900/50 shadow-sm'
          : 'bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 border-red-500 shadow-glow-red'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-5 w-5 ${todayCheckIn ? 'text-emerald-400' : 'text-red-400'}`} />
            <h3 className="font-bold text-sm text-white font-mono">
              {todayCheckIn ? 'Daily Check-In Recorded' : 'Morning Check-In Required'}
            </h3>
          </div>
          {todayCheckIn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              <CheckCircle className="h-3 w-3" /> Logged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800 animate-pulse">
              Due Now
            </span>
          )}
        </div>

        {todayCheckIn ? (
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-zinc-300 py-1">
            <div>
              <span className="text-[10px] text-zinc-500 block">Scale</span>
              <span className="font-bold">{formatWeight(todayCheckIn.weightLbs, weightUnit)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Sleep</span>
              <span className="font-bold">{todayCheckIn.sleepHours} hrs</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Soreness</span>
              <span className="font-bold text-red-400">{todayCheckIn.sorenessLevel}/10</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            Submit your scale weight, sleep hours, and muscle soreness so your coaching team can calibrate today&apos;s sparring load.
          </p>
        )}

        <button
          onClick={() => setCheckInModalOpen(true)}
          className={`w-full py-3 rounded-2xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            todayCheckIn
              ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-glow-red'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>{todayCheckIn ? 'Update Today\'s Check-In' : 'Start Morning Check-In'}</span>
        </button>
      </div>

      {/* Hydration Tracker */}
      <HydrationTracker />

      {/* Workout Completion Checklist */}
      <WorkoutChecklist />

      {/* Gym Floor Offline Sync Banner */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 flex items-center justify-between text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          {syncStatus.isOnline ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-400" />
          )}
          <span>
            {syncStatus.isOnline
              ? 'Gym Floor Real-Time Sync Active'
              : 'Offline Mode: Stored in Local Device Cache'}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">
          Last: {syncStatus.lastSyncedAt || 'Live'}
        </span>
      </div>

      {/* Check In Modal */}
      <CheckInModal />
    </div>
  );
};
