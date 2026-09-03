import { 
  SparringUploadMetadata, 
  AiSparringFeedback, 
  BiomechanicalFlaw, 
  KeyMoment, 
  PrescribedDrill, 
  SessionStats 
} from '@/types/sparring-analysis';

export function generateAiSparringFeedback(
  metadata: SparringUploadMetadata,
  actualDurationSeconds: number = 30
): AiSparringFeedback {
  const duration = actualDurationSeconds > 5 ? actualDurationSeconds : 30;
  const isHardIntensity = metadata.intensity === 'Championship Hard';

  // Fighter-specific contextualization
  let fighterName = 'Alex Silva';
  if (metadata.fighterId === 'f2') fighterName = 'Sean Martinez';
  else if (metadata.fighterId === 'f3') fighterName = 'Valentina Santos';
  else if (metadata.fighterId === 'f4') fighterName = 'Justin Vance';

  // Calculate timestamp relative to video duration
  const ts = (ratio: number) => parseFloat((duration * ratio).toFixed(1));

  const flaws: BiomechanicalFlaw[] = [
    {
      id: 'flaw_1',
      timestampSeconds: ts(0.18),
      title: 'Dropped Rear Hand on Lead Hook Recovery',
      severity: 'critical',
      observation: 'During the 3-2 exchange, your right glove dropped to collarbone level (abducted 42° outward) while throwing the lead left hook.',
      correction: 'Glue right thumb to the zygomatic cheekbone throughout entire rotational arc of the left hook to protect against counter overhands.',
      jointAngleImpact: 'Shoulder guard angle collapsed by 25° from defensive baseline.',
    },
    {
      id: 'flaw_2',
      timestampSeconds: ts(0.48),
      title: 'Spine Flexion During Level Change Takedown Defense',
      severity: 'warning',
      observation: 'When partner initiated a double leg shot, you bent at the waist rather than lowering your hips, allowing partner to achieve deep chest-to-thigh contact.',
      correction: 'Sprawl with hips driving through the floor: achieve 160° hip extension and keep chin up to frame on opponent head.',
      jointAngleImpact: 'Torso posture broke forward to 52° (optimal sprawl angle: 20-30°).',
    },
    {
      id: 'flaw_3',
      timestampSeconds: ts(0.78),
      title: 'Square Stance on Defensive Retreat',
      severity: 'advisory',
      observation: 'After missing the straight cross, your rear foot dragged parallel to the lead foot for 2 strides, momentarily removing your defensive base.',
      correction: 'Maintain 45° bladed stance on exit; step lead foot first when advancing, rear foot first when disengaging.',
      jointAngleImpact: 'Base width narrowed to 14 inches (minimum stable base: 24 inches).',
    },
  ];

  const keyMoments: KeyMoment[] = [
    {
      id: 'km_1',
      timestampSeconds: ts(0.12),
      type: 'positive',
      title: 'Calf Kick Timing on Stance Switch',
      description: 'Capitalized immediately as partner shifted weight onto lead foot, digging the instep across the peroneal nerve.',
      tag: 'Striking IQ',
    },
    {
      id: 'km_2',
      timestampSeconds: ts(0.38),
      type: 'positive',
      title: 'Underhook Pummel & Cage Frame',
      description: 'Switched whizzer into a deep underhook along the fence, reversing partner against the cage wall effortlessly.',
      tag: 'Cage Wrestling',
    },
    {
      id: 'km_3',
      timestampSeconds: ts(0.65),
      type: 'negative',
      title: 'Counter Overhand Absorbed on Reset',
      description: 'Lingered in the pocket after landing combinations instead of taking a 90° angle exit.',
      tag: 'Defensive Lag',
    },
    {
      id: 'km_4',
      timestampSeconds: ts(0.90),
      type: 'positive',
      title: 'High Pace Volume Output in Final Flurry',
      description: 'Maintained 84 punches/min tempo during the closing sequence with high aerobic resilience.',
      tag: 'Cardio Engine',
    },
  ];

  const prescribedDrills: PrescribedDrill[] = [
    {
      id: 'drill_1',
      title: 'Tennis Ball Chin-Tuck Hook Repetitions',
      setsAndReps: '4 rounds x 3 minutes',
      targetIssue: 'Dropped rear hand guard on power combinations',
      coachInstructions: 'Hold tennis ball under right chin/shoulder while throwing lead hook against heavy bag. Any drop forces immediate 10 burpees.',
    },
    {
      id: 'drill_2',
      title: 'Reaction Sprawl & Underhook Reversal Drill',
      setsAndReps: '5 sets x 10 explosive reps',
      targetIssue: 'Waist bending on takedown defense instead of hip drive',
      coachInstructions: 'Partner shoots randomly on coach whistle. Drive hips flat to mat with instant whizzer and head post.',
    },
    {
      id: 'drill_3',
      title: 'Cone Agility Lateral Exit Footwork',
      setsAndReps: '3 rounds x 4 minutes',
      targetIssue: 'Squaring up stance on backwards retreat',
      coachInstructions: 'Throw 1-2 combination, pivot 45 degrees around cone without ever crossing heels or losing bladed stance.',
    },
  ];

  const stats: SessionStats = {
    strikesLanded: isHardIntensity ? 34 : 22,
    strikesAbsorbed: isHardIntensity ? 16 : 8,
    strikeAccuracyPct: 68,
    takedownDefensePct: 83,
    cageControlSeconds: Math.round(duration * 0.35),
  };

  const overallScore = isHardIntensity ? 88 : 91;
  const grade = overallScore >= 90 ? 'A' : overallScore >= 85 ? 'A-' : 'B+';

  return {
    sessionId: `spar_${Date.now()}`,
    fighterName,
    roundNumber: metadata.roundNumber || 1,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    overallScore,
    grade,
    fightIqSummary: `${fighterName} exhibited high-level distance management and clean calf kick timing against ${metadata.sparringPartnerStyle || 'the sparring partner'}. Hand position when retracting off power hooks and hip level change during sprawl require tightening before fight night.`,
    stats,
    flaws,
    keyMoments,
    prescribedDrills,
  };
}
