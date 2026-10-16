# GitHub Issue List — `mzwa77143-wq/New-CampOS`

**Source:** code review of commit `d1c227c`
**Total findings:** 44 (8 blockers · 22 suggestions · 14 nits)
**Note:** the review's summary table listed 21 suggestions; the enumerated list (3.1–3.22) contains 22. All 44 are reproduced below.

## Label taxonomy

| Label | Meaning |
|---|---|
| `blocker` | Must fix before any deployment |
| `suggestion` | Should fix |
| `nit` | Nice to have |
| `security` | Auth, injection, secrets, data exposure |
| `bug` | Incorrect behaviour |
| `performance` | Speed, memory, blocking work |
| `testing` | Test coverage |
| `tech-debt` | Structure, duplication, dead code, types |
| `dependencies` | Third-party version / upgrade work |
| `dx` | Developer experience, tooling, CI |

## Milestone map

| Milestone | Issues |
|---|---|
| **Today** | B1–B8 |
| **This week** | S1–S11 |
| **Next** | S12–S22 |
| **Then** | N1–N14 |

---

# 🔴 Blockers — Today

---

### B1 — [Blocker] Rotate and purge the leaked Gemini API key from git history

**Labels:** `blocker`, `security`
**Milestone:** Today
**Location:** `lib/ai/gemini-service.ts:8` (introduced in commit `60403b6`)

**Problem**
The initial commit hard-coded a live Gemini API key as a fallback:
```ts
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6I6…(redacted)';
```
Commit `2815389` removed the literal from the working tree, but the value is still present in repository history and is served to anyone who clones the repo.

**Why it matters**
Removing a secret from the working tree does not revoke it. The key must be treated as compromised and is billable by anyone who finds it.

**Suggested fix**
1. Revoke/rotate the key in Google AI Studio immediately.
2. Purge it from history (`git filter-repo --replace-text` or BFG) and force-push.
3. Add a pre-commit secret scanner (gitleaks / trufflehog) to CI.
4. Never provide a hard-coded fallback — fail closed or use the offline engine.

---

### B2 — [Blocker] Database is world-writable and world-deletable (open RLS policies)

**Labels:** `blocker`, `security`
**Milestone:** Today
**Location:** `supabase/migrations/20260903_create_uploaded_videos.sql:38–49`

