import { loadImageBuffer } from './loadImage.js';
import { computeExposureStats, statsToScore, classifyStats } from './exposure.js';

/**
 * Computes a 0-1 exposure score for an image. 1 means well-balanced
 * exposure; 0 means heavily under- or over-exposed.
 * @param {string | Buffer | Uint8Array} input - File path, http(s) URL, or image bytes.
 * @param {{ clipWeight?: number, deviationWeight?: number }} [options]
 * @returns {Promise<number>}
 */
export async function getExposureScore(input, options = {}) {
  const buffer = await loadImageBuffer(input);
  const stats = await computeExposureStats(buffer);
  return statsToScore(stats, options);
}

/**
 * Returns the exposure score plus the underlying statistics and a verdict.
 * @param {string | Buffer | Uint8Array} input - File path, http(s) URL, or image bytes.
 * @param {{ clipWeight?: number, deviationWeight?: number }} [options]
 * @returns {Promise<{
 *   score: number,
 *   mean: number,
 *   clippedShadowsRatio: number,
 *   clippedHighlightsRatio: number,
 *   verdict: 'underexposed' | 'overexposed' | 'ok',
 * }>}
 */
export async function getExposureInfo(input, options = {}) {
  const buffer = await loadImageBuffer(input);
  const stats = await computeExposureStats(buffer);
  const score = statsToScore(stats, options);
  const verdict = classifyStats(stats, score);
  return { score, ...stats, verdict };
}

/**
 * Determines whether an image is poorly exposed relative to a threshold.
 * @param {string | Buffer | Uint8Array} input - File path, http(s) URL, or image bytes.
 * @param {number} [threshold=0.5] - Exposure score below which an image counts as poorly exposed (0-1).
 * @param {{ clipWeight?: number, deviationWeight?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function isPoorlyExposed(input, threshold = 0.5, options = {}) {
  const score = await getExposureScore(input, options);
  return score < threshold;
}
