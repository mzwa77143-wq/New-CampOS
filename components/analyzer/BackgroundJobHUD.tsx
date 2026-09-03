'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCampStore } from '@/lib/store';
import { AnalysisJob } from '@/lib/ai/video-jobs';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  X, 
  ExternalLink,
  Sparkles,
  Video
} from 'lucide-react';

export const BackgroundJobHUD: React.FC = () => {
  const router = useRouter();
  const { 
    activeJobs, 
    completedJobs, 
    updateJob, 
    dismissJob, 
    setSelectedCompletedJobId, 
    fetchActiveJobs 
  } = useCampStore();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Poll server for live progress on active jobs
  const pollActiveJobs = useCallback(async () => {
    if (activeJobs.length === 0) return;

    for (const job of activeJobs) {
      try {
        const res = await fetch(`/api/v1/mma/jobs?jobId=${job.jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            updateJob(job.jobId, data.job);
          }
        }
      } catch (e) {
        // Network lag catch
      }
    }
  }, [activeJobs, updateJob]);

  // Initial jobs restore & periodic polling
  useEffect(() => {
    fetchActiveJobs();
  }, [fetchActiveJobs]);

  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      pollActiveJobs();
    }, 1200);

    return () => clearInterval(interval);
  }, [activeJobs.length, pollActiveJobs]);

  const totalJobsCount = activeJobs.length + completedJobs.length;
  if (totalJobsCount === 0) return null;

  const handleOpenJob = (job: AnalysisJob) => {
    setSelectedCompletedJobId(job.jobId);
    router.push(`/analyzer?jobId=${job.jobId}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm sm:max-w-md w-full transition-all duration-300">
      <div className="rounded-2xl border border-zinc-700 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        
        {/* Header Bar */}
        <div className="p-3 px-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeJobs.length > 0 ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            <span className="font-bold text-white tracking-tight">
              CampOS AI Pipeline {activeJobs.length > 0 ? `(${activeJobs.length} Processing)` : `(${completedJobs.length} Ready)`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
              title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Body List */}
        {!isMinimized && (
          <div className="p-3 flex flex-col gap-2.5 max-h-80 overflow-y-auto divide-y divide-zinc-900">
            
            {/* Active Jobs */}
            {activeJobs.map((job) => (
              <div key={job.jobId} className="pt-2 first:pt-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Video className="h-3.5 w-3.5 text-red-400" />
                    <span className="font-bold text-white">
                      {job.fighterName} &bull; R{job.roundNumber}
                    </span>
                  </div>
                  <span className="text-red-400 font-bold text-[11px]">
                    {job.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-400 h-1.5 transition-all duration-300"
                    style={{ width: `${Math.max(5, job.progress)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="truncate max-w-[260px] text-zinc-400">
                    {job.stage}
                  </span>
                  <Activity className="h-3 w-3 text-red-400 animate-spin shrink-0 ml-1" />
                </div>
              </div>
            ))}

            {/* Completed Jobs */}
            {completedJobs.map((job) => (
              <div key={job.jobId} className="pt-2.5 first:pt-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-bold text-white">
                      {job.fighterName} &bull; R{job.roundNumber}
                    </span>
                  </div>

                  {job.result && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300 font-bold">
                      Grade {job.result.grade} &bull; {job.result.overallScore}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <button
                    onClick={() => handleOpenJob(job)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white transition-all font-bold text-[11px]"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>View Breakdown</span>
                    <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-70" />
                  </button>

                  <button
                    onClick={() => dismissJob(job.jobId)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-all"
                    title="Dismiss notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};
