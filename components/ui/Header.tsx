'use client';

import React from 'react';
import { useCampStore } from '@/lib/store';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  LayoutDashboard, 
  Scale, 
  FileText, 
  RefreshCw,
  Flame,
  Video
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentRole, 
    setRole, 
    weightUnit, 
    toggleWeightUnit, 
    syncStatus, 
    setWeighInModalOpen, 
    setCutSheetOpen, 
    resetToDefaultData,
    fighters,
    selectedFighterId,
    setSelectedFighterId
  } = useCampStore();

  const activeFighter = fighters.find(f => f.id === selectedFighterId) || fighters[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Event Badge */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 shadow-glow-red">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-mono">Camp<span className="text-red-500">OS</span></span>
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium tracking-wide text-zinc-400">
                Combat Sports Fight Camp Management
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center border-l border-zinc-800 pl-4 space-x-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-zinc-400">Active Camp:</span>
            <span className="font-semibold text-zinc-200">{activeFighter.event}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">vs. {activeFighter.opponent}</span>
          </div>
        </div>

        {/* Center: Role Switcher (Coach vs Fighter vs Video Analyzer) */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setRole('coach')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'coach'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Coach Command</span>
          </button>

          <button
            onClick={() => setRole('fighter')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'fighter'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Fighter App</span>
          </button>

          <button
            onClick={() => setRole('analyzer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'analyzer'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Video &amp; Biomechanics</span>
          </button>
        </div>

        {/* Right: Actions, Unit Toggle, Sync Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quick Weigh-In Button (Coach only) */}
          {currentRole === 'coach' && (
            <button
              onClick={() => setWeighInModalOpen(true)}
              className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/50 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              title="Log Scale Weigh-in for current fighter"
            >
              <Scale className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Log Weigh-In</span>
            </button>
          )}

          {/* Cut Sheet Protocol Button */}
          <button
            onClick={() => setCutSheetOpen(true)}
            className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            title="View Fight Week Hydration & Sodium Protocol"
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Cut Protocol</span>
          </button>

          {/* Unit Toggle (LBS / KG) */}
          <button
            onClick={toggleWeightUnit}
            className="flex items-center space-x-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Toggle between Pounds (lbs) and Kilograms (kg)"
          >
            <span className={weightUnit === 'lbs' ? 'text-red-400' : 'text-zinc-500'}>LBS</span>
            <span className="text-zinc-600">/</span>
            <span className={weightUnit === 'kg' ? 'text-red-400' : 'text-zinc-500'}>KG</span>
          </button>

          {/* Sync & Offline Status */}
          <div 
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400"
            title="Sync status: Real-time broadcast and Gym Floor Local-First Cache active"
          >
            {syncStatus.isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden lg:inline text-[11px] font-medium text-emerald-400">Gym Sync Active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-amber-400">Offline Cache</span>
              </>
            )}
          </div>

          {/* Reset Demo State Button */}
          <button
            onClick={() => {
              if (confirm('Reset CampOS data back to default fight camp demonstration state?')) {
                resetToDefaultData();
              }
            }}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Reset to default fight camp roster data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
