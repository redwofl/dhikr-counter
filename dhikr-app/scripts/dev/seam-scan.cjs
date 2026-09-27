const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen7.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  for (let y = 1000; y < 1300; y++) {
    let prev = null, len = 0;
    let bestColor = null, bestLen = 0, bestStart = 0;
    let start = 0;
    for (let x = 0; x < w; x++) {
      const i = (y*w+x)*4;
      const c = (data[i]<<16)|(data[i+1]<<8)|data[i+2];
      const similar = prev !== null && Math.abs((c&255)-(prev&255))<4 && Math.abs(((c>>8)&255)-((prev>>8)&255))<4 && Math.abs(((c>>16)&255)-((prev>>16)&255))<4;
      if (similar) { len++; }
      else { if (len > bestLen) { bestLen = len; bestColor = prev; bestStart = start; } prev = c; start = x; len = 1; }
    }
    if (len > bestLen) { bestLen = len; bestColor = prev; bestStart = start; }
    if (bestLen > w * 0.5) {
      console.log(`y=${y}: run ${bestStart}+${bestLen} #${bestColor.toString(16).padStart(6,"0")}`);
    }
  }
})();