import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// The SVG is the source of truth. Browser favicons stay transparent;
// only the home-screen icon uses a solid tile.
const iconUrl = new URL("../public/icon.svg", import.meta.url);
const svg = (await readFile(iconUrl, "utf8"))
  .replace(/<style>[\s\S]*?<\/style>/, "");
const homeIcon = svg
  .replaceAll("currentColor", "#e7e3d8")
  .replace('viewBox="0 0 64 64">', 'viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#080d10"/>');
await sharp(Buffer.from(homeIcon)).resize(180, 180).png().toFile(
  new URL("../public/apple-touch-icon.png", import.meta.url).pathname,
);
for (const [theme, color] of [["light", "#292d30"], ["dark", "#e7e3d8"]]) {
  await sharp(Buffer.from(svg.replaceAll("currentColor", color)))
    .resize(32, 32).png().toFile(
      new URL(`../public/favicon-${theme}.png`, import.meta.url).pathname,
    );
}
const png = await readFile(new URL("../public/favicon-light.png", import.meta.url));
// Single PNG-compressed image in an ICO container.
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile(new URL("../public/favicon.ico", import.meta.url), Buffer.concat([header, png]));
