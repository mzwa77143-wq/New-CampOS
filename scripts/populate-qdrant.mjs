import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QdrantClient } from '@qdrant/js-client-rest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Manually parse .env.local to load Qdrant credentials
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const filePath = path.join(rootDir, envFile);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const qdrantApiKey = process.env.QDRANT_API_KEY || undefined;

console.log('───────────────────────────────────────────────────────');
console.log('Qdrant Framework Population');
console.log('Target URL:', qdrantUrl);
console.log('API Key configured:', Boolean(qdrantApiKey));

const client = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
  checkCompatibility: false,
});

const COLLECTION_NAME = 'mma_technical_framework';
const VECTOR_DIMENSION = 384;

// Combat taxonomy mapping (from lib/vector/embeddings.ts)
const COMBAT_TAXONOMY = {
  "takedown": [0, 1, 2, 3],
  "single leg": [0, 2, 4, 12, 14],
  "double leg": [0, 1, 4, 13, 15],
  "blast double": [0, 1, 5, 13, 20],
  "level change": [0, 4, 8, 16, 22],
  "body lock": [2, 6, 10, 18, 24],
  "suplex": [2, 6, 11, 19, 25],
  "trip": [3, 7, 14, 21, 26],
  "inside trip": [3, 7, 15, 22, 27],
  "sprawl": [0, 8, 16, 30, 32],
  "underhook": [1, 9, 17, 31, 33],
  "overhook": [1, 9, 18, 32, 34],
  "guillotine": [40, 41, 42, 43, 44],
  "high elbow guillotine": [40, 41, 44, 45, 46],
  "front headlock": [40, 42, 47, 48, 49],
  "choke": [41, 43, 50, 51, 52],
  "counter": [8, 40, 53, 54, 55],
  "rear naked choke": [41, 43, 56, 57, 58],
  "armbar": [60, 61, 62, 63, 64],
  "triangle": [65, 66, 67, 68, 69],
  "kimura": [70, 71, 72, 73, 74],
  "heel hook": [80, 81, 82, 83, 84],
  "kneebar": [80, 82, 85, 86, 87],
  "leg lock": [80, 81, 88, 89, 90],
  "sweep": [95, 96, 97, 98, 99],
  "butterfly sweep": [95, 97, 100, 101, 102],
  "striking": [110, 111, 112, 113],
  "jab": [110, 114, 115, 116],
  "cross": [110, 117, 118, 119],
  "overhand": [111, 120, 121, 122],
  "overhand right": [111, 120, 123, 124, 125],
  "hook": [112, 126, 127, 128],
  "check hook": [112, 127, 129, 130, 131],
  "uppercut": [113, 132, 133, 134],
  "calf kick": [140, 141, 142, 143, 144],
  "inside calf kick": [140, 142, 145, 146, 147],
  "low kick": [140, 143, 148, 149],
  "head kick": [150, 151, 152, 153],
  "question mark kick": [150, 152, 154, 155, 156],
  "knee": [160, 161, 162, 163],
  "flying knee": [160, 162, 164, 165, 166],
  "elbow": [170, 171, 172, 173],
  "spinning back elbow": [170, 172, 174, 175, 176],
  "posture": [200, 201, 202],
  "posture break": [200, 203, 204, 205],
  "hip extension": [210, 211, 212],
  "knee flexion": [220, 221, 222],
  "center of gravity": [230, 231, 232],
  "rotational torque": [240, 241, 242],
  "angle": [250, 251, 252],
  "pivot": [250, 253, 254],
  "dropped hands": [260, 261, 262],
  "guard recovery": [263, 264, 265],
  "stance stability": [266, 267, 268],
  "overextension": [269, 270, 271],
  "weight overextension": [200, 269, 270, 271],
  "hip elevation": [210, 211, 272, 273],
  "clinch": [2, 6, 280, 281],
  "open guard": [95, 96, 282, 283],
  "mount": [284, 285, 286],
  "mount scramble": [284, 285, 287, 288],
  "vulnerability": [290, 291, 292],
  "fault": [290, 293, 294],
  "caught in underhook": [1, 9, 17, 31, 33, 275],

  // Modern MMA Tactical Framework Concepts
  "peroneal nerve": [140, 142, 300, 301],
  "drop foot": [140, 142, 302, 303],
  "check": [140, 144, 304, 305],
  "open stance": [110, 250, 306, 307],
  "southpaw": [110, 250, 308, 309],
  "orthodox": [110, 250, 310, 311],
  "thai clinch": [2, 6, 280, 312],
  "plum": [2, 6, 280, 313],
  "dagestani handcuff": [1, 9, 284, 314, 315],
  "wrist ride": [284, 314, 316, 317],
  "mat return": [0, 1, 284, 318, 319],
  "wall walk": [2, 6, 280, 320, 321],
  "quad pod": [0, 8, 280, 322, 323],
  "d'arce": [40, 42, 47, 324, 325],
  "anaconda": [40, 42, 47, 326, 327],
  "kimura trap": [70, 71, 72, 328, 329],
  "ground and pound": [110, 284, 330, 331],
  "ashi garami": [80, 81, 88, 332, 333],
  "saddle": [80, 81, 88, 334, 335],
  "411": [80, 81, 88, 334, 335],
  "knee line": [80, 82, 220, 336, 337],
  "heel slip": [80, 82, 220, 338, 339],
  "body triangle": [41, 65, 284, 340, 341],
  "knee slice": [95, 96, 220, 342, 343],
  "crossface": [200, 284, 344, 345],
  "knee shield": [95, 220, 346, 347],
};