**Problem**
```sql
CREATE POLICY "Allow public read access to uploaded videos" ... USING (true);
CREATE POLICY "Allow public insert to uploaded videos"      ... WITH CHECK (true);
CREATE POLICY "Allow public delete of uploaded videos"      ... USING (true);
```
The anon key ships to the browser via `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the storage bucket is created `public` with an open INSERT policy.

**Why it matters**
With `USING (true)` on DELETE, any visitor can delete every row in `uploaded_videos` with one REST call. INSERT is equally open, so anyone can inject arbitrary rows — which also enables B4.

**Suggested fix**
Add an `owner_id uuid` column and scope every policy to the authenticated owner (`USING (auth.uid() = owner_id)`). Remove the public DELETE/INSERT policies and route writes through a server-side route using the service-role key. Make the bucket private and serve via signed URLs.

---

### B3 — [Blocker] No authentication or authorization on any API route

**Labels:** `blocker`, `security`
**Milestone:** Today
**Location:** `app/api/v1/mma/videos/route.ts:29–53`, `videos/upload/route.ts`, `search/route.ts`, `jobs/route.ts`, `sparring-analysis/route.ts`

**Problem**
Every endpoint is fully anonymous. `DELETE /api/v1/mma/videos?id=<any-id>` deletes any record and its file; `POST /api/v1/mma/videos/upload` accepts arbitrary uploads; `POST /api/v1/mma/sparring-analysis` lets anyone burn your Gemini quota. There is no tenant or owner check anywhere.

**Why it matters**
One gym's data is visible to and deletable by all. The AI routes are an open door to quota exhaustion and cost.

**Suggested fix**
Add an auth layer (Supabase Auth session or a signed gym/coach token) and a shared `requireAuth()` guard at the top of each handler. Enforce ownership on read and delete. Add per-IP and per-user rate limiting on the AI and upload routes.

---

### B4 — [Blocker] Path traversal in video deletion allows arbitrary file removal

**Labels:** `blocker`, `security`
**Milestone:** Today
**Location:** `lib/db/video-db.ts:222–232`

**Problem**
```ts
if (target.storageProvider === 'local' && target.videoUrl.startsWith('/uploads/videos/')) {
  const localFilePath = path.join(process.cwd(), 'public', target.videoUrl);
  if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
```
`videoUrl` is read from the database, and the database is publicly insertable (B2). An attacker can insert a row whose `video_url` begins with the expected `/uploads/videos/` prefix and then climbs out of that directory using repeated parent-directory segments (four of them reach the system password file from `public/uploads/videos`), with `storage_provider = 'local'`, then call `DELETE /api/v1/mma/videos?id=<that row>`.

For clarity, the injected value looks like: `/uploads/videos/` + four parent-directory segments + `/etc/passwd`.

**Why it matters**
`path.join` normalises the parent-segment sequences away and `unlinkSync` removes the resolved file — i.e. an arbitrary file outside the uploads directory. The `startsWith` check does **not** prevent traversal, because the prefix is satisfied *before* the climbing segments run.

**Suggested fix**
Resolve and confine the path:
```ts
const base = path.resolve(process.cwd(), 'public', 'uploads', 'videos');
const p = path.resolve(base, path.basename(target.videoUrl));
if (!p.startsWith(base + path.sep)) throw new Error('Invalid path');
```
Better: store only the generated `videoId` and rebuild the path server-side, never trusting a stored URL.

---

### B5 — [Blocker] Universal PIN backdoor and client-side-only authentication

**Labels:** `blocker`, `security`
**Milestone:** Today
**Location:** `lib/store.ts:216`, `lib/mock-data.ts:9`, `components/fighter/PinLogin.tsx:23,41–42`

**Problem**
```ts
if (fighter && (fighter.pin === pin || pin === '1234')) { ... }
```
`'1234'` authenticates **every** fighter regardless of their real PIN. PINs are stored in plaintext in `mock-data.ts`, which is bundled into the client, so all four PINs are readable in the JS payload. Authentication is purely client-side state (`isPinAuthenticated`) and can be flipped from the console. There is no lockout.

**Why it matters**
A 4-digit PIN with a universal backdoor and no throttling is not authentication. Any visitor can impersonate any fighter.

**Suggested fix**
Remove the `|| pin === '1234'` clause. Move PIN verification server-side, store only a salted hash (bcrypt/argon2), and issue a session token. Add attempt throttling and lockout. Never ship PINs to the client.

---

### B6 — [Blocker] Unbounded uploads and frame payloads allow memory/disk DoS

**Labels:** `blocker`, `security`, `performance`
**Milestone:** Today
**Location:** `app/api/v1/mma/videos/upload/route.ts:29–34`, `app/api/v1/mma/sparring-analysis/route.ts:20–22`

**Problem**
The upload route calls `await file.arrayBuffer()` with no size cap and no MIME allow-list (it defaults any type to `video/mp4`), then writes the whole buffer to `public/uploads/videos` — a statically served directory. The analysis route accepts an unbounded `frames: string[]` of base64 images with no length or count limit.

**Why it matters**
A single multi-GB request exhausts memory and disk. Unbounded base64 frames do the same to the analysis route.

**Suggested fix**
Reject `file.size > MAX` (e.g. 200 MB) before reading; validate `file.type` against an allow-list; cap `frames.length` (e.g. ≤ 8) and each string's length. Stream to storage instead of buffering. Serve uploads from a non-public path or via signed URLs.

---

### B7 — [Blocker] Background jobs cannot complete on serverless, and the job registry is per-instance

**Labels:** `blocker`, `bug`
**Milestone:** Today
**Location:** `app/api/v1/mma/sparring-analysis/route.ts:32`, `lib/ai/video-jobs.ts:36,47,60–61,111,129`

**Problem**
The route returns `202` and then runs `runBackgroundAnalysis(...)` as a detached promise. On Vercel/Lambda the execution environment is frozen once the response is sent, so the job silently never completes. Worse, `jobsRegistry` is an in-process `Map`: the follow-up `GET /api/v1/mma/jobs?jobId=…` poll hits a different instance and returns `404`. The client polls every 1 s forever with no timeout.

**Why it matters**
The headline "asynchronous analysis pipeline" does not work in the deployment target it was written for, and the failure is silent.

**Suggested fix**
Move job execution to a durable queue/worker (QStash, Inngest, Supabase Edge Function + pg_cron, or a real queue) and persist job state in Postgres/Redis rather than a module-level Map. Add a client-side poll timeout and backoff.

---

### B8 — [Blocker] Fight countdown is frozen to a hard-coded date

**Labels:** `blocker`, `bug`
**Milestone:** Today
**Location:** `lib/utils.ts:24–30`

**Problem**
```ts
const today = new Date('2026-09-03'); // Anchor to current context date
```
`calculateDaysOut()` is used by the coach dashboard, roster sidebar, fighter home and weight chart.

**Why it matters**
Every countdown, daily cut-rate and "days out" figure is permanently wrong, and the mock fight dates (Sep 8–26) are already in the past relative to the real current date.

**Suggested fix**
Use `new Date()` and normalise both sides to local midnight:
```ts
const start = new Date(); start.setHours(0,0,0,0);
```
Add a unit test with a fixed clock.

---

# 🟡 Suggestions — This week

---

### S1 — [Suggestion] Gemini model names are fictional, so the AI path always falls back

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `lib/ai/gemini-service.ts:16–21`

**Problem**
```ts
const CANDIDATE_MODELS = ['gemini-3.5-flash','gemini-flash-latest','gemini-3.6-flash','gemini-3.8-flash'];
```
`gemini-3.5-flash`, `gemini-3.6-flash` and `gemini-3.8-flash` do not exist. Three of four cascade attempts 404, so the app almost always returns the canned `CampOS Combat Engine (Offline Fallback)` output — which the UI presents as "AI Vision". The `@google/generative-ai` SDK is also deprecated in favour of `@google/genai`.

**Why it matters**
The flagship feature is silently non-functional and mislabelled to the user.

**Suggested fix**
Use real model IDs (e.g. `gemini-2.5-flash`, `gemini-2.0-flash`) and migrate to `@google/genai`. Surface the fallback honestly in the UI.

---

### S2 — [Suggestion] "Semantic" search is a keyword hash, not an embedding

**Labels:** `suggestion`, `tech-debt`
**Milestone:** This week
**Location:** `lib/vector/embeddings.ts:88–130`

**Problem**
`generateEmbedding()` builds a 384-dim vector by bumping hand-picked dimensions for ~60 hard-coded keywords and hashing leftover tokens. It has no notion of synonymy or context, so "got caught in an underhook" only matches because the literal phrase is in the taxonomy. The UI advertises "Natural language vector retrieval … powered by Qdrant".

**Why it matters**
The feature overstates what it does; users will expect semantic recall it cannot deliver.

**Suggested fix**
Either call a real embedding model (Gemini `text-embedding-004`, OpenAI, or a local model) or rename the feature to "keyword/tag search" and drop the semantic claims.

---

### S3 — [Suggestion] Remote Qdrant filter uses a payload key that is never written

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `lib/vector/qdrant-service.ts:504` (filter) vs `:435` (payload write)

**Problem**
The remote query filters on `key: 'movement_type'`, but the upsert payload stores the field as `movementType`. The remote filter therefore never matches, silently returning unfiltered results whenever Qdrant is configured — while the local engine filters correctly (`:714`).

**Why it matters**
The two code paths disagree, so results change depending on whether Qdrant is reachable.

**Suggested fix**
Align the key names, and add a test asserting remote and local filtering return the same set for the same query.

---

### S4 — [Suggestion] Read-modify-write on a JSON file causes lost updates and blocks the event loop

**Labels:** `suggestion`, `performance`, `bug`
**Milestone:** This week
**Location:** `lib/db/video-db.ts:36–90,100–110`, `lib/ai/video-jobs.ts:44–58`

**Problem**
`readLocalDatabase()` → mutate → `writeLocalDatabase()` is not atomic. Two concurrent uploads interleave and one record is lost. All of it uses synchronous `fs` inside async request handlers. `persistJobsToDisk()` rewrites the **entire** job registry on every one of the ~5 progress updates per job.

**Why it matters**
Data loss under concurrency, plus event-loop blocking on every request.

**Suggested fix**
Use a real datastore (the Supabase table you already have) as the source of truth, or at minimum serialise writes behind a mutex and use `fs.promises` with atomic rename. Persist job progress on a throttle.

---

### S5 — [Suggestion] Empty remote result silently falls through to a different dataset

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `lib/db/video-db.ts:158–186`, `lib/supabase.ts:146`

**Problem**
Both `getUploadedVideos()` and `getSparringSessions()` only accept the remote result when `data.length > 0`. A legitimately empty remote table (e.g. a new gym) falls through to the local JSON/memory store.

**Why it matters**
The client sees stale or unrelated data and cannot distinguish "no records" from "remote unavailable".

**Suggested fix**
Branch on `error`, not on `data.length`: if the query succeeded, return `data` even when empty.

---

### S6 — [Suggestion] Raw snake_case rows are cast to camelCase types

**Labels:** `suggestion`, `bug`, `tech-debt`
**Milestone:** This week
**Location:** `lib/supabase.ts:146`

**Problem**
```ts
return data as any[]; // rows are snake_case, type claims camelCase
```
`getSparringSessions()` returns Supabase rows (`fighter_id`, `overall_score`, …) cast to `SparringAnalysisResponse[]` (which expects `fighterId`, `overallScore`, …). `getUploadedVideos()` does the mapping correctly — this one was missed.

**Why it matters**
Any consumer reading those fields gets `undefined` at runtime with no compile error.

**Suggested fix**
Map rows explicitly like `getUploadedVideos()` does, and remove the `as any[]`.

---

### S7 — [Suggestion] Search fires on every keystroke (no debounce)

**Labels:** `suggestion`, `performance`
**Milestone:** This week
**Location:** `components/analyzer/MMAVideoAnalyzer.tsx:60–114`

**Problem**
`executeSearch` is a `useCallback` whose deps include `queryText`, and `useEffect(() => { executeSearch(); }, [executeSearch])` re-runs whenever it changes. Typing one character re-creates the callback and fires a full POST to `/api/v1/mma/search`. `handleSelectSuggested` also sets state and calls `executeSearch(prompt)`, producing a duplicate request.

**Why it matters**
One request per keystroke, plus duplicates — needless load and a janky UI.

**Suggested fix**
Debounce the query (300–400 ms) and remove `queryText` from the effect trigger — search on submit / explicit filter change only.

---

### S8 — [Suggestion] UTC dates used for "today" cause off-by-one for non-UTC users

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `lib/store.ts:242,323,362,453`, `components/fighter/FighterHome.tsx:33`, `components/fighter/HydrationTracker.tsx:10`, `components/coach/TrainingSchedulePlanner.tsx:51`

**Problem**
```ts
const today = new Date().toISOString().split('T')[0]; // UTC, not local
```
In the app's own timezone (UTC+2) any check-in after 22:00 local is stamped with tomorrow's date, so the "today's check-in" lookup fails and the fighter is asked to check in again.

**Why it matters**
Daily check-ins, hydration logs and training sessions are all mis-dated for evening users.

**Suggested fix**
Derive the local date: `new Date().toLocaleDateString('en-CA')` (yields `YYYY-MM-DD`). Centralise it in one helper.

---

### S9 — [Suggestion] Trajectory updates are keyed to a hard-coded row

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `lib/store.ts:285,325`

**Problem**
```ts
const todayIndex = fighterTrajectory.findIndex((dp) => dp.date === 'Sep 03' || dp.daysOut === 9);
```
Both `submitDailyCheckIn` and `logCoachWeighIn` only ever update the row whose date is literally "Sep 03" or whose `daysOut` is 9.

**Why it matters**
For fighters f2/f3/f4 (whose rows use different dates) the weigh-in is silently dropped from the chart, and after Sep 03 nothing updates at all.

**Suggested fix**
Match on the actual current date (or the nearest row by `daysOut`), and append a new data point when no row matches.

---

### S10 — [Suggestion] ACWR and training-load figures are hard-coded mock data

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `components/coach/ReadinessOverview.tsx:49–60`

**Problem**
`volumeData` and `currentAcwr = 1.18` are literals, yet the panel is titled "Camp Readiness & ACWR Load" and reads as live analytics.

**Why it matters**
A coach could make a real training decision on fabricated numbers.

**Suggested fix**
Compute ACWR from `trainingSessions` (acute 7-day vs chronic 28-day load) or clearly label the panel as sample data.

---

### S11 — [Suggestion] Reported latency is clamped, hiding slow queries

**Labels:** `suggestion`, `bug`
**Milestone:** This week
**Location:** `lib/vector/qdrant-service.ts:571`

**Problem**
```ts
latency_ms: Math.min(latency, 45), // "Sub-50ms execution guaranteed"
```
The reported latency is clamped to 45 ms, so the UI badge can never show a real slow query. (Note the remote path at `:538` returns the unclamped value, so the two paths also disagree.)

**Why it matters**
This hides performance regressions and is misleading to the user.

**Suggested fix**
Report the measured value; assert on a target in a test rather than falsifying the metric.

---

# 🟡 Suggestions — Next

---

### S12 — [Suggestion] Unbounded in-memory stores leak memory and disk

**Labels:** `suggestion`, `performance`
**Milestone:** Next
**Location:** `lib/supabase.ts:8`, `lib/ai/video-jobs.ts:36`

**Problem**
`inMemorySparringStore` and `jobsRegistry` grow forever — every session and every job (including full analysis results) is retained for the process lifetime, and jobs are additionally written to `data/analysis_jobs.json` with no pruning.

**Why it matters**
Long-running instances leak memory and disk.

**Suggested fix**
Add an LRU/TTL cap (e.g. keep the last 100 jobs) and prune completed jobs from disk on a schedule.

---

### S13 — [Suggestion] N+1 sequential polling for background jobs

**Labels:** `suggestion`, `performance`
**Milestone:** Next
**Location:** `components/analyzer/BackgroundJobHUD.tsx:33–50`, `components/analyzer/SparringVideoUploader.tsx:196–228`

**Problem**
The HUD loops over active jobs and awaits each `fetch` in series every 1.2 s; the uploader runs a second 1 s interval for the same job. With several jobs in flight this multiplies requests and can overlap. There is no backoff and no stop condition if a job never reaches a terminal state.

**Why it matters**
Wasted requests and a poll loop that never terminates on failure.

**Suggested fix**
Fetch all jobs in one request (`GET /api/v1/mma/jobs` already returns the full list), use `Promise.all`, and add exponential backoff plus a max-attempts cutoff.

---

### S14 — [Suggestion] Internal error details are leaked to clients

**Labels:** `suggestion`, `security`
**Milestone:** Next
**Location:** `app/api/v1/mma/videos/upload/route.ts:135`, `search/route.ts:66`, `jobs/route.ts:33,55`

**Problem**
```ts
{ error: 'Failed to upload video to database.', details: error?.message }
```
Raw exception messages (which can include connection strings, bucket names and stack context) are returned to the caller.

**Why it matters**
This aids reconnaissance.

**Suggested fix**
Log the detail server-side with a correlation ID and return only a generic message plus that ID.

---

### S15 — [Suggestion] 115 console statements, including payload dumps

**Labels:** `suggestion`, `tech-debt`, `security`
**Milestone:** Next
**Location:** throughout `lib/`, `app/api/v1/mma/**`, `components/`

**Problem**
Verbose logging of fighter IDs, file names, sizes, query text and full analysis payloads runs in production.

**Why it matters**
Noisy, costs performance, and can leak personal data into log aggregators.

**Suggested fix**
Introduce a small logger with levels gated on `NODE_ENV`/`LOG_LEVEL`, and drop payload dumps from the hot paths.

---

### S16 — [Suggestion] 35 `any` usages defeat the type system

**Labels:** `suggestion`, `tech-debt`
**Milestone:** Next
**Location:** `lib/vector/qdrant-service.ts`, `lib/store.ts`, `components/analyzer/*`, `components/fighter/*`

**Problem**
`strict: true` is enabled in `tsconfig.json`, but escape hatches (e.g. `setIntensity(e.target.value as any)`, `payload as any`, `data as any[]`) mean real type errors — like the snake_case mismatch in S6 — compile cleanly.

**Why it matters**
The type system is not actually protecting the codebase.

**Suggested fix**
Replace with proper unions/guards; enable `@typescript-eslint/no-explicit-any` as a warning and burn the list down.

---

### S17 — [Suggestion] Stale form state when the selected fighter changes

**Labels:** `suggestion`, `bug`
**Milestone:** Next
**Location:** `components/coach/WeighInModal.tsx:20–22`, `components/fighter/CheckInModal.tsx:26–28`

**Problem**
`useState(convertLbsToCurrent(fighter.currentWeightLbs, …))` initialises once. If the coach switches fighter while the modal is open (or reopens it for another fighter), the weight field still shows the previous fighter's value.

**Why it matters**
Submitting writes the previous fighter's weight to the new fighter.

**Suggested fix**
Key the modal on `selectedFighterId` (`<WeighInModal key={selectedFighterId} />`) or sync with a `useEffect` on fighter change.

---

### S18 — [Suggestion] Service-worker navigation fallback never reaches the second route

**Labels:** `suggestion`, `bug`
**Milestone:** Next
**Location:** `public/sw.js:47–52`

**Problem**
```js
return caches.match('/') || caches.match('/fighter');
```
`caches.match()` returns a **Promise**, which is always truthy — so the `||` short-circuits and `caches.match('/fighter')` is never evaluated. If `/` is not cached the fallback resolves to `undefined` and the navigation fails. `/analyzer` is also missing from the precache list.

**Why it matters**
Offline navigation breaks for the fighter route.

**Suggested fix**
```js
const r = await caches.match('/');
return r || (await caches.match('/fighter')) || Response.error();
```
and add `/analyzer` to `ASSETS_TO_CACHE`.

---

### S19 — [Suggestion] Outdated Next.js with known advisories

**Labels:** `suggestion`, `dependencies`, `security`
**Milestone:** Next
**Location:** `package.json:17`

**Problem**
`next@14.2.15` predates several published advisories (including the middleware authorization-bypass class). The app does not currently use middleware, which limits exposure.

**Why it matters**
Shipping a version with known advisories is avoidable risk.

**Suggested fix**
Upgrade to the latest 14.2.x patch (or 15.x) and add `npm audit` / Dependabot to CI.

---

### S20 — [Suggestion] Request bodies are not validated

**Labels:** `suggestion`, `security`
**Milestone:** Next
**Location:** `app/api/v1/mma/search/route.ts:12–30`, `app/api/v1/mma/sparring-analysis/route.ts:14–22`

**Problem**
`body.limit`, `min_confidence`, `max_posture_angle`, `duration` and `metadata` are used with only ad-hoc checks. `limit` is clamped, but a non-numeric `min_confidence` or a huge `duration` flows straight through; `metadata` is trusted wholesale.

**Why it matters**
Malformed input reaches the query and AI layers unchecked.

**Suggested fix**
Validate with a schema library (zod) at the boundary and reject with 400 on failure.

---

### S21 — [Suggestion] Dead code, unused imports and duplicated logic

**Labels:** `suggestion`, `tech-debt`
**Milestone:** Next
**Location:** `app/api/v1/mma/videos/route.ts:2`, `lib/vector/qdrant-service.ts:2–10`, `components/analyzer/SparringVideoUploader.tsx:6–30`, `components/analyzer/MMAVideoAnalyzer.tsx:18–28`, `ReadinessOverview.tsx:36–39` + `RosterSidebar.tsx:24–30`

**Problem**
`getUploadedVideoById` is imported but never used; `Discipline` is imported unused in the Qdrant service; the uploader imports a dozen icons it never renders. Separately, the composite readiness formula (sleep 35 / soreness 35 / focus 30) is copy-pasted in two components and can drift.

**Why it matters**
Noise in the codebase and a formula that will diverge.

**Suggested fix**
Enable `@typescript-eslint/no-unused-vars` and remove them; extract `computeReadinessScore(checkIn)` into `lib/utils.ts` and unit-test it.

---

### S22 — [Suggestion] Persisted session errors are swallowed

**Labels:** `suggestion`, `bug`
**Milestone:** Next
**Location:** `lib/supabase.ts:88–120`

**Problem**
The insights and sequences upserts are awaited without checking their `error`, and the outer `catch` returns `success: true` regardless.

**Why it matters**
A partial write (session header saved, insights lost) is reported as a clean success.

**Suggested fix**
Check each `error`, and either wrap the three writes in a transaction/RPC or report partial failure explicitly.

---

# 💭 Nits — Then

---

### N1 — [Nit] Timestamp can render as "00:60.0"

**Labels:** `nit`, `bug`
**Milestone:** Then
**Location:** `components/analyzer/SparringVideoUploader.tsx:262–266`, `components/analyzer/VideoPlayerPanel.tsx:88–92`

**Problem** `(sec % 60).toFixed(1)` rounds 59.96 up to `"60.0"`.
**Fix** Use `Math.floor` on the seconds component.

---

### N2 — [Nit] `getUrineStatus` has no default branch

**Labels:** `nit`, `bug`
**Milestone:** Then
**Location:** `lib/utils.ts:48–61`

**Problem** The switch covers 1–5 only; an out-of-range value returns `undefined` and the caller crashes on `urineStatus.bg`.
**Fix** Add a fallback return.

---

### N3 — [Nit] Unused Next.js image configuration

**Labels:** `nit`, `tech-debt`
**Milestone:** Then
**Location:** `next.config.mjs:4–11`

**Problem** `remotePatterns` is configured but every avatar/thumbnail uses a plain `<img>` with an eslint-disable.
**Fix** Adopt `next/image` or drop the config.

---

### N4 — [Nit] Tailwind fonts reference undefined CSS variables

**Labels:** `nit`, `tech-debt`
**Milestone:** Then
**Location:** `tailwind.config.ts:31–34`

**Problem** `var(--font-inter)` / `var(--font-mono)` are never defined (no `next/font` setup), so the stacks silently fall back.
**Fix** Wire up `next/font` or remove the variables.

---

### N5 — [Nit] Empty catch blocks hide failures

**Labels:** `nit`, `tech-debt`
**Milestone:** Then
**Location:** `lib/vector/qdrant-service.ts:196–205`, `lib/db/video-db.ts:230,243`, `lib/store.ts:520`

**Problem** `catch (e) {}` discards errors entirely, making misconfiguration invisible.
**Fix** Log at debug level at minimum.

---

### N6 — [Nit] BroadcastChannel listener registered in the store initialiser

**Labels:** `nit`, `tech-debt`
**Milestone:** Then
**Location:** `lib/store.ts:120–150`

**Problem** Side effects in a Zustand initialiser run on module evaluation and can double-register under HMR.
**Fix** Move to an explicit `initSync()`.

---

### N7 — [Nit] `resetToDefaultData` is partial

**Labels:** `nit`, `bug`
**Milestone:** Then
**Location:** `lib/store.ts:565–580`

**Problem** Leaves `weightUnit`, `currentRole`, `activeJobs`, `completedJobs` untouched.
**Fix** Reset the full state slice.

---

### N8 — [Nit] Custom tooltip defined in the component body

**Labels:** `nit`, `performance`
**Milestone:** Then
**Location:** `components/coach/WeightCutChart.tsx:44–110`

**Problem** Re-created every render, forcing Recharts to remount.
**Fix** Hoist it out or wrap in `useCallback`.

---

### N9 — [Nit] Negative "remaining cut" renders as a negative weight

**Labels:** `nit`, `bug`
**Milestone:** Then
**Location:** `components/coach/WeightCutChart.tsx:36,200–210`

**Problem** If under the limit, prints e.g. "-2.0 lbs" under a "Remaining Cut" label.
**Fix** Clamp to 0 and show "ON WEIGHT".

---

### N10 — [Nit] Hand-rolled UUID generation

**Labels:** `nit`, `tech-debt`
**Milestone:** Then
**Location:** `lib/vector/qdrant-service.ts:283–293`

**Problem** 32-hex slicing produces a UUID-shaped string with incorrect version/variant nibbles; the 32-bit hash pair has real collision risk.
**Fix** Use `crypto.randomUUID()` or UUIDv5.

---

### N11 — [Nit] Only one video frame is ever captured

**Labels:** `nit`, `bug`
**Milestone:** Then
**Location:** `components/analyzer/SparringVideoUploader.tsx:150–165`

**Problem** A single canvas snapshot, yet the UI promises "frame-by-frame biomechanical flaw extraction".
**Fix** Sample several timestamps or soften the copy.

---

### N12 — [Nit] Mock roster uses real fighters' names

**Labels:** `nit`, `tech-debt`
**Milestone:** Then
**Location:** `lib/mock-data.ts:5–12`

**Problem** "Alex Silva / Poatan", "Sean Martinez / Sugar" are thinly-veiled real athletes.
**Fix** Prefer clearly fictional names.

---

### N13 — [Nit] CI has no test or typecheck step

**Labels:** `nit`, `dx`, `testing`
**Milestone:** Then
**Location:** `.github/workflows/ci.yml:33–41`

**Problem** Runs `lint` + `build` only; no `tsc --noEmit`, no tests — the workflow name overstates what it does.
**Fix** Add `tsc --noEmit` and a test step.

---

### N14 — [Nit] Storage upload always uses `upsert: true`

**Labels:** `nit`, `bug`
**Milestone:** Then
**Location:** `app/api/v1/mma/videos/upload/route.ts:60–66`

**Problem** With a predictable path this silently overwrites on collision.
**Fix** Prefer `upsert: false`.

---

# Remediation order

1. **Today** — B1 rotate + purge the key · B2 lock down RLS · B3 add auth guards · B4 fix path traversal · B5 remove the PIN backdoor · B6 cap uploads · B7 durable job queue · B8 fix `calculateDaysOut`.
2. **This week** — S1 real model IDs · S2 honest search naming · S3 align the Qdrant filter key · S4 atomic writes · S5 branch on `error` · S6 map rows · S7 debounce search · S8 local dates · S9 date-keyed trajectory · S10 real ACWR · S11 stop clamping latency.
3. **Next** — S12 cap the stores · S13 batch polling · S14 stop leaking errors · S15 levelled logger · S16 burn down `any` · S17 key the modals · S18 fix the SW fallback · S19 upgrade Next.js · S20 validate bodies · S21 remove dead code · S22 check persist errors.
4. **Then** — N1–N14, plus the test suite below.

# Testing gaps

There are **zero** test files, no test runner in `package.json`, and no test step in CI. Highest-value tests, in order:

| Priority | Target | What to assert |
|---|---|---|
| High | `lib/utils.ts` · `calculateDaysOut` | Correct day count with an injected clock; never negative; DST boundaries |
| High | `lib/db/video-db.ts` · `deleteUploadedVideo` | Rejects traversal paths; deletes only files inside the uploads dir |
| High | `lib/store.ts` · `authenticatePin` | Rejects wrong PINs; no universal backdoor; lockout after N attempts |
| High | `app/api/v1/mma/videos/upload` | Rejects oversized files and disallowed MIME types with 4xx |
| Medium | `lib/vector/embeddings.ts` | Determinism, unit norm, dimension = 384, cosine similarity bounds |
| Medium | `lib/vector/qdrant-service.ts` | Remote and local filter paths return identical result sets (catches S3) |
| Medium | `lib/ai/video-jobs.ts` | Job lifecycle transitions, failure path, cancellation, disk round-trip |
| Medium | `lib/supabase.ts` | Row → camelCase mapping for sessions (catches S6) |
| Low | `components/*` | RTL: check-in submit, weigh-in unit conversion, round toggling |
| Low | e2e | Playwright: upload → analyze → poll → view breakdown happy path |
