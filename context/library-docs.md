# Library Docs — CampOS

Project-specific integration patterns, error handling protocols, and usage constraints for third-party libraries used in CampOS. Adhere to these exact patterns when interacting with these libraries.

---

## 1. Google Generative AI (`@google/generative-ai`)

CampOS utilizes Google Gemini for multimodal video analysis, biomechanical flaw detection, and tactical fight IQ synthesis.

### Model Cascade & Spiking Prevention
To prevent downtime from `503 Service Unavailable` or regional capacity spikes, `lib/ai/gemini-service.ts` cascades across candidate models:

```typescript
// lib/ai/gemini-service.ts
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];
```

### Multimodal Frame Ingestion Pattern
Frames extracted via client-side canvas are passed as base64 JPEG buffers:

```typescript
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2, // Low temperature for consistent biomechanical extraction
  }
});

const imageParts: Part[] = framesBase64.map((b64) => ({
  inlineData: {
    data: b64,
    mimeType: 'image/jpeg',
  },
}));

const result = await model.generateContent([promptText, ...imageParts]);
const responseText = result.response.text();
```

### Fallback Protocol
If `GEMINI_API_KEY` is not present in `.env.local` or GitHub Secrets, or if all remote API calls fail, the service automatically falls back to `lib/ai/sparring-analyzer.ts` (`CampOS Combat Engine`), returning a fully structured offline tactical analysis without crashing.

---

## 2. Qdrant Vector Client (`@qdrant/js-client-rest`)

Used for 384-dimensional dense semantic vector similarity search across MMA technical framework slices and historical sparring insights.

### Collection Specifications
- **Framework Collection**: `mma_technical_framework`
- **Insights Collection**: `sparring_insights`
- **Vector Dimension**: `384` (normalized L2 norm)
- **Distance Metric**: `Cosine`

### Initialization & Remote Connection
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const url = process.env.QDRANT_URL;
const apiKey = process.env.QDRANT_API_KEY;

export const qdrant = url
  ? new QdrantClient({ url, apiKey, checkCompatibility: false })
  : null;
```

### Querying with Payload Filters
```typescript
const filterMust: any[] = [];

if (filters.discipline && filters.discipline !== 'All') {
  filterMust.push({
    key: 'discipline',
    match: { value: filters.discipline },
  });
}

if (filters.stance && filters.stance !== 'All') {
  filterMust.push({
    key: 'stance',
    match: { value: filters.stance },
  });
}

const points = await qdrant.search(COLLECTION_NAME, {
  vector: queryVector,
  filter: filterMust.length > 0 ? { must: filterMust } : undefined,
  limit: limit || 10,
  with_payload: true,
});
```

### Embedded Vector Fallback
If `qdrant` client is `null` or unconfigured, `mmaVectorSearchService` seamlessly runs its internal 384-dimensional in-memory cosine similarity engine (`lib/vector/embeddings.ts` and `INITIAL_MMA_TECHNIQUES`). It computes exact cosine similarities bounded to `[0, 1]` and marks the response with `fallback_applied: true`.

---

## 3. Supabase Client (`@supabase/supabase-js`)

Used for remote cloud persistence of sparring sessions, relational telemetry, and video storage.

### Client Factory Pattern
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const getSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('[Supabase Service] Initialization failed, falling back to local-first mode', err);
      return null;
    }
  }
  return null;
};
```

### Tables & Relational Schema
- `sparring_sessions`: Session metadata, score, grade, fight IQ summary, overall stats.
- `sparring_insights`: Normalized agentic insights (category, root cause, correction, timestamps).
- `sparring_sequences`: Positional transitions, dominant disciplines, outcomes.
- `uploaded_videos`: Video metadata, duration, file size, storage provider (`supabase` vs `local`).
- Storage Bucket: `sparring-videos`

### Resilience Rule
If Supabase is unconfigured or unreachable:
1. Sparring sessions are stored in an in-memory map (`inMemorySparringStore`) and state store.
2. Video metadata is written to `data/uploaded_videos.json`.
3. Raw video files are written to `public/uploads/videos/`.

---

## 4. Zustand (`zustand`)

Central state management for CampOS. Implements dual persistence: `localStorage` and `BroadcastChannel`.

### Hydration & Broadcast Pattern
```typescript
// lib/store.ts
const STORAGE_KEY = 'campos_state_v1';
let syncChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined') {
  try {
    syncChannel = new BroadcastChannel('campos_sync_bus');
    syncChannel.onmessage = (event) => {
      // Synchronize state across tabs on gym tablets
      if (event.data?.type && event.data?.payload) {
        useCampStore.setState(event.data.payload);
      }
    };
  } catch (e) {
    // Unsupported environments degrade gracefully
  }
}
```

### SSR Safety
Because `localStorage` and `BroadcastChannel` are browser-only APIs, components that read store state must guard against hydration mismatch:
```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  rehydrateFromStorage();
}, [rehydrateFromStorage]);

if (!mounted) return null; // or stable SSR skeleton
```

---

## 5. Recharts (`recharts`)

Used for weight cut trajectory visualization in `components/coach/WeightCutChart.tsx`.

### Dark Theme Charting Rules
- Wrap in `ResponsiveContainer` (`width="100%" height={320}`).
- Set Cartesian grid stroke to `#27272a` with `strokeDasharray="3 3"`.
- Use custom SVG defs for gradients:
  ```tsx
  <defs>
    <linearGradient id="weightCutGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
    </linearGradient>
  </defs>
  ```
- Use `ReferenceLine` for division limits (`stroke="#f59e0b"`) and danger zones (`stroke="#ef4444"`).
- Tooltips must use custom JSX rendered with dark zinc styling (`bg-zinc-900 border border-zinc-700 text-zinc-100`).

---

## 6. Utility Class Merging (`clsx` + `tailwind-merge`)

Found in `lib/utils.ts`. Always use `cn(...)` when combining conditional classes:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
