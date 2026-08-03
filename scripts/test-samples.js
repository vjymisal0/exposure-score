import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { computeExposureStats, statsToScore, classifyStats } from '../src/exposure.js';

const SAMPLES_DIR = new URL('../samples/', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:');

const VARIANTS = [
  { label: 'original', brightness: 1 },
  { label: 'dim-0.5', brightness: 0.5 },
  { label: 'dark-0.25', brightness: 0.25 },
  { label: 'dark-0.1', brightness: 0.1 },
  { label: 'bright-1.8', brightness: 1.8 },
  { label: 'blown-3.0', brightness: 3.0 },
];

async function main() {
  const files = (await readdir(SAMPLES_DIR)).filter((f) => ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase()));

  const rows = [];
  for (const file of files) {
    const path = join(SAMPLES_DIR, file);
    const originalBuffer = await sharp(path).toBuffer();

    for (const variant of VARIANTS) {
      const buffer =
        variant.brightness === 1
          ? originalBuffer
          : await sharp(originalBuffer).modulate({ brightness: variant.brightness }).toBuffer();

      const stats = await computeExposureStats(buffer);
      const score = statsToScore(stats);
      const verdict = classifyStats(stats, score);

      rows.push({
        file: basename(file),
        variant: variant.label,
        mean: Math.round(stats.mean),
        clipLow: (stats.clippedShadowsRatio * 100).toFixed(1) + '%',
        clipHigh: (stats.clippedHighlightsRatio * 100).toFixed(1) + '%',
        score: Number(score.toFixed(3)),
        verdict,
      });
    }
  }

  const width = Math.max(...rows.map((r) => r.file.length)) + 2;
  console.log(
    'file'.padEnd(width) + 'variant'.padEnd(12) + 'mean'.padEnd(6) + 'clipLo'.padEnd(9) + 'clipHi'.padEnd(9) + 'score'.padEnd(8) + 'verdict'
  );
  console.log('-'.repeat(width + 55));
  for (const row of rows) {
    console.log(
      row.file.padEnd(width) +
        row.variant.padEnd(12) +
        String(row.mean).padEnd(6) +
        row.clipLow.padEnd(9) +
        row.clipHigh.padEnd(9) +
        String(row.score).padEnd(8) +
        row.verdict
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
