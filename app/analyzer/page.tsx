'use client';

import React, { useEffect } from 'react';
import { useCampStore } from '@/lib/store';
import { Header } from '@/components/ui/Header';
import { MMAVideoAnalyzer } from '@/components/analyzer/MMAVideoAnalyzer';

export default function AnalyzerPage() {
  const { setRole, rehydrateFromStorage } = useCampStore();

  useEffect(() => {
    rehydrateFromStorage();
    setRole('analyzer');
  }, [setRole, rehydrateFromStorage]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Header />
      <div className="flex-1">
        <MMAVideoAnalyzer />
      </div>
    </div>
  );
}
