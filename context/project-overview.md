# Project Overview — CampOS

## About the Project

**CampOS** is a specialized, local-first, AI-augmented Fight Camp Operating System built for elite combat sports — Mixed Martial Arts (MMA), Professional Boxing, Muay Thai, and Submission Grappling.

Developed for championship teams, head coaches, cutmen, strength & conditioning coaches, and professional fighters, CampOS unifies the most critical and high-consequence aspects of a fight camp into a single cohesive, gym-floor-ready interface:
1. **Weight Cut Trajectory & Fight Week Protocols** (preventing dangerous cuts, tracking daily weigh-ins against physiological danger curves, and executing day-by-day water loading/depletion cut sheets).
2. **Gym Kiosk Athlete Readiness** (rapid 4-digit PIN authentication for shared locker room tablets, morning check-ins with an interactive body soreness map, sleep telemetry, mental focus, RPE fatigue, and hydration tracking with a 5-stage urine color scale).
3. **AI-Powered Sparring Video & Biomechanical Analysis** (multimodal video ingestion, asynchronous background processing HUD, Google Gemini Vision tactical analysis, joint angle & posture telemetry inspection, and 384-dimensional semantic technique retrieval via Qdrant and embedded vector engines).
4. **Resilient Local-First Architecture** (zero data loss in gym basements with spotty Wi-Fi, offline mutation queues, cross-tab BroadcastChannel synchronization, and optional Supabase cloud persistence).

---

## The Problem It Solves

Championship fight camps are high-stakes, fast-paced environments where small oversights lead to catastrophic outcomes:
- **Catastrophic Weight Cuts**: Fighters cutting 15-25 lbs in fight week risk severe organ distress, missed weight fines, or fight cancellations. Most camps track cuts on paper or disparate spreadsheets that fail to project when an athlete has crossed into the physiological "danger zone."
- **Gym Floor Data Friction**: Athletes and coaches do not have time to fill out complex forms during grueling sessions. Shared tablets in sweaty gym locker rooms require instant PIN-based access, visual body maps, and one-tap loggers.
- **Lost Technical Sparring Feedback**: Hard sparring rounds generate critical tactical data that is forgotten or lost in verbal post-round debriefs. Coaches rarely have time to tag video clips manually.
- **Spotty Gym Connectivity**: Combat sports gyms are frequently located in concrete industrial spaces or basements with poor cellular signal. Apps that depend entirely on remote servers fail when offline.

CampOS eliminates these points of failure through automated projection curves, tactile tablet workflows, automated video intelligence, and an offline-first architecture.

---

## Roles & Interfaces

CampOS provides three specialized operational modes, switchable via the global header or dedicated URL routes:

```
/              → Unified Shell with Global Role Switcher
/fighter       → Dedicated Fighter App (Kiosk / Athlete View)
/analyzer      → Dedicated MMA Video & Biomechanics Analyzer
```

### 1. Coach Command Center (`currentRole === 'coach'`)
- **Fighter Roster Sidebar**: Quick navigation across active camp athletes, displaying weight classes, walkout weights, championship status, fight countdowns, and real-time camp health badges (`optimal`, `warning`, `critical`).
- **Weight Cut Trajectory Chart**: Interactive Recharts visualization plotting daily weigh-ins against target trajectory and physiological danger thresholds.
- **Fight Week Cut Protocol Sheet**: Day-by-day hydration guidelines (gallons/day), sodium manipulation ('Normal', 'High (Loading)', 'Low', 'Zero', 'Re-hydration'), carbohydrate targets, sweat methods (sauna, hot bath), and mandatory coach checkpoints.
- **Readiness Matrix**: Team-wide daily check-in monitoring (sleep hours/quality, soreness areas, resting heart rate, mental focus, and RPE fatigue).
- **Training Schedule Planner**: Weekly session planning by discipline (Sparring, Striking, Wrestling/Grappling, S&C, Roadwork, Recovery) with target rounds and intensity ratings.
- **Scale Weigh-In Modal**: Rapid morning and evening scale loggers with instantaneous unit conversion (lbs/kg).

