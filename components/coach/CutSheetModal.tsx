'use client';

import React from 'react';
import { useCampStore } from '@/lib/store';
import { MOCK_CUT_PROTOCOLS } from '@/lib/mock-data';
import { formatWeight } from '@/lib/utils';
import { FileText, Printer, X, Droplet, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const CutSheetModal: React.FC = () => {
  const { isCutSheetOpen, setCutSheetOpen, selectedFighterId, fighters, weightUnit } = useCampStore();
  const fighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];

  if (!isCutSheetOpen) return null;

  const protocolDays = MOCK_CUT_PROTOCOLS[selectedFighterId] || MOCK_CUT_PROTOCOLS['f1'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-[#101013] p-5 sm:p-7 shadow-2xl relative my-auto">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800 text-cyan-400">
              <Droplet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-mono">
                  Fight Week Water & Sodium Cut Protocol
                </h3>
                <span className="text-[10px] uppercase font-mono bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                  Official Camp OS Sheet
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {fighter.name} &bull; {fighter.weightClass} (Limit: {formatWeight(fighter.divisionLimitLbs, weightUnit)}) &bull; Weigh-In: {fighter.fightDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={() => setCutSheetOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Safety Warning */}
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Medical & Coach Safety Mandate:</span> Acute fluid restriction must only begin under coach supervision. If urine color reaches Stage 5 or fighter presents dizziness/cognitive fog, cease sweat immediately and commence slow electrolyte administration.
          </div>
        </div>

        {/* Protocol Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3">Timeline</th>
                <th className="p-3">Phase</th>
                <th className="p-3">Water Target</th>
                <th className="p-3">Sodium & Carbs</th>
                <th className="p-3">Sweat / Sauna</th>
                <th className="p-3">Target Weight</th>
                <th className="p-3">Checkpoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
              {protocolDays.map((day, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3 font-bold text-zinc-200 whitespace-nowrap">
                    {day.daysOut === 0 ? 'FIGHT DAY' : `${day.daysOut}d Out`}
                    <span className="block text-[10px] font-normal text-zinc-500">{day.date}</span>
                  </td>

                  <td className="p-3 font-semibold text-zinc-300">
                    {day.phaseName}
                  </td>

                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800 font-bold">
                      {day.waterGoalGal > 0 ? `${day.waterGoalGal} Gal / day` : '0 Gal (Ice chips)'}
                    </span>
                  </td>

                  <td className="p-3 text-zinc-300">
                    <div>Na: <span className="font-bold text-amber-400">{day.sodiumLevel}</span></div>
                    <div className="text-[10px] text-zinc-500">Carbs: {day.carbsGrams}g</div>
                  </td>

                  <td className="p-3 text-zinc-400">
                    {day.sweatMethod || 'None'}
                  </td>

                  <td className="p-3 font-bold text-red-400 whitespace-nowrap">
                    {formatWeight(day.targetWeightLbs, weightUnit)}
                  </td>

                  <td className="p-3 text-zinc-400 text-[11px] max-w-xs">
                    <ul className="list-disc list-inside space-y-0.5">
                      {day.coachCheckpoints.map((cp, cIdx) => (
                        <li key={cIdx} className="line-clamp-2">{cp}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800/80">
          <span>Standard Aldosterone Flushing & Rapid Rehydration Protocol</span>
          <button
            onClick={() => setCutSheetOpen(false)}
            className="mt-2 sm:mt-0 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
