import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WeightUnit } from '../types/camp';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(lbs: number, unit: WeightUnit = 'lbs'): string {
  if (unit === 'kg') {
    const kg = lbs * 0.45359237;
    return `${kg.toFixed(1)} kg`;
  }
  return `${lbs.toFixed(1)} lbs`;
}

export function convertLbsToCurrent(lbs: number, unit: WeightUnit = 'lbs'): number {
  if (unit === 'kg') {
    return parseFloat((lbs * 0.45359237).toFixed(1));
  }
  return parseFloat(lbs.toFixed(1));
}

export function calculateDaysOut(fightDateStr: string): number {
  const fightDate = new Date(fightDateStr);
  const today = new Date('2026-09-03'); // Anchor to current context date
  const diffTime = fightDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Acute:Chronic Workload Ratio (ACWR)
// Optimal range: 0.8 - 1.3 (Sweet Spot)
// 1.3 - 1.5: Elevated Injury Risk
// > 1.5: Danger / High Injury Risk
export function getAcwrBadge(acwr: number): { label: string; color: string; bg: string } {
  if (acwr < 0.8) {
    return { label: 'Under-trained', color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800/60' };
  } else if (acwr <= 1.3) {
    return { label: 'Optimal / Sweet Spot', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/60' };
  } else if (acwr <= 1.5) {
    return { label: 'Elevated Load', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800/60' };
  } else {
    return { label: 'Over-training Risk', color: 'text-combat-red', bg: 'bg-red-950/60 border-red-800/60' };
  }
}

export function getUrineStatus(scale: 1 | 2 | 3 | 4 | 5): { label: string; color: string; bg: string } {
  switch (scale) {
    case 1:
      return { label: 'Optimal Hydration', color: 'text-cyan-300', bg: 'bg-cyan-950/50 border-cyan-800' };
    case 2:
      return { label: 'Good Hydration', color: 'text-emerald-300', bg: 'bg-emerald-950/50 border-emerald-800' };
    case 3:
      return { label: 'Fair / Drink 500ml', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-800' };
    case 4:
      return { label: 'Dehydrated / Fluid Alert', color: 'text-orange-400', bg: 'bg-orange-950/50 border-orange-800' };
    case 5:
      return { label: 'Severe Dehydration', color: 'text-red-400', bg: 'bg-red-950/50 border-red-800' };
  }
}
