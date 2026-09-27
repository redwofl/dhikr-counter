const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  for (const y of [720, 721, 722, 1157, 1158, 1190, 1191, 1686, 1687, 2216, 2217, 2597, 2630]) {
    const runs = [];
    let prev = null, start = 0;
    for (let x = 200; x < 1100; x++) {
      const i = (y * w + x) * 4;
      const c = (data[i] << 16) | (data[i+1] << 8) | data[i+2];
      if (c !== prev) { if (prev !== null) runs.push([start, x - start, prev]); prev = c; start = x; }
    }
    runs.push([start, 1100 - start, prev]);
    const summarize = runs.filter(([s, len]) => len >= 30).map(([s, len, c]) => `x${s}+${len}#${c.toString(16).padStart(6,"0")}`).slice(0, 10);
    console.log(`y=${y}: ${summarize.join(" | ") || "no runs>=30px"}`);
  }
})();