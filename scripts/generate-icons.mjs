import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// The SVG is the source of truth. Every exported icon keeps its transparent
// exterior and open center; the operating system owns home-screen presentation.
const iconUrl = new URL("../public/icon.svg", import.meta.url);
const svg = (await readFile(iconUrl, "utf8"))
  .replace(/<style>[\s\S]*?<\/style>/, "");
const homeIcon = svg.replaceAll("currentColor", "#242b30");
await sharp(Buffer.from(homeIcon)).resize(180, 180).png().toFile(
  new URL("../public/apple-touch-icon.png", import.meta.url).pathname,
);
for (const [theme, color] of [["light", "#242b30"], ["dark", "#eeeae0"]]) {
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
