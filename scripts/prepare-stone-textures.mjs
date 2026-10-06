// Same-resolution delivery reviewed against the original marble in daylight/night.
// Regenerate: node scripts/prepare-stone-textures.mjs; verify: append --check.
import sharp from 'sharp';
import { readFile, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const checkOnly = process.argv.includes('--check');
const directory = new URL('../public/textures/sanctuary/materials/', import.meta.url);
const hash = data => createHash('sha256').update(data).digest('hex');
const maps = [
  { kind: 'Color', sha256: '819bef00ff76e751bcad618942f36e0200471fd08b68a3ef23cb755c2ad95d8b', mae: 1.1, max: 52, p99: 4 },
  { kind: 'Roughness', sha256: '8f9f214e4de35fab0460c94fcf6240176200c8c9b78c90db6c1fea81dbebec1f', mae: 0.6, max: 6, p99: 2 },
  { kind: 'Displacement', sha256: '960be54ababd3077c625a5cccdd8a58e070fa66115a5ff4d3e205fa59ab17721', mae: 0.75, max: 7, p99: 3 },
];
let sourceTotal = 0, outputTotal = 0;
for (const expected of maps) {
  const { kind } = expected;
  const stem = `Marble021_4K-JPG_${kind}`;
  const source = fileURLToPath(new URL(`${stem}.jpg`, directory));
  const destination = fileURLToPath(new URL(`${stem}-q98.webp`, directory));
  const candidate = `${destination}.pending.webp`;
  try {
    const sourceFile = await readFile(source);
    if (hash(sourceFile) !== expected.sha256) throw new Error(`${kind}: original source hash changed.`);
    if (!checkOnly) await sharp(source).webp({ quality: 98, effort: 6 }).toFile(candidate);
    const encodedPath = checkOnly ? destination : candidate;
    const original = await sharp(source).raw().toBuffer({ resolveWithObject: true });
    const decoded = await sharp(encodedPath).raw().toBuffer({ resolveWithObject: true });
    if (original.info.width !== 4096 || original.info.height !== 4096 ||
      decoded.info.width !== 4096 || decoded.info.height !== 4096 ||
      original.info.channels !== decoded.info.channels || original.data.length !== decoded.data.length) {
      throw new Error(`${kind}: source/runtime dimensions or channels changed.`);
    }
    let total = 0, max = 0;
    const histogram = new Uint32Array(256);
    for (let index = 0; index < original.data.length; index++) {
      const difference = Math.abs(original.data[index] - decoded.data[index]);
      total += difference; histogram[difference]++;
      if (difference > max) max = difference;
    }
    const mae = total / original.data.length;
    let cumulative = 0, p99 = 0;
    for (; p99 < 255; p99++) {
      cumulative += histogram[p99];
      if (cumulative >= original.data.length * 0.99) break;
    }
    if (mae > expected.mae || max > expected.max || p99 > expected.p99) {
      throw new Error(`${kind}: decoded error exceeded reviewed bounds (MAE=${mae}, max=${max}, p99=${p99}).`);
    }
    const outputFile = await readFile(encodedPath);
    if (outputFile.length >= sourceFile.length) throw new Error(`${kind}: delivery output provides no byte saving.`);
    if (!checkOnly) await rename(candidate, destination);
    sourceTotal += sourceFile.length; outputTotal += outputFile.length;
    console.log(JSON.stringify({
      kind, width: decoded.info.width, height: decoded.info.height, channels: decoded.info.channels,
      quality: 98, effort: 6, decodedMae: mae, decodedMax: max, decodedP99: p99,
      sourceBytes: sourceFile.length, runtimeBytes: outputFile.length,
      savedBytes: sourceFile.length - outputFile.length,
      sourceSha256: hash(sourceFile), runtimeSha256: hash(outputFile), decodedSha256: hash(decoded.data),
    }));
  } finally {
    if (!checkOnly) await rm(candidate, { force: true });
  }
}
console.log(JSON.stringify({ sourceTotal, outputTotal, savedBytes: sourceTotal - outputTotal, sharp: sharp.versions.sharp, webp: sharp.versions.webp }));
