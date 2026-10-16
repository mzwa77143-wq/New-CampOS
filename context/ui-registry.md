# UI Registry — CampOS

Comprehensive component registry for CampOS. Consult this registry before building new components or modifying existing layouts to maintain visual and behavioral parity.

---

## Global Navigation & UI

### Header
- **File**: [`components/ui/Header.tsx`](file:///c:/dev/New%20CampOS/components/ui/Header.tsx)
- **Purpose**: Sticky application header containing brand identity, active camp matchup, 3-role navigation switcher, scale weigh-in shortcut, cut protocol sheet modal trigger, unit toggle (LBS/KG), and gym floor sync status.
- **Classes**: `sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md px-4 lg:px-8 py-3`
- **Tokens Used**: `bg-zinc-900/90`, `border-zinc-800`, `shadow-glow-red`, `bg-red-600`, `text-emerald-400`, `text-amber-400`

### PwaRegister
- **File**: [`components/ui/PwaRegister.tsx`](file:///c:/dev/New%20CampOS/components/ui/PwaRegister.tsx)
- **Purpose**: Client-side Service Worker registration handler enabling PWA installation on gym tablets and iPads.
- **Classes**: Non-rendering utility component (`return null`).

---

## Coach Command Center

### CoachDashboard
- **File**: [`components/coach/CoachDashboard.tsx`](file:///c:/dev/New%20CampOS/components/coach/CoachDashboard.tsx)
- **Purpose**: High-level orchestrator layout for the coach view, arranging the roster sidebar, weight cut trajectory visualization, training schedule planner, and team readiness overview.
- **Classes**: `p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6 flex flex-col lg:flex-row gap-6`
- **Tokens Used**: `bg-background`, `space-y-6`, `gap-6`

### RosterSidebar
- **File**: [`components/coach/RosterSidebar.tsx`](file:///c:/dev/New%20CampOS/components/coach/RosterSidebar.tsx)
- **Purpose**: Camp athlete directory displaying avatar, name, nickname, weight division, walkout weight, fight countdown, and dynamic health status badge (`optimal`, `warning`, `critical`).
- **Classes**: `w-full lg:w-80 flex-shrink-0 space-y-3`, `glow-card p-4 rounded-xl cursor-pointer transition-all`
- **Tokens Used**: `glow-card`, `glow-card-active`, `border-combat-glow`, `text-zinc-100`, `text-red-400`

### WeightCutChart
- **File**: [`components/coach/WeightCutChart.tsx`](file:///c:/dev/New%20CampOS/components/coach/WeightCutChart.tsx)
- **Purpose**: Interactive Recharts chart rendering target weight cut trajectory, recorded scale weights, physiological danger zone threshold, and division limit.
- **Classes**: `bg-card border border-zinc-800 rounded-xl p-6 shadow-glow-subtle`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `stroke-red-500`, `stroke-emerald-400`, `stroke-amber-400`

### CutSheetModal
- **File**: [`components/coach/CutSheetModal.tsx`](file:///c:/dev/New%20CampOS/components/coach/CutSheetModal.tsx)
- **Purpose**: Interactive modal presenting the daily fight week cut protocol: water loading/depletion schedule, sodium cycling phase, carbohydrate intake, sweat methods, and coach checkpoints.
- **Classes**: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `bg-amber-500/10`, `text-amber-400`

### TrainingSchedulePlanner
- **File**: [`components/coach/TrainingSchedulePlanner.tsx`](file:///c:/dev/New%20CampOS/components/coach/TrainingSchedulePlanner.tsx)
- **Purpose**: Weekly training session planner by discipline (sparring, striking, grappling, S&C, roadwork, recovery) with round targets, coach notes, and intensity indicators.
- **Classes**: `bg-card border border-zinc-800 rounded-xl p-6 space-y-4`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `bg-zinc-800/50`, `text-red-400`, `text-zinc-400`

### ReadinessOverview
- **File**: [`components/coach/ReadinessOverview.tsx`](file:///c:/dev/New%20CampOS/components/coach/ReadinessOverview.tsx)
- **Purpose**: Aggregated team readiness dashboard displaying sleep hours, sleep quality, soreness hot zones, resting heart rates, and average camp fatigue scores.
- **Classes**: `bg-card border border-zinc-800 rounded-xl p-6`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `text-emerald-400`, `text-amber-400`, `text-red-400`

### WeighInModal
- **File**: [`components/coach/WeighInModal.tsx`](file:///c:/dev/New%20CampOS/components/coach/WeighInModal.tsx)
- **Purpose**: Rapid scale weigh-in dialog for logging morning or evening weights with automatic lbs/kg conversion and danger zone alerts.
- **Classes**: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `bg-red-600 hover:bg-red-500`, `font-mono`

---

## Fighter App & Kiosk

### FighterApp
- **File**: [`components/fighter/FighterApp.tsx`](file:///c:/dev/New%20CampOS/components/fighter/FighterApp.tsx)
- **Purpose**: Root view for the athlete experience. Manages PIN authentication state and transitions between the shared gym tablet kiosk login and the personal athlete hub.
- **Classes**: `min-h-screen bg-[#09090b] text-zinc-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto`
- **Tokens Used**: `bg-background`, `text-zinc-100`

### PinLogin
- **File**: [`components/fighter/PinLogin.tsx`](file:///c:/dev/New%20CampOS/components/fighter/PinLogin.tsx)
- **Purpose**: 4-digit PIN numeric keypad for fast athlete authentication on shared gym floor tablets.
- **Classes**: `grid grid-cols-3 gap-3 max-w-xs mx-auto`, `h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-2xl font-bold font-mono text-zinc-100 active:scale-95 transition-all`
- **Tokens Used**: `bg-zinc-900`, `border-zinc-800`, `text-zinc-100`, `bg-red-600`

### FighterHome
- **File**: [`components/fighter/FighterHome.tsx`](file:///c:/dev/New%20CampOS/components/fighter/FighterHome.tsx)
- **Purpose**: Athlete home dashboard showing weight cut progress ring, fight countdown, readiness cards, hydration tracker, and today's workout checklist.
- **Classes**: `space-y-6 pb-12`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `text-emerald-400`, `text-red-400`

### CheckInModal
- **File**: [`components/fighter/CheckInModal.tsx`](file:///c:/dev/New%20CampOS/components/fighter/CheckInModal.tsx)
- **Purpose**: Morning athlete check-in dialog with an interactive 15-zone body soreness map, sleep telemetry, and mental focus rating.
- **Classes**: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`, `grid grid-cols-2 sm:grid-cols-3 gap-2`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `bg-red-500/20 text-red-300 border-red-500/40`

### HydrationTracker
- **File**: [`components/fighter/HydrationTracker.tsx`](file:///c:/dev/New%20CampOS/components/fighter/HydrationTracker.tsx)
- **Purpose**: Real-time fluid logging card with quick-add buttons (+8oz, +16oz, +32oz), target progress bar, electrolyte counter, and 5-stage urine color scale selector.
- **Classes**: `bg-card border border-zinc-800 rounded-xl p-6 space-y-4`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `text-cyan-400`, `bg-cyan-500/20`

### WorkoutChecklist
- **File**: [`components/fighter/WorkoutChecklist.tsx`](file:///c:/dev/New%20CampOS/components/fighter/WorkoutChecklist.tsx)
- **Purpose**: Round-by-round interactive checklist for training sessions, round timers, and post-workout RPE rating.
- **Classes**: `bg-card border border-zinc-800 rounded-xl p-6 space-y-3`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `bg-emerald-500/10 text-emerald-400 border-emerald-500/30`

---

## Video & Biomechanics Analyzer

### MMAVideoAnalyzer
- **File**: [`components/analyzer/MMAVideoAnalyzer.tsx`](file:///c:/dev/New%20CampOS/components/analyzer/MMAVideoAnalyzer.tsx)
- **Purpose**: Main analysis workstation coordinating video playback, AI fight IQ report, biomechanical telemetry inspector, and semantic technique search.
- **Classes**: `p-4 lg:p-8 max-w-[1700px] mx-auto space-y-6`
- **Tokens Used**: `bg-background`, `space-y-6`

### VideoPlayerPanel
- **File**: [`components/analyzer/VideoPlayerPanel.tsx`](file:///c:/dev/New%20CampOS/components/analyzer/VideoPlayerPanel.tsx)
- **Purpose**: High-precision video review player with frame-stepping, custom playback speed presets (0.25x, 0.5x, 1x, 2x), timeline scrubbing, and clip loop markers.
- **Classes**: `bg-black rounded-xl border border-zinc-800 overflow-hidden relative`
- **Tokens Used**: `bg-black`, `border-zinc-800`, `text-red-500`, `accent-red-500`

### BiomechanicalInspector
- **File**: [`components/analyzer/BiomechanicalInspector.tsx`](file:///c:/dev/New%20CampOS/components/analyzer/BiomechanicalInspector.tsx)
- **Purpose**: Real-time telemetry HUD displaying joint angles (knee flexion, hip extension, posture angle, shoulder abduction), angular velocities, and injury risk assessments.
- **Classes**: `bg-card border border-zinc-800 rounded-xl p-5 space-y-4`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `text-emerald-400`, `text-amber-400`, `text-red-400`

### SparringVideoUploader
- **File**: [`components/analyzer/SparringVideoUploader.tsx`](file:///c:/dev/New%20CampOS/components/analyzer/SparringVideoUploader.tsx)
- **Purpose**: Upload modal for sparring footage. Features client-side HTML5 canvas frame extraction and metadata tagging before enqueuing background analysis.
- **Classes**: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`
- **Tokens Used**: `bg-card`, `border-zinc-800`, `bg-red-600 hover:bg-red-500`

### BackgroundJobHUD
- **File**: [`components/analyzer/BackgroundJobHUD.tsx`](file:///c:/dev/New%20CampOS/components/analyzer/BackgroundJobHUD.tsx)
- **Purpose**: Floating HUD mounted in the root layout that displays active asynchronous video processing jobs, animated progress bars, stage badges, and quick-inspection links.
- **Classes**: `fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-zinc-950 border border-zinc-800/90 rounded-xl shadow-2xl p-4 backdrop-blur-md`
- **Tokens Used**: `bg-zinc-950`, `border-zinc-800`, `bg-red-600`, `shadow-glow-red`, `text-red-400`
