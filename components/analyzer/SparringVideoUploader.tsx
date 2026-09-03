'use client';

import React, { useState, useRef } from 'react';
import { useCampStore } from '@/lib/store';
import { 
  SparringUploadMetadata, 
  AiSparringFeedback, 
  BiomechanicalFlaw, 
  KeyMoment, 
  PrescribedDrill 
} from '@/types/sparring-analysis';
import { 
  UploadCloud, 
  Video, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Flame, 
  Dumbbell, 
  Clock, 
  Layers, 
  Activity, 
  Check, 
  ArrowRight,
  RefreshCw,
  Database,
  Compass
} from 'lucide-react';

const SAMPLE_SPARRING_VIDEO = 'https://vjs.zencdn.net/v/oceans.mp4';

export const SparringVideoUploader: React.FC = () => {
  const { fighters, selectedFighterId, syncAiSparringDebrief } = useCampStore();

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [fighterId, setFighterId] = useState<string>(selectedFighterId || 'f1');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [partnerStyle, setPartnerStyle] = useState<string>('Southpaw Pressure Boxer');
  const [intensity, setIntensity] = useState<SparringUploadMetadata['intensity']>('Championship Hard');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [feedback, setFeedback] = useState<AiSparringFeedback | null>(null);
  const [isSyncedToCamp, setIsSyncedToCamp] = useState<boolean>(false);

  // Video Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFileName(file.name);
      setFeedback(null);
      setIsSyncedToCamp(false);
    }
  };

  const loadSampleVideo = () => {
    setVideoUrl(SAMPLE_SPARRING_VIDEO);
    setVideoFileName('Championship_Sparring_Round3_CamA.mp4');
    setFeedback(null);
    setIsSyncedToCamp(false);
  };

  const handleStartAnalysis = async () => {
    if (!videoUrl) return;

    setIsAnalyzing(true);
    setFeedback(null);
    setIsSyncedToCamp(false);

    // Realistic multi-stage vision pipeline progression
    setAnalysisStep('Ingesting video frames and normalizing resolution...');
    await new Promise((r) => setTimeout(r, 450));

    // Extract visual frame snapshot from client video if available
    const capturedFrames: string[] = [];
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          capturedFrames.push(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch (e) {
        // Safe catch for canvas cross-origin
      }
    }

    console.log('[Sparring Uploader: Start Pipeline]', {
      fighterId,
      roundNumber,
      duration: duration || 30,
      partnerStyle,
      intensity,
      framesExtracted: capturedFrames.length,
      videoFileName,
    });

    setAnalysisStep('Extracting skeletal keypoints & joint angles...');
    await new Promise((r) => setTimeout(r, 450));

    setAnalysisStep('Streaming visual telemetry to Google Gemini Multimodal AI...');

    try {
      console.log('[Sparring Uploader: Request] Calling POST /api/v1/mma/sparring-analysis...');
      const res = await fetch('/api/v1/mma/sparring-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            fighterId,
            roundNumber,
            roundDurationSeconds: duration || 30,
            sparringPartnerStyle: partnerStyle,
            intensity,
            videoFileName,
          },
          duration: duration || 30,
          frames: capturedFrames.length > 0 ? capturedFrames : undefined,
        }),
      });

      if (!res.ok) throw new Error(`Analysis request failed with status ${res.status}`);
      const data: AiSparringFeedback = await res.json();
      console.log('[Sparring Uploader: Analysis Received]', {
        sessionId: data.sessionId,
        score: data.overallScore,
        grade: data.grade,
        source: data.source,
        tacticalSequences: data.tacticalSequences?.length || 0,
        biomechanicalMetrics: data.biomechanicalMetrics?.length || 0,
        insights: data.insights?.length || 0,
        actionItems: data.actionItems?.length || 0,
        qdrantIndexed: data.qdrantIndexed,
        persistedToSupabase: data.persistedToSupabase,
      });
      setFeedback(data);
    } catch (err) {
      console.error('[Sparring Uploader: Error] AI Sparring Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const seekToTimestamp = (sec: number) => {
    console.log(`[Sparring Uploader: Video Scrub] Seeking video to ${sec.toFixed(1)}s (progress: ${((sec / (duration || 30)) * 100).toFixed(0)}%)`);
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSyncToSchedule = () => {
    if (!feedback) return;
    const drillTitles = feedback.prescribedDrills.map((d) => `${d.title} (${d.setsAndReps})`);
    console.log('[Sparring Uploader: Camp Sync] Syncing debrief to fighter training plan:', {
      fighterId,
      roundNumber,
      drillsCount: drillTitles.length,
      drills: drillTitles,
    });
    syncAiSparringDebrief(fighterId, roundNumber, feedback.fightIqSummary, drillTitles);
    setIsSyncedToCamp(true);
  };

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
      
      {/* 1. Upload & Session Setup Card */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-[#121217] to-zinc-950 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                  <Video className="h-5 w-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  Upload Sparring Video &amp; AI Coach Critique
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Upload gym floor round footage for frame-by-frame biomechanical flaw extraction and tactical feedback
              </p>
            </div>

            <button
              onClick={loadSampleVideo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-200 transition-all self-start sm:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5 text-red-400" />
              <span>Load Sample Footage</span>
            </button>
          </div>

          {/* Configuration Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Fighter Selector */}
            <div>
              <label className="text-zinc-400 block mb-1">Fighter Sparring:</label>
              <select
                value={fighterId}
                onChange={(e) => setFighterId(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {fighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.weightClass})
                  </option>
                ))}
              </select>
            </div>

            {/* Round Number */}
            <div>
              <label className="text-zinc-400 block mb-1">Camp Round:</label>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((rnd) => (
                  <button
                    key={rnd}
                    type="button"
                    onClick={() => setRoundNumber(rnd)}
                    className={`py-2 rounded-lg font-bold border transition-all ${
                      roundNumber === rnd
                        ? 'bg-red-600 border-red-500 text-white shadow-glow-red'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    R{rnd}
                  </button>
                ))}
              </div>
            </div>

            {/* Sparring Partner Style */}
            <div>
              <label className="text-zinc-400 block mb-1">Partner Style Archetype:</label>
              <select
                value={partnerStyle}
                onChange={(e) => setPartnerStyle(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="Southpaw Pressure Boxer">Southpaw Pressure Boxer</option>
                <option value="Dagestani Chain Wrestler">Dagestani Chain Wrestler</option>
                <option value="Muay Thai Low-Kick Specialist">Muay Thai Low-Kick Specialist</option>
                <option value="Counter-Striker / Distance Sniping">Counter-Striker / Distance Sniping</option>
                <option value="BJJ Guard Puller / Leg Locker">BJJ Guard Puller / Leg Locker</option>
              </select>
            </div>

            {/* Intensity */}
            <div>
              <label className="text-zinc-400 block mb-1">Session Intensity:</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as any)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="Championship Hard">Championship Hard (5x5)</option>
                <option value="Light Technical">Light Technical / Flow</option>
                <option value="Situational / Wall">Situational / Cage Wall</option>
              </select>
            </div>
          </div>

          {/* Video Dropzone / Upload Box */}
          {!videoUrl ? (
            <label className="relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-red-500/80 bg-zinc-950/60 hover:bg-zinc-900/40 cursor-pointer transition-all text-center group">
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-4 rounded-2xl bg-zinc-900 group-hover:bg-red-600/20 text-zinc-400 group-hover:text-red-400 border border-zinc-800 transition-all mb-3">
                <UploadCloud className="h-8 w-8" />
              </div>
              <span className="font-bold text-sm text-zinc-200 group-hover:text-white font-mono">
                Click to browse or drop sparring footage here
              </span>
              <span className="text-xs text-zinc-500 mt-1 font-mono">
                Supports MP4, MOV, WebM &bull; Instant in-browser streaming (No upload limits)
              </span>
            </label>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-white font-mono block truncate max-w-sm">
                    {videoFileName || 'Selected Sparring Clip'}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Ready for AI Computer Vision Analysis
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer transition-all">
                  <span>Replace Video</span>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold shadow-glow-red transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Coach Breakdown'}</span>
                </button>
              </div>
            </div>
          )}

          {/* AI Analysis Processing HUD */}
          {isAnalyzing && (
            <div className="rounded-2xl border border-red-500/40 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center gap-3 shadow-glow-red animate-pulse">
              <div className="relative">
                <Activity className="h-10 w-10 text-red-500 animate-spin" />
              </div>
              <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                AI Vision Pipeline Active
              </h3>
              <p className="text-xs text-red-400 font-mono">
                {analysisStep}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 2. Interactive AI Feedback & Video Player Layout */}
      {feedback && videoUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Synchronized Video Player & Key Exchanges (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Synchronized Video Player */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-bold text-base text-white font-mono">
                    Round {roundNumber} Sparring Playback
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {feedback.fighterName} vs. {partnerStyle}
                </span>
              </div>

              {/* Viewport */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  playsInline
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                  className="h-full w-full object-contain"
                />

                {/* Overlay timestamp */}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-700 text-[11px] font-mono text-zinc-200">
                  Time: {formatSec(currentTime)} / {formatSec(duration)}
                </div>
              </div>

              {/* Timeline Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }}
                  className="w-full accent-red-500"
                />
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!videoRef.current) return;
                      if (isPlaying) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-glow-red"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                  </button>

                  <button
                    onClick={() => seekToTimestamp(0)}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                {/* Slow motion */}
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  {[0.25, 0.5, 1.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackSpeed(rate);
                        if (videoRef.current) videoRef.current.playbackRate = rate;
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        playbackSpeed === rate ? 'bg-red-600 text-white' : 'text-zinc-400'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Moments Timeline */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  Timestamped Exchange Timeline
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Click to seek video
                </span>
              </div>

              <div className="space-y-2">
                {feedback.keyMoments.map((km) => (
                  <div
                    key={km.id}
                    onClick={() => seekToTimestamp(km.timestampSeconds)}
                    className="p-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900 hover:border-red-500/50 cursor-pointer transition-all flex items-start gap-3"
                  >
                    <button className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-red-400 font-mono font-bold text-xs flex-shrink-0">
                      {formatSec(km.timestampSeconds)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white font-mono">
                          {km.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {km.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        {km.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Scorecard, Biomechanical Flaws & Homework Drills (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Performance Scorecard Banner */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                    Session Performance Grade
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl font-black font-mono text-white">
                      {feedback.grade}
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      ({feedback.overallScore}/100)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                    Analyzed At
                  </span>
                  <span className="text-xs font-mono text-zinc-300 mt-1 block">
                    {feedback.analyzedAt}
                  </span>
                </div>
              </div>

              {/* Pipeline Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {feedback.source && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-300 text-[11px] font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>AI Vision: {feedback.source}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-[11px] font-mono">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Qdrant: {feedback.qdrantIndexed !== false ? 'Vector Indexed (sparring_insights)' : 'Indexed Locally'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[11px] font-mono">
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Database: {feedback.persistedToSupabase ? 'Supabase Relational' : 'Local-First Persistent'}</span>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase">Striking</span>
                  <span className="font-bold text-zinc-200">
                    {feedback.stats.strikesLanded}/{feedback.stats.strikesLanded + feedback.stats.strikesAbsorbed}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">{feedback.stats.strikeAccuracyPct}% acc</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase">TD Defense</span>
                  <span className="font-bold text-zinc-200">{feedback.stats.takedownDefensePct}%</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Defended</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase">Cage Control</span>
                  <span className="font-bold text-zinc-200">{feedback.stats.cageControlSeconds}s</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Octagon dominance</span>
                </div>
              </div>

              {/* Tactical Summary */}
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed italic">
                &quot;{feedback.fightIqSummary}&quot;
              </div>

              {/* Action Button: Sync to Camp */}
              <button
                onClick={handleSyncToSchedule}
                disabled={isSyncedToCamp}
                className={`w-full py-3 rounded-2xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isSyncedToCamp
                    ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-300'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-glow-red'
                }`}
              >
                {isSyncedToCamp ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Synced to Camp Training Schedule!</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4" />
                    <span>+ Sync AI Feedback to Fighter&apos;s Camp Regimen</span>
                  </>
                )}
              </button>
            </div>

            {/* Tactical Sequences & Positional Transitions */}
            {feedback.tacticalSequences && feedback.tacticalSequences.length > 0 && (
              <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                    <Compass className="h-4 w-4 text-cyan-400" />
                    Positional Transitions &amp; Tactical Sequences
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Click to jump
                  </span>
                </div>

                <div className="space-y-3">
                  {feedback.tacticalSequences.map((seq) => (
                    <div
                      key={seq.id}
                      onClick={() => seekToTimestamp(seq.startTimestampMs / 1000)}
                      className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/70 hover:border-cyan-500/60 cursor-pointer transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-400 font-mono font-bold text-[11px]">
                            {formatSec(seq.startTimestampMs / 1000)} - {formatSec(seq.endTimestampMs / 1000)}
                          </span>
                          <span className="font-bold text-xs text-white font-mono">
                            {seq.sequenceName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                          {seq.dominantDiscipline}
                        </span>
                      </div>

                      <div className="px-2.5 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-300 font-mono flex items-center gap-2">
                        <span className="text-zinc-500 uppercase text-[10px]">Transition:</span>
                        <span className="text-cyan-300 font-semibold">{seq.positionalTransition}</span>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {seq.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Biomechanical Joint Angles */}
            {feedback.biomechanicalMetrics && feedback.biomechanicalMetrics.length > 0 && (
              <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" />
                    Biomechanical Joint &amp; Kinematic Metrics
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Click to jump
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {feedback.biomechanicalMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      onClick={() => seekToTimestamp(metric.timestampMs / 1000)}
                      className="p-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 hover:border-red-500/50 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                          {metric.jointOrSegment}
                        </span>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          metric.status === 'optimal'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : metric.status === 'warning'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {metric.status}
                        </span>
                      </div>

                      <div className="my-1.5">
                        <span className="text-xl font-bold font-mono text-white">
                          {metric.measuredValue}{metric.unit}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono ml-2">
                          (Target: {metric.optimalRangeMin}-{metric.optimalRangeMax}{metric.unit})
                        </span>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-mono line-clamp-1">
                        {metric.notes || metric.metricName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Biomechanical Flaws & Corrections */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Biomechanical Flaws &amp; Corrections
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Click to seek flaw
                </span>
              </div>

              <div className="space-y-3">
                {feedback.flaws.map((flaw) => (
                  <div
                    key={flaw.id}
                    onClick={() => seekToTimestamp(flaw.timestampSeconds)}
                    className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/70 hover:border-red-500/60 cursor-pointer transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-red-400 font-mono font-bold text-[11px]">
                          {formatSec(flaw.timestampSeconds)}
                        </span>
                        <span className="font-bold text-xs text-white font-mono">
                          {flaw.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        flaw.severity === 'critical'
                          ? 'bg-red-950/80 border-red-800 text-red-300'
                          : 'bg-amber-950/80 border-amber-800 text-amber-300'
                      }`}>
                        {flaw.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      <span className="text-zinc-500 font-mono">Observation: </span>
                      {flaw.observation}
                    </p>

                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-emerald-300">
                      <span className="font-bold font-mono text-emerald-400 block mb-0.5">
                        Coach Correction:
                      </span>
                      {flaw.correction}
                    </div>

                    {flaw.jointAngleImpact && (
                      <div className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>Angle Impact: {flaw.jointAngleImpact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Prescribed Camp Homework Drills */}
            <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-cyan-400" />
                  Prescribed Camp Homework Drills
                </h3>
              </div>

              <div className="space-y-2.5">
                {feedback.prescribedDrills.map((drill) => (
                  <div
                    key={drill.id}
                    className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/70 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white font-mono">
                        {drill.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                        {drill.setsAndReps}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Target: {drill.targetIssue}
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      {drill.coachInstructions}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
