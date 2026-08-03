import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { getExposureScore, getExposureInfo, isPoorlyExposed } from '../src/index.js';

function makeFlatJpeg(gray) {
  const raw = Buffer.alloc(64 * 64, gray);
  return sharp(raw, { raw: { width: 64, height: 64, channels: 1 } }).jpeg({ quality: 100 }).toBuffer();
}

test('a mid-gray image scores well', async () => {
  const buffer = await makeFlatJpeg(128);
  const score = await getExposureScore(buffer);
  assert.ok(score > 0.8, `expected > 0.8, got ${score}`);
});

test('a near-black image scores poorly and is classified underexposed', async () => {
  const buffer = await makeFlatJpeg(2);
  const info = await getExposureInfo(buffer);
  assert.ok(info.score < 0.2, `expected < 0.2, got ${info.score}`);
  assert.equal(info.verdict, 'underexposed');
});

test('a near-white image scores poorly and is classified overexposed', async () => {
  const buffer = await makeFlatJpeg(253);
  const info = await getExposureInfo(buffer);
  assert.ok(info.score < 0.2, `expected < 0.2, got ${info.score}`);
  assert.equal(info.verdict, 'overexposed');
});

test('brightness moving away from mid-gray monotonically lowers the score', async () => {
  const mid = await getExposureScore(await makeFlatJpeg(128));
  const dim = await getExposureScore(await makeFlatJpeg(70));
  const dark = await getExposureScore(await makeFlatJpeg(20));

  assert.ok(mid > dim, `expected mid (${mid}) > dim (${dim})`);
  assert.ok(dim > dark, `expected dim (${dim}) > dark (${dark})`);
});

test('isPoorlyExposed respects the threshold', async () => {
  const darkBuffer = await makeFlatJpeg(5);
  const midBuffer = await makeFlatJpeg(128);

  assert.equal(await isPoorlyExposed(darkBuffer, 0.5), true);
  assert.equal(await isPoorlyExposed(midBuffer, 0.5), false);
});

test('getExposureInfo reports clipping ratios', async () => {
  const info = await getExposureInfo(await makeFlatJpeg(0));
  assert.ok(info.clippedShadowsRatio > 0.9, `expected > 0.9, got ${info.clippedShadowsRatio}`);
  assert.equal(info.clippedHighlightsRatio, 0);
});

test('accepts a file path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'exposure-score-'));
  const filePath = join(dir, 'gray.jpg');
  try {
    await writeFile(filePath, await makeFlatJpeg(128));
    const score = await getExposureScore(filePath);
    assert.ok(score >= 0 && score <= 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects unsupported input types', async () => {
  await assert.rejects(() => getExposureScore(12345), TypeError);
});
