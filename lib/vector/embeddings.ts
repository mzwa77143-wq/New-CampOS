/**
 * Combat Sports Semantic Vector Embedding Engine
 * Generates 384-dimensional dense vectors with domain semantic mapping
 * for MMA techniques, biomechanical attributes, and tactical movements.
 */

export const VECTOR_DIMENSION = 384;

// Key combat sports concept hubs with assigned semantic dimension anchors
const COMBAT_TAXONOMY: Record<string, number[]> = {
  // Grappling & Takedowns
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

  // Submissions & Counters
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

  // Striking
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

  // Biomechanical & Posture
  "posture": [200, 201, 202],
  "posture break": [200, 203, 204, 205],
  "hip extension": [210, 211, 212],
  "knee flexion": [220, 221, 222],
  "center of gravity": [230, 231, 232],
  "rotational torque": [240, 241, 242],
  "angle": [250, 251, 252],
  "pivot": [250, 253, 254],
};

/**
 * Generate a deterministic 384-dimensional dense semantic embedding
 */
export function generateEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().trim();
  const vector = new Array(VECTOR_DIMENSION).fill(0.01);

  // Match domain taxonomy terms and activate corresponding dimensions
  let matchesCount = 0;
  for (const [concept, dimensions] of Object.entries(COMBAT_TAXONOMY)) {
    if (normalized.includes(concept)) {
      matchesCount++;
      dimensions.forEach((dim) => {
        vector[dim] += 1.25;
      });
    }
  }

  // Token hashing for vocabulary fallback
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

  // Normalize vector to unit length (L2 norm)
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

/**
 * Computes cosine similarity between two normalized vectors
 * Returns value in range [0, 1]
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const rawSim = dotProduct / denominator;
  // Bound to [0, 1]
  return Math.max(0, Math.min(1, rawSim));
}
