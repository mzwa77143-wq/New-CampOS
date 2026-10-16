# Build Plan — CampOS

Architectural roadmap and phased implementation plan for CampOS. Built according to local-first principles: UI and mock data first, verified visually before logic wiring, followed by robust offline-resilient backend integrations.

---

## Phase 1 — Core Shell, Athletic Theme & Local-First State Foundation

Establish the application canvas, athletic dark theme, global navigation, and resilient state store.

### 01 App Shell & Dark Theme Setup
- **UI**: Configure `globals.css` with dark athletic background (`#09090b`), custom red combat glow classes (`.border-combat-glow`, `.glow-card`), custom dark scrollbars, and touch active scaling.
- **Header (`components/ui/Header.tsx`)**: Build sticky navigation bar with CampOS PRO brand badge, active camp matchup preview, 3-way role switcher (`Coach Command`, `Fighter App`, `Video & Biomechanics`), quick scale log button, cut sheet trigger, LBS/KG toggle, and real-time sync ping.
- **Verification**: Header is responsive across mobile, tablet, and desktop, switching roles smoothly with high visual contrast.

### 02 Zustand State & Cross-Device Sync
- **Logic (`lib/store.ts`)**: Implement `useCampStore` with state properties for fighters, check-ins, hydration, training sessions, weight trajectories, and sync status.
- **Persistence**: Rehydrate state from `localStorage` (`campos_state_v1`) on mount.
- **BroadcastChannel**: Initialize `BroadcastChannel('campos_sync_bus')` to mirror mutations across open browser tabs on shared gym tablets.
- **Verification**: Multiple browser tabs stay in lockstep when state changes occur without needing manual page reloads.

---

## Phase 2 — Coach Command Center & Fight Camp Management

Deliver the primary command console for head coaches, cutmen, and performance directors.

### 03 Fighter Roster Sidebar
- **UI (`components/coach/RosterSidebar.tsx`)**: Interactive athlete directory with avatars, weight divisions, walkout weights, fight dates, and color-coded camp health badges (`optimal`, `warning`, `critical`).
- **Logic**: Selecting an athlete updates `selectedFighterId` across all dashboard modules.

### 04 Interactive Weight Cut Trajectory
- **UI (`components/coach/WeightCutChart.tsx`)**: Recharts area and line chart plotting daily morning/evening scale weigh-ins against target descent curves and physiological danger lines.
- **Logic**: Dynamically scales axes based on division limit; highlights danger threshold breach if weight exceeds the projected safe dehydration envelope.

### 05 Fight Week Cut Protocol Sheet
- **UI (`components/coach/CutSheetModal.tsx`)**: Day-by-day protocol modal displaying water loading/depletion targets (gallons/day), sodium cycling phase, carbohydrate targets, sweat methods, and coach checkpoints.
- **Logic**: Reads protocol days from athlete profile and allows review of weigh-in checkpoints.

### 06 Training Schedule Planner & Readiness Matrix
- **UI (`components/coach/TrainingSchedulePlanner.tsx`, `components/coach/ReadinessOverview.tsx`)**: Weekly discipline planner (sparring, striking, grappling, S&C, roadwork, recovery) with target RPEs. Team readiness overview showing sleep metrics and body soreness hot zones.
- **Logic**: Computes average camp readiness and flags fatigued athletes.

### 07 Scale Weigh-In Modal
- **UI (`components/coach/WeighInModal.tsx`)**: Rapid dialog for logging morning and evening scale readings with immediate unit conversion (`lbs` ↔ `kg`).

---

## Phase 3 — Fighter App & Gym Tablet Kiosk

Provide a low-friction, high-speed interface tailored for athletes in the gym locker room.

### 08 PIN Kiosk Authentication
- **UI (`components/fighter/PinLogin.tsx`)**: 4-digit numeric keypad with 64px touch targets, error shakes, and quick fighter profile switching.
- **Logic**: Validates PIN against selected fighter record; establishes authenticated session.

### 09 Athlete Home & Readiness Dashboard
- **UI (`components/fighter/FighterHome.tsx`)**: Displays fight countdown clock, weight cut progress ring, today's schedule, and readiness status.

