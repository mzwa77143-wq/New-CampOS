'use client';

import React from 'react';
import { useCampStore } from '@/lib/store';
import { RosterSidebar } from './RosterSidebar';
import { WeightCutChart } from './WeightCutChart';
import { ReadinessOverview } from './ReadinessOverview';
import { TrainingSchedulePlanner } from './TrainingSchedulePlanner';
import { WeighInModal } from './WeighInModal';
import { CutSheetModal } from './CutSheetModal';
import { formatWeight, calculateDaysOut } from '@/lib/utils';
import { Swords, Trophy, Calendar, AlertOctagon, Flame } from 'lucide-react';

export const CoachDashboard: React.FC = () => {
  const { fighters, selectedFighterId, weightUnit } = useCampStore();
  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];

  const daysOut = calculateDaysOut(fighter.fightDate);
  const remainingWeight = fighter.currentWeightLbs - fighter.divisionLimitLbs;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* Left Column: Fighter Roster Sidebar */}
      <RosterSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Active Fighter Banner Card */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-[#121216] to-zinc-950 p-5 sm:p-6 shadow-xl">
          {/* Subtle background red glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Fighter Info */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fighter.avatarUrl}
                  alt={fighter.name}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-red-500/40 shadow-glow-red"
                />
                <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[9px] font-black font-mono px-1.5 py-0.5 rounded uppercase">
                  Wk {fighter.campWeekCurrent}/{fighter.campWeeksTotal}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                    {fighter.name}
                  </h1>
                  {fighter.nickname && (
                    <span className="text-sm font-serif italic text-red-500">
                      &quot;{fighter.nickname}&quot;
                    </span>
                  )}
                  <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-700">
                    {fighter.record}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                  <span className="text-zinc-200 font-semibold">{fighter.weightClass}</span>
                  <span>•</span>
                  <span>Walkout: {formatWeight(fighter.walkoutWeightLbs, weightUnit)}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Limit: {formatWeight(fighter.divisionLimitLbs, weightUnit)}</span>
                </p>

                {/* Matchup Tag */}
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-300 font-semibold">
                    <Swords className="h-3.5 w-3.5" />
                    vs. {fighter.opponent}
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
                    {fighter.event}
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown & Cut Delta Pillar */}
            <div className="flex items-center gap-4 self-start md:self-auto border-t md:border-t-0 md:border-l border-zinc-800/80 pt-3 md:pt-0 md:pl-6">
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                  Fight Countdown
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black font-mono text-white">
                    {daysOut}
                  </span>
                  <span className="text-xs text-red-400 font-mono font-bold">DAYS</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Weigh-In: {fighter.fightDate}
                </span>
              </div>

              <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />

              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                  Cut Requirement
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-3xl font-black font-mono ${remainingWeight <= 3 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {remainingWeight > 0 ? `+${formatWeight(remainingWeight, weightUnit)}` : 'ON WEIGHT'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Current: {formatWeight(fighter.currentWeightLbs, weightUnit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Weight Cut Trajectory Chart */}
        <WeightCutChart />

        {/* 2. Camp Readiness & ACWR Load */}
        <ReadinessOverview />

        {/* 3. Training Regimen & Sparring Schedule */}
        <TrainingSchedulePlanner />

      </main>

      {/* Global Modals for Coach */}
      <WeighInModal />
      <CutSheetModal />
    </div>
  );
};
