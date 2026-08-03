export interface ExposureScoreOptions {
  /** Weight applied to the fraction of clipped (crushed/blown) pixels. Default: 6. */
  clipWeight?: number;
  /** Weight applied to how far the mean brightness deviates from mid-gray. Default: 1.4. */
  deviationWeight?: number;
}

export interface ExposureInfo {
  score: number;
  mean: number;
  clippedShadowsRatio: number;
  clippedHighlightsRatio: number;
  verdict: 'underexposed' | 'overexposed' | 'ok';
}

/**
 * Computes a 0-1 exposure score for an image. 1 means well-balanced
 * exposure; 0 means heavily under- or over-exposed.
 */
export function getExposureScore(
  input: string | Buffer | Uint8Array,
  options?: ExposureScoreOptions
): Promise<number>;

/**
 * Returns the exposure score plus the underlying statistics and a verdict.
 */
export function getExposureInfo(
  input: string | Buffer | Uint8Array,
  options?: ExposureScoreOptions
): Promise<ExposureInfo>;

/**
 * Determines whether an image is poorly exposed relative to a threshold.
 */
export function isPoorlyExposed(
  input: string | Buffer | Uint8Array,
  threshold?: number,
  options?: ExposureScoreOptions
): Promise<boolean>;
