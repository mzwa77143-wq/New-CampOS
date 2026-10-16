# Code Standards — CampOS

Implementation rules, constraints, and engineering conventions for CampOS. All AI agents and developers working on this codebase must adhere strictly to these principles to prevent regression, preserve gym-floor reliability, and maintain code quality.

---

## Engineering Mindset

CampOS operates in high-pressure athletic facilities and fight camps where coaches and athletes are under severe physical and mental stress.

- **Zero Data Loss on the Gym Floor**: Internet in gym basements or locker rooms is notoriously unreliable. Never assume network connectivity. All user actions (weigh-ins, check-ins, hydration additions, workout checks) must immediately commit to local state first. Remote calls must be non-blocking and fail-safe.
- **Athletic Usability & Instant Readability**: Dark mode (`#09090b`), high-contrast text (`text-zinc-100`, `text-zinc-400`), and bold visual indicators (`#ef4444` combat red, `#f59e0b` gold, `#10b981` green). Design for athletes with hand wraps or gloves on shared wall-mounted tablets (minimum 44x44px touch targets).
- **Zero UI Blocking During AI Processing**: Sparring video analysis and semantic vector searches must never freeze or block the user interface. Heavy analysis runs asynchronously in background workers returning HTTP `202 Accepted` while the floating HUD keeps the user informed.
- **Fail Gracefully with Cascading Fallbacks**:
  - If Gemini API fails or lacks a key → Fall back to CampOS Combat Engine (`lib/ai/sparring-analyzer.ts`).
  - If Qdrant is unreachable → Fall back to the 384-dimensional embedded in-memory vector engine (`lib/vector/qdrant-service.ts`).
  - If Supabase is offline → Fall back to local memory and `data/*.json` filesystem storage (`lib/db/video-db.ts`).
- **Clean Over Clever**: Write readable, modular TypeScript that can be audited quickly. Avoid deep abstractions or unnecessary meta-programming.

---

## TypeScript Standards

- **Strict Mode Enabled**: Defined in `tsconfig.json` (`"strict": true`). Do not disable strict checks.
- **No Uncontrolled `any`**: Avoid `any`. Use strict domain models from `types/camp.ts`, `types/sparring-analysis.ts`, and `types/video-search.ts`. If an external payload is unknown, type it as `unknown` and use type guards.
- **Explicit Return Types**: All public exported functions, API handlers, and store actions must define explicit return types.
- **Domain Modeling**:
  - Use `type` for unions, primitives, and simple shapes (e.g. `WeightUnit`, `TrainingType`, `Discipline`, `Stance`).
  - Use `interface` for entity data structures and component props (e.g. `Fighter`, `CheckIn`, `SparringAnalysisResponse`).
- **Null & Undefined Safety**: Always check for undefined when searching arrays (e.g. `fighters.find(f => f.id === selectedFighterId) || fighters[0]`). Never perform unchecked indexing.

---

## Next.js 14 App Router Conventions

- **Next.js 14.2 + React 18**: Use standard Next.js 14 App Router patterns.
- **Client vs Server Components**:
  - Components that use React hooks (`useState`, `useEffect`, `useCallback`), browser APIs (`localStorage`, `BroadcastChannel`, `canvas`), or the Zustand store must declare `'use client'` at line 1.
  - Prevent SSR hydration mismatch when reading browser state: initialize a `mounted` state flag (`const [mounted, setMounted] = useState(false)`) and only render browser-dependent badges after mount.
- **Route Handlers (`app/api/v1/mma/`)**:
  - File name must always be `route.ts`.
  - Use `NextRequest` and `NextResponse`.
  - Always wrap route logic in `try / catch` blocks, log execution time and structured telemetry to `console.log`, and return appropriate HTTP status codes:
    - `200 OK` for successful queries and uploads.
    - `202 Accepted` for enqueued asynchronous background analysis jobs.
    - `400 Bad Request` with an explicit `{ error: string }` message on validation failure.
    - `500 Internal Server Error` with details on unrecoverable server exceptions.
- **File Upload Handling**:
  - Consume uploads via `await request.formData()`.
  - Sanitize uploaded filenames (`rawName.replace(/[^a-zA-Z0-9._-]/g, '_')`).
  - Generate unique IDs using timestamps and random tokens (`vid_${Date.now()}_...`).

---

## Zustand State & Local-First Conventions

- **Single Store Architecture**: All shared camp state lives in `lib/store.ts` (`useCampStore`).
- **State Hydration**: On application mount, call `rehydrateFromStorage()` to read `campos_state_v1` from `localStorage`.
- **BroadcastChannel Sync**: Every mutating action in `useCampStore` that impacts team or athlete state must call `broadcastStateChange(eventType, data)` to notify other open tabs and kiosks on the same machine.
- **Selective Subscriptions**: Components should select only the state properties they need (e.g. `const currentRole = useCampStore((s) => s.currentRole)`) to prevent unnecessary full-tree re-renders.
- **Offline Mutation Queue**: If offline, actions must append an entry to `offlineQueue: Array<{ type: string; payload: any; timestamp: string }>`.

---

## File & Folder Naming Rules

| Entity | Pattern | Examples |
| :--- | :--- | :--- |
| **React Components** | PascalCase | `CoachDashboard.tsx`, `WeightCutChart.tsx`, `PinLogin.tsx` |
| **Route Handler Files** | `route.ts` | `app/api/v1/mma/search/route.ts` |
| **Page Files** | `page.tsx` | `app/page.tsx`, `app/analyzer/page.tsx` |
| **Utilities & Services**| kebab-case | `gemini-service.ts`, `qdrant-service.ts`, `video-jobs.ts` |
| **Domain Type Files** | kebab-case | `camp.ts`, `sparring-analysis.ts`, `video-search.ts` |
| **Directories** | kebab-case / lowercase | `components/coach/`, `lib/vector/`, `app/api/v1/mma/` |

---

## Mathematical & Domain Conventions

- **Weight Calculations**:
  - Stored canonically in pounds (`lbs`).
  - Kilograms conversion formula: `kg = lbs * 0.45359237` (or `lbs = kg / 0.45359237`).
  - Always display weights formatted to 1 decimal place using `weight.toFixed(1)`.
  - When calculating championship weight, allowance is `0.0 lbs` (exact limit required). For non-title bouts, standard allowance is `+1.0 lb` or `+0.5 lb`.
- **Fluid & Hydration Units**:
  - Tracked in fluid ounces (`oz`) and gallons (`gal`).
  - Conversion: `1 gallon = 128 fluid ounces`.
- **Urine Hydration Color Scale**:
  - Medical 1-to-5 scale:
    - 1: Pale / Clear (Well hydrated)
    - 2: Light Straw (Optimal)
    - 3: Yellow (Borderline / Mild dehydration)
    - 4: Dark Yellow / Amber (Significant dehydration)
    - 5: Brown / Dark Amber (Critical dehydration / Dangerous during weight cut)
- **Time & Durations**:
  - Round durations stored in seconds or milliseconds (`startTimestampMs`, `endTimestampMs`).
  - Human-readable timestamps in video players formatted as `MM:SS` (e.g. `01:45`).
