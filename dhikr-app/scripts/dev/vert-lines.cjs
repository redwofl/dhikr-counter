const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const W9 = Math.floor(h * 0.5);
  for (let x = 0; x < w; x++) {
    let runs = [];
    let prev = -1, start = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      const c = (data[i] << 16) | (data[i+1] << 8) | data[i+2];
      if (c !== prev) { if (prev !== -1 && y - start >= W9) runs.push([start, y - start, prev]); prev = c; start = y; }
    }
    if (h - start >= W9) runs.push([start, h - start, prev]);
    for (const [y, len, c] of runs) {
      console.log(`x=${x} y${y}+${len} #${c.toString(16).padStart(6,"0")}`);
    }
  }
})();