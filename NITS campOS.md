| # | Issue | Location | Note |
| --- | --- | --- | --- |
| 4.1 | Timestamp can emit "00:60.0" | SparringVideoUploader.tsx:262–266, VideoPlayerPanel.tsx:88–92 | (sec % 60).toFixed(1) rounds 59.96 up to "60.0". Use Math.floor on the seconds component. |
| 4.2 | getUrineStatus has no default branch | lib/utils.ts:47–61 | Switch covers 1–5 only; out-of-range returns undefined and the caller crashes on urineStatus.bg. Add a fallback return. |
| 4.3 | Unused Next.js image config | next.config.mjs:4–11 | remotePatterns is configured but every avatar/thumbnail uses a plain <img> with an eslint-disable. Adopt next/image or drop the config. |
| 4.4 | Tailwind fonts reference undefined CSS vars | tailwind.config.ts:31–34 | var(--font-inter) / var(--font-mono) are never defined (no next/font setup), so stacks silently fall back. |
| 4.5 | Empty catch blocks hide failures | qdrant-service.ts:196–205, video-db.ts:230, 243, store.ts:520 | catch (e) {} discards errors entirely, making misconfiguration invisible. Log at debug level at minimum. |
| 4.6 | BroadcastChannel listener in store initialiser | lib/store.ts:120–150 | Side effects in a Zustand initialiser run on module evaluation and can double-register under HMR. Move to an explicit initSync(). |
| 4.7 | resetToDefaultData is partial | lib/store.ts:565–580 | Leaves weightUnit, currentRole, activeJobs, completedJobs untouched. |
| 4.8 | Custom tooltip defined in component body | WeightCutChart.tsx:44–110 | Re-created every render, forcing Recharts to remount. Hoist it out or useCallback. |
| 4.9 | Negative "remaining cut" renders as negative weight | WeightCutChart.tsx:36, 200–210 | If under the limit, prints e.g. "-2.0 lbs" under a "Remaining Cut" label. Clamp to 0 and show "ON WEIGHT". |
| 4.10 | Hand-rolled UUID generation | qdrant-service.ts:283–293 | 32-hex slicing produces a UUID-shaped string with incorrect version/variant nibbles; 32-bit hash pair has real collision risk. Use crypto.randomUUID() or UUIDv5. |
| 4.11 | Only one video frame is ever captured | SparringVideoUploader.tsx:150–165 | Single canvas snapshot, yet the UI promises "frame-by-frame biomechanical flaw extraction". Sample several timestamps or soften the copy. |
| 4.12 | Mock roster uses real fighters' names | lib/mock-data.ts:5–12 | "Alex Silva / Poatan", "Sean Martinez / Sugar" are thinly-veiled real athletes. Prefer clearly fictional names. |
| 4.13 | CI has no test or typecheck step | .github/workflows/ci.yml:33–41 | Runs lint + build only; no tsc --noEmit, no tests — the workflow name overstates what it does. |
| 4.14 | Storage upload always uses upsert: true | videos/upload/route.ts:60–66 | With a predictable path this silently overwrites on collision. Prefer upsert: false. |