function generateEmbedding(text) {
  const normalized = text.toLowerCase().trim();
  const vector = new Array(VECTOR_DIMENSION).fill(0.01);

  for (const [concept, dimensions] of Object.entries(COMBAT_TAXONOMY)) {
    if (normalized.includes(concept)) {
      dimensions.forEach((dim) => {
        vector[dim] += 1.25;
      });
    }
  }

  const tokens = normalized.split(/[\s,_\-]+/).filter(Boolean);
  tokens.forEach((token, tIdx) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const primaryIdx = Math.abs(hash) % VECTOR_DIMENSION;
    const secondaryIdx = Math.abs((hash * 31) + tIdx) % VECTOR_DIMENSION;
    vector[primaryIdx] += 0.45;
    vector[secondaryIdx] += 0.35;
  });

  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    vector[i] = parseFloat((vector[i] / norm).toFixed(6));
  }

  return vector;
}

async function run() {
  const dataPath = path.join(rootDir, 'data', 'mma_technical_framework_points.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const pointsData = JSON.parse(rawData);

  console.log(`Loaded ${pointsData.length} framework points from ${dataPath}`);

  // 1. Ensure collection exists
  try {
    const exists = await client.collectionExists(COLLECTION_NAME);
    if (!exists) {
      console.log(`Creating collection "${COLLECTION_NAME}" (size: 384, Cosine)...`);
      await client.createCollection(COLLECTION_NAME, {
        vectors: { size: VECTOR_DIMENSION, distance: 'Cosine' },
      });
    } else {
      console.log(`Collection "${COLLECTION_NAME}" already exists.`);
    }
  } catch (err) {
    console.warn(`Notice checking/creating collection:`, err?.message);
  }

  // 2. Create payload indexes for strict mode filtering
  const indexFields = [
    { name: 'range', schema: 'keyword' },
    { name: 'phase', schema: 'keyword' },
    { name: 'discipline', schema: 'keyword' },
    { name: 'concept', schema: 'keyword' },
  ];

  for (const f of indexFields) {
    try {
      console.log(`Creating payload index for field "${f.name}" (${f.schema})...`);
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: f.name,
        field_schema: f.schema,
        wait: true,
      });
      console.log(`✓ Created payload index for "${f.name}".`);
    } catch (e) {
      console.log(`Payload index for "${f.name}":`, e?.message || 'already exists');
    }
  }

  // 3. Generate 384-dimensional dense vectors from text_to_embed
  console.log('Generating 384-dimensional dense vectors and assembling points...');
  const pointsToUpsert = [];

  for (const item of pointsData) {
    const vector = generateEmbedding(item.payload.text_to_embed);
    if (vector.length !== 384) {
      throw new Error(`Dimension mismatch: expected 384, got ${vector.length}`);
    }

    pointsToUpsert.push({
      id: item.id,
      vector: vector,
      payload: item.payload,
    });

    console.log(`  → Vectorized [${item.id}] "${item.payload.range}": ${item.payload.concept}`);
  }

  // 4. Upsert points into Qdrant
  console.log(`Upserting ${pointsToUpsert.length} points to Qdrant collection "${COLLECTION_NAME}"...`);
  const result = await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: pointsToUpsert,
  });

  console.log('Upsert result status:', result?.status || 'OK');

  // 5. Verification check
  try {
    const collectionInfo = await client.getCollection(COLLECTION_NAME);
    console.log('Collection Points Count:', collectionInfo?.points_count);

    // Test a filtered search query to verify strict mode indexing
    const testVector = generateEmbedding('clinch collar tie and dirty boxing');
    const searchRes = await client.query(COLLECTION_NAME, {
      query: testVector,
      filter: {
        must: [
          {
            key: 'phase',
            match: { value: 'Clinch' },
          },
        ],
      },
      limit: 3,
      with_payload: true,
    });

    console.log('Test filtered search query on phase="Clinch" found:', searchRes.points?.length, 'results');
    if (searchRes.points && searchRes.points.length > 0) {
      console.log('Top match:', searchRes.points[0].payload?.concept, '(score:', searchRes.points[0].score, ')');
    }
  } catch (verr) {
    console.warn('Verification notice:', verr?.message);
  }

  console.log('───────────────────────────────────────────────────────');
  console.log('✓ Successfully populated mma_technical_framework in Qdrant!');
}

run().catch((err) => {
  console.error('Fatal error populating Qdrant:', err);
  process.exit(1);
});
