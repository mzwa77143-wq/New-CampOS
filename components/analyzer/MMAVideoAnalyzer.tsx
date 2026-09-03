'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TechniqueMatchCard, 
  SearchResponse, 
  Discipline, 
  SparringInsightMatch,
  SearchRequest 
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
  Flame, 
  Zap,
  ArrowRight,
  UploadCloud,
  Database,
  Compass,
  ShieldAlert
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'times I got caught in an underhook',
  'dropped rear hand on hook',
  'high elbow guillotine counter against single leg',
  'blast double leg level change with posture break',
  'inside calf kick timing off jab feint',
  'check left hook counter to aggressive blitz',
  'flying knee interception vs telegraphed level change',
  'high crotch to double leg mat return',
];

export const MMAVideoAnalyzer: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'search' | 'sparring'>('search');
  const [queryText, setQueryText] = useState('times I got caught in an underhook');
  const [searchTarget, setSearchTarget] = useState<'all' | 'techniques' | 'insights'>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | 'All'>('All');
  const [minConfidence, setMinConfidence] = useState<number>(0.8);
  const [maxPostureAngle, setMaxPostureAngle] = useState<number>(60);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueMatchCard | null>(null);
  const [targetSeekTime, setTargetSeekTime] = useState<number | null>(null);

  const executeSearch = useCallback(
    async (
      queryOverride?: string, 
      disciplineOverride?: Discipline | 'All',
      targetOverride?: 'all' | 'techniques' | 'insights'
    ) => {
      const text = queryOverride !== undefined ? queryOverride : queryText;
      if (!text.trim()) return;

      setIsLoading(true);
      try {
        const payload: SearchRequest = {
          query_text: text,
          target: targetOverride !== undefined ? targetOverride : searchTarget,
          discipline: disciplineOverride !== undefined ? disciplineOverride : selectedDiscipline,
          min_confidence: minConfidence,
          max_posture_angle: maxPostureAngle,
          limit: 10,
        };

        console.log('[Analyzer Client: Search Request]', payload);

        const res = await fetch('/api/v1/mma/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Search failed with status ${res.status}`);
        }

        const data: SearchResponse = await res.json();
        console.log('[Analyzer Client: Search Results]', {
          totalMatches: data.total_matches,
          latencyMs: data.latency_ms,
          techniquesCount: data.results?.length || 0,
          insightsCount: data.insightMatches?.length || 0,
          fallbackApplied: data.fallback_applied,
        });
        setSearchResponse(data);

        if (data.results && data.results.length > 0) {
          setSelectedTechnique(data.results[0]);
        }
      } catch (err) {
        console.error('[Analyzer Client: Search Error]', err);
      } finally {
        setIsLoading(false);
      }
    },
    [queryText, selectedDiscipline, minConfidence, maxPostureAngle, searchTarget]
  );

  // Initial search load
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSelectSuggested = (prompt: string) => {
    console.log('[Analyzer Client: Selected Suggested Prompt]', prompt);
    setQueryText(prompt);
    executeSearch(prompt);
  };

  const handleDisciplineFilter = (disc: Discipline | 'All') => {
    console.log('[Analyzer Client: Discipline Filter Changed]', disc);
    setSelectedDiscipline(disc);
    executeSearch(undefined, disc);
  };

  const handleTargetChange = (target: 'all' | 'techniques' | 'insights') => {
    console.log('[Analyzer Client: Target Collection Changed]', target);
    setSearchTarget(target);
    executeSearch(undefined, undefined, target);
  };

  const handleSelectInsight = (insight: SparringInsightMatch) => {
    console.log('[Analyzer Client: Selected Sparring Insight]', {
      id: insight.id,
      title: insight.title,
      timestampSeconds: insight.timestampSeconds,
      similarityScore: insight.similarityScore,
    });
    setTargetSeekTime(insight.timestampSeconds);
    // If selected technique is not displaying, or we can align it
    if (insight.videoUrl && selectedTechnique) {
      setSelectedTechnique({
        ...selectedTechnique,
        videoUrl: insight.videoUrl,
        startTimeSeconds: Math.max(0, insight.timestampSeconds - 2),
        endTimeSeconds: insight.timestampSeconds + 4,
        techniqueName: insight.title,
      });
    }
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
          <Search className="h-4 w-4" />
          <span>Semantic MMA Video Search (Qdrant)</span>
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
          <span>Sparring Video Upload &amp; AI Multimodal Feedback</span>
        </button>
      </div>

      {activeMode === 'sparring' ? (
        <SparringVideoUploader />
      ) : (
        <>
          {/* Top Control Center: Search & Taxonomy Filter Header */}
          <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 shadow-xl flex flex-col gap-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-red-500">
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/80">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                    Semantic MMA Video Search &amp; Biomechanics
                  </h1>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Natural language vector retrieval across indexed technical framework and sparring insights powered by Qdrant
                </p>
              </div>

              {searchResponse && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 font-bold">
                    {searchResponse.latency_ms}ms Vector Retrieval
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {searchResponse.total_matches} Matched Vectors
                  </span>
                </div>
              )}
            </div>

            {/* Target Collection Switcher */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500 uppercase text-[10px]">Target Collection:</span>
              <button
                type="button"
                onClick={() => handleTargetChange('all')}
                className={`px-3 py-1 rounded-xl border transition-all ${
                  searchTarget === 'all'
                    ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                All Vectors
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange('techniques')}
                className={`px-3 py-1 rounded-xl border transition-all ${
                  searchTarget === 'techniques'
                    ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Technique Framework (mma_technical_framework)
              </button>
              <button
                type="button"
                onClick={() => handleTargetChange('insights')}
                className={`px-3 py-1 rounded-xl border transition-all ${
                  searchTarget === 'insights'
                    ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Sparring Archive Insights (sparring_insights)
              </button>
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
                  placeholder="Search combat movements (e.g. 'times I got caught in an underhook', 'dropped rear hand', 'high elbow guillotine')..."
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
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Sparring Archive Insights Section */}
              {searchResponse?.insightMatches && searchResponse.insightMatches.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      Sparring Archive Insights (Qdrant `sparring_insights`) ({searchResponse.insightMatches.length})
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">Vector Cosine Match</span>
                  </div>

                  <div className="space-y-2.5">
                    {searchResponse.insightMatches.map((ins) => (
                      <div
                        key={ins.id}
                        onClick={() => handleSelectInsight(ins)}
                        className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 hover:border-amber-500/70 cursor-pointer transition-all flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400 font-mono font-bold text-[11px]">
                              {ins.timestampSeconds}s
                            </span>
                            <span className="font-bold text-xs text-white font-mono">
                              {ins.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                            {(ins.similarityScore * 100).toFixed(0)}%
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {ins.observation}
                        </p>

                        <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-emerald-300">
                          <span className="font-bold font-mono text-emerald-400 block mb-0.5">Correction:</span>
                          {ins.correction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Framework Matches Section */}
              {searchResponse?.results && searchResponse.results.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-red-500" />
                      Ranked Vector Matches ({searchResponse.results.length})
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-500">Cosine Similarity</span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-1">
                    {searchResponse.results.map((item) => {
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

                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed pt-2 border-t border-zinc-800/60">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </>
      )}

    </div>
  );
};
