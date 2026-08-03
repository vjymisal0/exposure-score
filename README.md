# exposure-score

Detect over- or under-exposed photos. Returns a 0-1 score (1 = well-exposed) using luminance histogram analysis - crushed shadows, blown highlights, and overall brightness deviation.

Companion to [`blur-score`](https://www.npmjs.com/package/blur-score): together they cover the two most common "is this photo actually usable" checks for upload pipelines.

## Install

```bash
npm install exposure-score
```

Requires Node.js >= 18. Uses [`sharp`](https://sharp.pixelplumbing.com/) internally.

## Usage

```js
import { getExposureScore, getExposureInfo, isPoorlyExposed } from 'exposure-score';

const score = await getExposureScore('photo.jpg'); // e.g. 0.72

const info = await getExposureInfo('photo.jpg');
// { score: 0.72, mean: 103, clippedShadowsRatio: 0, clippedHighlightsRatio: 0, verdict: 'ok' }

if (await isPoorlyExposed('photo.jpg', 0.5)) {
  console.warn('This photo is under- or over-exposed.');
}
```

All functions accept a file path (`string`), an `http(s)` URL (`string`), or image bytes (`Buffer` / `Uint8Array`).

## API

### `getExposureScore(input, options?)`

Returns `Promise<number>` - a 0-1 exposure score.

### `getExposureInfo(input, options?)`

Returns `Promise<{ score, mean, clippedShadowsRatio, clippedHighlightsRatio, verdict }>` where `verdict` is `'underexposed' | 'overexposed' | 'ok'`.

### `isPoorlyExposed(input, threshold?, options?)`

Returns `Promise<boolean>` - `true` when the score is below `threshold` (default `0.5`).

### Options

- `clipWeight` (default `6`): how heavily clipped (crushed-black or blown-white) pixels penalize the score.
- `deviationWeight` (default `1.4`): how heavily the mean brightness deviating from mid-gray penalizes the score.

## How it works

1. The image is converted to grayscale.
2. Mean luminance and the fraction of near-black (`<= 4`) and near-white (`>= 251`) pixels are computed.
3. Both signals are combined into a penalty, and `score = 1 - penalty`.

## Known limitation

This measures brightness distribution, not photographic intent. A genuinely high-key photo (bright, airy, white background - common in product photography) or a low-key photo (dark, moody) can score low even though it was shot that way on purpose. In testing, a bright stock photo of light-colored flowers on a white background scored 0.09 ("overexposed") in its original, unaltered form, purely because its mean brightness sits far from mid-gray - not because it lost detail to clipping. If your images are intentionally high-key or low-key, tune `deviationWeight` down (or rely on the clipping ratios in `getExposureInfo` instead of the combined score, since clipping is a much less ambiguous signal of a genuine problem).

## License

MIT