### 2. Fighter App (`currentRole === 'fighter'`)
- **Gym Kiosk PIN Authentication**: Fast 4-digit numeric keypad (e.g. `1234`, `2222`, `3333`) designed for shared gym tablets without requiring email/password logins.
- **Daily Check-In Modal**: Morning log capturing scale weight, sleep duration & 1-5 star quality, 1-10 soreness scale, interactive 15-zone body soreness map (neck, shoulders, chest, ribs, back, hands, hips, knees, etc.), mental focus, and RPE.
- **Hydration Tracker**: Real-time fluid logger (+8oz, +16oz, +32oz quick-add buttons), daily target progress ring, electrolyte packet tracker, and 5-stage medical urine hydration color scale.
- **Workout Checklist**: Round-by-round timer and completion checkboxes for scheduled training sessions, followed by post-session RPE and personal notes.

### 3. MMA Video & Biomechanics Analyzer (`currentRole === 'analyzer'`)
- **Sparring Footage Ingestion**: Upload sparring video (.mp4, .mov, .webm) tagged by fighter, round number, sparring partner fighting style (e.g. "Southpaw Pressure Boxer", "Dagestani Chain Wrestler"), and intensity level.
- **Asynchronous Background Processing HUD**: Non-blocking job runner displaying real-time progress bar, analysis stage indicators (`queued` → `extracting_telemetry` → `gemini_vision` → `persisting_database` → `vector_indexing` → `completed`), and click-to-view completed results.
- **Video Player Panel**: Scrubbing controls, frame-by-frame step buttons, speed presets (0.25x, 0.5x, 1x, 2x), and synchronized timeline indicators.
- **Biomechanical Telemetry Inspector**: Real-time display of joint angles (Lead Knee Flexion, Hip Extension, Posture Angle, Shoulder Abduction), angular velocity (°/s), and center of mass height (%). Includes color-coded checkpoint ranges (optimal, warning, critical) and injury risk indicators.
- **AI Fight IQ & Tactical Debrief**: Overall score (0-100), fight grade (A+ to C), executive fight IQ summary, striking/grappling performance statistics, identified biomechanical flaws with corrective guidance, and coach-prescribed action drills.
- **Semantic Technical Search**: Natural language query engine powered by Qdrant (with 384-dimensional embedded fallback) allowing coaches to search technique databases and historical sparring insights (e.g. "counter lead hook when pinned against cage", "single leg posture breakdown").

---

## Core Operational Flow

### 1. Morning Athlete Check-In
1. Fighter approaches gym kiosk tablet running `/fighter`.
2. Selects their profile avatar and enters their 4-digit PIN.
3. Steps onto the scale and logs morning weigh-in.
4. Rates sleep quality, logs sleep hours, and taps sore muscle groups on the anatomical body map.
5. Rates mental readiness and fatigue level, then submits.
6. Check-in is committed to local store, broadcast across active gym devices via `BroadcastChannel`, and queued for remote sync.

### 2. Coach Camp Monitoring & Protocol Adjustments
1. Coach opens Coach Command on tablet or laptop.
2. Roster highlights any fighter with status `warning` or `critical` (e.g. weight curve deviating above danger line or high soreness levels).
3. Coach inspects the Weight Cut Chart, compares morning scale entry against the target trajectory, and opens the Cut Protocol sheet to adjust fight week water intake or sodium phase.
4. Coach reviews the morning readiness metrics and modifies today's training intensity in the Training Schedule Planner.

### 3. Sparring Session & Post-Round Video Debrief
1. Videographer or assistant coach captures sparring footage and uploads it via the Video Analyzer.
2. Metadata is attached (fighter, round number, partner style, intensity).
3. The video initiates background analysis; the user receives a 202 Accepted response and can continue using the dashboard while the floating HUD tracks progress.
4. Google Gemini Vision (or local rule-based combat engine fallback) analyzes technical exchanges, detects posture breaches or dropped guards, and produces structured fight IQ metrics.
5. Fighter and coach review the video together cage-side, scrubbing to flagged timestamps, reviewing joint angles, and adding prescribed drills to the upcoming training plan.

---

## Key Design Constraints

- **Theme**: Athletic High-Contrast Dark Mode (`#09090b` background, `#121215` card surfaces, `#ef4444` combat red accents, `#27272a` borders).
- **Usability**: Touch-first with minimum 44px touch targets for gloved or tape-wrapped hands.
- **Dual Unit System**: Instant toggle between Pounds (`lbs`) and Kilograms (`kg`) across all views with accurate mathematical conversion (`kg = lbs * 0.45359237`).
- **Resilience**: Zero external dependency requirement for core operations. Embedded vector engine, offline state persistence, and mock roster guarantees immediate operation out-of-the-box.
