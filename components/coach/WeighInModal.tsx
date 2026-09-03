'use client';

import React, { useState } from 'react';
import { useCampStore } from '@/lib/store';
import { formatWeight, convertLbsToCurrent } from '@/lib/utils';
import { Scale, X, Check, Sun, Moon } from 'lucide-react';

export const WeighInModal: React.FC = () => {
  const { 
    isWeighInModalOpen, 
    setWeighInModalOpen, 
    selectedFighterId, 
    fighters, 
    weightUnit, 
    logCoachWeighIn 
  } = useCampStore();

  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];

  const [weightValue, setWeightValue] = useState<number>(
    convertLbsToCurrent(fighter.currentWeightLbs, weightUnit)
  );
  const [isEvening, setIsEvening] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  if (!isWeighInModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLbs = weightUnit === 'kg' ? weightValue / 0.45359237 : weightValue;
    logCoachWeighIn(fighter.id, parseFloat(finalLbs.toFixed(1)), isEvening, notes);
    setWeighInModalOpen(false);
  };

  const currentDiff = (weightUnit === 'kg' ? weightValue / 0.45359237 : weightValue) - fighter.divisionLimitLbs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-5 sm:p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={() => setWeighInModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">
              Gym Floor Scale Weigh-In
            </h3>
            <p className="text-xs text-zinc-400">
              {fighter.name} ({fighter.weightClass})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Time of Day Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEvening(false)}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                !isEvening ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun className="h-4 w-4 text-amber-400" />
              <span>Morning Fasted</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEvening(true)}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                isEvening ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Moon className="h-4 w-4 text-indigo-400" />
              <span>Evening Post-Gym</span>
            </button>
          </div>

          {/* Scale Weight Input */}
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
              Scale Reading ({weightUnit.toUpperCase()})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                required
                value={weightValue}
                onChange={(e) => setWeightValue(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-4 py-3 text-2xl font-mono font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500 font-bold">
                {weightUnit.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Division Limit</span>
              <span className="font-bold text-zinc-300">
                {formatWeight(fighter.divisionLimitLbs, weightUnit)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Delta to Scale</span>
              <span className={`font-bold ${currentDiff <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentDiff > 0 ? `+${formatWeight(currentDiff, weightUnit)}` : 'MADE WEIGHT!'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
              Scale Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fasted morning weight, sweat suit on, hydration good"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setWeighInModalOpen(false)}
              className="w-1/2 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-glow-red flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              Save Weigh-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
