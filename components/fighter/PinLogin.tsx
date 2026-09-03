'use client';

import React, { useState } from 'react';
import { useCampStore } from '@/lib/store';
import { Shield, KeyRound, Delete, ArrowRight, UserCheck } from 'lucide-react';

export const PinLogin: React.FC = () => {
  const { fighters, selectedFighterId, setSelectedFighterId, authenticatePin } = useCampStore();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeFighter = fighters.find((f) => f.id === selectedFighterId) || fighters[0];

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        const success = authenticatePin(nextPin, activeFighter.id);
        if (!success) {
          setErrorMsg('Invalid PIN. Use default "1234" or select another fighter.');
          setTimeout(() => setPin(''), 1000);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const handleQuickDemoFill = () => {
    setPin('1234');
    authenticatePin('1234', activeFighter.id);
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
      <div className="w-full rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        
        {/* Fighter Selection Carousel / Switcher */}
        <div className="w-full mb-6">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
            Select Fighter Profile (Gym Tablet Mode)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {fighters.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFighterId(f.id);
                  setPin('');
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  f.id === selectedFighterId
                    ? 'bg-red-950/40 border-red-500 shadow-glow-red scale-105'
                    : 'bg-zinc-900/50 border-zinc-800/80 opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.avatarUrl}
                  alt={f.name}
                  className="h-9 w-9 rounded-full object-cover mb-1 ring-1 ring-zinc-700"
                />
                <span className="text-[10px] font-bold text-zinc-200 truncate w-full">
                  {f.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Fighter Badge */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeFighter.avatarUrl}
              alt={activeFighter.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-red-500/40 shadow-glow-red"
            />
            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1 rounded-full">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white font-mono">
            {activeFighter.name}
          </h2>
          <p className="text-xs text-red-400 font-serif italic">
            &quot;{activeFighter.nickname}&quot; • {activeFighter.weightClass}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Enter your 4-digit PIN for gym floor check-in
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'border-red-500 bg-red-500 shadow-glow-red scale-110'
                    : 'border-zinc-700 bg-zinc-900'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className="text-xs text-red-400 font-mono mb-4 animate-shake">
            {errorMsg}
          </p>
        )}

        {/* Sweat/Glove-Friendly Touch Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xl font-mono font-bold text-white shadow-sm active:scale-95 transition-all flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-all flex items-center justify-center"
          >
            CLEAR
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xl font-mono font-bold text-white active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Fast Bypass */}
        <button
          onClick={handleQuickDemoFill}
          className="mt-2 text-xs font-mono text-zinc-400 hover:text-red-400 underline decoration-zinc-700 hover:decoration-red-400 transition-colors flex items-center gap-1.5"
        >
          <UserCheck className="h-3.5 w-3.5 text-red-500" />
          <span>Bypass with Demo PIN (1234)</span>
        </button>

      </div>
    </div>
  );
};
