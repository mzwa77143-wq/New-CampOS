import { 
  SparringUploadMetadata, 
  SparringAnalysisResponse, 
  BiomechanicalFlaw, 
  KeyMoment, 
  PrescribedDrill, 
  SessionStats,
  TacticalSequence,
  BiomechanicalMetric,
  AgenticInsight,
  ActionItem
} from '@/types/sparring-analysis';

export function generateAiSparringFeedback(
  metadata: SparringUploadMetadata,
  actualDurationSeconds: number = 30
): SparringAnalysisResponse {
  const duration = actualDurationSeconds > 5 ? actualDurationSeconds : 30;
  const isHardIntensity = metadata.intensity === 'Championship Hard';

  // Fighter-specific contextualization
  let fighterName = 'Alex Silva';
  if (metadata.fighterId === 'f2') fighterName = 'Sean Martinez';
  else if (metadata.fighterId === 'f3') fighterName = 'Valentina Santos';
  else if (metadata.fighterId === 'f4') fighterName = 'Justin Vance';

  // Calculate timestamp relative to video duration
  const ts = (ratio: number) => parseFloat((duration * ratio).toFixed(1));
  const tsMs = (ratio: number) => Math.round(duration * ratio * 1000);

  const tacticalSequences: TacticalSequence[] = [
    {
      id: 'seq_1',
      startTimestampMs: tsMs(0.08),
      endTimestampMs: tsMs(0.22),
      sequenceName: 'Stance Switch Calf Kick & Hook Blitz',
      dominantDiscipline: 'Striking',
      initiator: 'fighter',
      positionalTransition: 'Distance Sniping -> Pocket Exchange -> Angle Disengage',
      outcome: 'Clean outside calf strike landed; counter cross absorbed on retreat.',
      description: `${fighterName} timed partner's lead foot placement with a heavy instep chop, then stepped off on a 45° angle.`,
    },
    {
      id: 'seq_2',
      startTimestampMs: tsMs(0.35),
      endTimestampMs: tsMs(0.55),
      sequenceName: 'Underhook Collar-Tie Pummel against Fence',
      dominantDiscipline: 'Clinch',
      initiator: 'partner',
      positionalTransition: 'Open Space -> Cage Pressure -> Head-Inside Single Defense',
      outcome: 'Partner dug deep underhook; fighter sprawled and framed head to break grip.',
      description: 'Partner closed distance behind high guard; fighter defended takedown attempt along fence using head post and overhook whizzer.',
    },
    {
      id: 'seq_3',
      startTimestampMs: tsMs(0.68),
      endTimestampMs: tsMs(0.85),
      sequenceName: 'Scramble Reversal into Front Headlock',
      dominantDiscipline: 'Grappling',
      initiator: 'fighter',
      positionalTransition: 'Sprawl -> Front Headlock -> Chin-Strap Shuck',
      outcome: 'Fighter spun behind to take rear waist lock control.',
      description: 'Capitalized on partner overextension by snapping head down into chin-strap wedge and circling behind.',
    },
  ];

  const biomechanicalMetrics: BiomechanicalMetric[] = [
    {
      id: 'bm_1',
      metricName: 'Spine Posture Forward Flexion',
      measuredValue: 46,
      optimalRangeMin: 15,
      optimalRangeMax: 30,
      unit: 'deg',
      jointOrSegment: 'Thoracic Spine',
      status: 'warning',
      timestampMs: tsMs(0.18),
      notes: 'Torso flexed forward 46° on double jab entry, shifting 74% mass past lead knee.',
    },
    {
      id: 'bm_2',
      metricName: 'Lead Knee Flexion Angle',
      measuredValue: 118,
      optimalRangeMin: 90,
      optimalRangeMax: 135,
      unit: 'deg',
      jointOrSegment: 'Lead Knee',
      status: 'optimal',
      timestampMs: tsMs(0.42),
      notes: 'Optimal athletic bend during takedown defense sprawl.',
    },
    {
      id: 'bm_3',
      metricName: 'Shoulder Guard Abduction',
      measuredValue: 42,
      optimalRangeMin: 10,
      optimalRangeMax: 20,
      unit: 'deg',
      jointOrSegment: 'Rear Shoulder & Glove',
      status: 'critical',
      timestampMs: tsMs(0.20),
      notes: 'Right hand dropped to collarbone plane during left hook delivery.',
    },
    {
      id: 'bm_4',
      metricName: 'Rotational Angular Velocity',
      measuredValue: 540,
      optimalRangeMin: 450,
      optimalRangeMax: 650,
      unit: 'deg/s',
      jointOrSegment: 'Pelvis / Core Rotation',
      status: 'optimal',
      timestampMs: tsMs(0.14),
      notes: 'Explosive pelvic whipping on calf kick initiation.',
    },
  ];

  const insights: AgenticInsight[] = [
    {
      id: 'ins_1',
      category: 'biomechanical',
      title: 'Dropped Rear Hand on Lead Hook Delivery',
      observation: 'During the 3-2 combination, your right glove dropped 25° below chin level, exposing the right temple to trailing overhands.',
      rootCause: 'Torso rotation initiates without latissimus engagement to stabilize the defensive guard arm.',
      correction: 'Glue right thumb to zygomatic cheekbone throughout entire rotational delivery and recovery of the lead left hook.',
      confidenceScore: 0.94,
      timestampMs: tsMs(0.18),
      endTimestampMs: tsMs(0.24),
      severity: 'critical',
      impactMetric: 'Guard dropped 25° below protective orbital line',
    },
    {
      id: 'ins_2',
      category: 'tactical',
      title: 'Linear Retreat into Fence Vulnerability',
      observation: 'Backed up in straight lines when partner blitzed with 1-2 punches, allowing partner to achieve cage control effortlessly.',
      rootCause: 'Lack of proactive lateral pivot off the lead foot when disengaging from close pocket exchanges.',
      correction: 'Pivot 45° to the right or left off the lead toe on the final punch to exit out of partner power corridor.',
      confidenceScore: 0.91,
      timestampMs: tsMs(0.48),
      endTimestampMs: tsMs(0.55),
      severity: 'warning',
      impactMetric: 'Linear retreat spanned 8 feet directly towards fence',
    },
    {
      id: 'ins_3',
      category: 'fight_iq',
      title: 'Underhook Collar-Tie Pummel Superiority',
      observation: 'Fighter effectively shut down partner single leg entry by immediately digging a deep overhook whizzer and framing head away.',
      rootCause: 'Quick tactical recognition of opponent level change cadence.',
      correction: 'Maintain this high-tempo whizzer reaction and look to transition faster to the front headlock snap.',
      confidenceScore: 0.96,
      timestampMs: tsMs(0.78),
      endTimestampMs: tsMs(0.85),
      severity: 'advisory',
      impactMetric: 'Neutralized 100% of opponent takedown drive within 1.2s',
    },
  ];

  const actionItems: ActionItem[] = [
    {
      id: 'action_1',
      title: 'Chin-Tuck Hook Retraction Drill',
      priority: 'high',
      targetFlaw: 'Dropped rear hand on power combinations',
      prescribedDrill: 'Tennis Ball Chin-Tuck Hook Repetitions',
      setsAndReps: '4 rounds x 3 minutes',
      coachInstructions: 'Hold tennis ball under right jaw while firing lead hook against heavy bag. Dropping ball requires 10 sprawl burpees.',
    },
    {
      id: 'action_2',
      title: 'Lateral Pivot Disengage Agility',
      priority: 'high',
      targetFlaw: 'Linear backward retreat into fence',
      prescribedDrill: 'Cone Pivot 45° Angle Footwork',
      setsAndReps: '3 rounds x 4 minutes',
      coachInstructions: 'Throw 1-2, pivot 45 degrees around cone without crossing heels or squaring defensive base.',
    },
    {
      id: 'action_3',
      title: 'Reaction Sprawl & Whizzer Shuck',
      priority: 'medium',
      targetFlaw: 'Bending at waist on level changes',
      prescribedDrill: 'Whistle Sprawl & Head-Wedge Pummeling',
      setsAndReps: '5 sets x 10 explosive reps',
      coachInstructions: 'Partner shoots on coach whistle; drive hips to floor with 160° hip extension and snap head to mat.',
    },
  ];

  const flaws: BiomechanicalFlaw[] = insights.map((ins) => ({
    id: ins.id,
    timestampSeconds: parseFloat((ins.timestampMs / 1000).toFixed(1)),
    title: ins.title,
    severity: ins.severity,
    observation: ins.observation,
    correction: ins.correction,
    jointAngleImpact: ins.impactMetric,
  }));

  const keyMoments: KeyMoment[] = tacticalSequences.map((seq) => ({
    id: seq.id,
    timestampSeconds: parseFloat((seq.startTimestampMs / 1000).toFixed(1)),
    type: seq.dominantDiscipline === 'Striking' ? 'positive' : 'neutral',
    title: seq.sequenceName,
    description: seq.description,
    tag: seq.dominantDiscipline,
  }));

  const prescribedDrills: PrescribedDrill[] = actionItems.map((act) => ({
    id: act.id,
    title: act.prescribedDrill,
    setsAndReps: act.setsAndReps,
    targetIssue: act.targetFlaw,
    coachInstructions: act.coachInstructions,
  }));

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
    fighterId: metadata.fighterId || 'f1',
    fighterName,
    roundNumber: metadata.roundNumber || 1,
    roundDurationMs: duration * 1000,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    overallScore,
    grade,
    fightIqSummary: `${fighterName} exhibited high-level distance management and clean calf kick timing against ${metadata.sparringPartnerStyle || 'the sparring partner'}. Hand position when retracting off power hooks and hip level change during sprawl require tightening before fight night.`,
    stats,
    tacticalSequences,
    biomechanicalMetrics,
    insights,
    actionItems,
    flaws,
    keyMoments,
    prescribedDrills,
  };
}
