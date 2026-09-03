'use client';

import React from 'react';
import { useCampStore } from '@/lib/store';
import { getUrineStatus } from '@/lib/utils';
import { Droplet, Plus, Sparkles, AlertCircle, Check } from 'lucide-react';

export const HydrationTracker: React.FC = () => {
  const { selectedFighterId, hydrationLogs, updateHydrationLog } = useCampStore();
  const today = new Date().toISOString().split('T')[0];

  const log = hydrationLogs.find((h) => h.fighterId === selectedFighterId && h.date === today) || {
    waterIntakeOz: 160,
    targetWaterOz: 192,
    electrolytesPackets: 2,
    urineColorScale: 2 as 1 | 2 | 3 | 4 | 5,
  };

  const percentage = Math.min(100, Math.round((log.waterIntakeOz / log.targetWaterOz) * 100));
  const targetGallons = (log.targetWaterOz / 128).toFixed(1);
  const currentGallons = (log.waterIntakeOz / 128).toFixed(1);
  const urineStatus = getUrineStatus(log.urineColorScale);

  const urineColors = [
    { scale: 1, color: '#e0f2fe', label: '1 • Pale' },
    { scale: 2, color: '#fef08a', label: '2 • Straw' },
    { scale: 3, color: '#fde047', label: '3 • Amber' },
    { scale: 4, color: '#f59e0b', label: '4 • Dark' },
    { scale: 5, color: '#b45309', label: '5 • Red-Brown' },
  ];

  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold text-base text-zinc-100 font-mono">
            Hydration & Water Loading
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-400">
          Target: {targetGallons} Gal ({log.targetWaterOz} oz)
        </span>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Visual Progress Stats */}
        <div className="flex flex-col text-center sm:text-left">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300/80">
            Intake Logged Today
          </span>
          <div className="flex items-baseline gap-2 justify-center sm:justify-start my-1">
            <span className="text-3xl sm:text-4xl font-black font-mono text-white">
              {log.waterIntakeOz}
            </span>
            <span className="text-sm font-mono text-cyan-300">/ {log.targetWaterOz} oz</span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Approx. {currentGallons} of {targetGallons} Gallons ingested
          </span>
        </div>

        {/* Progress Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-zinc-800"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-cyan-400 transition-all duration-700 ease-out"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - percentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-base font-bold font-mono text-white">
              {percentage}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono mt-1">Daily Target</span>
        </div>
      </div>

      {/* Quick Add Intake Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => updateHydrationLog(selectedFighterId, 8)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-700 text-xs font-mono font-bold text-zinc-200 transition-all"
        >
          <Plus className="h-3.5 w-3.5 text-cyan-400" />
          <span>+8 oz (Glass)</span>
        </button>

        <button
          onClick={() => updateHydrationLog(selectedFighterId, 16)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-700 text-xs font-mono font-bold text-zinc-200 transition-all"
        >
          <Plus className="h-3.5 w-3.5 text-cyan-400" />
          <span>+16 oz (Bottle)</span>
        </button>

        <button
          onClick={() => updateHydrationLog(selectedFighterId, 32)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-700 text-xs font-mono font-bold text-zinc-200 transition-all"
        >
          <Plus className="h-3.5 w-3.5 text-cyan-400" />
          <span>+32 oz (Flask)</span>
        </button>

        <button
          onClick={() => updateHydrationLog(selectedFighterId, 0, 1)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-amber-950/60 border border-zinc-800 hover:border-amber-700 text-xs font-mono font-bold text-amber-300 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>+1 Electrolyte ({log.electrolytesPackets})</span>
        </button>
      </div>

      {/* 5-Level Urine Color Scale */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            Urine Color Hydration Check
          </span>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${urineStatus.bg} ${urineStatus.color}`}>
            {urineStatus.label}
          </span>
        </div>

        <p className="text-[11px] text-zinc-500 mb-2">
          Tap your current color to update hydration status:
        </p>

        <div className="grid grid-cols-5 gap-2">
          {urineColors.map((u) => {
            const isSelected = log.urineColorScale === u.scale;
            return (
              <button
                key={u.scale}
                onClick={() => updateHydrationLog(selectedFighterId, 0, 0, u.scale as any)}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-white ring-2 ring-white/30 scale-105'
                    : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className="h-7 w-full rounded-lg mb-1 shadow-inner"
                  style={{ backgroundColor: u.color }}
                />
                <span className="text-[10px] font-mono font-bold text-zinc-300">
                  {u.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
