import sharp from 'sharp';

const IDEAL_MEAN = 128;
const SHADOW_CLIP_THRESHOLD = 4; // luminance <= this counts as crushed black
const HIGHLIGHT_CLIP_THRESHOLD = 251; // luminance >= this counts as blown-out white

/**
 * Computes luminance statistics for an image: mean brightness and the
 * fraction of pixels clipped to near-black or near-white.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ mean: number, clippedShadowsRatio: number, clippedHighlightsRatio: number }>}
 */
export async function computeExposureStats(imageBuffer) {
  const { data, info } = await sharp(imageBuffer).greyscale().raw().toBuffer({ resolveWithObject: true });

  const total = info.width * info.height;
  let sum = 0;
  let clippedShadows = 0;
  let clippedHighlights = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    sum += value;
    if (value <= SHADOW_CLIP_THRESHOLD) clippedShadows++;
    if (value >= HIGHLIGHT_CLIP_THRESHOLD) clippedHighlights++;
  }

  return {
    mean: sum / total,
    clippedShadowsRatio: clippedShadows / total,
    clippedHighlightsRatio: clippedHighlights / total,
  };
}

/**
 * Maps exposure statistics to a 0-1 "well-exposed" score. 1 means balanced
 * exposure with minimal clipping; 0 means heavily under- or over-exposed.
 * @param {{ mean: number, clippedShadowsRatio: number, clippedHighlightsRatio: number }} stats
 * @param {{ clipWeight?: number, deviationWeight?: number }} [options]
 * @returns {number}
 */
export function statsToScore(stats, options = {}) {
  const clipWeight = options.clipWeight ?? 6;
  const deviationWeight = options.deviationWeight ?? 1.4;

  const clipPenalty = Math.min(1, (stats.clippedShadowsRatio + stats.clippedHighlightsRatio) * clipWeight);
  const deviation = Math.abs(stats.mean - IDEAL_MEAN) / IDEAL_MEAN;
  const deviationPenalty = Math.min(1, deviation * deviationWeight);

  const score = 1 - Math.max(clipPenalty, deviationPenalty);
  return Math.min(1, Math.max(0, score));
}

/**
 * Classifies the dominant exposure problem, if any.
 * @param {{ mean: number }} stats
 * @param {number} score
 * @returns {'underexposed' | 'overexposed' | 'ok'}
 */
export function classifyStats(stats, score) {
  if (score >= 0.5) return 'ok';
  return stats.mean < IDEAL_MEAN ? 'underexposed' : 'overexposed';
}
