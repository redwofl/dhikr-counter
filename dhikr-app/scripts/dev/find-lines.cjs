const sharp = require("sharp");

(async () => {
  const file = process.argv[2];
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const count = [];
  for (let y = 0; y < h; y++) {
    let same = 0, col = -1;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const c = (data[i] << 16) | (data[i+1] << 8) | data[i+2];
      if (c !== col) { if (same > w * 0.55) count.push([x - same, same, col]); col = c; same = 1; }
      else same++;
    }
    if (same > w * 0.55) count.push([w - same, same, col]);
  }
  const lines = [];
  for (let y = 0; y < h; y++) {
    const runs = count.filter((r) => r[0] <= -999);
    let segs = [];
    let c = -1, st = -1, len = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const cur = (data[i] << 16) | (data[i+1] << 8) | data[i+2];
      if (cur === c) len++;
      else { if (len > w * 0.5 && c !== -1) segs.push([st, len, c]); c = cur; st = x; len = 1; }
    }
    if (len > w * 0.5 && c !== -1) segs.push([st, len, c]);
    if (segs.length) lines.push({ y, segs });
  }
  // Group contiguous rows into bands
  console.log("Rows with a wide (>50% width) uniform run, grouped:");
  let prevY = -5, cur = null;
  for (const { y, segs } of lines) {
    if (y > prevY + 1) { if (cur) console.log(`  y=${cur.y}-${prevY} (${prevY-cur.y+1}px) ${cur.segs.map(s=>`x${s[0]}+${s[1]} #${s[2].toString(16).padStart(6,'0')}`).join(", ")}`); cur = { y, segs: [] }; }
    for (const s of segs) { if (!cur.segs.some(o => o[0]===s[0]&&o[2]===s[2])) cur.segs.push(s); }
    prevY = y;
  }
  if (cur) console.log(`  y=${cur.y}-${prevY} ${cur.segs.map(s=>`x${s[0]}+${s[1]} #${s[2].toString(16).padStart(6,'0')}`).join(", ")}`);
})();