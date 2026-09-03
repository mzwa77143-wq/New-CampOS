'use client';

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { useCampStore } from '@/lib/store';
import { formatWeight, convertLbsToCurrent, calculateDaysOut } from '@/lib/utils';
import { TrendingDown, AlertCircle, Scale, Droplets, Info } from 'lucide-react';

export const WeightCutChart: React.FC = () => {
  const { 
    selectedFighterId, 
    fighters, 
    weightTrajectories, 
    weightUnit, 
    setWeighInModalOpen, 
    setCutSheetOpen 
  } = useCampStore();

  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];
  const chartData = useMemo(() => {
    const rawTrajectory = weightTrajectories[selectedFighterId] || [];
    return rawTrajectory.map((pt) => ({
      ...pt,
      target: convertLbsToCurrent(pt.targetWeightLbs, weightUnit),
      actual: pt.actualWeightLbs !== undefined ? convertLbsToCurrent(pt.actualWeightLbs, weightUnit) : null,
      evening: pt.eveningWeightLbs !== undefined ? convertLbsToCurrent(pt.eveningWeightLbs, weightUnit) : null,
      danger: convertLbsToCurrent(pt.dangerZoneThresholdLbs, weightUnit),
      limit: convertLbsToCurrent(fighter.divisionLimitLbs, weightUnit),
    }));
  }, [weightTrajectories, selectedFighterId, weightUnit, fighter.divisionLimitLbs]);

  const daysOut = calculateDaysOut(fighter.fightDate);
  const remainingToCut = fighter.currentWeightLbs - fighter.divisionLimitLbs;
  const cutRatePerDay = daysOut > 0 ? (remainingToCut / daysOut).toFixed(2) : '0';

  // Y-axis bounds
  const minVal = Math.floor(convertLbsToCurrent(fighter.divisionLimitLbs - 4, weightUnit));
  const maxVal = Math.ceil(convertLbsToCurrent(fighter.walkoutWeightLbs + 2, weightUnit));

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <p className="font-bold text-zinc-200 border-b border-zinc-800 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span>{dataPoint.date} ({dataPoint.daysOut}d out)</span>
            {dataPoint.isWaterCutPhase && (
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                Water Cut Phase
              </span>
            )}
          </p>

          <div className="space-y-1.5">
            {dataPoint.actual !== null && (
              <div className="flex items-center justify-between gap-4 text-white">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Morning Actual:
                </span>
                <span className="font-bold text-red-400">{dataPoint.actual} {weightUnit}</span>
              </div>
            )}

            {dataPoint.evening !== null && (
              <div className="flex items-center justify-between gap-4 text-zinc-300">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-orange-400" /> Evening Weigh-in:
                </span>
                <span className="font-bold">{dataPoint.evening} {weightUnit}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-500" /> Target Trajectory:
              </span>
              <span>{dataPoint.target} {weightUnit}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-900" /> Danger Ceiling:
              </span>
              <span className="text-red-400/80">{dataPoint.danger} {weightUnit}</span>
            </div>
          </div>

          {dataPoint.notes && (
            <div className="mt-2 pt-1.5 border-t border-zinc-800/80 text-[11px] text-zinc-400 italic">
              Note: {dataPoint.notes}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 sm:p-5 flex flex-col gap-4">
      
      {/* Top Bar: Title & Stat Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-base text-zinc-100 font-mono tracking-tight">
              Weight Cut Trajectory
            </h3>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              Limit: {formatWeight(fighter.divisionLimitLbs, weightUnit)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time projection vs. daily scale weigh-ins & safe water-depletion threshold
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCutSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
          >
            <Droplets className="h-3.5 w-3.5 text-cyan-400" />
            <span>Water Schedule</span>
          </button>
          <button
            onClick={() => setWeighInModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-glow-red transition-all"
          >
            <Scale className="h-3.5 w-3.5" />
            <span>+ Log Scale Weight</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Current Scale
          </span>
          <span className="text-lg font-bold font-mono text-white mt-0.5 block">
            {formatWeight(fighter.currentWeightLbs, weightUnit)}
          </span>
          <span className="text-[10px] text-zinc-400">
            Camp start: {formatWeight(fighter.walkoutWeightLbs, weightUnit)}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Remaining Cut
          </span>
          <span className="text-lg font-bold font-mono text-red-400 mt-0.5 block">
            {formatWeight(remainingToCut, weightUnit)}
          </span>
          <span className="text-[10px] text-zinc-400">
            {((remainingToCut / fighter.walkoutWeightLbs) * 100).toFixed(1)}% body mass
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Daily Pace
          </span>
          <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
            {cutRatePerDay} {weightUnit}/day
          </span>
          <span className="text-[10px] text-zinc-400">
            Across {daysOut} days to scale
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
            Water Phase Buffer
          </span>
          <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
            {formatWeight(Math.min(remainingToCut, 12.0), weightUnit)}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">
            Within safe 7-8% limit
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

            <XAxis 
              dataKey="date" 
              stroke="#71717a" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#27272a' }}
            />

            <YAxis 
              domain={[minVal, maxVal]} 
              stroke="#71717a" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#27272a' }}
              tickFormatter={(v) => `${v}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Official Division Weight Limit Line */}
            <ReferenceLine 
              y={convertLbsToCurrent(fighter.divisionLimitLbs, weightUnit)} 
              stroke="#10b981" 
              strokeDasharray="4 4"
              label={{ 
                value: `Limit: ${formatWeight(fighter.divisionLimitLbs, weightUnit)}`, 
                fill: '#10b981', 
                fontSize: 10, 
                position: 'insideBottomRight' 
              }} 
            />

            {/* Danger Zone Ceiling Line */}
            <Line 
              type="monotone" 
              dataKey="danger" 
              stroke="#7f1d1d" 
              strokeWidth={1.5} 
              strokeDasharray="3 3" 
              dot={false}
              name="Danger Threshold"
            />

            {/* Target Trajectory Slope */}
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#a1a1aa" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false}
              name="Target Slope"
            />

            {/* Actual Weigh-In Area & Line */}
            <Area 
              type="monotone" 
              dataKey="actual" 
              stroke="#ef4444" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#actualGradient)" 
              dot={{ r: 4, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#ef4444', strokeWidth: 3 }}
              name="Morning Actual"
            />

            {/* Evening Weigh-Ins */}
            <Line 
              type="monotone" 
              dataKey="evening" 
              stroke="#f97316" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#f97316', stroke: '#09090b', strokeWidth: 1 }}
              name="Evening Scale"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Water Cut Phase Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-zinc-800/60 pt-3 text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
            <span className="text-zinc-200">Actual Weigh-In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-zinc-400 border-b border-dashed border-zinc-400" />
            <span>Target Cut Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-red-900 border-b border-dashed border-red-900" />
            <span className="text-zinc-500">Danger Threshold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-emerald-500" />
            <span className="text-emerald-400">Official Limit</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-950/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          <span>Final 5 days: active water flush begins</span>
        </div>
      </div>

    </div>
  );
};
