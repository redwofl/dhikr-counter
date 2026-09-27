const sharp = require("sharp");
const fs = require("fs");

(async () => {
  const { data, info } = await sharp(fs.readFileSync("public/counter-bg-custom.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const hits = [];
  for (let y = 0; y < h; y++) {
    // alpha coverage
    let opaque = 0, minA = 255, maxA = 0, sumA = 0;
    let prev = null, len = 0, best = 0, bestColor = null;
    for (let x = 0; x < w; x++) {
      const i = (y*w+x)*4;
      const a = data[i+3];
      if (a > 25) { opaque++; }
      sumA += a;
      if (a < minA) minA = a; if (a > maxA) maxA = a;
      const cur = (data[i]<<16)|(data[i+1]<<8)|data[i+2];
      if (cur === prev) len++; else { if (len > best) { best = len; bestColor = prev; } prev = cur; len = 1; }
    }
    if (len > best) { best = len; bestColor = prev; }
    const coverage = opaque / w;
    if (coverage > 0.15) {
      hits.push({ y, coverage: (coverage*100)|0, best, bestColor: bestColor && "#"+bestColor.toString(16).padStart(6,"0") });
    }
  }
  // Collapse consecutive ys into bands
  let out = [];
  let cur = null;
  for (const hh of hits) {
    if (cur && hh.y - cur.y <= 3 && Math.abs((hh.coverage|0) - (cur.coverage|0)) <= 20 && hh.bestColor === cur.bestColor) {
      cur.y2 = hh.y;
    } else {
      if (cur) out.push(cur);
      cur = { y: hh.y, y2: hh.y, coverage: hh.coverage, best: hh.best, bestColor: hh.bestColor };
    }
  }
  if (cur) out.push(cur);
  for (const b of out) {
    if (b.y2 - b.y >= 3) console.log(`img_y ${b.y}-${b.y2} (${b.y2-b.y+1}px) coverage=${b.coverage}% longest-run=${b.best}px color=${b.bestColor}`);
  }
})();