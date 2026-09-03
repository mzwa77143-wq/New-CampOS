'use client';

import React, { useState } from 'react';
import { useCampStore } from '@/lib/store';
import { formatWeight, convertLbsToCurrent } from '@/lib/utils';
import { BodyPart } from '@/types/camp';
import { 
  Scale, 
  Moon, 
  Flame, 
  Brain, 
  X, 
  Check, 
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const CheckInModal: React.FC = () => {
  const { 
    isCheckInModalOpen, 
    setCheckInModalOpen, 
    selectedFighterId, 
    fighters, 
    weightUnit, 
    submitDailyCheckIn 
  } = useCampStore();

  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];

  const [weightValue, setWeightValue] = useState<number>(
    convertLbsToCurrent(fighter.currentWeightLbs, weightUnit)
  );
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [sorenessLevel, setSorenessLevel] = useState<number>(3);
  const [selectedAreas, setSelectedAreas] = useState<BodyPart[]>(['neck', 'shins']);
  const [mentalFocus, setMentalFocus] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [rpeFatigue, setRpeFatigue] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  if (!isCheckInModalOpen) return null;

  const toggleBodyPart = (part: BodyPart) => {
    if (selectedAreas.includes(part)) {
      setSelectedAreas(selectedAreas.filter((p) => p !== part));
    } else {
      setSelectedAreas([...selectedAreas, part]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLbs = weightUnit === 'kg' ? weightValue / 0.45359237 : weightValue;

    submitDailyCheckIn({
      fighterId: fighter.id,
      weightLbs: parseFloat(finalLbs.toFixed(1)),
      sleepHours,
      sleepQuality,
      sorenessLevel,
      sorenessAreas: selectedAreas,
      mentalFocus,
      rpeFatigue,
      notes: notes.trim() || undefined,
    });

    setIsSubmittedSuccess(true);
    setTimeout(() => {
      setIsSubmittedSuccess(false);
      setCheckInModalOpen(false);
    }, 1200);
  };

  const availableParts: { key: BodyPart; label: string }[] = [
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-7 shadow-2xl relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={() => setCheckInModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-zinc-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">
              Morning Camp Check-In
            </h2>
            <p className="text-xs text-zinc-400">
              {fighter.name} &bull; Fight Readiness Log
            </p>
          </div>
        </div>

        {isSubmittedSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold font-mono text-white">
              Check-In Recorded!
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Saved to gym floor storage & synced with Coach Command Center in real-time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* 1. Morning Scale Weight */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-red-500" />
                  Morning Scale Weight ({weightUnit.toUpperCase()})
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Target: {formatWeight(fighter.divisionLimitLbs, weightUnit)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weightValue}
                  onChange={(e) => setWeightValue(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-2xl font-mono font-black text-white focus:outline-none focus:border-red-500"
                />
                <span className="text-sm font-mono font-bold text-zinc-400">
                  {weightUnit.toUpperCase()}
                </span>
              </div>
            </div>

            {/* 2. Sleep Tracking */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  Sleep Duration & Quality
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {sleepHours} Hours
                </span>
              </div>

              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 mb-3"
              />

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <span className="text-[11px] text-zinc-400">Sleep Quality</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSleepQuality(star as any)}
                      className={`text-lg transition-transform hover:scale-125 ${
                        star <= sleepQuality ? 'text-amber-400' : 'text-zinc-700'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Muscle Soreness & Anatomical Troublespots */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-red-500" />
                  Muscle Soreness & Fatigue (1-10)
                </span>
                <span className="text-xs font-mono font-bold text-red-400">
                  Level {sorenessLevel}/10
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="10"
                value={sorenessLevel}
                onChange={(e) => setSorenessLevel(parseInt(e.target.value))}
                className="w-full accent-red-500 mb-3"
              />

              <div className="pt-2 border-t border-zinc-800/60">
                <span className="text-[11px] text-zinc-400 block mb-2">
                  Tap Any Trouble / Bruised Body Spots:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {availableParts.map((part) => {
                    const selected = selectedAreas.includes(part.key);
                    return (
                      <button
                        type="button"
                        key={part.key}
                        onClick={() => toggleBodyPart(part.key)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-mono transition-all border ${
                          selected
                            ? 'bg-red-950/70 border-red-500 text-red-200 font-bold'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {part.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Mental Readiness & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                  Fight Mood (1-5)
                </span>
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setMentalFocus(val as any)}
                      className={`h-8 w-8 rounded-lg text-xs font-mono font-bold border transition-all ${
                        mentalFocus === val
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                  Fatigue RPE (1-10)
                </span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rpeFatigue}
                  onChange={(e) => setRpeFatigue(parseInt(e.target.value) || 5)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Feedback / Debrief */}
            <div>
              <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                Note for Coach / Medical (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Shin feels sore on check, great energy for bag work"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-mono font-bold text-sm shadow-glow-red flex items-center justify-center gap-2 mt-1"
            >
              <Check className="h-5 w-5" />
              <span>Submit Check-In & Sync</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
