import sharp from "sharp";
import { writeFileSync } from "node:fs";

const cream = "#FBF7F0";
const SRC = "C:/Users/Black_owl/Downloads/ChatGPT Image Sep 22, 2026, 02_22_05 AM.png";

const meta = await sharp(SRC).metadata();
const W = 1024;
const scale = 600 / meta.height;
const tw = Math.round(meta.width * scale);
const th = Math.round(meta.height * scale);
const left = Math.round((W - tw) / 2);
const top = Math.round((W - th) / 2);

const sized = await sharp(SRC).resize({ width: tw, height: th }).png().toBuffer();
const tile = await sharp({
  create: { width: W, height: W, channels: 3, background: cream },
})
  .composite([{ input: sized, left, top }])
  .png()
  .toBuffer();

await Promise.all([
  writeFileSync("assets/icon-foreground.png", tile),
  writeFileSync("assets/icon-only.png", tile),
  sharp({ create: { width: W, height: W, channels: 3, background: cream } }).png().toBuffer(),
]);

const b64 = tile.toString("base64");
const webSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="23" fill="${cream}"/>
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="100" height="100"/>
</svg>`;
writeFileSync("public/icon.svg", webSvg);

console.log("placed", tw + "x" + th, "at", left, top, "scale", scale.toFixed(3));
console.log("wrote assets/icon-foreground.png assets/icon-only.png assets/icon-background.png public/icon.svg");