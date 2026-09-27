// Diff two screenshots: print bounding boxes of pixel-change clusters.
// Usage: node scripts/dev/diff-shots.cjs before.png after.png
const sharp = require("sharp");

async function main() {
  const [a, b] = process.argv.slice(2);
  const A = await sharp(a).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = A.info;
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) {
    console.error("size mismatch");
    process.exit(1);
  }
  // grid of 40px cells; mark cells with any pixel delta > 30
  const CELL = 40;
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const hot = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      let maxd = 0;
      for (let y = gy * CELL; y < Math.min((gy + 1) * CELL, h); y += 2) {
        for (let x = gx * CELL; x < Math.min((gx + 1) * CELL, w); x += 2) {
          const i = (y * w + x) * ch;
          const d =
            Math.abs(A.data[i] - B.data[i]) +
            Math.abs(A.data[i + 1] - B.data[i + 1]) +
            Math.abs(A.data[i + 2] - B.data[i + 2]);
          if (d > maxd) maxd = d;
        }
      }
      if (maxd > 90) hot.push([gx, gy]);
    }
  }
  // cluster adjacent hot cells
  const clusters = [];
  const seen = new Set();
  for (const [gx, gy] of hot) {
    if (seen.has(gx + "," + gy)) continue;
    const stack = [[gx, gy]];
    const cells = [];
    while (stack.length) {
      const [x, y] = stack.pop();
      const k = x + "," + y;
      if (seen.has(k)) continue;
      seen.add(k);
      if (!hot.some(([hx, hy]) => Math.abs(hx - x) <= 1 && Math.abs(hy - y) <= 1)) continue;
      cells.push([x, y]);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    if (cells.length) {
      const xs = cells.map((c) => c[0]);
      const ys = cells.map((c) => c[1]);
      clusters.push({
        x: Math.min(...xs) * CELL,
        y: Math.min(...ys) * CELL,
        w: (Math.max(...xs) - Math.min(...xs) + 1) * CELL,
        h: (Math.max(...ys) - Math.min(...ys) + 1) * CELL,
      });
    }
  }
  clusters.sort((p, q) => q.w * q.h - p.w * q.h);
  for (const c of clusters.slice(0, 12)) {
    console.log(`box x=${c.x} y=${c.y} w=${c.w} h=${c.h}`);
  }
  console.log(`screen ${w}x${h}, clusters: ${clusters.length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
