'use client';

import React, { useEffect, useState } from 'react';
import { useCampStore } from '@/lib/store';
import { Header } from '@/components/ui/Header';
import { CoachDashboard } from '@/components/coach/CoachDashboard';
import { FighterApp } from '@/components/fighter/FighterApp';
import { MMAVideoAnalyzer } from '@/components/analyzer/MMAVideoAnalyzer';

export default function Home() {
  const { currentRole, syncOfflineQueue, rehydrateFromStorage } = useCampStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    rehydrateFromStorage();
  }, [rehydrateFromStorage]);

  // Listen for browser online / offline network state changes
  useEffect(() => {
    const handleOnline = () => {
      useCampStore.setState((state) => ({
        syncStatus: {
          ...state.syncStatus,
          isOnline: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
        },
      }));
      syncOfflineQueue();
    };

    const handleOffline = () => {
      useCampStore.setState((state) => ({
        syncStatus: {
          ...state.syncStatus,
          isOnline: false,
        },
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Header />
      <div className="flex-1">
        {currentRole === 'coach' ? (
          <CoachDashboard />
        ) : currentRole === 'fighter' ? (
          <FighterApp />
        ) : (
          <MMAVideoAnalyzer />
        )}
      </div>
    </div>
  );
}