### 10 Daily Check-In Modal with Body Map
- **UI (`components/fighter/CheckInModal.tsx`)**: Interactive 15-zone anatomical body soreness map (neck, shoulders, chest, back, ribs, hands, hips, knees, shins, ankles), sleep duration and quality stars, mental focus rating, and RPE slider.
- **Logic**: Compiles check-in record, updates fighter health status, and commits to local state.

### 11 Hydration Tracker
- **UI (`components/fighter/HydrationTracker.tsx`)**: Fluid progress ring, quick-add buttons (+8oz, +16oz, +32oz), electrolyte pack counter, and 5-stage urine color scale picker.
- **Logic**: Tracks daily hydration against athlete target; warns when urine scale indicates severe dehydration.

### 12 Workout Checklist
- **UI (`components/fighter/WorkoutChecklist.tsx`)**: Round-by-round timer and completion checkboxes for scheduled sessions, ending with post-session RPE and personal notes.

---

## Phase 4 — AI Sparring Video & Biomechanics Analyzer

Integrate multimodal video analysis, asynchronous background workers, and biomechanical telemetry.

### 13 Sparring Footage Uploader & Canvas Frame Extractor
- **UI (`components/analyzer/SparringVideoUploader.tsx`)**: Video upload modal accepting `.mp4`, `.mov`, and `.webm` files with round number, partner style, and intensity selectors.
- **Logic**: Extracts base64 JPEG keyframes using HTML5 `<canvas>` before dispatching to the analysis pipeline.

### 14 Asynchronous Background Worker & Floating HUD
- **Logic (`lib/ai/video-jobs.ts`, `app/api/v1/mma/sparring-analysis/route.ts`)**: Accepts video analysis requests and responds immediately with `202 Accepted`. Executes background analysis through 6 stages (`queued` → `extracting_telemetry` → `gemini_vision` → `persisting_database` → `vector_indexing` → `completed`).
- **UI (`components/analyzer/BackgroundJobHUD.tsx`)**: Fixed floating HUD in the bottom-right corner displaying active job progress and completion notices.

### 15 Gemini Vision Cascade & Combat Engine Fallback
- **Logic (`lib/ai/gemini-service.ts`, `lib/ai/sparring-analyzer.ts`)**: Cascades across Gemini models (`gemini-3.5-flash`, `gemini-flash-latest`, etc.) to produce structured tactical analysis. Falls back gracefully to CampOS Combat Engine if offline or without an API key.

### 16 Video Player & Biomechanical Inspector
- **UI (`components/analyzer/VideoPlayerPanel.tsx`, `components/analyzer/BiomechanicalInspector.tsx`)**: Scrubbable video player with frame-stepping, playback speeds (0.25x - 2x), and real-time telemetry HUD displaying knee flexion, hip extension, posture angle, angular velocity, and injury risk assessments.

---

## Phase 5 — Semantic Vector Search & Hybrid Persistence

Enable technical framework retrieval and persistent cloud/local storage.

### 17 384-Dimensional Semantic Vector Engine
- **Logic (`lib/vector/embeddings.ts`, `lib/vector/qdrant-service.ts`)**: Deterministic 384-dimensional dense semantic embedding engine with combat sports taxonomy. Connects to Qdrant Cloud or falls back to internal in-memory cosine similarity engine.
- **API (`app/api/v1/mma/search/route.ts`, `app/api/v1/mma/filters/route.ts`)**: Endpoints for semantic searching across techniques and historical insights with discipline and stance filtering.

### 18 Dual Cloud & Local Persistence Adapter
- **Logic (`lib/supabase.ts`, `lib/db/video-db.ts`)**: Upserts completed sparring sessions and telemetry into Supabase PostgreSQL and Storage when available, with automatic fallback to `data/analysis_jobs.json`, `data/uploaded_videos.json`, and local disk storage.

---

## Phase 6 — PWA, Tablet Optimization & Production Hardening

Ensure maximum reliability on physical gym tablets and kiosks.

### 19 PWA Manifest & Service Worker
- **Assets (`public/manifest.json`, `public/sw.js`, `components/ui/PwaRegister.tsx`)**: Web App Manifest and Service Worker providing offline caching, home screen installability, and full-screen kiosk display on iOS and Android.

### 20 Unit Handling & Build Verification
- **Verification**: Run `npm run build` and `next lint` to guarantee zero compilation or type errors. Verify responsive behavior across standard tablet viewports (768px - 1024px).
