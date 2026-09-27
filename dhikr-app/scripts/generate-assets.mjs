// Generates source assets for @capacitor/assets from public/icon.svg
// - assets/icon-only.png   (1024x1024, full-bleed app icon)
// - assets/icon-foreground.png (1024x1024, logo with safe-area padding)
// - assets/icon-background.png (1024x1024, solid cream background)
// - assets/splash.png      (2732x2732, centered logo on cream)
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";

const svg = readFileSync("public/icon.svg");

mkdirSync("assets", { recursive: true });

// full-bleed icon
await sharp(svg, { density: 1200 }).resize(1024, 1024).png().toFile("assets/icon-only.png");

// solid cream background layer
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: "#FBF7F0" }
}).png().toFile("assets/icon-background.png");

// foreground: logo at 66% size, centered (safe area for adaptive icons)
const logo = await sharp(svg, { density: 1200 }).resize(680, 680).png().toBuffer();
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
}).composite([{ input: logo, top: 172, left: 172 }]).png().toFile("assets/icon-foreground.png");

// splash: centered logo on cream
await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: "#FBF7F0" }
}).composite([{ input: await sharp(svg, { density: 1200 }).resize(600, 600).png().toBuffer(), top: 1066, left: 1066 }])
  .png().toFile("assets/splash.png");

console.log("assets generated");