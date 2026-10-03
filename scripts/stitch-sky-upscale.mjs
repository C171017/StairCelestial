// Blend overlapping AI-upscaled tiles in linear light, including wraparound.
// Usage: node scripts/stitch-sky-upscale.mjs /path/to/work-directory
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = process.argv[2];
if (!directory) throw new Error('Provide the directory containing manifest.json and upscaled tiles.');
const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
const tiles = await Promise.all(manifest.tiles.map(async tile => ({
  ...tile,
  ...await sharp(path.join(directory, tile.output)).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
})));
const height = tiles[0].info.height;
const width = height * 2;
if (tiles.some(tile => tile.info.width !== height || tile.info.height !== height || tile.info.channels !== 3)) {
  throw new Error('All tiles must be RGB squares of identical dimensions.');
}
const scale = height / manifest.height;
const decode = Float32Array.from({ length: 256 }, (_, i) => {
  const s = i / 255;
  return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
});
const encode = Uint8Array.from({ length: 65536 }, (_, i) => {
  const v = i / 65535;
  return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055));
});
// Fractional source offsets are retained, avoiding a two-pixel registration
// error when an odd-width panorama's quarter points fall between pixels.
const columns = Array.from({ length: width }, (_, x) => {
  const contributors = [];
  let total = 0;
  for (const tile of tiles) {
    const tx = ((x - tile.left * scale) % width + width) % width;
    if (tx >= height) continue;
    const x0 = Math.floor(tx);
    const weight = Math.sin(Math.PI * (tx + .5) / height) ** 2;
    contributors.push({ tile, x0, x1: Math.min(x0 + 1, height - 1), fraction: tx - x0, weight });
    total += weight;
  }
  if (total < .1) throw new Error(`Insufficient overlap at column ${x}.`);
  for (const item of contributors) item.weight /= total;
  return contributors;
});
const pixels = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const contributors = columns[x];
  for (let c = 0; c < 3; c++) {
    let value = 0;
    for (const item of contributors) {
      const row = y * height * 3;
      const a = decode[item.tile.data[row + item.x0 * 3 + c]];
      const b = decode[item.tile.data[row + item.x1 * 3 + c]];
      value += (a + (b - a) * item.fraction) * item.weight;
    }
    pixels[(y * width + x) * 3 + c] = encode[Math.min(65535, Math.max(0, Math.round(value * 65535)))];
  }
}
const raw = { width, height, channels: 3 };
await sharp(pixels, { raw }).png().toFile(path.join(directory, 'panorama-master.png'));
const destination = 'public/textures/sanctuary';
const desktop = await sharp(pixels, { raw }).webp({ quality: 88, effort: 5 }).toFile(path.join(destination, 'cloudscape-360-8k.webp'));
const compact = await sharp(pixels, { raw }).resize(4096, 2048).webp({ quality: 88, effort: 5 }).toFile(path.join(destination, 'cloudscape-360-4k.webp'));
// Compare the wrap boundary with its immediate neighbors, not with zero:
// a continuous cloud edge can legitimately have a nonzero color gradient.
let seam = 0, neighbor = 0;
for (let y = 0; y < height; y++) for (let c = 0; c < 3; c++) {
  const row = y * width * 3;
  seam += Math.abs(pixels[row + c] - pixels[row + (width - 1) * 3 + c]);
  neighbor += (Math.abs(pixels[row + c] - pixels[row + 3 + c])
    + Math.abs(pixels[row + (width - 1) * 3 + c] - pixels[row + (width - 2) * 3 + c])) / 2;
}
const report = { width, height, desktopBytes: desktop.size, compactBytes: compact.size,
  wrapMeanRgbDifference: seam / (height * 3), adjacentMeanRgbDifference: neighbor / (height * 3) };
await writeFile(path.join(directory, 'stitch-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
