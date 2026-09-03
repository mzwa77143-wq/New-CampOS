'use client';

import React, { useRef, useState, useEffect } from 'react';
import { TechniqueMatchCard } from '@/types/video-search';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  FastForward, 
  Clock, 
  Maximize2, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';

interface VideoPlayerPanelProps {
  technique: TechniqueMatchCard;
  targetSeekTime?: number | null;
}

export const VideoPlayerPanel: React.FC<VideoPlayerPanelProps> = ({
  technique,
  targetSeekTime,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(technique.startTimeSeconds);
  const [duration, setDuration] = useState(technique.endTimeSeconds + 5);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(true);

  // Jump to start time whenever technique changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = technique.startTimeSeconds;
      setCurrentTime(technique.startTimeSeconds);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [technique.id, technique.startTimeSeconds]);

  // Handle external micro-phase seek requests
  useEffect(() => {
    if (targetSeekTime !== undefined && targetSeekTime !== null && videoRef.current) {
      videoRef.current.currentTime = targetSeekTime;
      setCurrentTime(targetSeekTime);
    }
  }, [targetSeekTime]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // If loop mode is enabled and current time exceeds slice end_time_seconds, clamp back to start_time_seconds
    if (isLooping && curr >= technique.endTimeSeconds) {
      videoRef.current.currentTime = technique.startTimeSeconds;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const jumpToStart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = technique.startTimeSeconds;
    setCurrentTime(technique.startTimeSeconds);
  };

  const stepFrame = (delta: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + delta);
  };

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <h3 className="font-bold text-base text-white font-mono leading-tight">
              {technique.techniqueName}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            {technique.eventTitle} &bull; {technique.fighterNames.join(' vs. ')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Slice: {formatSec(technique.startTimeSeconds)} - {formatSec(technique.endTimeSeconds)}
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 font-bold">
            {(technique.similarityScore * 100).toFixed(0)}% Match
          </span>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800/80 flex items-center justify-center">
        <video
          ref={videoRef}
          src={technique.videoUrl}
          poster={technique.thumbnailUrl}
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          className="h-full w-full object-contain"
        />

        {/* Overlay Slice Tag */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-700 text-[11px] font-mono text-zinc-200 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Active Window: [{technique.startTimeSeconds}s - {technique.endTimeSeconds}s]</span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-3 right-3 bg-black/75 backdrop-blur-md p-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Scrubber & Timeline Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="relative h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const newTime = pos * duration;
            if (videoRef.current) {
              videoRef.current.currentTime = newTime;
            }
          }}
        >
          {/* Target Slice Highlight Window */}
          <div
            className="absolute h-full bg-red-600/30 border-x-2 border-red-500 pointer-events-none"
            style={{
              left: `${(technique.startTimeSeconds / (duration || 1)) * 100}%`,
              width: `${((technique.endTimeSeconds - technique.startTimeSeconds) / (duration || 1)) * 100}%`,
            }}
          />

          {/* Current Playback Progress */}
          <div
            className="absolute h-full bg-red-500 transition-all pointer-events-none"
            style={{
              width: `${(currentTime / (duration || 1)) * 100}%`,
            }}
          />
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>{formatSec(currentTime)}</span>
          <span className="text-zinc-600">Slice: {technique.endTimeSeconds - technique.startTimeSeconds}s total</span>
          <span>{formatSec(duration || technique.endTimeSeconds + 5)}</span>
        </div>
      </div>

      {/* Control Bar: Play/Pause, Loop, Speed, Precision Step */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
        
        {/* Left: Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-glow-red transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
          </button>

          <button
            onClick={jumpToStart}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-all"
            title="Jump back to technique start point"
          >
            <RotateCcw className="h-3.5 w-3.5 text-red-400" />
            <span className="hidden sm:inline">Reset Slice</span>
          </button>

          {/* Frame Step */}
          <button
            onClick={() => stepFrame(-0.1)}
            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white"
            title="Step back 0.1s"
          >
            -0.1s
          </button>
          <button
            onClick={() => stepFrame(0.1)}
            className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white"
            title="Step forward 0.1s"
          >
            +0.1s
          </button>
        </div>

        {/* Center: Loop Clamp Toggle */}
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
            isLooping
              ? 'bg-red-950/70 border-red-500 text-red-300 shadow-glow-red'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="Continuously loop the technique slice"
        >
          <Repeat className="h-3.5 w-3.5" />
          <span>Loop Slice</span>
        </button>

        {/* Right: Slow Motion Rates */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {[0.25, 0.5, 0.75, 1.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                playbackRate === rate
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

      </div>

    </div>
  );
};
