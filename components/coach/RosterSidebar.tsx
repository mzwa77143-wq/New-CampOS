'use client';

import React from 'react';
import { useCampStore } from '@/lib/store';
import { formatWeight, calculateDaysOut } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, ChevronRight, Activity } from 'lucide-react';

export const RosterSidebar: React.FC = () => {
  const { fighters, selectedFighterId, setSelectedFighterId, weightUnit, checkIns } = useCampStore();

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
          <Activity className="h-4 w-4 text-red-500" />
          Active Roster ({fighters.length})
        </h2>
        <span className="text-[11px] font-mono text-zinc-500">UFC / Pro Camp</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {fighters.map((fighter) => {
          const isSelected = fighter.id === selectedFighterId;
          const daysOut = calculateDaysOut(fighter.fightDate);
          const weightDiff = fighter.currentWeightLbs - fighter.divisionLimitLbs;
          const latestCheckIn = checkIns.find(ci => ci.fighterId === fighter.id);

          // Calculate a dynamic readiness percentage (0 - 100%)
          let readinessScore = 85;
          if (latestCheckIn) {
            const sleepFactor = Math.min(latestCheckIn.sleepHours / 8, 1) * 35;
            const sorenessFactor = Math.max(0, (10 - latestCheckIn.sorenessLevel) / 10) * 35;
            const focusFactor = (latestCheckIn.mentalFocus / 5) * 30;
            readinessScore = Math.round(sleepFactor + sorenessFactor + focusFactor);
          }

          return (
            <div
              key={fighter.id}
              onClick={() => setSelectedFighterId(fighter.id)}
              className={`group relative flex flex-col p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? 'bg-zinc-900/90 border-red-500 shadow-glow-red'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              {/* Top Row: Avatar, Name & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fighter.avatarUrl}
                      alt={fighter.name}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-zinc-800 group-hover:ring-red-500/50 transition-all"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                        fighter.status === 'optimal'
                          ? 'bg-emerald-500'
                          : fighter.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500 animate-pulse'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-100 group-hover:text-white">
                        {fighter.name}
                      </span>
                      {fighter.nickname && (
                        <span className="text-xs font-serif italic text-red-400">
                          &quot;{fighter.nickname}&quot;
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {fighter.weightClass} • {fighter.record}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {daysOut}d out
                  </span>
                </div>
              </div>

              {/* Weight & Readiness Metrics Strip */}
              <div className="mt-3 grid grid-cols-3 gap-2 pt-2.5 border-t border-zinc-800/60 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Current</span>
                  <span className="font-mono font-bold text-zinc-200">
                    {formatWeight(fighter.currentWeightLbs, weightUnit)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">To Cut</span>
                  <span className={`font-mono font-bold ${weightDiff <= 3 ? 'text-emerald-400' : 'text-red-400'}`}>
                    +{formatWeight(weightDiff, weightUnit)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Readiness</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-zinc-200">{readinessScore}%</span>
                    <span 
                      className={`h-1.5 w-1.5 rounded-full ${
                        readinessScore >= 80 ? 'bg-emerald-400' : readinessScore >= 65 ? 'bg-amber-400' : 'bg-red-500'
                      }`} 
                    />
                  </div>
                </div>
              </div>

              {/* Status Message / Safety Tag */}
              {fighter.statusMessage && (
                <div className="mt-2 text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800/70 text-zinc-400 flex items-start gap-1.5 line-clamp-1">
                  {fighter.status === 'critical' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : fighter.status === 'warning' ? (
                    <Shield className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="truncate">{fighter.statusMessage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
