'use client';

import React, { useEffect } from 'react';
import { useCampStore } from '@/lib/store';
import { Header } from '@/components/ui/Header';
import { FighterApp } from '@/components/fighter/FighterApp';

export default function FighterPage() {
  const { setRole, rehydrateFromStorage } = useCampStore();

  useEffect(() => {
    rehydrateFromStorage();
    setRole('fighter');
  }, [setRole, rehydrateFromStorage]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Header />
      <div className="flex-1">
        <FighterApp />
      </div>
    </div>
  );
}
