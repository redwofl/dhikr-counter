// Generates Play Store listing assets from the root logo.png:
//   store-assets/icon-512.png              512x512 flattened store icon (no alpha)
//   store-assets/feature-graphic-1024x500  1024x500 feature graphic
// Run:  cd dhikr-app && node scripts/make-store-assets.js
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const logoPath = join(root, "logo.png");
const outDir = join(root, "store-assets");
mkdirSync(outDir, { recursive: true });

const logoB64 = readFileSync(logoPath).toString("base64");

// Brand palette (from src/index.css + TasbihBeads golds)
const C = {
  bgTop: "#5C4732",
  bgMid: "#43331F",
  bgBot: "#2A1F13",
  deep: "#33261A",
  goldBright: "#E8D5A0",
  gold: "#C79A4B",
  goldDeep: "#8B6914",
  ivory: "#EFE3CC"
};

/* ---------------- 512 store icon (rendered at 1024, downscaled) ---------------- */
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024"
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.bgTop}"/>
      <stop offset="55%" stop-color="${C.bgMid}"/>
      <stop offset="100%" stop-color="${C.bgBot}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="${C.goldBright}" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="${C.gold}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <image xlink:href="data:image/png;base64,${logoB64}" x="132" y="132" width="760" height="760"/>
</svg>`;

await sharp(Buffer.from(iconSvg))
  .resize(512, 512)
  .flatten({ background: C.deep })
  .png()
  .toFile(join(outDir, "icon-512.png"));
console.log("wrote store-assets/icon-512.png");

/* ---------------- 1024x500 feature graphic ---------------- */
// Subtle tasbih-bead arc on the right edge (decorative, crops safely on TV)
let beads = "";
const cx = 1010, cy = 250, r = 300;
for (let a = -54; a <= 54; a += 9) {
  const rad = (a * Math.PI) / 180;
  const x = (cx + r * Math.cos(rad)).toFixed(1);
  const y = (cy + r * Math.sin(rad)).toFixed(1);
  beads += `<circle cx="${x}" cy="${y}" r="15" fill="url(#bead)" opacity="0.45"/>`;
}

const featureSvg = `<svg width="1024" height="500" viewBox="0 0 1024 500"
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bgTop}"/>
      <stop offset="55%" stop-color="${C.bgMid}"/>
      <stop offset="100%" stop-color="${C.bgBot}"/>
    </linearGradient>
    <radialGradient id="glow" cx="22%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${C.goldBright}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldtext" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.goldBright}"/>
      <stop offset="60%" stop-color="${C.gold}"/>
      <stop offset="100%" stop-color="${C.goldDeep}"/>
    </linearGradient>
    <radialGradient id="bead" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="${C.goldBright}"/>
      <stop offset="70%" stop-color="${C.gold}"/>
      <stop offset="100%" stop-color="#4A3808"/>
    </radialGradient>
  </defs>

  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  ${beads}

  <!-- app logo -->
  <image xlink:href="data:image/png;base64,${logoB64}" x="105" y="105" width="290" height="290"/>

  <!-- wordmark (textLength keeps layout deterministic across renderers) -->
  <text x="450" y="228" font-family="Georgia, 'Times New Roman', serif" font-weight="bold"
        font-size="68" fill="url(#goldtext)" textLength="455" lengthAdjust="spacingAndGlyphs">Dhikr Counter</text>

  <rect x="452" y="252" width="440" height="2" rx="1" fill="${C.gold}" opacity="0.45"/>

  <text x="452" y="305" font-family="Georgia, 'Times New Roman', serif"
        font-size="27" fill="${C.ivory}" opacity="0.92"
        textLength="400" lengthAdjust="spacingAndGlyphs">Tasbih · Adhkar · Prayer Times</text>

  <text x="452" y="352" font-family="Georgia, 'Times New Roman', serif"
        font-size="21" fill="${C.ivory}" opacity="0.6"
        textLength="300" lengthAdjust="spacingAndGlyphs">Urdu · English · العربية</text>

  <!-- bead accent row -->
  <circle cx="460" cy="392" r="8" fill="url(#bead)"/>
  <circle cx="492" cy="392" r="8" fill="url(#bead)" opacity="0.8"/>
  <circle cx="524" cy="392" r="8" fill="url(#bead)" opacity="0.55"/>
</svg>`;

await sharp(Buffer.from(featureSvg))
  .flatten({ background: C.deep })
  .png({ compressionLevel: 9 })
  .toFile(join(outDir, "feature-graphic-1024x500.png"));
console.log("wrote store-assets/feature-graphic-1024x500.png");

/* ---------------- verify ---------------- */
for (const f of ["icon-512.png", "feature-graphic-1024x500.png"]) {
  const m = await sharp(join(outDir, f)).metadata();
  console.log(`${f}: ${m.width}x${m.height} alpha=${m.hasAlpha}`);
}
