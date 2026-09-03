'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TechniqueMatchCard, 
  SearchResponse, 
  Discipline, 
  Stance 
} from '@/types/video-search';
import { VideoPlayerPanel } from './VideoPlayerPanel';
import { BiomechanicalInspector } from './BiomechanicalInspector';
import { SparringVideoUploader } from './SparringVideoUploader';
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  Flame, 
  Zap,
  Tag,
  ArrowRight,
  UploadCloud,
  Database
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'high elbow guillotine counter against single leg',
  'blast double leg level change with posture break',
  'inside calf kick timing off jab feint',
  'overhand right transition into body lock',
  'overhook butterfly guard sweep with head trap',
  'check left hook counter to aggressive blitz',
  'flying knee interception vs telegraphed level change',
  'high crotch to double leg mat return',
];

export const MMAVideoAnalyzer: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'search' | 'sparring'>('search');
  const [queryText, setQueryText] = useState('high elbow guillotine counter against single leg');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | 'All'>('All');
  const [minConfidence, setMinConfidence] = useState<number>(0.8);
  const [maxPostureAngle, setMaxPostureAngle] = useState<number>(60);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueMatchCard | null>(null);
  const [targetSeekTime, setTargetSeekTime] = useState<number | null>(null);

  const executeSearch = useCallback(async (queryOverride?: string, disciplineOverride?: Discipline | 'All') => {
    const text = queryOverride !== undefined ? queryOverride : queryText;
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const payload = {
        query_text: text,
        discipline: disciplineOverride !== undefined ? disciplineOverride : selectedDiscipline,
        min_confidence: minConfidence,
        max_posture_angle: maxPostureAngle,
        limit: 10,
      };

      const res = await fetch('/api/v1/mma/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Search failed with status ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setSearchResponse(data);

      if (data.results && data.results.length > 0) {
        setSelectedTechnique(data.results[0]);
      }
    } catch (err) {
      console.error('Vector search request error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryText, selectedDiscipline, minConfidence, maxPostureAngle]);

  // Initial search load
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSelectSuggested = (prompt: string) => {
    setQueryText(prompt);
    executeSearch(prompt);
  };

  const handleDisciplineFilter = (disc: Discipline | 'All') => {
    setSelectedDiscipline(disc);
    executeSearch(undefined, disc);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
      
      {/* Sub-Feature Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 self-start bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveMode('search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeMode === 'search'
              ? 'bg-red-600 text-white shadow-glow-red'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Semantic Technique Search (Qdrant)</span>
        </button>

        <button
          onClick={() => setActiveMode('sparring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeMode === 'sparring'
              ? 'bg-red-600 text-white shadow-glow-red'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Sparring Video &amp; AI Coach</span>
        </button>
      </div>

      {activeMode === 'sparring' ? (
        <SparringVideoUploader />
      ) : (
        <>
          {/* 1. Search & Filter Header Banner */}
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-[#121217] to-zinc-950 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                  <Zap className="h-5 w-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  Semantic MMA Video Search &amp; Biomechanics
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Natural language vector retrieval over indexed fight archives powered by Qdrant
              </p>
            </div>

            {searchResponse && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 font-bold">
                  {searchResponse.latency_ms}ms Vector Retrieval
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {searchResponse.total_matches} Indexed Slices
                </span>
              </div>
            )}
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch();
            }}
            className="flex items-center gap-2 w-full"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search semantic combat movement (e.g., 'high elbow guillotine counter vs single leg', 'inside calf kick timing')..."
                className="w-full rounded-2xl bg-zinc-900/90 border border-zinc-700/80 pl-12 pr-4 py-3.5 text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`p-3.5 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                showFiltersDrawer
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              title="Toggle Biomechanical Threshold Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Angles</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-sm shadow-glow-red transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLoading ? 'Vectorizing...' : 'Search'}</span>
            </button>
          </form>

          {/* Suggested Natural Language Query Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono uppercase text-zinc-500">
              Try Prompts:
            </span>
            {SUGGESTED_QUERIES.slice(0, 4).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggested(prompt)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-red-950/40 border border-zinc-800 hover:border-red-600 text-zinc-400 hover:text-red-300 transition-all text-left"
              >
                &quot;{prompt}&quot;
              </button>
            ))}
          </div>

          {/* Discipline Facet Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] font-mono uppercase text-zinc-400 mr-1">
              Discipline:
            </span>
            {(['All', 'Grappling', 'Striking', 'Ground', 'Clinch'] as const).map((disc) => (
              <button
                key={disc}
                onClick={() => handleDisciplineFilter(disc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                  selectedDiscipline === disc
                    ? 'bg-red-600 border-red-500 text-white shadow-glow-red'
                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>

          {/* Biomechanical Angles Filter Drawer */}
          {showFiltersDrawer && (
            <div className="mt-2 p-4 rounded-2xl bg-zinc-950 border border-red-500/40 shadow-glow-red grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300">Max Posture Angle (° of spine flexion):</span>
                  <span className="font-bold text-red-400">&le; {maxPostureAngle}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={maxPostureAngle}
                  onChange={(e) => setMaxPostureAngle(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Filters for low postures, penetration drops, or defensive level shifts.
                </span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300">Minimum Model Confidence:</span>
                  <span className="font-bold text-amber-400">{(minConfidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.98"
                  step="0.02"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Threshold for keypoint detection confidence.
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fallback Badge Notice if strict filters were relaxed */}
      {searchResponse?.fallback_applied && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/25 p-4 flex items-center gap-3 text-xs text-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold font-mono uppercase block">
              Filter Relaxation Notice
            </span>
            <p className="text-[11px] text-amber-300/90 mt-0.5">
              {searchResponse.fallback_reason || 'Showing nearest matches without strict filters.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Stage: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center: Interactive Video Player & Telemetry (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedTechnique ? (
            <>
              <VideoPlayerPanel
                technique={selectedTechnique}
                targetSeekTime={targetSeekTime}
              />
              <BiomechanicalInspector
                telemetry={selectedTechnique.biomechanicalData}
                techniqueName={selectedTechnique.techniqueName}
                onSeekToPhase={(time) => setTargetSeekTime(time)}
              />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 font-mono text-xs">
              No technique selected. Perform a search to analyze video slices.
            </div>
          )}
        </div>

        {/* Right: Matches Grid / Results Stream (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-red-500" />
              Ranked Vector Matches ({searchResponse?.results.length || 0})
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">Cosine Similarity</span>
          </div>

          <div className="flex flex-col gap-3 max-h-[1050px] overflow-y-auto pr-1">
            {searchResponse?.results.map((item) => {
              const isSelected = selectedTechnique?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedTechnique(item);
                    setTargetSeekTime(item.startTimeSeconds);
                  }}
                  className={`group rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 flex flex-col gap-2.5 ${
                    isSelected
                      ? 'bg-zinc-900 border-red-500 shadow-glow-red'
                      : 'bg-zinc-950/70 border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail with Timestamp overlay */}
                    <div className="relative h-20 w-28 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl}
                        alt={item.techniqueName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-200">
                        {item.startTimeSeconds}s - {item.endTimeSeconds}s
                      </span>
                    </div>

                    {/* Technique Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors line-clamp-1">
                          {item.techniqueName}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                          {(item.similarityScore * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                        {item.fighterNames.join(' vs. ')} &bull; {item.eventTitle}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {item.discipline}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {item.stance} Stance
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          Posture: {item.biomechanicalData.postureAngleDeg}°
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Synopsis Description */}
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed pt-2 border-t border-zinc-800/60">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
        </>
      )}

    </div>
  );
};
