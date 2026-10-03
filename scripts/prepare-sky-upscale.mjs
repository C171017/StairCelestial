// Prepare four overlapping half-panorama tiles for the dedicated upscaler.
// Usage: node scripts/prepare-sky-upscale.mjs /path/to/work-directory
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = process.argv[2];
if (!directory) throw new Error('Provide an output directory.');
await mkdir(directory, { recursive: true });
const source = 'public/textures/sanctuary/cloudscape-360.webp';
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== info.height * 2) throw new Error('Expected a 2:1 panorama.');
const { width, height } = info;
const linear = value => { const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; };
const srgb = value => Math.round(255 * (value <= .0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - .055));
const starts = [0, Math.floor(width / 4), height, Math.floor(width * 3 / 4)];
const tiles = [];
for (const [index, left] of starts.entries()) {
  const pixels = Buffer.alloc(height * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < height; x++) {
    const sx = (x + left) % width;
    // Bake the existing sky shader's edge repair into the wraparound tile.
    // The upscaler now sees both sides of the panorama join in one image.
    const edge = Math.min(sx, width - 1 - sx);
    const t = Math.min(1, edge / (width * .035));
    const blend = index === 3 ? .5 * (1 - t * t * (3 - 2 * t)) : 0;
    for (let c = 0; c < 3; c++) {
      const value = data[(y * width + sx) * 3 + c];
      const opposite = data[(y * width + width - 1 - sx) * 3 + c];
      pixels[(y * height + x) * 3 + c] = blend ? srgb(linear(value) * (1 - blend) + linear(opposite) * blend) : value;
    }
  }
  const filename = `tile-${index}.webp`;
  await sharp(pixels, { raw: { width: height, height, channels: 3 } }).webp({ quality: 90 }).toFile(path.join(directory, filename));
  tiles.push({ index, left, sourceWidth: height, sourceHeight: height, input: filename, output: `tile-${index}-4k.png` });
}
await writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ source, width, height, tiles }, null, 2));
console.log(JSON.stringify({ directory, width, height, tiles }, null, 2));
