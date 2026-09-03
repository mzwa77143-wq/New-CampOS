'use client';

import React, { useState } from 'react';
import { useCampStore } from '@/lib/store';
import { PinLogin } from './PinLogin';
import { FighterHome } from './FighterHome';
import { Smartphone, Monitor } from 'lucide-react';

export const FighterApp: React.FC = () => {
  const { isPinAuthenticated } = useCampStore();
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-start py-4 px-2 sm:px-4">
      
      {/* Viewport Frame Toggle for Desktop Viewers */}
      <div className="hidden sm:flex items-center gap-2 mb-4 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-400 font-mono">
        <span>Preview Mode:</span>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
            isPhoneFrame ? 'bg-red-600 text-white font-bold' : 'hover:text-white'
          }`}
        >
          <Smartphone className="h-3 w-3" />
          <span>Mobile Device (Gym Floor)</span>
        </button>
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
            !isPhoneFrame ? 'bg-red-600 text-white font-bold' : 'hover:text-white'
          }`}
        >
          <Monitor className="h-3 w-3" />
          <span>Full Width</span>
        </button>
      </div>

      {/* Screen or Mobile Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[440px] rounded-[40px] border-4 border-zinc-800 bg-[#0d0d10] shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden min-h-[840px]'
            : 'max-w-2xl'
        }`}
      >
        {/* Device Notch simulation if in phone frame */}
        {isPhoneFrame && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-4 w-28 rounded-full bg-zinc-800/80" />
          </div>
        )}

        {!isPinAuthenticated ? <PinLogin /> : <FighterHome />}
      </div>
    </div>
  );
};
