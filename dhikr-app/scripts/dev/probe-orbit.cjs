// Classify each mala bead slot as lit/dim/imam from a screenshot.
// Finds the outer ring (beige #EAE0C8) to locate the circle, then samples
// the 33 orbit slots and prints their state.
// Usage: node scripts/dev/probe-orbit.cjs shot.png
const sharp = require("sharp");

// Mala geometry (must match CircularCounter.jsx)
const ORBIT_R = 102;
const RING_R = 120;
const GAP_DEG = (30 / ORBIT_R) * 180 / Math.PI;
const START_DEG = -90 + GAP_DEG / 2;
const SPAN_DEG = 360 - GAP_DEG;
const DEG = Math.PI / 180;

async function main() {
  const file = process.argv[2];
  const img = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = img.info;

  // 1) locate the ring: scan the middle column for beige pixels (#EAE0C8)
  const col = Math.floor(w / 2);
  let ringTopY = -1;
  let ringBotY = -1;
  const isBeige = (x, y) => {
    const i = (y * w + x) * ch;
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    return Math.abs(r - 0xEA) < 26 && Math.abs(g - 0xE0) < 26 && Math.abs(b - 0xC8) < 26;
  };
  for (let y = 0; y < h / 2; y++) if (isBeige(col, y)) { ringTopY = y; break; }
  for (let y = h - 1; y > h / 2; y--) if (isBeige(col, y)) { ringBotY = y; break; }
  if (ringTopY < 0 || ringBotY < 0) {
    console.log("ring not found");
    return;
  }
  const cx = col;
  const cy = (ringTopY + ringBotY) / 2;
  const pxPerUnit = (ringBotY - ringTopY) / 2 / RING_R;

  const sample = (deg) => {
    const x = Math.round(cx + ORBIT_R * pxPerUnit * Math.cos(deg * DEG));
    const y = Math.round(cy + ORBIT_R * pxPerUnit * Math.sin(deg * DEG));
    if (x < 0 || y < 0 || x >= w || y >= h) return "oob";
    const i = (y * w + x) * ch;
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const isWarm = r > 150 && g > 90; // hot oranges/yellows
    const isDark = lum < 70;
    if (isWarm && lum > 120) return "IMAM";
    if (isDark) return "dim";
    return "lit";
  };

  console.log(`ring: cx=${cx} cy=${cy.toFixed(0)} pxPerUnit=${pxPerUnit.toFixed(2)}`);
  for (let i = 0; i < 33; i++) {
    const t = i / 32;
    const deg = START_DEG + t * SPAN_DEG;
    const mark = i === 0 ? " [head]" : "";
    console.log(`slot ${String(i).padStart(2)}: ${sample(deg)}${mark}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
