'use client';

import React, { useState } from 'react';
import { useCampStore } from '@/lib/store';
import { TrainingSession } from '@/types/camp';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Swords, 
  Flame, 
  Send, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const WorkoutChecklist: React.FC = () => {
  const { 
    selectedFighterId, 
    trainingSessions, 
    toggleWorkoutRound, 
    completeTrainingSession 
  } = useCampStore();

  const [activeNoteSessionId, setActiveNoteSessionId] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [feedbackRpe, setFeedbackRpe] = useState<number>(8);

  const sessions = trainingSessions.filter((s) => s.fighterId === selectedFighterId);

  const handleOpenDebrief = (session: TrainingSession) => {
    setActiveNoteSessionId(session.id);
    setFeedbackNote(session.fighterNotes || '');
    setFeedbackRpe(session.actualRpe || session.targetRpe);
  };

  const handleSaveDebrief = (sessionId: string) => {
    completeTrainingSession(sessionId, feedbackRpe, feedbackNote);
    setActiveNoteSessionId(null);
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-red-500" />
          <h3 className="font-bold text-base text-zinc-100 font-mono">
            Assigned Camp Sessions
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {sessions.filter((s) => s.completed).length} / {sessions.length} Done
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
          No training assigned for today yet. Rest and recover!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const completedRounds = session.rounds?.filter((r) => r.completed).length || 0;
            const totalRounds = session.rounds?.length || 0;

            return (
              <div
                key={session.id}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  session.completed
                    ? 'bg-zinc-950/40 border-zinc-800/80 opacity-85'
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      {session.time}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                      RPE {session.targetRpe}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenDebrief(session)}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-red-400"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>{session.fighterNotes ? 'Edit Debrief' : '+ Add Note'}</span>
                  </button>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-white mt-1.5">
                  {session.title}
                </h4>

                {/* Coach Note */}
                {session.coachNotes && (
                  <p className="text-xs text-zinc-400 mt-1 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60">
                    <span className="text-red-400 font-bold font-mono">Coach Instruction: </span>
                    {session.coachNotes}
                  </p>
                )}

                {/* Round-by-Round Touch Checkboxes */}
                {session.rounds && session.rounds.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase text-zinc-400">
                        Check Off Rounds ({completedRounds}/{totalRounds})
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {session.rounds.map((round) => (
                        <button
                          key={round.roundNumber}
                          onClick={() => toggleWorkoutRound(session.id, round.roundNumber)}
                          className={`py-2 px-1 rounded-xl border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all ${
                            round.completed
                              ? 'bg-red-600 border-red-500 text-white shadow-glow-red'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span>R{round.roundNumber}</span>
                          {round.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mt-1" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 mt-1 text-zinc-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Complete / Status Row */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                  {session.fighterNotes ? (
                    <span className="text-[11px] text-zinc-400 italic truncate max-w-[200px]">
                      &quot;{session.fighterNotes}&quot;
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">
                      {session.completed ? 'Session finished' : 'Tap rounds as you complete'}
                    </span>
                  )}

                  {!session.completed ? (
                    <button
                      onClick={() => completeTrainingSession(session.id)}
                      className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-emerald-950 border border-zinc-700 hover:border-emerald-700 text-xs font-mono font-bold text-emerald-400 transition-all"
                    >
                      Mark All Complete
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Done & Synced
                    </span>
                  )}
                </div>

                {/* Debrief Note Drawer */}
                {activeNoteSessionId === session.id && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 flex flex-col gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-red-400">
                      Post-Session Debrief for Coach
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">Actual RPE (1-10):</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={feedbackRpe}
                        onChange={(e) => setFeedbackRpe(parseInt(e.target.value) || 8)}
                        className="w-16 rounded bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white font-mono text-center"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. Left shoulder felt fatigued after round 4. Good sparring rhythm."
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveNoteSessionId(null)}
                        className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveDebrief(session.id)}
                        className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Save & Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
