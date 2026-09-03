'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { useCampStore } from '@/lib/store';
import { getAcwrBadge } from '@/lib/utils';
import { 
  Activity, 
  Moon, 
  Flame, 
  Heart, 
  Brain, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';
import { BodyPart } from '@/types/camp';

export const ReadinessOverview: React.FC = () => {
  const { selectedFighterId, fighters, checkIns, trainingSessions } = useCampStore();
  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];

  const latestCheckIn = checkIns.find((ci) => ci.fighterId === selectedFighterId) || {
    sleepHours: 7.5,
    sleepQuality: 4,
    sorenessLevel: 3,
    sorenessAreas: ['neck', 'shins'] as BodyPart[],
    restingHR: 50,
    mentalFocus: 5,
    rpeFatigue: 4,
    notes: 'Feeling solid and on weight.',
  };

  // Calculate composite readiness score (0-100)
  const sleepFactor = Math.min(latestCheckIn.sleepHours / 8, 1) * 35;
  const sorenessFactor = Math.max(0, (10 - latestCheckIn.sorenessLevel) / 10) * 35;
  const focusFactor = (latestCheckIn.mentalFocus / 5) * 30;
  const compositeScore = Math.round(sleepFactor + sorenessFactor + focusFactor);

  // Mock 7-day training load & ACWR (Acute:Chronic Workload Ratio)
  const volumeData = [
    { day: 'Fri', volumeRounds: 18, rpe: 7.5, acwr: 1.05 },
    { day: 'Sat', volumeRounds: 25, rpe: 8.5, acwr: 1.25 },
    { day: 'Sun', volumeRounds: 6, rpe: 3.0, acwr: 1.10 },
    { day: 'Mon', volumeRounds: 22, rpe: 8.0, acwr: 1.30 },
    { day: 'Tue', volumeRounds: 20, rpe: 7.0, acwr: 1.22 },
    { day: 'Wed', volumeRounds: 24, rpe: 8.5, acwr: 1.28 },
    { day: 'Today', volumeRounds: 14, rpe: latestCheckIn.rpeFatigue || 7.0, acwr: 1.18 },
  ];

  const currentAcwr = 1.18;
  const acwrBadge = getAcwrBadge(currentAcwr);

  const allBodyParts: { key: BodyPart; label: string }[] = [
    { key: 'neck', label: 'Neck / Traps' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'ribs', label: 'Ribs / Core' },
    { key: 'lowerBack', label: 'Lower Back' },
    { key: 'hands', label: 'Hands / Wrists' },
    { key: 'hips', label: 'Hips / Groin' },
    { key: 'knees', label: 'Knees' },
    { key: 'shins', label: 'Shins / Feet' },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 sm:p-5 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          <h3 className="font-bold text-base text-zinc-100 font-mono tracking-tight">
            Camp Readiness & ACWR Load
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Last Check-In: {latestCheckIn.notes ? 'Today 07:15 AM' : 'Pending'}
        </span>
      </div>

      {/* Main Readiness Score Banner & Vital Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Composite Readiness Gauge */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Readiness Index
            </span>
            <ShieldCheck className={`h-4 w-4 ${compositeScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-4xl font-black font-mono tracking-tight ${
              compositeScore >= 80 ? 'text-emerald-400' : compositeScore >= 65 ? 'text-amber-400' : 'text-red-500'
            }`}>
              {compositeScore}%
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {compositeScore >= 80 ? 'Fight Ready' : compositeScore >= 65 ? 'Manage Load' : 'High Fatigue'}
            </span>
          </div>

          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                compositeScore >= 80 ? 'bg-emerald-500' : compositeScore >= 65 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${compositeScore}%` }}
            />
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Sleep & Rest</span>
            <Moon className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">{latestCheckIn.sleepHours} hrs</span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`text-xs ${star <= latestCheckIn.sleepQuality ? 'text-amber-400' : 'text-zinc-700'}`}
                >
                  ★
                </span>
              ))}
              <span className="text-[11px] text-zinc-400 ml-1">Quality ({latestCheckIn.sleepQuality}/5)</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500">REM & deep stage recovery logged</span>
        </div>

        {/* Resting Heart Rate */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Resting Pulse</span>
            <Heart className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">{latestCheckIn.restingHR || 48} <span className="text-xs text-zinc-400 font-sans">BPM</span></span>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              Normal baseline (46-52 bpm)
            </p>
          </div>
          <span className="text-[10px] text-zinc-500">No elevated sympathetic stress</span>
        </div>

        {/* Mental Focus & RPE Fatigue */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Mental Focus & RPE</span>
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{latestCheckIn.mentalFocus}/5</span>
              <span className="text-xs text-zinc-400 font-mono">Focus</span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">
              Perceived Fatigue: <span className="font-bold text-amber-400">{latestCheckIn.rpeFatigue}/10 RPE</span>
            </p>
          </div>
          <span className="text-[10px] text-zinc-500">Gameplan execution confidence</span>
        </div>

      </div>

      {/* Soreness Anatomical Troublespots & ACWR Load Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
        
        {/* Anatomical Soreness Heatmap / Tags */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-red-500" />
                Soreness & Contusion Map
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                Overall: <span className="font-bold text-red-400">{latestCheckIn.sorenessLevel}/10</span>
              </span>
            </div>

            {/* Trouble Spots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allBodyParts.map((part) => {
                const isFlagged = latestCheckIn.sorenessAreas?.includes(part.key);
                return (
                  <div
                    key={part.key}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-mono transition-all flex flex-col items-center text-center ${
                      isFlagged
                        ? 'bg-red-950/60 border-red-500/80 text-red-200 shadow-sm'
                        : 'bg-zinc-900/50 border-zinc-800/70 text-zinc-500'
                    }`}
                  >
                    <span className="font-bold">{part.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isFlagged ? 'text-red-400 font-bold' : 'text-zinc-600'}`}>
                      {isFlagged ? 'Sore / Flagged' : 'Clear'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {latestCheckIn.notes && (
            <div className="mt-3 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 italic">
              &quot;{latestCheckIn.notes}&quot;
            </div>
          )}
        </div>

        {/* ACWR & Training Volume Bar Chart */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                Workload Ratio (ACWR)
              </span>
              <span className="text-[11px] text-zinc-500">
                7-day rolling rounds completed vs. injury risk threshold
              </span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${acwrBadge.bg} ${acwrBadge.color}`}>
              {currentAcwr} ACWR • {acwrBadge.label}
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any, name: string) => [
                    `${val} ${name === 'volumeRounds' ? 'Rounds' : ''}`, 
                    name === 'volumeRounds' ? 'Training Volume' : name
                  ]}
                />
                <Bar dataKey="volumeRounds" radius={[4, 4, 0, 0]}>
                  {volumeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.day === 'Today' ? '#ef4444' : entry.volumeRounds > 22 ? '#f59e0b' : '#3f3f46'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
            <span>Sweet spot: 0.8 - 1.3 ACWR</span>
            <span>Red bar: today&apos;s active load</span>
          </div>
        </div>

      </div>
    </div>
  );
};
