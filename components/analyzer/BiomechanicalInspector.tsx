'use client';

import React from 'react';
import { BiomechanicalTelemetry, CheckpointItem } from '@/types/video-search';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Compass, 
  Gauge, 
  Zap, 
  Move
} from 'lucide-react';

interface BiomechanicalInspectorProps {
  telemetry: BiomechanicalTelemetry;
  techniqueName: string;
  onSeekToPhase?: (timestamp: number) => void;
}

export const BiomechanicalInspector: React.FC<BiomechanicalInspectorProps> = ({
  telemetry,
  techniqueName,
  onSeekToPhase,
}) => {
  const getStatusIcon = (status: CheckpointItem['status']) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    }
  };

  const getStatusBg = (status: CheckpointItem['status']) => {
    switch (status) {
      case 'optimal':
        return 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300';
      case 'warning':
        return 'border-amber-900/50 bg-amber-950/20 text-amber-300';
      case 'critical':
        return 'border-red-900/50 bg-red-950/20 text-red-300';
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          <h3 className="font-bold text-sm text-white font-mono tracking-tight">
            Biomechanical Telemetry & Angles
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-300">
          Kinematic Tracking
        </span>
      </div>

      {/* Joint Angle Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        {/* Lead Knee Flexion */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-mono tracking-wider">Knee Flexion</span>
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-cyan-400">
              {telemetry.leadKneeFlexionDeg}°
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Lead Joint Load</span>
        </div>

        {/* Hip Extension */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-mono tracking-wider">Hip Extension</span>
            <Compass className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-purple-400">
              {telemetry.hipExtensionDeg}°
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Pelvic Drive Arc</span>
        </div>

        {/* Posture / Spine Angle */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-mono tracking-wider">Spine Posture</span>
            <Move className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-amber-400">
              {telemetry.postureAngleDeg}°
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {telemetry.postureAngleDeg <= 30 ? 'Rigid / Intact' : 'Broken Forward'}
          </span>
        </div>

        {/* Angular Velocity */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-mono tracking-wider">Angular Speed</span>
            <Zap className="h-3.5 w-3.5 text-red-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-red-400">
              {telemetry.angularVelocityDegPerSec}
              <span className="text-xs text-zinc-500 font-sans font-normal ml-0.5">°/s</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Rotational Torque</span>
        </div>

      </div>

      {/* Micro-Phase Scrubbers if available */}
      {telemetry.keyPhases && telemetry.keyPhases.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
            Technique Micro-Phases (Jump &amp; Analyze):
          </span>
          <div className="flex flex-wrap gap-2">
            {telemetry.keyPhases.map((phase, idx) => (
              <button
                key={idx}
                onClick={() => onSeekToPhase && onSeekToPhase(phase.timestamp)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span className="text-red-500 text-[10px]">{phase.timestamp.toFixed(1)}s</span>
                <span>{phase.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Technical Execution Checkpoints */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 block mb-2.5">
          Key Execution Checkpoints ({telemetry.checkpoints.length})
        </span>

        <div className="space-y-2">
          {telemetry.checkpoints.map((cp, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${getStatusBg(
                cp.status
              )}`}
            >
              {getStatusIcon(cp.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-zinc-200">{cp.label}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900/60 text-zinc-400">
                    {cp.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">{cp.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Injury Risk Assessment */}
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-3 text-xs flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold font-mono text-red-300 uppercase block text-[11px]">
            Biomechanical Safety Assessment
          </span>
          <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
            {telemetry.injuryRiskAssessment}
          </p>
        </div>
      </div>

    </div>
  );
};
