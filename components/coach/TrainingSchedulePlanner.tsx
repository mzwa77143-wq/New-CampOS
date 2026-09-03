'use client';

import React, { useState } from 'react';
import { useCampStore } from '@/lib/store';
import { TrainingSession, TrainingType } from '@/types/camp';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  Swords, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Zap
} from 'lucide-react';

export const TrainingSchedulePlanner: React.FC = () => {
  const { 
    selectedFighterId, 
    trainingSessions, 
    toggleWorkoutRound, 
    completeTrainingSession,
    addTrainingSession 
  } = useCampStore();

  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TrainingType>('sparring');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newDuration, setNewDuration] = useState(60);
  const [newRounds, setNewRounds] = useState(5);
  const [newRpe, setNewRpe] = useState(8);
  const [newNotes, setNewNotes] = useState('');

  const fighterSessions = trainingSessions.filter((s) => s.fighterId === selectedFighterId);

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const roundList = Array.from({ length: newRounds }, (_, i) => ({
      roundNumber: i + 1,
      durationMinutes: 5,
      completed: false,
    }));

    addTrainingSession({
      fighterId: selectedFighterId,
      date: new Date().toISOString().split('T')[0],
      time: newTime,
      title: newTitle,
      type: newType,
      durationMinutes: newDuration,
      targetRounds: newRounds,
      rounds: roundList,
      intensity: newRpe >= 8 ? 'High' : newRpe >= 5 ? 'Moderate' : 'Low',
      targetRpe: newRpe,
      coachNotes: newNotes,
    });

    setNewTitle('');
    setNewNotes('');
    setIsAddingSession(false);
  };

  const getTypeBadge = (type: TrainingType) => {
    switch (type) {
      case 'sparring':
        return { label: 'Hard Sparring', bg: 'bg-red-950/70 border-red-800/80 text-red-300', icon: Swords };
      case 'striking':
        return { label: 'Striking / Mitts', bg: 'bg-orange-950/70 border-orange-800/80 text-orange-300', icon: Zap };
      case 'wrestling_grappling':
        return { label: 'Wrestling / BJJ', bg: 'bg-purple-950/70 border-purple-800/80 text-purple-300', icon: Dumbbell };
      case 'strength_conditioning':
        return { label: 'S&C / Power', bg: 'bg-amber-950/70 border-amber-800/80 text-amber-300', icon: Dumbbell };
      case 'roadwork':
        return { label: 'Roadwork / Cardio', bg: 'bg-blue-950/70 border-blue-800/80 text-blue-300', icon: Clock };
      case 'recovery':
        return { label: 'Active Recovery', bg: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300', icon: Sparkles };
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 sm:p-5 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-red-500" />
          <div>
            <h3 className="font-bold text-base text-zinc-100 font-mono tracking-tight">
              Camp Training Regimen & Sparring
            </h3>
            <p className="text-xs text-zinc-400">
              Assigned fight camp rounds, target RPE, and live partner/cage feedback
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingSession(!isAddingSession)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-red-400" />
          <span>{isAddingSession ? 'Cancel' : '+ Add Session'}</span>
        </button>
      </div>

      {/* Add Session Form Dropdown */}
      {isAddingSession && (
        <form 
          onSubmit={handleAddSession}
          className="rounded-xl border border-red-500/40 bg-zinc-950 p-4 flex flex-col gap-3 shadow-glow-red"
        >
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
            Schedule New Fight Camp Session
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Session Title</label>
              <input
                type="text"
                required
                placeholder="e.g. 5x5 Title Sparring (Cage work)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Discipline Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as TrainingType)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="sparring">Hard Sparring</option>
                <option value="striking">Striking / Pads</option>
                <option value="wrestling_grappling">Wrestling & Grappling</option>
                <option value="strength_conditioning">Strength & Conditioning</option>
                <option value="roadwork">Roadwork / Aerobic</option>
                <option value="recovery">Active Recovery & Flush</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Scheduled Time</label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Target Rounds</label>
              <input
                type="number"
                min="1"
                max="12"
                value={newRounds}
                onChange={(e) => setNewRounds(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Target RPE Intensity (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newRpe}
                onChange={(e) => setNewRpe(parseInt(e.target.value) || 7)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                max="180"
                value={newDuration}
                onChange={(e) => setNewDuration(parseInt(e.target.value) || 60)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Tactical Coach Instructions</label>
            <input
              type="text"
              placeholder="e.g. Fresh southpaw partner for rounds 2 & 4. Strictly check calf kicks."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSession(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm & Assign
            </button>
          </div>
        </form>
      )}

      {/* Session Cards List */}
      <div className="flex flex-col gap-3">
        {fighterSessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
            No training sessions assigned for today yet. Click &quot;+ Add Session&quot; above to schedule.
          </div>
        ) : (
          fighterSessions.map((session) => {
            const badge = getTypeBadge(session.type);
            const Icon = badge.icon;
            const completedRoundsCount = session.rounds?.filter((r) => r.completed).length || 0;

            return (
              <div
                key={session.id}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  session.completed
                    ? 'bg-zinc-950/40 border-zinc-800/60 opacity-80'
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Row: Discipline, Time, Title, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${badge.bg}`}>
                      <Icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      {session.time} ({session.durationMinutes} min)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                      Target RPE: <span className="font-bold text-amber-400">{session.targetRpe}/10</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => completeTrainingSession(session.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-zinc-900 hover:bg-emerald-950 hover:text-emerald-400 hover:border-emerald-800 border border-zinc-800 text-zinc-300 transition-colors"
                      >
                        Mark All Done
                      </button>
                    )}
                  </div>
                </div>

                {/* Session Title */}
                <h4 className="font-bold text-sm text-white mt-2">
                  {session.title}
                </h4>

                {/* Coach Tactical Notes */}
                {session.coachNotes && (
                  <p className="text-xs text-zinc-400 mt-1 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-red-400 font-semibold font-mono">Coach: </span>
                    {session.coachNotes}
                  </p>
                )}

                {/* Interactive Rounds Checklist */}
                {session.rounds && session.rounds.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        Rounds Logged ({completedRoundsCount}/{session.rounds.length})
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Click round to toggle completion
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {session.rounds.map((round) => (
                        <div
                          key={round.roundNumber}
                          onClick={() => toggleWorkoutRound(session.id, round.roundNumber)}
                          className={`p-2 rounded-lg border cursor-pointer text-xs font-mono transition-all flex items-center justify-between ${
                            round.completed
                              ? 'bg-red-950/40 border-red-500/70 text-red-200'
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="font-bold">Round {round.roundNumber}</span>
                          {round.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-zinc-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fighter Post-Session Notes if logged */}
                {session.fighterNotes && (
                  <div className="mt-2.5 p-2 rounded bg-zinc-900/50 border border-zinc-800/50 text-[11px] text-zinc-300 italic flex items-center gap-1.5">
                    <span className="text-zinc-500 font-mono not-italic">Fighter debrief:</span>
                    <span>&quot;{session.fighterNotes}&quot;</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
